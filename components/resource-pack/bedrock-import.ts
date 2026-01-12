import JSZip from "jszip"
import { v4 as uuidv4 } from "uuid"
import { ResourcePack, CustomSound, LanguageFile, CustomFont, CustomParticle, ShaderFile, TextureData, ModelData } from "./types"

export async function detectPackEdition(zip: JSZip): Promise<"java" | "bedrock"> {
    // Check for Bedrock-specific files
    if (zip.file("manifest.json")) {
        return "bedrock"
    }

    // Check for Java-specific files
    if (zip.file("pack.mcmeta")) {
        return "java"
    }

    // Default to Java if unclear
    return "java"
}

export function convertBedrockSoundsToInternal(soundDefinitions: any): CustomSound[] {
    const sounds: CustomSound[] = []

    if (!soundDefinitions || !soundDefinitions.sound_definitions) {
        return sounds
    }

    for (const [soundName, config] of Object.entries(soundDefinitions.sound_definitions)) {
        const soundConfig = config as any
        const newSound: CustomSound = {
            id: `sound_${uuidv4()}`,
            name: soundName,
            category: soundConfig.category || "master",
            sounds: Array.isArray(soundConfig.sounds)
                ? soundConfig.sounds.map((s: any) => typeof s === 'string' ? s : s.name?.replace('sounds/', '') || '')
                : [],
            subtitle: soundConfig.__subtitle,
        }
        sounds.push(newSound)
    }

    return sounds
}

export function convertBedrockLangToInternal(langContent: string, code: string, name: string): LanguageFile {
    const content: Record<string, string> = {}

    const lines = langContent.split('\n')
    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
            continue
        }

        const equalIndex = trimmed.indexOf('=')
        if (equalIndex > 0) {
            const key = trimmed.substring(0, equalIndex).trim()
            const value = trimmed.substring(equalIndex + 1).trim()
            content[key] = value
        }
    }

    return {
        code,
        name,
        content
    }
}

export async function importBedrockPack(
    zip: JSZip,
    fileName: string,
    getImageDimensions: (file: File) => Promise<{ width: number; height: number }>
): Promise<ResourcePack> {
    const importedPack: ResourcePack = {
        name: fileName.replace(".zip", ""),
        description: "",
        version: "1.21.0",
        format: 63, // Default to latest Java format for compatibility
        models: [],
        textures: [],
        fonts: [],
        sounds: [],
        languages: [],
        particles: [],
        shaders: [],
        packIcon: undefined,
        author: "",
        website: "",
        license: "All Rights Reserved",
    }

    // Read manifest.json
    const manifestFile = zip.file("manifest.json")
    if (manifestFile) {
        const manifestContent = await manifestFile.async("text")
        const manifest = JSON.parse(manifestContent)
        importedPack.name = manifest.header?.name || importedPack.name
        importedPack.description = manifest.header?.description || ""
        if (Array.isArray(manifest.header?.version)) {
            importedPack.version = manifest.header.version.join(".")
        }
    }

    // Read pack_icon.png
    const packIconFile = zip.file("pack_icon.png")
    if (packIconFile) {
        const iconBlob = await packIconFile.async("blob")
        const iconFile = new File([iconBlob], "pack_icon.png", { type: "image/png" })
        importedPack.packIcon = iconFile
    }

    // Read textures from textures/ folder (parallel processing)
    const textureFiles = Object.keys(zip.files).filter(
        (path) => path.startsWith("textures/") && (path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg"))
    )

    const texturePromises = textureFiles.map(async (texturePath) => {
        const textureFile = zip.file(texturePath)
        if (!textureFile) return null

        const textureBlob = await textureFile.async("blob")
        const textureName = texturePath.split("/").pop() || ""
        const textureFileObj = new File([textureBlob], textureName, { type: "image/png" })

        const dimensions = await getImageDimensions(textureFileObj)

        const relativePath = texturePath.replace(/\.(png|jpg|jpeg)$/, "")

        return {
            id: `texture_${uuidv4()}`,
            name: textureName.replace(/\.(png|jpg|jpeg)$/, ""),
            file: textureFileObj,
            path: relativePath,
            size: textureFileObj.size,
            dimensions,
            isOptimized: false,
            animation: {
                enabled: false,
                frametime: 1,
                interpolate: false,
                frames: []
            }
        }
    })

    const textureResults = await Promise.all(texturePromises)
    importedPack.textures = textureResults.filter((t) => t !== null) as TextureData[]

    // Read models from models/ folder (parallel processing)
    const modelFiles = Object.keys(zip.files).filter(
        (path) => path.startsWith("models/") && path.endsWith(".geo.json")
    )

    const modelPromises = modelFiles.map(async (modelPath) => {
        const modelFile = zip.file(modelPath)
        if (!modelFile) return null

        const modelContent = await modelFile.async("text")
        const modelData = JSON.parse(modelContent)
        const modelName = modelPath.split("/").pop()?.replace(".geo.json", "") || ""

        // Store Bedrock geometry for potential re-export
        return {
            id: `model_${uuidv4()}`,
            name: modelName,
            customModelData: 1, // Bedrock doesn't use CMD, but we need it internally
            parent: "item/generated",
            textures: {},
            targetItem: "stick", // Default, user can change
            customModelDataFloats: [],
            customModelDataFlags: [],
            customModelDataStrings: [],
            customModelDataColors: [],
            bedrockGeometry: modelData
        }
    })

    const modelResults = await Promise.all(modelPromises)
    importedPack.models = modelResults.filter((m) => m !== null) as ModelData[]

    // Read sounds from sounds/sound_definitions.json
    const soundDefsFile = zip.file("sounds/sound_definitions.json")
    if (soundDefsFile) {
        const soundDefsContent = await soundDefsFile.async("text")
        const soundDefs = JSON.parse(soundDefsContent)
        importedPack.sounds = convertBedrockSoundsToInternal(soundDefs)
    }

    // Read languages from texts/ folder
    const langFiles = Object.keys(zip.files).filter(
        (path) => path.startsWith("texts/") && path.endsWith(".lang")
    )

    for (const langPath of langFiles) {
        const langFile = zip.file(langPath)
        if (langFile) {
            const langContent = await langFile.async("text")
            const langCode = langPath.split("/").pop()?.replace(".lang", "") || ""
            // Convert en_US to en_us for internal consistency
            const normalizedCode = langCode.toLowerCase().replace(/_([a-z]+)/, (m, p1) => `_${p1}`)
            const langName = langCode // Use original name for display

            const language = convertBedrockLangToInternal(langContent, normalizedCode, langName)
            importedPack.languages.push(language)
        }
    }

    // Read particles from particles/ folder
    const particleFiles = Object.keys(zip.files).filter(
        (path) => path.startsWith("particles/") && path.endsWith(".json")
    )

    for (const particlePath of particleFiles) {
        const particleFile = zip.file(particlePath)
        if (particleFile) {
            const particleContent = await particleFile.async("text")
            const particleData = JSON.parse(particleContent)
            const particleName = particlePath.split("/").pop()?.replace(".json", "") || ""

            const newParticle: CustomParticle = {
                id: `particle_${uuidv4()}`,
                name: particleName,
                textures: [], // Bedrock particles structure is different, basic import
            }

            importedPack.particles.push(newParticle)
        }
    }

    return importedPack
}
