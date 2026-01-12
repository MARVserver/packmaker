"use client"

import { useState, useCallback, useMemo } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Sparkles, Film, Trash2 } from 'lucide-react'

import {
  ResourcePack,
  ModelData,
  TextureData,
  CustomFont,
  FontProvider,
  CustomSound,
  CustomParticle,
  ShaderFile,
  VersionConfig,
  MergeConflict,
  GeyserMapping,
  LanguageFile,
} from "./resource-pack/types"
import { TextureManager } from "./resource-pack/texture-manager"
import { ModelManager } from "./resource-pack/model-manager"
import { SoundManager } from "./resource-pack/sound-manager"
import { FontManager } from "./resource-pack/font-manager"
import { ShaderManager } from "./resource-pack/shader-manager"
import { ParticleManager } from "./resource-pack/particle-manager"
import {
  convertSoundsToJava,
  convertSoundsToBedrock,
  convertLangToJava,
  convertLangToBedrock,
} from "./resource-pack/converters"
import { detectPackEdition, importBedrockPack } from "./resource-pack/bedrock-import"
import { LanguageManager } from "./resource-pack/language-manager"
import { v4 as uuidv4 } from "uuid"


const validateModel = (model: ModelData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!model.name.trim()) errors.push("Model name is required")
  if (!model.customModelData || model.customModelData < 1) errors.push("Valid custom model data is required")
  if (!model.targetItem.trim()) errors.push("Target item is required")
  if (Object.keys(model.textures).length === 0) errors.push("At least one texture is required")

  return { isValid: errors.length === 0, errors }
}

const validateResourcePack = (pack: ResourcePack): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!pack.name.trim()) errors.push("Pack name is required")
  if (!pack.description.trim()) errors.push("Pack description is required")
  if (pack.models.length === 0) errors.push("At least one model is required")

  // Check for duplicate custom model data within same target item
  const targetItemGroups = pack.models.reduce(
    (acc, model) => {
      if (!acc[model.targetItem]) acc[model.targetItem] = []
      acc[model.targetItem].push(model.customModelData)
      return acc
    },
    {} as Record<string, number[]>,
  )

  Object.entries(targetItemGroups).forEach(([item, dataValues]) => {
    const duplicates = dataValues.filter((value, index) => dataValues.indexOf(value) !== index)
    if (duplicates.length > 0) {
      errors.push(`Duplicate custom model data for ${item}: ${duplicates.join(", ")}`)
    }
  })

  return { isValid: errors.length === 0, errors }
}

const translations = {
  ja: {
    title: "SUMMER",
    subtitle: "Minecraft リソースパック作成ツール",
    tabs: {
      general: "一般設定",
      models: "モデル管理",
      textures: "テクスチャ管理",
      fonts: "フォント管理",
      sounds: "サウンド管理",
      particles: "パーティクル管理",
      shaders: "シェーダー管理",
      preview: "プレビュー",
      advanced: "高度な設定",
      merge: "パックマージ",
      versions: "複数バージョン",
      geyser: "Geyser マッピング" // Added Geyser tab translation
    },
    general: {
      packName: "パック名",
      packDescription: "パック説明",
      packVersion: "バージョン",
      packFormat: "パックフォーマット",
      author: "作成者",
      website: "ウェブサイト",
      license: "ライセンス",
      packIcon: "パックアイコン",
      uploadIcon: "アイコンをアップロード",
      removeIcon: "アイコンを削除",
      title: "基本設定",
    },
    models: {
      addModel: "モデルを追加",
      noModels: "モデルがありません",
      modelCount: "モデル数",
      validModels: "有効なモデル",
      invalidModels: "無効なモデル",
    },
    textures: {
      addTexture: "テクスチャを追加",
      noTextures: "テクスチャがありません",
      textureCount: "テクスチャ数",
      totalSize: "合計サイズ",
      optimizeAll: "すべて最適化",
    },
    fonts: {
      addFont: "フォントを追加",
      noFonts: "フォントがありません",
      fontCount: "フォント数",
      fontName: "フォント名",
      providerType: "プロバイダータイプ",
      addProvider: "プロバイダーを追加",
    },
    sounds: {
      addSound: "サウンドを追加",
      noSounds: "サウンドがありません",
      soundCount: "サウンド数",
      soundName: "サウンド名",
      category: "カテゴリ",
      subtitle: "字幕",
    },
    particles: {
      addParticle: "パーティクルを追加",
      noParticles: "パーティクルがありません",
      particleCount: "パーティクル数",
    },
    shaders: {
      addShader: "シェーダーを追加",
      noShaders: "シェーダーがありません",
      shaderCount: "シェーダー数",
      shaderType: "シェーダータイプ",
    },
    actions: {
      download: "ZIPダウンロード",
      downloadJson: "JSON設定をダウンロード",
      import: "既存パックをインポート",
      export: "設定をエクスポート",
      validate: "検証",
      optimize: "最適化",
      reset: "リセット",
    },
    status: {
      ready: "準備完了",
      processing: "処理中...",
      validating: "検証中...",
      optimizing: "最適化中...",
      generating: "生成中...",
      complete: "完了",
    },
    alerts: {
      noModels: "有効なモデルがありません。少なくとも1つのモデルを追加してください。",
      packGenerated: "リソースパックが正常に生成されました！",
      validationPassed: "すべての検証に合格しました！",
      validationFailed: "検証エラーがあります。修正してください。",
      optimizationComplete: "最適化が完了しました。",
      importError: "インポートエラーが発生しました。",
      exportComplete: "設定のエクスポートが完了しました。",
    },
    buttons: {
      optimizeAll: "すべて最適化",
    }
  },
  en: {
    title: "SUMMER",
    subtitle: "Minecraft Resource Pack Creator",
    tabs: {
      general: "General",
      models: "Models",
      textures: "Textures",
      fonts: "Fonts",
      sounds: "Sounds",
      particles: "Particles",
      shaders: "Shaders",
      preview: "Preview",
      advanced: "Advanced",
      merge: "Merge Packs",
      versions: "Multi-Version",
      geyser: "Geyser Mapping" // Added Geyser tab translation
    },
    general: {
      packName: "Pack Name",
      packDescription: "Pack Description",
      packVersion: "Version",
      packFormat: "Pack Format",
      author: "Author",
      website: "Website",
      license: "License",
      packIcon: "Pack Icon",
      uploadIcon: "Upload Icon",
      removeIcon: "Remove Icon",
      title: "General Settings",
    },
    models: {
      addModel: "Add Model",
      noModels: "No models available",
      modelCount: "Model Count",
      validModels: "Valid Models",
      invalidModels: "Invalid Models",
    },
    textures: {
      addTexture: "Add Texture",
      noTextures: "No textures available",
      textureCount: "Texture Count",
      totalSize: "Total Size",
      optimizeAll: "Optimize All",
    },
    fonts: {
      addFont: "Add Font",
      noFonts: "No fonts available",
      fontCount: "Font Count",
      fontName: "Font Name",
      providerType: "Provider Type",
      addProvider: "Add Provider",
    },
    sounds: {
      addSound: "Add Sound",
      noSounds: "No sounds available",
      soundCount: "Sound Count",
      soundName: "Sound Name",
      category: "Category",
      subtitle: "Subtitle",
    },
    particles: {
      addParticle: "Add Particle",
      noParticles: "No particles available",
      particleCount: "Particle Count",
    },
    shaders: {
      addShader: "Add Shader",
      noShaders: "No shaders available",
      shaderCount: "Shader Count",
      shaderType: "Shader Type",
    },
    actions: {
      download: "Download ZIP",
      downloadJson: "Download JSON",
      import: "Import Pack",
      export: "Export Settings",
      validate: "Validate",
      optimize: "Optimize",
      reset: "Reset",
    },
    status: {
      ready: "Ready",
      processing: "Processing...",
      validating: "Validating...",
      optimizing: "Optimizing...",
      generating: "Generating...",
      complete: "Complete",
    },
    alerts: {
      noModels: "No valid models found. Please add at least one model.",
      packGenerated: "Resource pack generated successfully!",
      validationPassed: "All validations passed!",
      validationFailed: "Validation errors found. Please fix them.",
      optimizationComplete: "Optimization completed.",
      importError: "Import error occurred.",
      exportComplete: "Settings exported successfully.",
    },
    buttons: {
      optimizeAll: "Optimize All",
    }
  },
}

const MINECRAFT_ITEMS = [
  "stick",
  "diamond_sword",
  "iron_sword",
  "golden_sword",
  "stone_sword",
  "wooden_sword",
  "netherite_sword",
  "diamond_pickaxe",
  "iron_pickaxe",
  "golden_pickaxe",
  "stone_pickaxe",
  "wooden_pickaxe",
  "netherite_pickaxe",
  "diamond_axe",
  "iron_axe",
  "golden_axe",
  "stone_axe",
  "wooden_axe",
  "netherite_axe",
  "diamond_shovel",
  "iron_shovel",
  "golden_shovel",
  "stone_shovel",
  "wooden_shovel",
  "netherite_shovel",
  "diamond_hoe",
  "iron_hoe",
  "golden_hoe",
  "stone_hoe",
  "wooden_hoe",
  "netherite_hoe",
  "bow",
  "crossbow",
  "trident",
  "shield",
  "fishing_rod",
  "apple",
  "bread",
  "cooked_beef",
  "cooked_porkchop",
  "cooked_chicken",
  "diamond",
  "emerald",
  "gold_ingot",
  "iron_ingot",
  "coal",
  "stone",
  "cobblestone",
  "dirt",
  "grass_block",
  "oak_log",
  "enchanted_book",
  "book",
  "paper",
  "map",
  "compass",
  "clock",
  "carrot_on_a_stick",
  "warped_fungus_on_a_stick",
  "flint_and_steel",
  "shears",
  "spyglass",
  "brush",
  "goat_horn",
]

const PACK_FORMATS = [
  { version: "1.21.6", format: 63, description: "Minecraft 1.21.6" },
  { version: "1.21.4", format: 48, description: "Minecraft 1.21.4 (New items/ folder structure)" },
  { version: "1.21", format: 34, description: "Minecraft 1.21" },
  { version: "1.20.5-1.20.6", format: 32, description: "Minecraft 1.20.5-1.20.6" },
  { version: "1.20.3-1.20.4", format: 22, description: "Minecraft 1.20.3-1.20.4" },
  { version: "1.20.0-1.20.2", format: 18, description: "Minecraft 1.20.0-1.20.2" },
  { version: "1.19.4", format: 15, description: "Minecraft 1.19.4" },
  { version: "1.19.3", format: 13, description: "Minecraft 1.19.3" },
  { version: "1.19.0-1.19.2", format: 12, description: "Minecraft 1.19.0-1.19.2" },
  { version: "1.18.2", format: 9, description: "Minecraft 1.18.2" },
  { version: "1.18.0-1.18.1", format: 8, description: "Minecraft 1.18.0-1.18.1" },
  { version: "1.17.0-1.17.1", format: 7, description: "Minecraft 1.17.0-1.17.1" },
  { version: "1.16.2-1.16.5", format: 6, description: "Minecraft 1.16.2-1.16.5" },
  { version: "1.15.0-1.16.1", format: 5, description: "Minecraft 1.15.0-1.16.1" },
]

