/**
 * ZIP Worker - Handles ZIP generation in background thread
 * Provides streaming support for large packs
 */

import { type } from "os"

interface ZipGenerationRequest {
    type: 'init' | 'addFile' | 'finalize'
    fileName?: string
    fileData?: ArrayBuffer
    path?: string
    options?: {
        compression?: 'STORE' | 'DEFLATE'
        compressionLevel?: number
    }
}

interface ZipGenerationResponse {
    type: 'progress' | 'complete' | 'error'
    progress?: number
    data?: Blob
    error?: string
}

// Simple in-memory ZIP implementation for Web Worker
class WorkerZipGenerator {
    private files: Map<string, { data: ArrayBuffer; compressed: boolean }> = new Map()
    private totalFiles = 0
    private processedFiles = 0

    async addFile(path: string, data: ArrayBuffer, compress: boolean = true): Promise<void> {
        this.files.set(path, { data, compressed: compress })
        this.totalFiles++
        this.processedFiles++

        // Report progress
        const progress = (this.processedFiles / this.totalFiles) * 100
        self.postMessage({
            type: 'progress',
            progress
        } as ZipGenerationResponse)
    }

    async generateZip(): Promise<Blob> {
        // Import JSZip dynamically in worker
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()

        for (const [path, file] of this.files.entries()) {
            zip.file(path, file.data, {
                compression: file.compressed ? 'DEFLATE' : 'STORE'
            })
        }

        return await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        })
    }
}

let zipGenerator: WorkerZipGenerator | null = null

self.onmessage = async (e: MessageEvent<ZipGenerationRequest>) => {
    const { type, fileName, fileData, path, options } = e.data

    try {
        switch (type) {
            case 'init':
                zipGenerator = new WorkerZipGenerator()
                self.postMessage({
                    type: 'progress',
                    progress: 0
                } as ZipGenerationResponse)
                break

            case 'addFile':
                if (!zipGenerator) {
                    throw new Error('ZIP generator not initialized')
                }
                if (!path || !fileData) {
                    throw new Error('Missing file path or data')
                }

                const compress = options?.compression !== 'STORE'
                await zipGenerator.addFile(path, fileData, compress)
                break

            case 'finalize':
                if (!zipGenerator) {
                    throw new Error('ZIP generator not initialized')
                }

                const zipBlob = await zipGenerator.generateZip()

                self.postMessage({
                    type: 'complete',
                    data: zipBlob
                } as ZipGenerationResponse)

                zipGenerator = null
                break
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        } as ZipGenerationResponse)
    }
}

export { }
