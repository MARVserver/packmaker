/**
 * Recipe Generator - Create crafting, smelting, and smithing recipes
 */

"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Download } from "lucide-react"

type RecipeType = "crafting_shaped" | "crafting_shapeless" | "smelting" | "blasting" | "smoking" | "campfire_cooking" | "smithing"

interface RecipeData {
    type: RecipeType
    result: {
        item: string
        count?: number
    }
    pattern?: string[] // For shaped crafting
    key?: Record<string, { item: string }> // For shaped crafting
    ingredients?: Array<{ item: string }> // For shapeless
    ingredient?: { item: string } // For smelting
    addition?: { item: string } // For smithing
    base?: { item: string } // For smithing
    template?: { item: string } // For smithing
    experience?: number
    cookingTime?: number
}

export function RecipeGenerator() {
    const [recipeType, setRecipeType] = useState<RecipeType>("crafting_shaped")
    const [recipeName, setRecipeName] = useState("my_recipe")
    const [result, setResult] = useState({ item: "stick", count: 1 })

    // Shaped crafting
    const [pattern, setPattern] = useState(["###", " | ", " | "])
    const [key, setKey] = useState<Record<string, string>>({ "#": "diamond", "|": "stick" })

    // Shapeless crafting
    const [ingredients, setIngredients] = useState<string[]>(["stick", "stick"])

    // Smelting
    const [smeltingIngredient, setSmeltingIngredient] = useState("iron_ore")
    const [experience, setExperience] = useState(0.7)
    const [cookingTime, setCookingTime] = useState(200)

    // Smithing
    const [template, setTemplate] = useState("netherite_upgrade_smithing_template")
    const [base, setBase] = useState("diamond_sword")
    const [addition, setAddition] = useState("netherite_ingot")

    const generateRecipe = (): RecipeData => {
        const baseRecipe: RecipeData = {
            type: recipeType,
            result
        }

        switch (recipeType) {
            case "crafting_shaped":
                return {
                    ...baseRecipe,
                    pattern,
                    key: Object.fromEntries(
                        Object.entries(key).map(([k, v]) => [k, { item: v }])
                    )
                }

            case "crafting_shapeless":
                return {
                    ...baseRecipe,
                    ingredients: ingredients.map(item => ({ item }))
                }

            case "smelting":
            case "blasting":
            case "smoking":
            case "campfire_cooking":
                return {
                    ...baseRecipe,
                    ingredient: { item: smeltingIngredient },
                    experience,
                    cookingTime
                }

            case "smithing":
                return {
                    ...baseRecipe,
                    template: { item: template },
                    base: { item: base },
                    addition: { item: addition }
                }

            default:
                return baseRecipe
        }
    }

    const recipeJson = JSON.stringify(generateRecipe(), null, 2)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(recipeJson)
    }

    const downloadRecipe = () => {
        const blob = new Blob([recipeJson], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${recipeName}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="grid gap-4">
                    <div>
                        <Label>Recipe Name</Label>
                        <Input
                            value={recipeName}
                            onChange={(e) => setRecipeName(e.target.value)}
                            placeholder="my_custom_recipe"
                        />
                    </div>

                    <div>
                        <Label>Recipe Type</Label>
                        <Select
                            value={recipeType}
                            onValueChange={(value: RecipeType) => setRecipeType(value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="crafting_shaped">Shaped Crafting</SelectItem>
                                <SelectItem value="crafting_shapeless">Shapeless Crafting</SelectItem>
                                <SelectItem value="smelting">Smelting</SelectItem>
                                <SelectItem value="blasting">Blasting</SelectItem>
                                <SelectItem value="smoking">Smoking</SelectItem>
                                <SelectItem value="campfire_cooking">Campfire Cooking</SelectItem>
                                <SelectItem value="smithing">Smithing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Result Item</Label>
                            <Input
                                value={result.item}
                                onChange={(e) => setResult({ ...result, item: e.target.value })}
                                placeholder="minecraft:stick"
                            />
                        </div>

                        <div>
                            <Label>Result Count</Label>
                            <Input
                                type="number"
                                value={result.count}
                                onChange={(e) => setResult({ ...result, count: parseInt(e.target.value) })}
                                min={1}
                                max={64}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-4">
                <Tabs value={recipeType} className="w-full">
                    <TabsList className="hidden" />

                    <TabsContent value="crafting_shaped" className="space-y-4">
                        <div>
                            <Label>Crafting Pattern (3x3)</Label>
                            <div className="space-y-2 mt-2">
                                {pattern.map((row, i) => (
                                    <Input
                                        key={i}
                                        value={row}
                                        onChange={(e) => {
                                            const newPattern = [...pattern]
                                            newPattern[i] = e.target.value
                                            setPattern(newPattern)
                                        }}
                                        maxLength={3}
                                        placeholder="###"
                                        className="font-mono text-center"
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label>Key Mapping</Label>
                            <div className="space-y-2 mt-2">
                                {Object.entries(key).map(([symbol, item]) => (
                                    <div key={symbol} className="flex gap-2">
                                        <Input
                                            value={symbol}
                                            className="w-16 text-center font-mono"
                                            disabled
                                        />
                                        <Input
                                            value={item}
                                            onChange={(e) => setKey({ ...key, [symbol]: e.target.value })}
                                            placeholder="minecraft:stick"
                                            className="flex-1"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="crafting_shapeless" className="space-y-4">
                        <div>
                            <Label>Ingredients</Label>
                            <div className="space-y-2 mt-2">
                                {ingredients.map((item, i) => (
                                    <Input
                                        key={i}
                                        value={item}
                                        onChange={(e) => {
                                            const newIngredients = [...ingredients]
                                            newIngredients[i] = e.target.value
                                            setIngredients(newIngredients)
                                        }}
                                        placeholder="minecraft:stick"
                                    />
                                ))}
                                <Button
                                    variant="outline"
                                    onClick={() => setIngredients([...ingredients, "stick"])}
                                >
                                    Add Ingredient
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="smelting" className="space-y-4">
                        <div>
                            <Label>Ingredient</Label>
                            <Input
                                value={smeltingIngredient}
                                onChange={(e) => setSmeltingIngredient(e.target.value)}
                                placeholder="minecraft:iron_ore"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label>Experience</Label>
                                <Input
                                    type="number"
                                    value={experience}
                                    onChange={(e) => setExperience(parseFloat(e.target.value))}
                                    step="0.1"
                                />
                            </div>

                            <div>
                                <Label>Cooking Time (ticks)</Label>
                                <Input
                                    type="number"
                                    value={cookingTime}
                                    onChange={(e) => setCookingTime(parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {["blasting", "smoking", "campfire_cooking"].map(type => (
                        <TabsContent key={type} value={type} className="space-y-4">
                            <div>
                                <Label>Ingredient</Label>
                                <Input
                                    value={smeltingIngredient}
                                    onChange={(e) => setSmeltingIngredient(e.target.value)}
                                    placeholder="minecraft:iron_ore"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Experience</Label>
                                    <Input
                                        type="number"
                                        value={experience}
                                        onChange={(e) => setExperience(parseFloat(e.target.value))}
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <Label>Cooking Time (ticks)</Label>
                                    <Input
                                        type="number"
                                        value={cookingTime}
                                        onChange={(e) => setCookingTime(parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    ))}

                    <TabsContent value="smithing" className="space-y-4">
                        <div>
                            <Label>Template</Label>
                            <Input
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                placeholder="minecraft:netherite_upgrade_smithing_template"
                            />
                        </div>

                        <div>
                            <Label>Base Item</Label>
                            <Input
                                value={base}
                                onChange={(e) => setBase(e.target.value)}
                                placeholder="minecraft:diamond_sword"
                            />
                        </div>

                        <div>
                            <Label>Addition</Label>
                            <Input
                                value={addition}
                                onChange={(e) => setAddition(e.target.value)}
                                placeholder="minecraft:netherite_ingot"
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>

            <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <Label>Generated Recipe JSON</Label>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={downloadRecipe}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>

                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                    <code>{recipeJson}</code>
                </pre>
            </Card>
        </div>
    )
}
