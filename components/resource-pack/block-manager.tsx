"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, Box, Image as ImageIcon } from "lucide-react"
import { BlockData, TextureData } from "./types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BlockManagerProps {
    blocks: BlockData[]
    textures: TextureData[]
    onAdd: () => void
    onDelete: (id: string) => void
    onUpdate: (id: string, data: Partial<BlockData>) => void
}

const FACE_NAMES = ["all", "up", "down", "north", "south", "east", "west"]

export function BlockManager({ blocks, textures, onAdd, onDelete, onUpdate }: BlockManagerProps) {
    const [editingBlock, setEditingBlock] = useState<string | null>(null)

    const blockTextures = textures.filter(t => t.path.startsWith("textures/block/"))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Custom Blocks</h2>
                    <p className="text-muted-foreground">Manage custom blocks and their textures.</p>
                </div>
                <Button onClick={onAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Block
                </Button>
            </div>

            {blocks.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                        <Box className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No blocks added yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Start by adding a custom block to your resource pack.
                    </p>
                    <Button onClick={onAdd} variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Block
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {blocks.map((block) => (
                        <Card key={block.id} className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="grid gap-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={block.name}
                                            onChange={(e) => onUpdate(block.id, { name: e.target.value })}
                                            className="text-lg font-bold h-9 px-2 -ml-2 border-none bg-transparent hover:bg-muted focus:bg-background"
                                            placeholder="Block Name"
                                        />
                                        <Box className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                            minecraft:
                                        </code>
                                        <Input
                                            value={block.identifier}
                                            onChange={(e) => onUpdate(block.id, { identifier: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                                            className="h-7 text-xs font-mono border-none bg-transparent hover:bg-muted focus:bg-background px-1"
                                            placeholder="block_identifier"
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => onDelete(block.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {FACE_NAMES.map((face) => (
                                    <div key={face} className="space-y-2">
                                        <Label className="text-xs font-medium capitalize">{face}</Label>
                                        <Select
                                            value={block.textures[face] || ""}
                                            onValueChange={(value) => {
                                                const newTextures = { ...block.textures }
                                                if (value === "none") {
                                                    delete newTextures[face]
                                                } else {
                                                    newTextures[face] = value
                                                }
                                                onUpdate(block.id, { textures: newTextures })
                                            }}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select texture" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {blockTextures.map((tex) => (
                                                    <SelectItem key={tex.id} value={tex.path.replace("textures/", "")}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-4 w-4 rounded-sm bg-muted overflow-hidden">
                                                                <img
                                                                    src={URL.createObjectURL(tex.file)}
                                                                    className="h-full w-full object-contain pixelated"
                                                                />
                                                            </div>
                                                            <span>{tex.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
