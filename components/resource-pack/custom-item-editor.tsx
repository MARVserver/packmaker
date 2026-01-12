/**
 * Custom Item Editor - Create and edit custom items with attributes
 */

"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus } from "lucide-react"

export interface CustomItemAttributes {
    // Basic attributes
    displayName?: string
    lore?: string[]

    // Tool attributes
    damage?: number
    attackSpeed?: number
    miningSpeed?: number

    // Armor attributes
    defense?: number
    toughness?: number
    knockbackResistance?: number

    // Food attributes
    nutrition?: number
    saturation?: number

    // Common attributes
    durability?: number
    stackSize?: number
    rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary"

    // Custom attributes
    customAttributes?: Record<string, any>
}

export interface CustomItem {
    id: string
    name: string
    baseItem: string
    customModelData: number
    attributes: CustomItemAttributes
    tags?: string[]
    category?: "tool" | "weapon" | "armor" | "food" | "misc"
}

interface CustomItemEditorProps {
    item: CustomItem
    onChange: (item: CustomItem) => void
    onDelete: () => void
}

export function CustomItemEditor({ item, onChange, onDelete }: CustomItemEditorProps) {
    const updateAttributes = (key: keyof CustomItemAttributes, value: any) => {
        onChange({
            ...item,
            attributes: {
                ...item.attributes,
                [key]: value
            }
        })
    }

    const updateLore = (index: number, value: string) => {
        const newLore = [...(item.attributes.lore || [])]
        newLore[index] = value
        updateAttributes("lore", newLore)
    }

    const addLoreLine = () => {
        const newLore = [...(item.attributes.lore || []), ""]
        updateAttributes("lore", newLore)
    }

    const removeLoreLine = (index: number) => {
        const newLore = item.attributes.lore?.filter((_, i) => i !== index) || []
        updateAttributes("lore", newLore)
    }

    return (
        <Card className="p-4">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-2">
                    <Label>Item Name</Label>
                    <Input
                        value={item.name}
                        onChange={(e) => onChange({ ...item, name: e.target.value })}
                        placeholder="my_custom_item"
                    />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    className="ml-2 text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label>Base Item</Label>
                    <Select
                        value={item.baseItem}
                        onValueChange={(value) => onChange({ ...item, baseItem: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="stick">Stick</SelectItem>
                            <SelectItem value="diamond_sword">Diamond Sword</SelectItem>
                            <SelectItem value="diamond_pickaxe">Diamond Pickaxe</SelectItem>
                            <SelectItem value="apple">Apple</SelectItem>
                            <SelectItem value="paper">Paper</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Category</Label>
                    <Select
                        value={item.category}
                        onValueChange={(value: any) => onChange({ ...item, category: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tool">Tool</SelectItem>
                            <SelectItem value="weapon">Weapon</SelectItem>
                            <SelectItem value="armor">Armor</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="misc">Miscellaneous</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Custom Model Data</Label>
                    <Input
                        type="number"
                        value={item.customModelData}
                        onChange={(e) => onChange({ ...item, customModelData: parseInt(e.target.value) })}
                    />
                </div>

                <div>
                    <Label>Rarity</Label>
                    <Select
                        value={item.attributes.rarity || "common"}
                        onValueChange={(value: any) => updateAttributes("rarity", value)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="common">Common</SelectItem>
                            <SelectItem value="uncommon">Uncommon</SelectItem>
                            <SelectItem value="rare">Rare</SelectItem>
                            <SelectItem value="epic">Epic</SelectItem>
                            <SelectItem value="legendary">Legendary</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="basic" className="mt-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="combat">Combat</TabsTrigger>
                    <TabsTrigger value="tool">Tool</TabsTrigger>
                    <TabsTrigger value="food">Food</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                    <div>
                        <Label>Display Name</Label>
                        <Input
                            value={item.attributes.displayName || ""}
                            onChange={(e) => updateAttributes("displayName", e.target.value)}
                            placeholder="Custom Item Name"
                        />
                    </div>

                    <div>
                        <Label>Lore</Label>
                        <div className="space-y-2">
                            {item.attributes.lore?.map((line, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={line}
                                        onChange={(e) => updateLore(index, e.target.value)}
                                        placeholder="Lore line..."
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLoreLine(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addLoreLine}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Lore Line
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Durability</Label>
                            <Input
                                type="number"
                                value={item.attributes.durability || ""}
                                onChange={(e) => updateAttributes("durability", parseInt(e.target.value))}
                                placeholder="250"
                            />
                        </div>

                        <div>
                            <Label>Stack Size</Label>
                            <Input
                                type="number"
                                value={item.attributes.stackSize || ""}
                                onChange={(e) => updateAttributes("stackSize", parseInt(e.target.value))}
                                min={1}
                                max={99}
                                placeholder="64"
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="combat" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Damage</Label>
                            <Input
                                type="number"
                                value={item.attributes.damage || ""}
                                onChange={(e) => updateAttributes("damage", parseFloat(e.target.value))}
                                placeholder="7.0"
                                step="0.5"
                            />
                        </div>

                        <div>
                            <Label>Attack Speed</Label>
                            <Input
                                type="number"
                                value={item.attributes.attackSpeed || ""}
                                onChange={(e) => updateAttributes("attackSpeed", parseFloat(e.target.value))}
                                placeholder="1.6"
                                step="0.1"
                            />
                        </div>

                        <div>
                            <Label>Defense</Label>
                            <Input
                                type="number"
                                value={item.attributes.defense || ""}
                                onChange={(e) => updateAttributes("defense", parseFloat(e.target.value))}
                                placeholder="3.0"
                                step="0.5"
                            />
                        </div>

                        <div>
                            <Label>Toughness</Label>
                            <Input
                                type="number"
                                value={item.attributes.toughness || ""}
                                onChange={(e) => updateAttributes("toughness", parseFloat(e.target.value))}
                                placeholder="2.0"
                                step="0.5"
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="tool" className="space-y-4">
                    <div>
                        <Label>Mining Speed</Label>
                        <Input
                            type="number"
                            value={item.attributes.miningSpeed || ""}
                            onChange={(e) => updateAttributes("miningSpeed", parseFloat(e.target.value))}
                            placeholder="8.0"
                            step="0.5"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="food" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Nutrition</Label>
                            <Input
                                type="number"
                                value={item.attributes.nutrition || ""}
                                onChange={(e) => updateAttributes("nutrition", parseInt(e.target.value))}
                                placeholder="4"
                            />
                        </div>

                        <div>
                            <Label>Saturation</Label>
                            <Input
                                type="number"
                                value={item.attributes.saturation || ""}
                                onChange={(e) => updateAttributes("saturation", parseFloat(e.target.value))}
                                placeholder="0.3"
                                step="0.1"
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    )
}
