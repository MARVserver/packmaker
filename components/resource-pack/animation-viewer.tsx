/**
 * Animation Viewer - Display and preview BBModel animations
 */

"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"

interface AnimationKeyframe {
    time: number
    channel: "position" | "rotation" | "scale"
    values: number[]
    interpolation?: "linear" | "catmullrom" | "step"
}

interface AnimationTimeline {
    name: string
    length: number // in seconds
    loop: boolean
    keyframes: AnimationKeyframe[]
}

interface AnimationViewerProps {
    animations: AnimationTimeline[]
}

export function AnimationViewer({ animations }: AnimationViewerProps) {
    const [selectedAnimation, setSelectedAnimation] = useState<AnimationTimeline | null>(
        animations.length > 0 ? animations[0] : null
    )
    const [currentTime, setCurrentTime] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)

    useEffect(() => {
        if (!isPlaying || !selectedAnimation) return

        const interval = setInterval(() => {
            setCurrentTime((prev) => {
                const next = prev + (0.016 * playbackSpeed) // ~60fps
                if (next >= selectedAnimation.length) {
                    if (selectedAnimation.loop) {
                        return 0
                    } else {
                        setIsPlaying(false)
                        return selectedAnimation.length
                    }
                }
                return next
            })
        }, 16)

        return () => clearInterval(interval)
    }, [isPlaying, selectedAnimation, playbackSpeed])

    const handlePlay = () => {
        if (currentTime >= (selectedAnimation?.length || 0)) {
            setCurrentTime(0)
        }
        setIsPlaying(true)
    }

    const handlePause = () => {
        setIsPlaying(false)
    }

    const handleReset = () => {
        setCurrentTime(0)
        setIsPlaying(false)
    }

    const getKeyframeAtTime = (time: number): AnimationKeyframe[] => {
        if (!selectedAnimation) return []

        return selectedAnimation.keyframes.filter((kf) => {
            const threshold = 0.1
            return Math.abs(kf.time - time) < threshold
        })
    }

    const currentKeyframes = getKeyframeAtTime(currentTime)

    if (animations.length === 0) {
        return (
            <Card className="p-8 text-center text-muted-foreground">
                <p>No animations available</p>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="space-y-4">
                    <div>
                        <Label>Select Animation</Label>
                        <Select
                            value={selectedAnimation?.name}
                            onValueChange={(value) => {
                                const anim = animations.find((a) => a.name === value)
                                if (anim) {
                                    setSelectedAnimation(anim)
                                    setCurrentTime(0)
                                    setIsPlaying(false)
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {animations.map((anim) => (
                                    <SelectItem key={anim.name} value={anim.name}>
                                        {anim.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedAnimation && (
                        <>
                            <div>
                                <Label>
                                    Time: {currentTime.toFixed(2)}s / {selectedAnimation.length.toFixed(2)}s
                                </Label>
                                <Slider
                                    value={[currentTime]}
                                    onValueChange={([value]) => {
                                        setCurrentTime(value)
                                        setIsPlaying(false)
                                    }}
                                    min={0}
                                    max={selectedAnimation.length}
                                    step={0.01}
                                    className="mt-2"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleReset}
                                    disabled={isPlaying}
                                >
                                    <SkipBack className="h-4 w-4" />
                                </Button>

                                {isPlaying ? (
                                    <Button variant="outline" size="icon" onClick={handlePause}>
                                        <Pause className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="icon" onClick={handlePlay}>
                                        <Play className="h-4 w-4" />
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentTime(selectedAnimation.length)}
                                    disabled={isPlaying}
                                >
                                    <SkipForward className="h-4 w-4" />
                                </Button>

                                <div className="flex-1" />

                                <div className="flex items-center gap-2">
                                    <Label className="text-sm">Speed:</Label>
                                    <Select
                                        value={playbackSpeed.toString()}
                                        onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0.25">0.25x</SelectItem>
                                            <SelectItem value="0.5">0.5x</SelectItem>
                                            <SelectItem value="1">1x</SelectItem>
                                            <SelectItem value="1.5">1.5x</SelectItem>
                                            <SelectItem value="2">2x</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Card>

            {selectedAnimation && (
                <Card className="p-4">
                    <Label className="mb-2 block">Animation Details</Label>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{selectedAnimation.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Length:</span>
                            <span className="font-medium">{selectedAnimation.length.toFixed(2)}s</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Loop:</span>
                            <span className="font-medium">{selectedAnimation.loop ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Keyframes:</span>
                            <span className="font-medium">{selectedAnimation.keyframes.length}</span>
                        </div>
                    </div>
                </Card>
            )}

            {selectedAnimation && currentKeyframes.length > 0 && (
                <Card className="p-4">
                    <Label className="mb-2 block">Active Keyframes</Label>
                    <div className="space-y-2">
                        {currentKeyframes.map((kf, index) => (
                            <div key={index} className="rounded border p-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium capitalize">{kf.channel}</span>
                                    <span className="text-muted-foreground">{kf.time.toFixed(2)}s</span>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Values: [{kf.values.map((v) => v.toFixed(2)).join(", ")}]
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {selectedAnimation && (
                <Card className="p-4">
                    <Label className="mb-2 block">Timeline</Label>
                    <div className="relative h-24 rounded border bg-muted/30">
                        {/* Timeline markers */}
                        <div className="absolute inset-0 flex items-end">
                            {selectedAnimation.keyframes.map((kf, index) => {
                                const position = (kf.time / selectedAnimation.length) * 100
                                return (
                                    <div
                                        key={index}
                                        className="absolute bottom-0 w-1 bg-primary"
                                        style={{
                                            left: `${position}%`,
                                            height: "40%"
                                        }}
                                    />
                                )
                            })}
                        </div>

                        {/* Current time indicator */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-destructive"
                            style={{
                                left: `${(currentTime / selectedAnimation.length) * 100}%`
                            }}
                        />
                    </div>
                </Card>
            )}
        </div>
    )
}
