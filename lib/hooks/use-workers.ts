/**
 * Worker hooks for parallel processing
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export interface TextureCompressionResult {
    success: boolean
    compressedData?: ArrayBuffer
    originalSize: number
    compressedSize: number
    compressionRatio: number
}

export function useTextureWorker() {
    const workerRef = useRef<Worker | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        // Initialize worker
        workerRef.current = new Worker(new URL('../workers/texture-worker.ts', import.meta.url))

        return () => {
            workerRef.current?.terminate()
        }
    }, [])

    const compressTexture = useCallback(async (
        file: File,
        options?: { quality?: number; format?: 'png' | 'jpeg' | 'webp' }
    ): Promise<TextureCompressionResult> => {
        if (!workerRef.current) {
            throw new Error('Worker not initialized')
        }

        setIsProcessing(true)

        const imageData = await file.arrayBuffer()

        return new Promise((resolve, reject) => {
            const handleMessage = (e: MessageEvent) => {
                setIsProcessing(false)
                workerRef.current?.removeEventListener('message', handleMessage)

                if (e.data.success) {
                    resolve({
                        success: true,
                        compressedData: e.data.data,
                        originalSize: e.data.originalSize,
                        compressedSize: e.data.compressedSize,
                        compressionRatio: e.data.originalSize / e.data.compressedSize
                    })
                } else {
                    reject(new Error(e.data.error || 'Compression failed'))
                }
            }

            workerRef.current?.addEventListener('message', handleMessage)
            workerRef.current?.postMessage({
                type: 'compress',
                imageData,
                options
            })
        })
    }, [])

    const resizeTexture = useCallback(async (
        file: File,
        maxWidth: number,
        maxHeight: number
    ): Promise<ArrayBuffer> => {
        if (!workerRef.current) {
            throw new Error('Worker not initialized')
        }

        setIsProcessing(true)

        const imageData = await file.arrayBuffer()

        return new Promise((resolve, reject) => {
            const handleMessage = (e: MessageEvent) => {
                setIsProcessing(false)
                workerRef.current?.removeEventListener('message', handleMessage)

                if (e.data.success) {
                    resolve(e.data.data)
                } else {
                    reject(new Error(e.data.error || 'Resize failed'))
                }
            }

            workerRef.current?.addEventListener('message', handleMessage)
            workerRef.current?.postMessage({
                type: 'resize',
                imageData,
                options: { maxWidth, maxHeight }
            })
        })
    }, [])

    return {
        compressTexture,
        resizeTexture,
        isProcessing
    }
}

export interface ZipProgress {
    progress: number
    message: string
}

export function useZipWorker() {
    const workerRef = useRef<Worker | null>(null)
    const [progress, setProgress] = useState<ZipProgress>({ progress: 0, message: '' })
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        // Initialize worker
        workerRef.current = new Worker(new URL('../workers/zip-worker.ts', import.meta.url))

        return () => {
            workerRef.current?.terminate()
        }
    }, [])

    const generateZip = useCallback(async (
        files: Array<{ path: string; data: ArrayBuffer }>
    ): Promise<Blob> => {
        if (!workerRef.current) {
            throw new Error('Worker not initialized')
        }

        setIsGenerating(true)
        setProgress({ progress: 0, message: 'Initializing...' })

        return new Promise((resolve, reject) => {
            const handleMessage = (e: MessageEvent) => {
                if (e.data.type === 'progress') {
                    setProgress({
                        progress: e.data.progress,
                        message: `Processing files... ${Math.round(e.data.progress)}%`
                    })
                } else if (e.data.type === 'complete') {
                    setIsGenerating(false)
                    setProgress({ progress: 100, message: 'Complete!' })
                    workerRef.current?.removeEventListener('message', handleMessage)
                    resolve(e.data.data)
                } else if (e.data.type === 'error') {
                    setIsGenerating(false)
                    workerRef.current?.removeEventListener('message', handleMessage)
                    reject(new Error(e.data.error || 'ZIP generation failed'))
                }
            }

            workerRef.current?.addEventListener('message', handleMessage)

            // Initialize ZIP generation
            workerRef.current?.postMessage({ type: 'init' })

            // Add all files
            for (const file of files) {
                workerRef.current?.postMessage({
                    type: 'addFile',
                    path: file.path,
                    fileData: file.data
                })
            }

            // Finalize
            workerRef.current?.postMessage({ type: 'finalize' })
        })
    }, [])

    return {
        generateZip,
        progress,
        isGenerating
    }
}

export interface ModelParseProgress {
    progress: number
    message: string
}

export function useModelWorker() {
    const workerRef = useRef<Worker | null>(null)
    const [progress, setProgress] = useState<ModelParseProgress>({ progress: 0, message: '' })
    const [isParsing, setIsParsing] = useState(false)

    useEffect(() => {
        // Initialize worker
        workerRef.current = new Worker(new URL('../workers/model-worker.ts', import.meta.url))

        return () => {
            workerRef.current?.terminate()
        }
    }, [])

    const parseModel = useCallback(async (
        modelData: string,
        options?: { validateTextures?: boolean; extractAnimations?: boolean }
    ): Promise<any> => {
        if (!workerRef.current) {
            throw new Error('Worker not initialized')
        }

        setIsParsing(true)
        setProgress({ progress: 0, message: 'Parsing model...' })

        return new Promise((resolve, reject) => {
            const handleMessage = (e: MessageEvent) => {
                if (e.data.type === 'progress') {
                    setProgress({
                        progress: e.data.progress,
                        message: `Parsing... ${Math.round(e.data.progress)}%`
                    })
                } else if (e.data.type === 'success') {
                    setIsParsing(false)
                    setProgress({ progress: 100, message: 'Complete!' })
                    workerRef.current?.removeEventListener('message', handleMessage)
                    resolve(e.data.data)
                } else if (e.data.type === 'error') {
                    setIsParsing(false)
                    workerRef.current?.removeEventListener('message', handleMessage)
                    reject(new Error(e.data.error || 'Model parsing failed'))
                }
            }

            workerRef.current?.addEventListener('message', handleMessage)
            workerRef.current?.postMessage({
                type: 'parse',
                modelData,
                options
            })
        })
    }, [])

    return {
        parseModel,
        progress,
        isParsing
    }
}
