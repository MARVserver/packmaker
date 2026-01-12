import { CustomSound, LanguageFile } from "./types"

// --- Sound Conversion ---

export function convertSoundsToJava(sounds: CustomSound[]): Record<string, any> {
    const javaSounds: Record<string, any> = {}

    sounds.forEach(sound => {
        javaSounds[sound.name] = {
            category: sound.category,
            sounds: sound.sounds.map(s => ({
                name: s,
                type: "sound"
            })),
            ...(sound.subtitle && { subtitle: sound.subtitle }),
            ...(sound.replace !== undefined && { replace: sound.replace })
        }
    })

    return javaSounds
}

export function convertSoundsToBedrock(sounds: CustomSound[]): Record<string, any> {
    const bedrockDefinitions: Record<string, any> = {
        format_version: "1.14.0",
        sound_definitions: {}
    }

    sounds.forEach(sound => {
        bedrockDefinitions.sound_definitions[sound.name] = {
            category: sound.category,
            sounds: sound.sounds.map(s => ({
                name: `sounds/${s}`,
                volume: 1.0,
                pitch: 1.0,
                load_on_low_memory: true
            })),
            ...(sound.subtitle && { __subtitle: sound.subtitle }) // Bedrock doesn't use subtitle in definitions exactly like Java, but we can store it
        }
    })

    return bedrockDefinitions
}

// --- Language Conversion ---

export function convertLangToJava(content: Record<string, string>): Record<string, string> {
    return content
}

export function convertLangToBedrock(content: Record<string, string>): string {
    return Object.entries(content)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n")
}
