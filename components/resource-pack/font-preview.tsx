/**
 * Font Preview Renderer - Displays font preview using Canvas
 */
"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface FontPreviewProps {
    fontFile: File
    fontName: string
}

export function FontPreview({ fontFile, fontName }: FontPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [previewText, setPreviewText] = useState("The Quick Brown Fox Jumps Over The Lazy Dog 0123456789")
    const [fontSize, setFontSize] = useState(32)
    const [fontLoaded, setFontLoaded] = useState(false)

    useEffect(() => {
        const loadFont = async () => {
            try {
                const arrayBuffer = await fontFile.arrayBuffer()
                const fontFace = new FontFace(fontName, arrayBuffer)
                await fontFace.load()
                document.fonts.add(fontFace)
                setFontLoaded(true)
            } catch (error) {
                console.error("Failed to load font:", error)
            }
        }

        loadFont()

        return () => {
            // Cleanup: remove font from document
            document.fonts.forEach(font => {
                if (font.family === fontName) {
                    document.fonts.delete(font)
                }
            })
        }
    }, [fontFile, fontName])

    useEffect(() => {
        if (!fontLoaded || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size
        canvas.width = canvas.offsetWidth * window.devicePixelRatio
        canvas.height = 200 * window.devicePixelRatio
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

        // Clear canvas
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw text
        ctx.font = `${fontSize}px "${fontName}"`
        ctx.fillStyle = "#000000"
        ctx.textBaseline = "top"

        // Word wrap
        const maxWidth = canvas.offsetWidth - 20
        const words = previewText.split(" ")
        let line = ""
        let y = 10

        for (const word of words) {
            const testLine = line + word + " "
            const metrics = ctx.measureText(testLine)

            if (metrics.width > maxWidth && line !== "") {
                ctx.fillText(line, 10, y)
                line = word + " "
                y += fontSize + 5
            } else {
                line = testLine
            }
        }
        ctx.fillText(line, 10, y)
    }, [fontLoaded, previewText, fontSize, fontName])

    return (
        <Card className="p-4 space-y-4">
            <div>
                <Label>Preview Text</Label>
                <Input
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Enter text to preview..."
                />
            </div>

            <div>
                <Label>Font Size: {fontSize}px</Label>
                <Slider
                    value={[fontSize]}
                    onValueChange={([value]) => setFontSize(value)}
                    min={8}
                    max={72}
                    step={1}
                    className="mt-2"
                />
            </div>

            <div className="border rounded-lg overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    className="w-full"
                    style={{ height: "200px" }}
                />
            </div>

            {!fontLoaded && (
                <div className="text-sm text-muted-foreground">Loading font...</div>
            )}
        </Card>
    )
}
