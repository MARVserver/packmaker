"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Type } from "lucide-react"
import { CustomFont, FontProvider } from "./types"

interface FontManagerProps {
    fonts: CustomFont[]
    onAdd: (file: File) => void
    onUpdate: (id: string, data: Partial<CustomFont>) => void
    onDelete: (id: string) => void
}

export function FontManager({ fonts, onAdd, onUpdate, onDelete }: FontManagerProps) {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onAdd(file)
        }
    }

    const updateProvider = (fontId: string, providerIndex: number, data: Partial<FontProvider>) => {
        const font = fonts.find((f) => f.id === fontId)
        if (!font) return

        const newProviders = [...font.providers]
        newProviders[providerIndex] = { ...newProviders[providerIndex], ...data }
        onUpdate(fontId, { providers: newProviders })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Custom Fonts</h3>
                <div className="relative">
                    <input
                        type="file"
                        accept=".ttf,.otf,.png"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                    />
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Font Source
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {fonts.map((font) => (
                    <Card key={font.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <Type className="h-4 w-4" />
                                    {font.name}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => onDelete(font.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Font ID (namespace)</Label>
                                <Input
                                    value={font.id}
                                    onChange={(e) => onUpdate(font.id, { id: e.target.value })} // ID update might be tricky if used as key
                                    disabled
                                />
                            </div>

                            {font.providers.map((provider, index) => (
                                <div key={index} className="space-y-3 rounded-md bg-muted p-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Provider {index + 1}</Label>
                                        <span className="text-xs text-muted-foreground">{provider.type}</span>
                                    </div>

                                    {provider.type === "ttf" && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-xs">Font File {provider.fileHandle && <span className="text-xs text-muted-foreground font-normal">({provider.fileHandle.name})</span>}</Label>
                                                <Input
                                                    type="file"
                                                    accept=".ttf,.otf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) {
                                                            updateProvider(font.id, index, { fileHandle: file })
                                                        }
                                                    }}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Size</Label>
                                                <Input
                                                    type="number"
                                                    value={provider.size || 11}
                                                    onChange={(e) => updateProvider(font.id, index, { size: parseFloat(e.target.value) })}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Oversample</Label>
                                                <Input
                                                    type="number"
                                                    value={provider.oversample || 2.0}
                                                    onChange={(e) => updateProvider(font.id, index, { oversample: parseFloat(e.target.value) })}
                                                    className="h-8"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {provider.type === "bitmap" && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-xs">Texture File {provider.fileHandle && <span className="text-xs text-muted-foreground font-normal">({provider.fileHandle.name})</span>}</Label>
                                                <Input
                                                    type="file"
                                                    accept="image/png"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) {
                                                            updateProvider(font.id, index, { fileHandle: file })
                                                        }
                                                    }}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Height</Label>
                                                <Input
                                                    type="number"
                                                    value={provider.height || 8}
                                                    onChange={(e) => updateProvider(font.id, index, { height: parseInt(e.target.value) })}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Ascent</Label>
                                                <Input
                                                    type="number"
                                                    value={provider.ascent || 7}
                                                    onChange={(e) => updateProvider(font.id, index, { ascent: parseInt(e.target.value) })}
                                                    className="h-8"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {fonts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                    No custom fonts added yet.
                </div>
            )}
        </div>
    )
}