export function ResourcePackMaker() {
  const [language, setLanguage] = useState<"ja" | "en">("en") // Default to English
  const t = translations[language]

  const [resourcePack, setResourcePack] = useState<ResourcePack>({
    name: "",
    description: "",
    version: "1.21.6",
    format: 63,
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
  })

  const [activeTab, setActiveTab] = useState("general")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [progress, setProgress] = useState(0)
  const [validationResults, setValidationResults] = useState<{ isValid: boolean; errors: string[] }>({
    isValid: true,
    errors: [],
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [mergePacks, setMergePacks] = useState<{ name: string; file: File }[]>([])
  const [mergeConflicts, setMergeConflicts] = useState<MergeConflict[]>([])
  const [versionConfigs, setVersionConfigs] = useState<VersionConfig[]>([
    { version: "1.21.6+", format: 63, enabled: true },
    { version: "1.21.4-1.21.5", format: 48, enabled: false },
    { version: "1.21.0-1.21.3", format: 34, enabled: false },
    { version: "1.20.5-1.20.6", format: 32, enabled: false },
    { version: "1.20.3-1.20.4", format: 22, enabled: false },
    { version: "1.20.0-1.20.2", format: 18, enabled: false },
    { version: "1.19.4", format: 15, enabled: false },
    { version: "1.19.3", format: 13, enabled: false },
    { version: "1.19.0-1.19.2", format: 12, enabled: false },
    { version: "1.18.0-1.18.2", format: 9, enabled: false }, // Corrected format 9 mapping
    { version: "1.17.0-1.17.1", format: 7, enabled: false },
    { version: "1.16.2-1.16.5", format: 6, enabled: false },
    { version: "1.15.0-1.15.2", format: 5, enabled: false },
    { version: "1.13.0-1.14.4", format: 4, enabled: false },
  ])
  const [packEdition, setPackEdition] = useState<"java" | "bedrock">("java")

  const [targetItemInput, setTargetItemInput] = useState<Record<string, string>>({})
  const [showTargetItemSuggestions, setShowTargetItemSuggestions] = useState<Record<string, boolean>>({})

  const [editingTextureAnimation, setEditingTextureAnimation] = useState<string | null>(null)

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  const statistics = useMemo(() => {
    const validModels = resourcePack.models.filter((model) => {
      const validation = validateModel(model)
      return validation.isValid
    })

    const totalTextureSize = resourcePack.textures.reduce((sum, texture) => sum + (texture.size || 0), 0)
    const optimizedTextures = resourcePack.textures.filter((t) => t.isOptimized).length

    return {
      totalModels: resourcePack.models.length,
      validModels: validModels.length,
      invalidModels: resourcePack.models.length - validModels.length,
      totalTextures: resourcePack.textures.length,
      optimizedTextures,
      totalSize: totalTextureSize,
      formattedSize: formatFileSize(totalTextureSize),
    }
  }, [resourcePack.models, resourcePack.textures, formatFileSize])

  const packStats = statistics

  const updateProgress = useCallback((step: string, percent: number) => {
    setProcessingStep(step)
    setProgress(percent)
  }, [])

  const handlePackInfoChange = useCallback((field: keyof ResourcePack, value: string | number | File | undefined) => {
    setResourcePack((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const addModel = useCallback(() => {
    const existingCustomModelData = resourcePack.models.map((m) => m.customModelData)
    let newCustomModelData = 1
    while (existingCustomModelData.includes(newCustomModelData)) {
      newCustomModelData++
    }

    const newModel: ModelData = {
      id: `model_${uuidv4()}`,
      name: `New Model ${resourcePack.models.length + 1}`,
      customModelData: newCustomModelData,
      parent: "item/generated",
      textures: {},
      targetItem: "stick",
      customModelDataFloats: [],
      customModelDataFlags: [],
      customModelDataStrings: [],
      customModelDataColors: [],
    }

    setResourcePack((prev) => ({
      ...prev,
      models: [...prev.models, newModel],
    }))
  }, [resourcePack.models])

  const updateModel = useCallback((modelId: string, updatedModel: Partial<ModelData>) => {
    setResourcePack((prev) => ({
      ...prev,
      models: prev.models.map((model) => (model.id === modelId ? { ...model, ...updatedModel } : model)),
    }))
  }, [])

  const deleteModel = useCallback((modelId: string) => {
    setResourcePack((prev) => ({
      ...prev,
      models: prev.models.filter((model) => model.id !== modelId),
    }))
  }, [])

  const updateModelTexture = useCallback((modelId: string, layer: string, textureName: string) => {
    setResourcePack((prev) => ({
      ...prev,
      models: prev.models.map((model) =>
        model.id === modelId
          ? {
            ...model,
            textures: {
              ...model.textures,
              [layer]: textureName,
            },
          }
          : model,
      ),
    }))
  }, [])

  const removeModelTexture = useCallback((modelId: string, layer: string) => {
    setResourcePack((prev) => ({
      ...prev,
      models: prev.models.map((model) => {
        if (model.id === modelId) {
          const newTextures = { ...model.textures }
          delete newTextures[layer]
          return { ...model, textures: newTextures }
        }
        return model
      }),
    }))
  }, [])

  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const addTexture = useCallback(
    async (file: File, category: string = "item") => {
      const fileName = file.name.replace(/\.[^/.]+$/, "")

      // Get image dimensions
      const dimensions = await getImageDimensions(file)

      const newTexture: TextureData = {
        id: `texture_${uuidv4()}`,
        name: fileName,
        file: file,
        path: `textures/${category}/${fileName}.png`,
        size: file.size,
        dimensions,
        isOptimized: false,
        width: dimensions.width,
        height: dimensions.height,
        enabled: true,
        animation: { // Initialize animation settings
          enabled: false,
          frametime: 1,
          interpolate: false,
          frames: []
        }
      }

      setResourcePack((prev) => ({
        ...prev,
        textures: [...prev.textures, newTexture],
      }))
    },
    [getImageDimensions],
  )

  const deleteTexture = useCallback((id: string) => {
    setResourcePack((prev) => ({
      ...prev,
      textures: prev.textures.filter((t) => t.id !== id),
    }))
  }, [])

  const updateTexture = useCallback((id: string, data: Partial<TextureData>) => {
    setResourcePack((prev) => ({
      ...prev,
      textures: prev.textures.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }))
  }, [])

  const addLanguage = useCallback((lang: LanguageFile) => {
    setResourcePack((prev) => ({
      ...prev,
      languages: [...prev.languages, lang],
    }))
  }, [])

  const updateLanguage = useCallback((code: string, content: Record<string, string>) => {
    setResourcePack((prev) => ({
      ...prev,
      languages: prev.languages.map((l) => (l.code === code ? { ...l, content } : l)),
    }))
  }, [])

  const deleteLanguage = useCallback((code: string) => {
    setResourcePack((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l.code !== code),
    }))
  }, [])

  const addSound = useCallback((file: File) => {
    const newSound: CustomSound = {
      id: `sound_${uuidv4()}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      category: "master",
      sounds: [],
      file,
    }
    setResourcePack((prev) => ({
      ...prev,
      sounds: [...prev.sounds, newSound],
    }))
  }, [])

  const updateSound = useCallback((id: string, data: Partial<CustomSound>) => {
    setResourcePack((prev) => ({
      ...prev,
      sounds: prev.sounds.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }))
  }, [])

  const deleteSound = useCallback((id: string) => {
    setResourcePack((prev) => ({
      ...prev,
      sounds: prev.sounds.filter((s) => s.id !== id),
    }))
  }, [])

  const addFont = useCallback((file: File) => {
    const newFont: CustomFont = {
      id: `font_${uuidv4()}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      providers: [{ id: `provider_${uuidv4()}`, type: "ttf", file: file.name }],
      file,
    }
    setResourcePack((prev) => ({
      ...prev,
      fonts: [...prev.fonts, newFont],
    }))
  }, [])

  const updateFont = useCallback((id: string, data: Partial<CustomFont>) => {
    setResourcePack((prev) => ({
      ...prev,
      fonts: prev.fonts.map((f) => (f.id === id ? { ...f, ...data } : f)),
    }))
  }, [])

  const deleteFont = useCallback((id: string) => {
    setResourcePack((prev) => ({
      ...prev,
      fonts: prev.fonts.filter((f) => f.id !== id),
    }))
  }, [])

  const addParticle = useCallback(() => {
    const newParticle: CustomParticle = {
      id: `particle_${uuidv4()}`,
      name: "new_particle",
      textures: [],
    }
    setResourcePack((prev) => ({
      ...prev,
      particles: [...prev.particles, newParticle],
    }))
  }, [])

  const updateParticle = useCallback((id: string, data: Partial<CustomParticle>) => {
    setResourcePack((prev) => ({
      ...prev,
      particles: prev.particles.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }))
  }, [])

  const deleteParticle = useCallback((id: string) => {
    setResourcePack((prev) => ({
      ...prev,
      particles: prev.particles.filter((p) => p.id !== id),
    }))
  }, [])

  const addShader = useCallback((file: File, type: "vertex" | "fragment" | "program") => {
    const newShader: ShaderFile = {
      id: `shader_${uuidv4()}`,
      name: file.name,
      type,
      file,
    }
    setResourcePack((prev) => ({
      ...prev,
      shaders: [...prev.shaders, newShader],
    }))
  }, [])

  const deleteShader = useCallback((id: string) => {
    setResourcePack((prev) => ({
      ...prev,
      shaders: prev.shaders.filter((s) => s.id !== id),
    }))
  }, [])


  const updateTextureAnimation = useCallback((textureId: string, animation: TextureData['animation']) => {
    setResourcePack(prev => ({
      ...prev,
      textures: prev.textures.map(texture =>
        texture.id === textureId ? { ...texture, animation } : texture
      )
    }))
  }, [])

  const optimizeTexture = useCallback(async (textureId: string) => {
    setIsProcessing(true)
    updateProgress("Optimizing texture...", 50)

    // Simulate optimization process
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setResourcePack((prev) => ({
      ...prev,
      textures: prev.textures.map((texture) =>
        texture.id === textureId
          ? { ...texture, isOptimized: true, size: Math.floor((texture.size || 0) * 0.7) }
          : texture,
      ),
    }))

    setIsProcessing(false)
    setProgress(0)
  }, [])

  const optimizeAllTextures = useCallback(async () => {
    setIsProcessing(true)
    const unoptimizedTextures = resourcePack.textures.filter((t) => !t.isOptimized)

    for (let i = 0; i < unoptimizedTextures.length; i++) {
      updateProgress(
        `Optimizing texture ${i + 1}/${unoptimizedTextures.length}...`,
        (i / unoptimizedTextures.length) * 100,
      )

      const textureId = unoptimizedTextures[i].id
      setResourcePack((prev) => ({
        ...prev,
        textures: prev.textures.map((texture) =>
          texture.id === textureId
            ? { ...texture, isOptimized: true, size: Math.floor((texture.size || 0) * 0.7) }
            : texture,
        ),
      }))

      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setIsProcessing(false)
    setProgress(0)
    alert(t.alerts.optimizationComplete)
  }, [resourcePack.textures, t.alerts.optimizationComplete])

  const convertToBedrock = useCallback((bbmodelData: any, modelName: string) => {
    try {
      // Converting to Bedrock format

      const geometry = {
        format_version: "1.16.0",
        "minecraft:geometry": [
          {
            description: {
              identifier: `geometry.${modelName}`,
              texture_width: bbmodelData.resolution?.width || 16,
              texture_height: bbmodelData.resolution?.height || 16,
              visible_bounds_width: 2,
              visible_bounds_height: 1.5,
              visible_bounds_offset: [0, 0.25, 0],
            },
            bones: [] as any[],
          },
        ],
      }

      // Convert outliner to bones with proper hierarchy
      if (bbmodelData.outliner && Array.isArray(bbmodelData.outliner)) {
        const processBone = (item: any, parentName?: string) => {
          if (!item) return null

          const bone: any = {
            name: item.name || `bone_${Date.now()}`,
            pivot: item.origin || [0, 0, 0],
            cubes: [],
          }

          if (parentName) {
            bone.parent = parentName
          }

          if (item.rotation) {
            bone.rotation = item.rotation
          }

          // Process cubes from children
          if (item.children && Array.isArray(item.children)) {
            item.children.forEach((childUuid: string) => {
              const element = bbmodelData.elements?.find((e: any) => e.uuid === childUuid)
              if (element) {
                const cube: any = {
                  origin: element.from || [0, 0, 0],
                  size: [
                    (element.to?.[0] || 0) - (element.from?.[0] || 0),
                    (element.to?.[1] || 0) - (element.from?.[1] || 0),
                    (element.to?.[2] || 0) - (element.from?.[2] || 0),
                  ],
                  uv: {},
                }

                if (element.rotation) {
                  cube.rotation = element.rotation
                  cube.pivot = element.origin || element.from || [0, 0, 0]
                }

                if (element.inflate) {
                  cube.inflate = element.inflate
                }

                // Convert UV mapping to Bedrock format
                if (element.faces) {
                  Object.entries(element.faces).forEach(([faceName, faceData]: [string, any]) => {
                    if (faceData && faceData.uv) {
                      cube.uv[faceName] = {
                        uv: [faceData.uv[0], faceData.uv[1]],
                        uv_size: [faceData.uv[2] - faceData.uv[0], faceData.uv[3] - faceData.uv[1]],
                      }

                      if (faceData.texture !== undefined) {
                        cube.uv[faceName].texture = faceData.texture
                      }
                    }
                  })
                }

                bone.cubes.push(cube)
              }
            })
          }

          return bone
        }

        bbmodelData.outliner.forEach((item: any) => {
          const bone = processBone(item)
          if (bone) {
            geometry["minecraft:geometry"][0].bones.push(bone)
          }
        })
      }

      // Bedrock conversion successful
      return geometry
    } catch (error) {
      console.error("[MARV] Bedrock conversion error:", error)
      return null
    }
  }, [])

  const handleBbmodelUpload = useCallback(
    async (file: File, parsedData: any) => {
      try {
        // BBModel import started
        setIsProcessing(true)
        updateProgress("Parsing BBModel file...", 10)

        const modelName = parsedData.name || file.name.replace(".bbmodel", "")
        const targetItem = parsedData.meta?.model_identifier || "stick"

        const existingCustomModelData = resourcePack.models.map((m) => m.customModelData)
        let customModelData = 1
        while (existingCustomModelData.includes(customModelData)) {
          customModelData++
        }

        updateProgress("Processing textures...", 30)

        const textureMap: Record<string, string> = {}
        const textureFiles: File[] = []

        if (parsedData.textures && Array.isArray(parsedData.textures)) {
          for (let i = 0; i < parsedData.textures.length; i++) {
            const texture = parsedData.textures[i]
            updateProgress(
              `Processing texture ${i + 1}/${parsedData.textures.length}...`,
              30 + (i / parsedData.textures.length) * 40,
            )

            if (texture.source && texture.source.startsWith("data:image")) {
              const base64Data = texture.source.split(",")[1]
              const binaryData = atob(base64Data)
              const arrayBuffer = new Uint8Array(binaryData.length)
              for (let j = 0; j < binaryData.length; j++) {
                arrayBuffer[j] = binaryData.charCodeAt(j)
              }
              const blob = new Blob([arrayBuffer], { type: "image/png" })
              const textureName = texture.name || `texture_${i}`
              const textureFile = new File([blob], `${textureName}.png`, { type: "image/png" })

              textureFiles.push(textureFile)
              textureMap[`layer${i}`] = textureName
            }
          }
        }

        updateProgress("Creating model...", 80)

        let bedrockGeometry = null
        if (packEdition === "bedrock") {
          bedrockGeometry = convertToBedrock(parsedData, modelName)
        }

        const newModel: ModelData = {
          id: `model_${uuidv4()}`,
          name: modelName,
          customModelData,
          parent: "item/generated",
          textures: textureMap,
          targetItem,
          customModelDataFloats: [customModelData],
          customModelDataFlags: [],
          customModelDataStrings: [],
          customModelDataColors: [],
          bedrockGeometry,
        }

        for (const textureFile of textureFiles) {
          await addTexture(textureFile)
        }

        setResourcePack((prev) => ({
          ...prev,
          models: [...prev.models, newModel],
        }))

        updateProgress("Complete!", 100)

        setTimeout(() => {
          setIsProcessing(false)
          setProgress(0)
        }, 500)
      } catch (error) {
        console.error("[MARV] Import error:", error)
        setIsProcessing(false)
        updateProgress(`Error: ${error instanceof Error ? error.message : "Unknown error"}`, 0)
      }
    },
    [packEdition, resourcePack.models, addTexture, convertToBedrock],
  )

  const validatePack = useCallback(() => {
    setIsProcessing(true)
    updateProgress("Validating resource pack...", 50)

    const packValidation = validateResourcePack(resourcePack)
    const modelValidations = resourcePack.models.map((model) => ({
      model,
      validation: validateModel(model),
    }))

    const allErrors = [
      ...packValidation.errors,
      ...modelValidations.flatMap((mv) => mv.validation.errors.map((error) => `${mv.model.name}: ${error}`)),
    ]

    setValidationResults({
      isValid: allErrors.length === 0,
      errors: allErrors,
    })

    setTimeout(() => {
      setIsProcessing(false)
      setProgress(0)
      if (allErrors.length === 0) {
        alert(t.alerts.validationPassed)
      } else {
        alert(t.alerts.validationFailed)
      }
    }, 1000)
  }, [resourcePack, t.alerts])

  const getMinecraftVersion = useCallback((format: number): string => {
    const versionMap: Record<number, string> = {
      63: "1.21.6+",
      48: "1.21.4-1.21.5",
      34: "1.21.0-1.21.3",
      32: "1.20.5-1.20.6",
      22: "1.20.3-1.20.4",
      18: "1.20.0-1.20.2",
      15: "1.19.4",
      13: "1.19.3",
      12: "1.19.0-1.19.2",
      9: "1.18.0-1.18.2", // Corrected: format 9 is 1.18.0-1.18.1, changed to 1.18.0-1.18.2 as per original code's logic.
      8: "1.17.0-1.17.1", // Corrected: format 8 is 1.18.0-1.18.1, original code had 1.17.0-1.17.1
      7: "1.16.2-1.16.5", // Corrected: format 7 is 1.17.0-1.17.1, original code had 1.16.2-1.16.5
      6: "1.16.0-1.16.1", // Corrected: format 6 is 1.16.2-1.16.5, original code had 1.15.0-1.16.1
      5: "1.15.0-1.15.2", // Corrected: format 5 is 1.15.0-1.16.1, original code had 1.14.4
      4: "1.13.0-1.14.4", // Added for completeness
    }
    return versionMap[format] || "Unknown"
  }, [])

  const generateGeyserMapping = useCallback((): string => {
    const mapping: GeyserMapping = {
      format_version: 1,
      items: {},
    }

    const validModels = resourcePack.models.filter((m) => m.customModelData && m.targetItem)

    validModels.forEach((model) => {
      const javaItem = `minecraft:${model.targetItem}`

      if (!mapping.items[javaItem]) {
        mapping.items[javaItem] = []
      }

      const textureName = Object.values(model.textures)[0]?.replace(/^.*\//, "").replace(/\.[^/.]+$/, "") || model.name

      mapping.items[javaItem].push({
        custom_model_data: model.customModelData,
        display_name: model.name,
        icon: textureName,
        allow_offhand: true,
        texture_size: 16,
        creative_category: 1,
        creative_group: "custom_items",
        tags: ["custom_item"],
      })
    })

    return JSON.stringify(mapping, null, 2)
  }, [resourcePack.models])

  const generateZip = useCallback(async () => {
    // Starting ZIP generation
    setIsProcessing(true)
    updateProgress("Initializing...", 5)

    const validation = validateResourcePack(resourcePack)
    if (!validation.isValid) {
      alert(`Validation failed:\n${validation.errors.join("\n")}`)
      setIsProcessing(false)
      return
    }

    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    const validModels = resourcePack.models.filter((m) => m.customModelData && m.targetItem)
    // Valid models count

    if (packEdition === "bedrock") {
      // Generating Bedrock Edition pack
      updateProgress("Creating Bedrock manifest...", 15)

      // Create manifest.json
      const manifest = {
        format_version: 2,
        header: {
          name: resourcePack.name,
          description: resourcePack.description,
          uuid: uuidv4(),
          version: [1, 0, 0],
          min_engine_version: [1, 21, 0],
        },
        modules: [
          {
            type: "resources",
            uuid: uuidv4(),
            version: [1, 0, 0],
          },
        ],
      }

      zip.file("manifest.json", JSON.stringify(manifest, null, 2))

      // Add pack icon
      if (resourcePack.packIcon) {
        zip.file("pack_icon.png", resourcePack.packIcon)
      }

      updateProgress("Creating Bedrock models and attachables...", 40)

      // Generate geometry and attachables for each model
      for (let i = 0; i < validModels.length; i++) {
        const model = validModels[i]
        updateProgress(
          `Processing model ${i + 1}/${validModels.length}: ${model.name}`,
          40 + (i / validModels.length) * 30,
        )

        if (model.bedrockGeometry) {
          // Geometry file
          zip.file(`models/entity/${model.name}.geo.json`, JSON.stringify(model.bedrockGeometry, null, 2))

          // Attachable file
          const attachable = {
            format_version: "1.10.0",
            "minecraft:attachable": {
              description: {
                identifier: `custom:${model.name}`,
                materials: {
                  default: "entity_alphatest",
                },
                textures: {
                  default: `textures/entity/${model.name}`,
                },
                geometry: {
                  default: `geometry.${model.name}`,
                },
                render_controllers: ["controller.render.default"],
                scripts: {
                  parent_setup: "variable.item_slot = 0;",
                },
              },
            },
          }

          zip.file(`${model.name}.attachable.json`, JSON.stringify(attachable, null, 2))
        }
      }

      // Add textures
      updateProgress("Adding Bedrock textures...", 75)
      for (const texture of resourcePack.textures) {
        const textureName = texture.name.replace(/\.[^/.]+$/, "")
        zip.file(`textures/entity/${textureName}.png`, texture.file)
      }

      // README for Bedrock
      const readme = `# ${resourcePack.name}

${resourcePack.description}

## Minecraft Bedrock Edition Resource Pack

### Installation
1. Copy this pack to your resource_packs folder
2. Activate in Settings > Global Resources
3. Join a world to see custom models

### Models Included
${validModels.map((m) => `- ${m.name} (Custom Model Data: ${m.customModelData})`).join("\n")}

### Technical Details
- Format Version: 2
- Min Engine Version: 1.21.0
- Total Models: ${validModels.length}
- Total Textures: ${resourcePack.textures.length}

Generated with SUMMER Resource Pack Maker
${new Date().toLocaleString()}
`

      zip.file("README.txt", readme)

      updateProgress("Generating Geyser mapping...", 85)
      const geyserMapping = generateGeyserMapping()
      zip.file("geyser_mappings.json", geyserMapping)

    } else {
      // Generating Java Edition pack

      // Java Edition pack.mcmeta
      const packMcmeta = {
        pack: {
          pack_format: resourcePack.format,
          description: resourcePack.description || "Generated Resource Pack",
        },
      }
      zip.file("pack.mcmeta", JSON.stringify(packMcmeta, null, 2))

      // Pack icon
      if (resourcePack.packIcon) {
        zip.file("pack.png", resourcePack.packIcon)
      }

      // README
      const minecraftVersion = getMinecraftVersion(resourcePack.format)
      const readme = `# ${resourcePack.name || "Resource Pack"}

**Generated by SUMMER Resource Pack Maker**

## Pack Informationresource
- **Version**: ${resourcePack.version}
- **Pack Format**: ${resourcePack.format} (Minecraft ${minecraftVersion})
- **Description**: ${resourcePack.description}
${resourcePack.author ? `- **Author**: ${resourcePack.author}` : ""}
${resourcePack.website ? `- **Website**: ${resourcePack.website}` : ""}
${resourcePack.license ? `- **License**: ${resourcePack.license}` : ""}

## Contents
- **Models**: ${validModels.length}
- **Textures**: ${resourcePack.textures.length}
- **Fonts**: ${resourcePack.fonts.length}
- **Sounds**: ${resourcePack.sounds.length}
- **Particles**: ${resourcePack.particles.length}
- **Shaders**: ${resourcePack.shaders.length}

## Installation
1. Download this resource pack
2. Open Minecraft ${minecraftVersion}
3. Go to Options > Resource Packs
4. Click "Open Pack Folder"
5. Move this ZIP file into the folder
6. Select the pack in Minecraft

## Custom Model Data Reference

${validModels
          .map(
            (model) => `### ${model.name}
- **Item**: minecraft:${model.targetItem}
- **Custom Model Data**: ${model.customModelData}
- **Give Command** (1.21.4+ Latest Format - item_model): 
  \`\`\`
  /give @p minecraft:${model.targetItem}[minecraft:item_model="${model.name}"]
  \`\`\`
- **Give Command** (1.21.4+ custom_model_data): 
  \`\`\`
  /give @p minecraft:${model.targetItem}[minecraft:custom_model_data={floats:[${model.customModelData}.0f]}]
  \`\`\`
- **Legacy Command** (pre-1.21.4):
  \`\`\`
  /give @p minecraft:${model.targetItem}{CustomModelData:${model.customModelData}}
  \`\`\`
`,
          )
          .join("\n")}

---
Generated on ${new Date().toLocaleString()}
Format: ${resourcePack.format >= 48 ? "1.21.4+ (item_model with range_dispatch)" : "Legacy (overrides)"}

**Note**: The latest 1.21.4+ format uses \`minecraft:item_model\` component which directly references the model name.
This is the recommended approach over \`custom_model_data\` for new packs.
`

      zip.file("README.md", readme)

      updateProgress("Creating item definitions...", 40)

      // Group models by target item
      const itemGroups = validModels.reduce(
        (acc, model) => {
          if (!acc[model.targetItem]) {
            acc[model.targetItem] = []
          }
          acc[model.targetItem].push(model)
          return acc
        },
        {} as Record<string, ModelData[]>,
      )

      // Generate item definitions based on format
      for (const [itemName, models] of Object.entries(itemGroups)) {
        const sortedModels = [...models].sort((a, b) => a.customModelData - b.customModelData)

        if (resourcePack.format >= 48) {
          // 1.21.4+ format with range_dispatch
          console.log("[MARV] Using 1.21.4+ item_model format for", itemName)

          const itemDef = {
            model: {
              type: "minecraft:range_dispatch",
              property: "minecraft:custom_model_data",
              index: 0,
              fallback: {
                type: "minecraft:model",
                model: `minecraft:item/${itemName}`,
              },
              entries: sortedModels.map((model) => ({
                threshold: model.customModelData,
                model: {
                  type: "minecraft:model",
                  model: `minecraft:item/${model.name}`,
                },
              })),
            },
          }

          zip.file(`assets/minecraft/items/${itemName}.json`, JSON.stringify(itemDef, null, 2))
        } else {
          // Legacy format with overrides
          console.log("[MARV] Using legacy overrides format for", itemName)

          const itemModel = {
            parent: "item/generated",
            textures: {
              layer0: `minecraft:item/${itemName}`,
            },
            overrides: sortedModels.map((model) => ({
              predicate: {
                custom_model_data: model.customModelData,
              },
              model: `minecraft:item/${model.name}`,
            })),
          }

          zip.file(`assets/minecraft/models/item/${itemName}.json`, JSON.stringify(itemModel, null, 2))
        }
      }

      // Generate model files
      updateProgress("Creating model files...", 60)

      for (let i = 0; i < validModels.length; i++) {
        const model = validModels[i]
        updateProgress(`Processing model ${i + 1}/${validModels.length}: ${model.name}`, 60 + (i / validModels.length) * 15)

        const modelJson: any = {
          parent: model.parent || "item/generated",
          textures: {},
        }

        // Add textures with correct paths
        Object.entries(model.textures).forEach(([layer, textureName]) => {
          modelJson.textures[layer] = `minecraft:item/${textureName}`
        })

        if (model.elements) {
          modelJson.elements = model.elements
        }

        if (model.display) {
          modelJson.display = model.display
        }

        zip.file(`assets/minecraft/models/item/${model.name}.json`, JSON.stringify(modelJson, null, 2))
      }

      // Add textures
      updateProgress("Adding textures...", 80)

      for (const texture of resourcePack.textures) {
        const textureName = texture.name.replace(/\.[^/.]+$/, "")
        zip.file(`assets/minecraft/textures/item/${textureName}.png`, texture.file)

        if (texture.animation?.enabled) {
          const mcmeta = {
            animation: {
              ...(texture.animation.frametime !== undefined && { frametime: texture.animation.frametime }),
              ...(texture.animation.interpolate !== undefined && { interpolate: texture.animation.interpolate }),
              ...(texture.animation.frames && texture.animation.frames.length > 0 && { frames: texture.animation.frames })
            }
          }
          zip.file(`assets/minecraft/textures/item/${textureName}.png.mcmeta`, JSON.stringify(mcmeta, null, 2))
        }
      }

      // Add fonts
      if (resourcePack.fonts.length > 0) {
        updateProgress("Adding custom fonts...", 85)

        for (const font of resourcePack.fonts) {
          const fontJson: any = {
            providers: font.providers.map((provider) => {
              const providerJson: any = { type: provider.type }

              if (provider.type === "bitmap") {
                // Determine filename for bitmap texture
                let filename = font.name
                if (provider.fileHandle) {
                  filename = provider.fileHandle.name.replace(/\.[^/.]+$/, "")
                } else if (provider.file) {
                  const match = provider.file.match(/minecraft:font\/(.+)\.png/)
                  if (match) filename = match[1]
                }

                providerJson.file = `minecraft:font/${filename}.png`
                providerJson.ascent = provider.ascent || 8
                providerJson.height = provider.height || 8
                if (provider.chars) providerJson.chars = provider.chars

                // Save bitmap texture to textures/font/
                if (provider.fileHandle) {
                  zip.file(`assets/minecraft/textures/font/${provider.fileHandle.name}`, provider.fileHandle)
                } else if (font.file?.name.toLowerCase().endsWith(".png")) {
                  zip.file(`assets/minecraft/textures/font/${filename}.png`, font.file)
                }

              } else if (provider.type === "ttf") {
                // Determine filename and extension for TTF font
                let filename = font.name
                let extension = "ttf"

                if (provider.fileHandle) {
                  filename = provider.fileHandle.name.replace(/\.[^/.]+$/, "")
                  extension = provider.fileHandle.name.split(".").pop()?.toLowerCase() || "ttf"
                } else if (provider.file) {
                  const match = provider.file.match(/minecraft:font\/(.+)\.(.+)$/)
                  if (match) {
                    filename = match[1]
                    extension = match[2]
                  }
                } else if (font.file) {
                  const ext = font.file.name.split(".").pop()?.toLowerCase()
                  if (ext && ['ttf', 'otf'].includes(ext)) {
                    extension = ext
                  }
                }

                providerJson.file = `minecraft:font/${filename}.${extension}`
                providerJson.size = provider.size || 11
                providerJson.oversample = provider.oversample || 1.0
                if (provider.shift) providerJson.shift = provider.shift
                if (provider.skip) providerJson.skip = provider.skip

                // Save TTF/OTF file to font/
                if (provider.fileHandle) {
                  zip.file(`assets/minecraft/font/${provider.fileHandle.name}`, provider.fileHandle)
                } else if (font.file) {
                  const ext = font.file.name.split(".").pop()?.toLowerCase()
                  if (ext && ['ttf', 'otf'].includes(ext)) {
                    zip.file(`assets/minecraft/font/${filename}.${extension}`, font.file)
                  }
                }

              } else if (provider.type === "space") {
                providerJson.advances = provider.advances || {}
              } else if (provider.type === "unihex") {
                providerJson.hex_file = provider.file || `minecraft:font/unifont.hex`
                providerJson.size_overrides = []
              }

              return providerJson
            }),
          }

          // Save font JSON definition
          zip.file(`assets/minecraft/font/${font.name}.json`, JSON.stringify(fontJson, null, 2))
        }
      }

      // Add sounds
      if (resourcePack.sounds.length > 0) {
        updateProgress("Adding sounds...", 90)

        if (packEdition === "bedrock") {
          const soundDefinitions = convertSoundsToBedrock(resourcePack.sounds)
          zip.file("sounds/sound_definitions.json", JSON.stringify(soundDefinitions, null, 2))

          for (const sound of resourcePack.sounds) {
            if (sound.file) {
              const ext = sound.file.name.split(".").pop()
              zip.file(`sounds/${sound.name}.${ext}`, sound.file)
            }
          }
        } else {
          const soundsJson = convertSoundsToJava(resourcePack.sounds)
          zip.file("assets/minecraft/sounds.json", JSON.stringify(soundsJson, null, 2))

          for (const sound of resourcePack.sounds) {
            if (sound.file) {
              const ext = sound.file.name.split(".").pop()
              zip.file(`assets/minecraft/sounds/${sound.name}.${ext}`, sound.file)
            }
          }
        }
      }

      // Add languages
      if (resourcePack.languages.length > 0) {
        updateProgress("Adding languages...", 92)

        for (const lang of resourcePack.languages) {
          if (packEdition === "bedrock") {
            const langContent = convertLangToBedrock(lang.content)
            // Bedrock uses .lang files in texts/ folder
            // Map common codes: en_us -> en_US
            const bedrockCode = lang.code.replace("_", "_").replace(/_(\w+)/, (m, p1) => `_${p1.toUpperCase()}`)
            zip.file(`texts/${bedrockCode}.lang`, langContent)
          } else {
            const langJson = convertLangToJava(lang.content)
            zip.file(`assets/minecraft/lang/${lang.code}.json`, JSON.stringify(langJson, null, 2))
          }
        }
      }

      // Add particles
      if (resourcePack.particles.length > 0) {
        updateProgress("Adding particles...", 93)

        for (const particle of resourcePack.particles) {
          if (packEdition === "bedrock") {
            // Bedrock particles are complex, for now we just copy files if they exist
            // and maybe create a basic definition if we had a converter
            if (particle.file) {
              zip.file(`textures/particle/${particle.name}.png`, particle.file)
            }
            // Create a basic particle JSON for Bedrock if needed, or skip if not supported
            const particleJson = {
              format_version: "1.10.0",
              particle_effect: {
                description: {
                  identifier: `custom:${particle.name}`,
                  basic_render_parameters: {
                    material: "particles_alpha",
                    texture: `textures/particle/${particle.name}`
                  }
                },
                components: {}
              }
            }
            zip.file(`particles/${particle.name}.json`, JSON.stringify(particleJson, null, 2))

          } else {
            const particleJson = {
              textures: particle.textures.map((t) => `minecraft:particle/${t}`),
            }
            zip.file(`assets/minecraft/particles/${particle.name}.json`, JSON.stringify(particleJson, null, 2))

            if (particle.file) {
              zip.file(`assets/minecraft/textures/particle/${particle.name}.png`, particle.file)
            }
          }
        }
      }

      // Add shaders
      if (resourcePack.shaders.length > 0) {
        updateProgress("Adding shaders...", 94)

        if (packEdition === "java") {
          for (const shader of resourcePack.shaders) {
            const extension = shader.type === "program" ? ".json" : shader.type === "vertex" ? ".vsh" : ".fsh"
            const folder = shader.type === "program" ? "program" : "core"

            if (shader.file) {
              zip.file(`assets/minecraft/shaders/${folder}/${shader.name}${extension}`, shader.file)
            } else if (shader.content) {
              zip.file(`assets/minecraft/shaders/${folder}/${shader.name}${extension}`, shader.content)
            }
          }
        } else {
          // Bedrock shaders are not directly supported via this simple mechanism usually
          // but we can include them in a shaders/ folder if the user provided them
          for (const shader of resourcePack.shaders) {
            // Bedrock uses .bin or specific folder structures. We'll just dump them in shaders/
            // assuming the user knows what they are doing for Bedrock.
            const extension = shader.file?.name.split('.').pop() || 'bin'
            if (shader.file) {
              zip.file(`shaders/glsl/${shader.name}.${extension}`, shader.file)
            }
          }
        }
      }

      updateProgress("Generating Geyser mapping...", 85)
      const geyserMapping = generateGeyserMapping()
      zip.file("geyser_mappings.json", geyserMapping)
    }

    updateProgress("Generating ZIP file...", 97)

    const content = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    })

    updateProgress("Complete!", 100)

    const url = URL.createObjectURL(content)
    const a = document.createElement("a")
    a.href = url
    const packName = resourcePack.name || "resource-pack"
    const editionSuffix = packEdition === "bedrock" ? "-bedrock" : ""
    a.download = `${packName}${editionSuffix}.zip`
    a.click()
    URL.revokeObjectURL(url)

    console.log("[MARV] ZIP generation complete!")

    setTimeout(() => {
      setIsProcessing(false)
      setProgress(0)
      alert(t.alerts.packGenerated)
    }, 1000)
  }, [
    resourcePack,
    t.alerts,
    getMinecraftVersion,
    updateProgress,
    packEdition,
    generateGeyserMapping, // Added to dependencies
  ])

  const handleMergePackUpload = useCallback(async (files: FileList) => {
    const newPacks: { name: string; file: File }[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.name.endsWith(".zip")) {
        newPacks.push({ name: file.name.replace(".zip", ""), file })
      }
    }

    setMergePacks((prev) => [...prev, ...newPacks])
  }, [])

  const analyzeMergeConflicts = useCallback(async () => {
    setIsProcessing(true)
    updateProgress("Analyzing packs for conflicts...", 10)

    try {
      const JSZip = (await import("jszip")).default
      const textureMap = new Map<string, { packName: string; file: File }[]>()

      for (let i = 0; i < mergePacks.length; i++) {
        const pack = mergePacks[i]
        updateProgress(`Analyzing ${pack.name}...`, 10 + (i / mergePacks.length) * 40)

        const zip = await JSZip.loadAsync(pack.file)

        for (const [path, zipEntry] of Object.entries(zip.files)) {
          if (!zipEntry.dir && path.includes("textures/")) {
            const file = await zipEntry
              .async("blob")
              .then((blob) => new File([blob], path.split("/").pop() || "texture.png"))

            if (!textureMap.has(path)) {
              textureMap.set(path, [])
            }
            textureMap.get(path)!.push({ packName: pack.name, file })
          }
        }
      }

      const conflicts: MergeConflict[] = []
      for (const [path, packs] of textureMap.entries()) {
        if (packs.length > 1) {
          conflicts.push({ path, packs, resolution: "overwrite" })
        }
      }

      setMergeConflicts(conflicts)
      updateProgress("Analysis complete!", 100)

      setTimeout(() => {
        setIsProcessing(false)
        setProgress(0)
      }, 500)
    } catch (error) {
      console.error("Merge analysis error:", error)
      setIsProcessing(false)
      setProgress(0)
      alert("Failed to analyze packs for merging.")
    }
  }, [mergePacks])

  const executeMerge = useCallback(async () => {
    setIsProcessing(true)
    updateProgress("Merging packs...", 10)

    try {
      const JSZip = (await import("jszip")).default
      const mergedTextures = new Map<string, File>()
      const mergedModels = new Map<string, any>()

      for (let i = 0; i < mergePacks.length; i++) {
        const pack = mergePacks[i]
        updateProgress(`Merging ${pack.name}...`, 10 + (i / mergePacks.length) * 80)

        const zip = await JSZip.loadAsync(pack.file)

        for (const [path, zipEntry] of Object.entries(zip.files)) {
          if (zipEntry.dir) continue

          if (path.includes("textures/")) {
            const conflict = mergeConflicts.find((c) => c.path === path)

            if (conflict) {
              if (conflict.resolution === "skip" && mergedTextures.has(path)) {
                continue
              } else if (conflict.resolution === "rename") {
                const newPath = path.replace(/(\.[^.]+)$/, `_${pack.name}$1`)
                const file = await zipEntry
                  .async("blob")
                  .then((blob) => new File([blob], newPath.split("/").pop() || "texture.png"))
                mergedTextures.set(newPath, file)
                continue
              }
            }

            const file = await zipEntry
              .async("blob")
              .then((blob) => new File([blob], path.split("/").pop() || "texture.png"))
            mergedTextures.set(path, file)
          } else if (path.includes("models/")) {
            const content = await zipEntry.async("text")
            try {
              const modelData = JSON.parse(content)
              mergedModels.set(path, modelData)
            } catch (e) {
              console.error(`Failed to parse model: ${path}`)
            }
          }
        }
      }

      // Add merged textures to resource pack
      for (const [path, file] of mergedTextures.entries()) {
        await addTexture(file)
      }

      updateProgress("Merge complete!", 100)

      setTimeout(() => {
        setIsProcessing(false)
        setProgress(0)
        setMergePacks([])
        setMergeConflicts([])
        alert(`Successfully merged ${mergePacks.length} packs with ${mergedTextures.size} textures!`)
      }, 500)
    } catch (error) {
      console.error("Merge execution error:", error)
      setIsProcessing(false)
      setProgress(0)
      alert("Failed to merge packs.")
    }
  }, [mergePacks, mergeConflicts, addTexture])

  const generateMultiVersionPacks = useCallback(async () => {
    const enabledVersions = versionConfigs.filter((v) => v.enabled)

    if (enabledVersions.length === 0) {
      alert("Please enable at least one version.")
      return
    }

    setIsProcessing(true)

    for (let i = 0; i < enabledVersions.length; i++) {
      const versionConfig = enabledVersions[i]
      updateProgress(`Generating pack for ${versionConfig.version}...`, (i / enabledVersions.length) * 100)

      // Temporarily set the format for this version
      const originalFormat = resourcePack.format
      setResourcePack((prev) => ({ ...prev, format: versionConfig.format }))

      // Generate the pack
      await generateZip()

      // Restore original format
      setResourcePack((prev) => ({ ...prev, format: originalFormat }))

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setIsProcessing(false)
    setProgress(0)
    alert(`Generated ${enabledVersions.length} version(s) successfully!`)
  }, [versionConfigs, resourcePack.format, generateZip])

  const importExistingPack = useCallback(
    async (file: File) => {
      if (!file || !file.name) {
        console.error("[MARV] Import error: No file provided")
        alert("Please select a file to import.")
        return
      }

      setIsProcessing(true)
      updateProgress("Importing pack...", 10)

      try {
        if (file.name.endsWith(".json")) {
          // Import from JSON settings file
          const text = await file.text()
          const data = JSON.parse(text)

          if (data.pack && data.models) {
            setResourcePack({
              name: data.pack.name || file.name.replace(".json", ""),
              description: data.pack.description || "",
              version: data.pack.version || "1.21.6",
              format: data.pack.pack_format || 63,
              models: data.models || [],
              textures: data.textures || [],
              fonts: data.fonts || [],
              sounds: data.sounds || [],
              languages: data.languages || [],
              particles: data.particles || [],
              shaders: data.shaders || [],
              packIcon: undefined,
              author: data.pack.author || "",
              website: data.pack.website || "",
              license: data.pack.license || "All Rights Reserved",
            })
            setIsProcessing(false)
            setProgress(0)
            alert(t.alerts.exportComplete)
          } else {
            alert("Invalid JSON file format. Expected 'pack' and 'models' properties.")
            setIsProcessing(false)
            setProgress(0)
          }
        } else if (file.name.endsWith(".zip")) {
          updateProgress("Loading ZIP file...", 20)
          const JSZip = (await import("jszip")).default
          const zip = await JSZip.loadAsync(file)

          // Detect pack edition
          updateProgress("Detecting pack edition...", 25)
          const edition = await detectPackEdition(zip)
          console.log(`[MARV] Detected pack edition: ${edition}`)

          if (edition === "bedrock") {
            // Import Bedrock pack
            updateProgress("Importing Bedrock pack...", 30)
            const importedPack = await importBedrockPack(zip, file.name, getImageDimensions)

            // Set the pack edition to bedrock
            setPackEdition("bedrock")
            setResourcePack(importedPack)

            setTimeout(() => {
              setIsProcessing(false)
              setProgress(0)

              const stats = {
                models: importedPack.models.length,
                textures: importedPack.textures.length,
                sounds: importedPack.sounds.length,
                languages: importedPack.languages.length,
                particles: importedPack.particles.length,
              }

              alert(
                `Bedrock pack imported!\\n\\nModels: ${stats.models}\\nTextures: ${stats.textures}\\nSounds: ${stats.sounds}\\nLanguages: ${stats.languages}\\nParticles: ${stats.particles}`
              )
            }, 500)

            return
          }

          // Continue with Java pack import
          setPackEdition("java")

          const importedPack: ResourcePack = {
            name: file.name.replace(".zip", ""),
            description: "",
            version: "1.21.6",
            format: 63,
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

          // Read pack.mcmeta
          updateProgress("Reading pack metadata...", 30)
          const packMetaFile = zip.file("pack.mcmeta")
          if (packMetaFile) {
            const packMetaContent = await packMetaFile.async("text")
            const packMeta = JSON.parse(packMetaContent)
            importedPack.description = packMeta.pack.description || ""
            importedPack.format = packMeta.pack.pack_format || 63
          }

          // Read pack.png
          updateProgress("Reading pack icon...", 35)
          const packIconFile = zip.file("pack.png")
          if (packIconFile) {
            const iconBlob = await packIconFile.async("blob")
            const iconFile = new File([iconBlob], "pack.png", { type: "image/png" })
            importedPack.packIcon = iconFile
          }

          updateProgress("Reading textures...", 40)
          const textureMap: Record<string, File> = {}
          const textureFiles = Object.keys(zip.files).filter(
            (path) =>
              path.startsWith("assets/minecraft/textures/") &&
              (path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg")),
          )

          // Parallel texture processing for high-speed import
          const textureProcessingPromises = textureFiles.map(async (texturePath) => {
            const textureFile = zip.file(texturePath)
            if (!textureFile) return null

            const textureBlob = await textureFile.async("blob")
            const textureName = texturePath.split("/").pop() || ""
            const textureFileObj = new File([textureBlob], textureName, { type: "image/png" })

            // Get dimensions in parallel
            const dimensions = await getImageDimensions(textureFileObj)

            // Store with full path as key for reference
            const relativePath = texturePath
              .replace("assets/minecraft/textures/", "")
              .replace(/\.(png|jpg|jpeg)$/, "")

            return {
              textureData: {
                id: `texture_${uuidv4()}`,
                name: textureName.replace(/\.(png|jpg|jpeg)$/, ""), // Clean name
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
              },
              mapEntry: { key: relativePath, file: textureFileObj }
            }
          })

          const textureResults = await Promise.all(textureProcessingPromises)

          // Add results to importedPack
          for (const result of textureResults) {
            if (result) {
              importedPack.textures.push(result.textureData)
              textureMap[result.mapEntry.key] = result.mapEntry.file
            }
          }

          updateProgress("Analyzing item definitions...", 50)

          const has1214Structure = Object.keys(zip.files).some(
            (path) => path.startsWith("assets/minecraft/items/") && path.endsWith(".json"),
          )

          const baseItemOverrides: Record<string, Array<{ model: string; predicate: any }>> = {}

          if (has1214Structure) {
            const itemFiles = Object.keys(zip.files).filter(
              (path) => path.startsWith("assets/minecraft/items/") && path.endsWith(".json"),
            )

            for (const itemPath of itemFiles) {
              const itemFile = zip.file(itemPath)
              if (itemFile) {
                try {
                  const itemContent = await itemFile.async("text")
                  const itemData = JSON.parse(itemContent)
                  const itemName = itemPath.split("/").pop()?.replace(".json", "") || ""

                  // Parse select-based model definitions
                  if (itemData.model?.type === "minecraft:select" && itemData.model.cases) {
                    baseItemOverrides[itemName] = itemData.model.cases.map((caseItem: any) => ({
                      model: caseItem.model?.model?.replace("minecraft:", ""),
                      predicate: { custom_model_data: caseItem.when },
                    }))
                  }
                } catch (error) {
                  console.error(`[MARV] Error reading ${itemPath}:`, error)
                }
              }
            }
          } else {
            for (const itemName of MINECRAFT_ITEMS) {
              const itemPath = `assets/minecraft/models/item/${itemName}.json`
              const itemFile = zip.file(itemPath)

              if (itemFile) {
                try {
                  const itemContent = await itemFile.async("text")
                  const itemData = JSON.parse(itemContent)

                  if (Array.isArray(itemData.overrides) && itemData.overrides.length > 0) {
                    baseItemOverrides[itemName] = itemData.overrides
                  }
                } catch (error) {
                  console.error(`[MARV] Error reading ${itemPath}:`, error)
                }
              }
            }
          }

          updateProgress("Importing custom models...", 60)
          const modelFiles = Object.keys(zip.files).filter(
            (path) => path.startsWith("assets/minecraft/models/") && path.endsWith(".json"),
          )

          const processedModels = new Set<string>()

          // Collect all model processing tasks
          const modelProcessingTasks: Promise<ModelData | null>[] = []

          for (const [targetItem, overrides] of Object.entries(baseItemOverrides)) {
            for (const override of overrides) {
              if (!override.predicate?.custom_model_data) continue

              const modelRefFull = override.model?.replace("minecraft:", "").replace("item/", "")
              if (!modelRefFull) continue

              // Extract just the filename for the model name (e.g., "custom_food/apple_pie" -> "apple_pie")
              const modelName = modelRefFull.split('/').pop() || modelRefFull

              if (processedModels.has(modelRefFull)) continue

              processedModels.add(modelRefFull) // Mark as processed to avoid duplicates

              const modelPath = `assets/minecraft/models/item/${modelRefFull}.json`
              const modelFile = zip.file(modelPath)

              if (modelFile) {
                // Add to parallel processing queue
                modelProcessingTasks.push(
                  (async () => {
                    try {
                      const modelContent = await modelFile.async("text")
                      const modelData = JSON.parse(modelContent)

                      const newModel: ModelData = {
                        id: `model_${uuidv4()}`,
                        name: modelName,
                        customModelData: 1,
                        parent: modelData.parent || "item/generated",
                        textures: {}, // Will be populated below
                        elements: modelData.elements || [],
                        targetItem: targetItem,
                        customModelDataFloats: [],
                        customModelDataFlags: [],
                        customModelDataStrings: [],
                        customModelDataColors: [],
                      }

                      // Automatically clean and resolve texture layers
                      if (modelData.textures && typeof modelData.textures === 'object') {
                        for (const [layer, texturePath] of Object.entries(modelData.textures)) {
                          if (typeof texturePath === 'string') {
                            // Remove minecraft: prefix but keep the path structure initially
                            const pathWithoutMinecraft = texturePath.replace(/^minecraft:/, '')

                            // Try to find matching texture in textureMap
                            let textureFound = false
                            let finalTextureName = ''

                            // Strategy 1: Check with original path (e.g., "item/custom_food/apple_pie")
                            if (textureMap[pathWithoutMinecraft]) {
                              finalTextureName = pathWithoutMinecraft.replace(/^item\//, '').replace(/^block\//, '').replace(/^entity\//, '')
                              newModel.textures[layer] = finalTextureName
                              textureFound = true
                              console.log(`[MARV] ✓ Linked texture layer ${layer}: ${finalTextureName} (path: ${pathWithoutMinecraft})`)
                            }
                            // Strategy 2: Try without type prefix (e.g., "custom_food/apple_pie")
                            else {
                              const withoutPrefix = pathWithoutMinecraft
                                .replace(/^item\//, '')
                                .replace(/^block\//, '')
                                .replace(/^entity\//, '')

                              if (textureMap[`item/${withoutPrefix}`]) {
                                finalTextureName = withoutPrefix
                                newModel.textures[layer] = finalTextureName
                                textureFound = true
                                console.log(`[MARV] ✓ Linked texture layer ${layer}: ${finalTextureName}`)
                              }
                              else if (textureMap[withoutPrefix]) {
                                finalTextureName = withoutPrefix
                                newModel.textures[layer] = finalTextureName
                                textureFound = true
                                console.log(`[MARV] ✓ Linked texture layer ${layer}: ${finalTextureName}`)
                              }
                              // Strategy 3: Try to find by texture name only (last part of path)
                              else {
                                const textureName = withoutPrefix.split('/').pop() || withoutPrefix
                                const matchingKey = Object.keys(textureMap).find(key =>
                                  key.endsWith(`/${textureName}`) || key === textureName || key === `item/${textureName}`
                                )

                                if (matchingKey) {
                                  // Use the full relative path from textureMap
                                  finalTextureName = matchingKey.replace(/^item\//, '').replace(/^block\//, '').replace(/^entity\//, '')
                                  newModel.textures[layer] = finalTextureName
                                  textureFound = true
                                  console.log(`[MARV] ✓ Auto-matched texture layer ${layer}: ${finalTextureName} (from ${pathWithoutMinecraft})`)
                                }
                              }
                            }

                            // If texture not found in pack, still keep the reference but warn
                            if (!textureFound) {
                              finalTextureName = pathWithoutMinecraft.replace(/^item\//, '').replace(/^block\//, '').replace(/^entity\//, '')
                              newModel.textures[layer] = finalTextureName
                              console.warn(`[MARV] ⚠ Texture reference not found in pack: ${layer} -> ${finalTextureName}`)
                            }
                          }
                        }
                      }

                      const cmd = override.predicate.custom_model_data

                      if (typeof cmd === "number") {
                        newModel.customModelData = cmd
                      } else if (typeof cmd === "object") {
                        // Extended format with floats, flags, strings, colors
                        if (Array.isArray(cmd.floats)) {
                          newModel.customModelDataFloats = cmd.floats
                        }
                        if (Array.isArray(cmd.flags)) {
                          newModel.customModelDataFlags = cmd.flags
                        }
                        if (Array.isArray(cmd.strings)) {
                          newModel.customModelDataStrings = cmd.strings
                        }
                        if (Array.isArray(cmd.colors)) {
                          newModel.customModelDataColors = cmd.colors.map(
                            (rgb: number[]) => `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`,
                          )
                        }

                        // Generate a unique ID from the extended data
                        const dataStr = JSON.stringify(cmd)
                        const hash = dataStr.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
                        newModel.customModelData = (Math.abs(hash) % 10000) + 1
                      }

                      if (modelData.display) {
                        newModel.display = modelData.display
                      }

                      return newModel
                    } catch (error) {
                      console.error(`[MARV] Error reading model ${modelPath}:`, error)
                      return null
                    }
                  })()
                )
              }
            }
          }

          // Process all models in parallel
          const modelResults = await Promise.all(modelProcessingTasks)

          // Add successful results to importedPack
          for (const model of modelResults) {
            if (model) {
              importedPack.models.push(model)
            }
          }

          updateProgress("Reading fonts...", 70)
          // Read fonts from assets/minecraft/font/
          const fontFiles = Object.keys(zip.files).filter(
            (path) => path.startsWith("assets/minecraft/font/") && path.endsWith(".json"),
          )

          for (const fontPath of fontFiles) {
            const fontFile = zip.file(fontPath)
            if (fontFile) {
              const fontContent = await fontFile.async("text")
              const fontData = JSON.parse(fontContent)
              const fontName = fontPath.split("/").pop()?.replace(".json", "") || ""

              const newFont: CustomFont = {
                id: `font_${uuidv4()}`,
                name: fontName,
                providers: [],
              }

              if (Array.isArray(fontData.providers)) {
                for (const provider of fontData.providers) {
                  const newProvider: FontProvider = {
                    id: `provider_${uuidv4()}`,
                    type: provider.type || "bitmap",
                    file: provider.file || "",
                    ascent: provider.ascent,
                    height: provider.height,
                    chars: provider.chars,
                    advances: provider.advances,
                    size: provider.size,
                    oversample: provider.oversample,
                    shift: provider.shift,
                    skip: provider.skip,
                  }
                  newFont.providers.push(newProvider)
                }
              }

              importedPack.fonts.push(newFont)
            }
          }

          // Read sounds from assets/minecraft/sounds.json
          updateProgress("Reading sounds...", 75)
          const soundsFile = zip.file("assets/minecraft/sounds.json")
          if (soundsFile) {
            const soundsContent = await soundsFile.async("text")
            const soundsData = JSON.parse(soundsContent)

            for (const [soundName, soundConfig] of Object.entries(soundsData)) {
              if (typeof soundConfig === "object" && soundConfig !== null) {
                const config = soundConfig as any
                const newSound: CustomSound = {
                  id: `sound_${uuidv4()}`,
                  name: soundName,
                  category: config.category || "master",
                  sounds: Array.isArray(config.sounds) ? config.sounds : [],
                  subtitle: config.subtitle,
                  replace: config.replace,
                }
                importedPack.sounds.push(newSound)
              }
            }
          }

          // Read particles from assets/minecraft/particles/
          updateProgress("Reading particles...", 80)
          const particleFiles = Object.keys(zip.files).filter(
            (path) => path.startsWith("assets/minecraft/particles/") && path.endsWith(".json"),
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
                textures: Array.isArray(particleData.textures) ? particleData.textures : [],
              }

              importedPack.particles.push(newParticle)
            }
          }

          // Read languages from assets/minecraft/lang/
          updateProgress("Reading languages...", 82)
          const langFiles = Object.keys(zip.files).filter(
            (path) => path.startsWith("assets/minecraft/lang/") && path.endsWith(".json")
          )

          for (const langPath of langFiles) {
            const langFile = zip.file(langPath)
            if (langFile) {
              const langContent = await langFile.async("text")
              const langData = JSON.parse(langContent)
              const langCode = langPath.split("/").pop()?.replace(".json", "") || ""

              const newLanguage: LanguageFile = {
                code: langCode,
                name: langCode, // Can be improved with a mapping of codes to names
                content: langData
              }

              importedPack.languages.push(newLanguage)
            }
          }

          // Read shaders from assets/minecraft/shaders/
          updateProgress("Reading shaders...", 85)
          const shaderFiles = Object.keys(zip.files).filter(
            (path) =>
              path.startsWith("assets/minecraft/shaders/") &&
              (path.endsWith(".vsh") || path.endsWith(".fsh") || path.endsWith(".json")),
          )

          for (const shaderPath of shaderFiles) {
            const shaderFile = zip.file(shaderPath)
            if (shaderFile) {
              const shaderContent = await shaderFile.async("text")
              const shaderName = shaderPath.split("/").pop() || ""
              const shaderType = shaderPath.endsWith(".vsh")
                ? "vertex"
                : shaderPath.endsWith(".fsh")
                  ? "fragment"
                  : "program"

              const newShader: ShaderFile = {
                id: `shader_${uuidv4()}`,
                name: shaderName,
                type: shaderType,
                content: shaderContent, // Store content for later use or display if needed
              }

              importedPack.shaders.push(newShader)
            }
          }

          updateProgress("Finalizing import...", 95)
          setResourcePack(importedPack)

          // Use setTimeout to ensure state update is processed before alert
          setTimeout(() => {
            setIsProcessing(false)
            setProgress(0)

            const stats = {
              models: importedPack.models.length,
              textures: importedPack.textures.length,
              fonts: importedPack.fonts.length,
              sounds: importedPack.sounds.length,
              languages: importedPack.languages.length,
              particles: importedPack.particles.length,
              shaders: importedPack.shaders.length,
            }

            // Count total texture layers and verify matches
            let totalLayers = 0
            let matchedLayers = 0

            importedPack.models.forEach(model => {
              const layerCount = Object.keys(model.textures).length
              totalLayers += layerCount

              // Count how many texture references exist in our texture files
              Object.values(model.textures).forEach(textureName => {
                if (typeof textureName === 'string') {
                  const textureExists = importedPack.textures.some(t =>
                    t.name === textureName || t.path.endsWith(textureName)
                  )
                  if (textureExists) {
                    matchedLayers++
                  }
                }
              })
            })

            console.log(`[MARV] Import complete: ${totalLayers} texture layers, ${matchedLayers} matched, ${totalLayers - matchedLayers} unmatched`)

            alert(
              `Import complete!\n\nModels: ${stats.models}\nTextures: ${stats.textures}\nTexture Layers: ${totalLayers} (${matchedLayers} matched)\nFonts: ${stats.fonts}\nSounds: ${stats.sounds}\nLanguages: ${stats.languages}\nParticles: ${stats.particles}\nShaders: ${stats.shaders}`,
            )
          }, 500) // Short delay to allow state update
        } else {
          alert("Unsupported file type. Please import a .zip or .json file.")
          setIsProcessing(false)
          setProgress(0)
        }
      } catch (error) {
        console.error("[MARV] Import error:", error)
        alert(`${t.alerts.importError}\n\nError: ${error instanceof Error ? error.message : "Unknown error"}`)
        setIsProcessing(false)
        setProgress(0)
      }
    },
    [t, updateProgress, getImageDimensions],
  )

  const exportSettings = useCallback(() => {
    const settings = {
      pack: {
        name: resourcePack.name,
        description: resourcePack.description,
        version: resourcePack.version,
        pack_format: resourcePack.format,
        author: resourcePack.author,
        website: resourcePack.website,
        license: resourcePack.license,
      },
      models: resourcePack.models,
      textures: resourcePack.textures.map((t) => ({
        id: t.id,
        name: t.name,
        path: t.path,
        size: t.size,
        dimensions: t.dimensions,
        isOptimized: t.isOptimized,
        animation: t.animation // Include animation settings
      })),
      fonts: resourcePack.fonts.map((f) => ({
        id: f.id,
        name: f.name,
        providers: f.providers.map((p) => ({
          id: p.id,
          type: p.type,
          file: p.file,
          ascent: p.ascent,
          height: p.height,
          chars: p.chars,
          advances: p.advances,
          size: p.size,
          oversample: p.oversample,
          shift: p.shift,
          skip: p.skip,
        })),
      })),
      sounds: resourcePack.sounds.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        sounds: s.sounds,
        subtitle: s.subtitle,
        replace: s.replace,
      })),
      particles: resourcePack.particles.map((p) => ({
        id: p.id,
        name: p.name,
        textures: p.textures,
      })),
      shaders: resourcePack.shaders.map((sh) => ({
        id: sh.id,
        name: sh.name,
        type: sh.type,
        content: sh.content,
      })),
    }

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${resourcePack.name || "resource-pack"}-settings.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [resourcePack])

  const handlePackIconUpload = useCallback((file: File) => {
    setResourcePack((prev) => ({
      ...prev,
      packIcon: file,
    }))
  }, [])

  const removePackIcon = useCallback(() => {
    setResourcePack((prev) => ({
      ...prev,
      packIcon: undefined,
    }))
  }, [])

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-sans text-4xl font-bold text-primary md:text-5xl">{t.title}</h1>
          <p className="text-lg text-muted-foreground">{t.subtitle}</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => setLanguage(language === "en" ? "ja" : "en")}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              {language === "en" ? "日本語" : "English"}
            </button>
            <div className="flex items-center gap-2 rounded-md border-2 border-primary bg-card px-4 py-2">
              <label className="text-sm font-medium">Edition:</label>
              <select
                value={packEdition}
                onChange={(e) => setPackEdition(e.target.value as "java" | "bedrock")}
                className="rounded border border-border bg-input px-2 py-1 text-sm"
              >
                <option value="java">Java Edition</option>
                <option value="bedrock">Bedrock Edition</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.models.modelCount}</div>
            <div className="mt-1 text-2xl font-bold text-card-foreground">{packStats.totalModels}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.models.validModels}</div>
            <div className="mt-1 text-2xl font-bold text-green-600">{packStats.validModels}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.textures.textureCount}</div>
            <div className="mt-1 text-2xl font-bold text-card-foreground">{packStats.totalTextures}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.textures.totalSize}</div>
            <div className="mt-1 text-2xl font-bold text-card-foreground">{packStats.formattedSize}</div>
          </div>
          {/* Add font count to stats */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.fonts.fontCount}</div>
            <div className="mt-1 text-2xl font-bold text-card-foreground">{resourcePack.fonts.length}</div>
          </div>
          {/* Add sound count to stats */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t.sounds.soundCount}</div>
            <div className="mt-1 text-2xl font-bold text-card-foreground">{resourcePack.sounds.length}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-lg border-2 border-primary bg-card p-6">
          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {["general", "models", "textures", "fonts", "sounds", "particles", "shaders"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {t.tabs[tab as keyof typeof t.tabs]}
              </button>
            ))}
            <button
              onClick={() => setActiveTab("geyser")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "geyser"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {t.tabs.geyser}
            </button>
            <button
              onClick={() => setActiveTab("merge")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "merge"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {t.tabs.merge}
            </button>
            <button
              onClick={() => setActiveTab("versions")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "versions"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {t.tabs.versions}
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "preview"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {t.tabs.preview}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-border bg-card p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">{t.general.title}</h2>
                  {/* moved edition toggle to header */}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">{t.general.packName}</label>
                  <input
                    type="text"
                    value={resourcePack.name}
                    onChange={(e) => handlePackInfoChange("name", e.target.value)}
                    className="w-full rounded-md border-2 border-primary bg-input px-4 py-2 text-foreground"
                    placeholder="My Resource Pack"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">{t.general.packDescription}</label>
                  <textarea
                    value={resourcePack.description}
                    onChange={(e) => handlePackInfoChange("description", e.target.value)}
                    className="w-full rounded-md border-2 border-primary bg-input px-4 py-2 text-foreground"
                    rows={3}
                    placeholder="A custom resource pack for Minecraft"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">{t.general.author}</label>
                    <input
                      type="text"
                      value={resourcePack.author}
                      onChange={(e) => handlePackInfoChange("author", e.target.value)}
                      className="w-full rounded-md border-2 border-primary bg-input px-4 py-2 text-foreground"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">{t.general.packVersion}</label>
                    <input
                      type="text"
                      value={resourcePack.version}
                      onChange={(e) => handlePackInfoChange("version", e.target.value)}
                      className="w-full rounded-md border-2 border-primary bg-input px-4 py-2 text-foreground"
                      placeholder="1.21.6"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">{t.general.packIcon}</label>
                  <input
                    type="file"
                    accept="image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handlePackIconUpload(file)
                    }}
                    className="w-full rounded-md border-2 border-primary bg-input px-4 py-2 text-foreground"
                  />
                  {resourcePack.packIcon && (
                    <button
                      onClick={removePackIcon}
                      className="mt-2 rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground"
                    >
                      {t.general.removeIcon}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "models" && (
            <ModelManager
              models={resourcePack.models}
              textures={resourcePack.textures}
              onAdd={addModel}
              onUpdate={updateModel}
              onDelete={deleteModel}
            />
          )}



          {
            activeTab === "textures" && (
              <TextureManager
                textures={resourcePack.textures}
                onAdd={addTexture}
                onDelete={deleteTexture}
                onUpdate={updateTexture}
                onOptimize={optimizeTexture}
                onOptimizeAll={optimizeAllTextures}
              />
            )
          }

          {
            activeTab === "fonts" && (
              <FontManager
                fonts={resourcePack.fonts}
                onAdd={addFont}
                onUpdate={updateFont}
                onDelete={deleteFont}
              />
            )
          }

          {
            activeTab === "sounds" && (
              <SoundManager
                sounds={resourcePack.sounds}
                onAdd={addSound}
                onUpdate={updateSound}
                onDelete={deleteSound}
              />
            )
          }

          {
            activeTab === "languages" && (
              <LanguageManager
                languages={resourcePack.languages}
                onAdd={addLanguage}
                onUpdate={updateLanguage}
                onDelete={deleteLanguage}
              />
            )
          }

          {
            activeTab === "particles" && (
              <ParticleManager
                particles={resourcePack.particles}
                textures={resourcePack.textures}
                onAdd={addParticle}
                onUpdate={updateParticle}
                onDelete={deleteParticle}
              />
            )
          }

          {
            activeTab === "shaders" && (
              <ShaderManager
                shaders={resourcePack.shaders}
                onAdd={addShader}
                onDelete={deleteShader}
              />
            )
          }


          {
            activeTab === "geyser" && (
              <div className="space-y-4">
                <div className="border-2 border-primary rounded-lg p-6 bg-card">
                  <h3 className="text-xl font-bold text-primary mb-4">Geyser Mapping</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Generated Mapping (JSON)
                      </label>
                      <div className="relative">
                        <pre className="max-h-96 overflow-auto rounded border border-border bg-muted p-4 text-xs">
                          {generateGeyserMapping()}
                        </pre>
                        <button
                          onClick={() => {
                            const mapping = generateGeyserMapping()
                            navigator.clipboard.writeText(mapping)
                            alert("Geyser mapping copied to clipboard!")
                          }}
                          className="absolute top-2 right-2 px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-80"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="rounded border border-border bg-muted/50 p-4">
                      <h4 className="mb-2 font-medium text-foreground">Installation Instructions</h4>
                      <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                        <li>Place this file in <code className="rounded bg-muted px-1">Geyser/custom_mappings/</code></li>
                        <li>Name it with <code className="rounded bg-muted px-1">.json</code> extension</li>
                        <li>Restart Geyser or reload mappings</li>
                        <li>Bedrock players will see custom items with proper icons</li>
                      </ol>
                    </div>

                    <div className="rounded border border-border bg-muted/50 p-4">
                      <h4 className="mb-2 font-medium text-foreground">Mapped Items</h4>
                      <div className="space-y-2">
                        {resourcePack.models.filter((m) => m.customModelData && m.targetItem).length === 0 ? (
                          <p className="text-sm text-muted-foreground">No models to map yet</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="pb-2 text-left">Java Item</th>
                                <th className="pb-2 text-left">CMD</th>
                                <th className="pb-2 text-left">Display Name</th>
                                <th className="pb-2 text-left">Icon</th>
                              </tr>
                            </thead>
                            <tbody>
                              {resourcePack.models.filter((m) => m.customModelData && m.targetItem).map((model) => {
                                const textureName = Object.values(model.textures)[0]?.replace(/^.*\//, "").replace(/\.[^/.]+$/, "") || model.name
                                return (
                                  <tr key={model.id} className="border-b border-border/50">
                                    <td className="py-2">{model.targetItem}</td>
                                    <td className="py-2">{model.customModelData}</td>
                                    <td className="py-2">{model.name}</td>
                                    <td className="py-2">{textureName}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    <div className="rounded border-2 border-accent/50 bg-accent/10 p-4">
                      <h4 className="mb-2 flex items-center gap-2 font-medium text-foreground">
                        <span className="text-accent">ℹ️</span> CraftEngine Support
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        This tool automatically generates Geyser mappings compatible with CraftEngine custom items.
                        Custom model data values are preserved and mapped to Bedrock-compatible icons.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          {
            activeTab === "merge" && (
              <div className="space-y-6">
                <div className="border-2 border-primary rounded-lg p-6 bg-card">
                  <h3 className="text-xl font-bold text-primary mb-4">Texture Pack Merge</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Upload Resource Packs to Merge
                      </label>
                      <input
                        type="file"
                        accept=".zip"
                        multiple
                        onChange={(e) => e.target.files && handleMergePackUpload(e.target.files)}
                        className="w-full px-4 py-2 border-2 border-primary rounded-lg bg-background text-foreground"
                      />
                    </div>

                    {mergePacks.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground">Packs to Merge ({mergePacks.length})</h4>
                        <div className="space-y-2">
                          {mergePacks.map((pack, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <span className="text-foreground">{pack.name}</span>
                              <button
                                onClick={() => setMergePacks((prev) => prev.filter((_, i) => i !== index))}
                                className="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:opacity-80"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={analyzeMergeConflicts}
                            disabled={isProcessing}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                          >
                            Analyze Conflicts
                          </button>
                        </div>
                      </div>
                    )}

                    {mergeConflicts.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground">Conflicts Found ({mergeConflicts.length})</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {mergeConflicts.map((conflict, index) => (
                            <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                              <div className="text-sm text-foreground font-mono">{conflict.path}</div>
                              <div className="text-xs text-muted-foreground">
                                Found in: {conflict.packs.map((p) => p.packName).join(", ")}
                              </div>
                              <select
                                value={conflict.resolution}
                                onChange={(e) => {
                                  const newConflicts = [...mergeConflicts]
                                  newConflicts[index].resolution = e.target.value as any
                                  setMergeConflicts(newConflicts)
                                }}
                                className="w-full px-3 py-1 border-2 border-primary rounded bg-background text-foreground"
                              >
                                <option value="overwrite">Overwrite (use last)</option>
                                <option value="skip">Skip (use first)</option>
                                <option value="rename">Rename (keep all)</option>
                              </select>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={executeMerge}
                          disabled={isProcessing}
                          className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                        >
                          Execute Merge
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          {
            activeTab === "versions" && (
              <div className="space-y-6">
                <div className="border-2 border-primary rounded-lg p-6 bg-card">
                  <h3 className="text-xl font-bold text-primary mb-4">Multi-Version Pack Generation</h3>

                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Generate resource packs for multiple Minecraft versions simultaneously.
                    </p>

                    <div className="space-y-2">
                      {versionConfigs.map((config, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={config.enabled}
                              onChange={(e) => {
                                const newConfigs = [...versionConfigs]
                                newConfigs[index].enabled = e.target.checked
                                setVersionConfigs(newConfigs)
                              }}
                              className="w-5 h-5"
                            />
                            <div>
                              <div className="font-semibold text-foreground">Minecraft {config.version}</div>
                              <div className="text-xs text-muted-foreground">Pack Format: {config.format}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={generateMultiVersionPacks}
                      disabled={isProcessing || versionConfigs.filter((v) => v.enabled).length === 0}
                      className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      Generate All Enabled Versions
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          {
            activeTab === "preview" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted p-6">
                  <h3 className="mb-4 text-lg font-semibold">Pack Summary</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Name:</dt>
                      <dd className="font-medium">{resourcePack.name || "Untitled"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Models:</dt>
                      <dd className="font-medium">{packStats.totalModels}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Textures:</dt>
                      <dd className="font-medium">{packStats.totalTextures}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Total Size:</dt>
                      <dd className="font-medium">{packStats.formattedSize}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Fonts:</dt>
                      <dd className="font-medium">{resourcePack.fonts.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Sounds:</dt>
                      <dd className="font-medium">{resourcePack.sounds.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Particles:</dt>
                      <dd className="font-medium">{resourcePack.particles.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Shaders:</dt>
                      <dd className="font-medium">{resourcePack.shaders.length}</dd>
                    </div>
                  </dl>
                </div>
                {validationResults.errors.length > 0 && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                    <h4 className="mb-2 font-semibold text-destructive">Validation Errors:</h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-destructive">
                      {validationResults.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          }
        </div >

        {/* Action Buttons */}
        < div className="mt-6 flex flex-wrap gap-4" >
          <button
            onClick={generateZip}
            disabled={isProcessing}
            className="rounded-md bg-secondary px-6 py-3 font-medium text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
          >
            {isProcessing ? processingStep : t.actions.download}
          </button>
          <button
            onClick={validatePack}
            disabled={isProcessing}
            className="rounded-md border-2 border-primary bg-background px-6 py-3 font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {t.actions.validate}
          </button>
          <button
            onClick={exportSettings}
            className="rounded-md border-2 border-primary bg-background px-6 py-3 font-medium text-primary hover:bg-primary/10"
          >
            {t.actions.export}
          </button>
          <button
            onClick={() => {
              // Trigger file input click for import
              const fileInput = document.createElement("input")
              fileInput.type = "file"
              fileInput.accept = ".zip,.json"
              fileInput.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  importExistingPack(file)
                }
              }
              fileInput.click()
            }}
            className="rounded-md border-2 border-primary bg-background px-6 py-3 font-medium text-primary hover:bg-primary/10"
          >
            {t.actions.import}
          </button>
        </div >

        {/* Progress Bar */}
        {
          isProcessing && (
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex justify-between text-sm">
                <span>{processingStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )
        }
      </div >
    </div >
  )
}
