/**
 * Texture Worker - Processes images in parallel
 * Handles compression, resizing, and format conversion
 */

interface TextureProcessRequest {
    type: 'compress' | 'resize' | 'convert'
    imageData: ArrayBuffer
    options?: {
        quality?: number
        maxWidth?: number
        maxHeight?: number
        format?: 'png' | 'jpeg' | 'webp'
    }
}

interface TextureProcessResponse {
    success: boolean
    data?: ArrayBuffer
    error?: string
    originalSize?: number
    compressedSize?: number
}

self.onmessage = async (e: MessageEvent<TextureProcessRequest>) => {
    const { type, imageData, options } = e.data

    try {
        const blob = new Blob([imageData])
        const imageBitmap = await createImageBitmap(blob)

        let canvas: OffscreenCanvas
        let ctx: OffscreenCanvasRenderingContext2D | null

        switch (type) {
            case 'compress': {
                canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
                ctx = canvas.getContext('2d')
                if (!ctx) throw new Error('Failed to get canvas context')

                ctx.drawImage(imageBitmap, 0, 0)

                const quality = options?.quality || 0.8
                const format = options?.format || 'png'
                const mimeType = `image/${format}`

                const compressedBlob = await canvas.convertToBlob({
                    type: mimeType,
                    quality: format !== 'png' ? quality : undefined
                })

                const compressedData = await compressedBlob.arrayBuffer()

                const response: TextureProcessResponse = {
                    success: true,
                    data: compressedData,
                    originalSize: imageData.byteLength,
                    compressedSize: compressedData.byteLength
                }

                self.postMessage(response)
                break
            }

            case 'resize': {
                const maxWidth = options?.maxWidth || imageBitmap.width
                const maxHeight = options?.maxHeight || imageBitmap.height

                let width = imageBitmap.width
                let height = imageBitmap.height

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height)
                    width = Math.floor(width * ratio)
                    height = Math.floor(height * ratio)
                }

                canvas = new OffscreenCanvas(width, height)
                ctx = canvas.getContext('2d')
                if (!ctx) throw new Error('Failed to get canvas context')

                ctx.drawImage(imageBitmap, 0, 0, width, height)

                const resizedBlob = await canvas.convertToBlob({ type: 'image/png' })
                const resizedData = await resizedBlob.arrayBuffer()

                const response: TextureProcessResponse = {
                    success: true,
                    data: resizedData,
                    originalSize: imageData.byteLength,
                    compressedSize: resizedData.byteLength
                }

                self.postMessage(response)
                break
            }

            case 'convert': {
                canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
                ctx = canvas.getContext('2d')
                if (!ctx) throw new Error('Failed to get canvas context')

                ctx.drawImage(imageBitmap, 0, 0)

                const format = options?.format || 'png'
                const convertedBlob = await canvas.convertToBlob({ type: `image/${format}` })
                const convertedData = await convertedBlob.arrayBuffer()

                const response: TextureProcessResponse = {
                    success: true,
                    data: convertedData
                }

                self.postMessage(response)
                break
            }
        }
    } catch (error) {
        const response: TextureProcessResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
        self.postMessage(response)
    }
}

export { }
