/**
 * Model Worker - Parses and validates BBModel files
 * Handles large model files in background thread
 */

interface ModelParseRequest {
    type: 'parse' | 'validate'
    modelData: string // JSON string
    options?: {
        validateTextures?: boolean
        extractAnimations?: boolean
    }
}

interface ModelParseResponse {
    type: 'success' | 'error' | 'progress'
    data?: ParsedModelData
    error?: string
    progress?: number
}

interface ParsedModelData {
    name: string
    textures: Array<{
        name: string
        source: string
        width: number
        height: number
    }>
    elements: any[]
    outliner: any[]
    animations?: any[]
    resolution?: { width: number; height: number }
    meta?: Record<string, any>
}

function validateBBModelStructure(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name) errors.push('Missing model name')
    if (!data.resolution) errors.push('Missing resolution')
    if (!Array.isArray(data.elements)) errors.push('Invalid or missing elements array')
    if (!Array.isArray(data.outliner)) errors.push('Invalid or missing outliner array')

    return {
        valid: errors.length === 0,
        errors
    }
}

function extractTextureData(texture: any): {
    name: string
    source: string
    width: number
    height: number
} | null {
    if (!texture || typeof texture !== 'object') return null

    const name = texture.name || 'unknown'
    const source = texture.source || ''

    // Extract dimensions from base64 data if possible
    let width = texture.width || 16
    let height = texture.height || 16

    if (source.startsWith('data:image/')) {
        try {
            // Create temporary image to get dimensions
            // Note: This won't work in worker, we'll just use defaults
            width = texture.width || texture.uv_width || 16
            height = texture.height || texture.uv_height || 16
        } catch (e) {
            // Use defaults
        }
    }

    return { name, source, width, height }
}

self.onmessage = async (e: MessageEvent<ModelParseRequest>) => {
    const { type, modelData, options } = e.data

    try {
        const parsedData = JSON.parse(modelData)

        switch (type) {
            case 'validate': {
                const validation = validateBBModelStructure(parsedData)

                if (!validation.valid) {
                    self.postMessage({
                        type: 'error',
                        error: `Validation failed: ${validation.errors.join(', ')}`
                    } as ModelParseResponse)
                    return
                }

                self.postMessage({
                    type: 'success',
                    data: parsedData
                } as ModelParseResponse)
                break
            }

            case 'parse': {
                // Report progress
                self.postMessage({
                    type: 'progress',
                    progress: 25
                } as ModelParseResponse)

                // Validate structure
                const validation = validateBBModelStructure(parsedData)
                if (!validation.valid) {
                    throw new Error(`Invalid model structure: ${validation.errors.join(', ')}`)
                }

                self.postMessage({
                    type: 'progress',
                    progress: 50
                } as ModelParseResponse)

                // Extract textures
                const textures: ParsedModelData['textures'] = []
                if (Array.isArray(parsedData.textures)) {
                    for (const texture of parsedData.textures) {
                        const textureData = extractTextureData(texture)
                        if (textureData) {
                            textures.push(textureData)
                        }
                    }
                }

                self.postMessage({
                    type: 'progress',
                    progress: 75
                } as ModelParseResponse)

                // Extract animations if requested
                let animations: any[] = []
                if (options?.extractAnimations && Array.isArray(parsedData.animations)) {
                    animations = parsedData.animations
                }

                const result: ParsedModelData = {
                    name: parsedData.name || 'Unnamed Model',
                    textures,
                    elements: parsedData.elements || [],
                    outliner: parsedData.outliner || [],
                    animations,
                    resolution: parsedData.resolution,
                    meta: parsedData.meta
                }

                self.postMessage({
                    type: 'success',
                    data: result,
                    progress: 100
                } as ModelParseResponse)
                break
            }
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown parsing error'
        } as ModelParseResponse)
    }
}

export { }
