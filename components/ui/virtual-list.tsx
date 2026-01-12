/**
 * Virtual List Component for large texture/model lists
 * Optimizes rendering by only showing visible items
 */

import React, { useCallback, useRef, useEffect, useState, ReactNode } from 'react'

interface VirtualListProps<T> {
    items: T[]
    itemHeight: number
    containerHeight: number
    renderItem: (item: T, index: number) => ReactNode
    overscan?: number
    className?: string
}

export function VirtualList<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 3,
    className = ''
}: VirtualListProps<T>) {
    const [scrollTop, setScrollTop] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    const totalHeight = items.length * itemHeight

    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    const visibleItems = items.slice(startIndex, endIndex + 1)

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop)
    }, [])

    return (
        <div
            ref={containerRef}
            className={`overflow-auto ${className}`}
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems.map((item, index) => {
                    const actualIndex = startIndex + index
                    return (
                        <div
                            key={actualIndex}
                            style={{
                                position: 'absolute',
                                top: actualIndex * itemHeight,
                                height: itemHeight,
                                width: '100%'
                            }}
                        >
                            {renderItem(item, actualIndex)}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

interface VirtualGridProps<T> {
    items: T[]
    itemWidth: number
    itemHeight: number
    containerWidth: number
    containerHeight: number
    gap?: number
    renderItem: (item: T, index: number) => ReactNode
    overscan?: number
    className?: string
}

export function VirtualGrid<T>({
    items,
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight,
    gap = 16,
    renderItem,
    overscan = 1,
    className = ''
}: VirtualGridProps<T>) {
    const [scrollTop, setScrollTop] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    // Calculate columns per row
    const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap))
    const totalRows = Math.ceil(items.length / columnsPerRow)
    const rowHeight = itemHeight + gap

    const totalHeight = totalRows * rowHeight

    // Calculate visible rows
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
    const endRow = Math.min(
        totalRows - 1,
        Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    )

    const visibleRows: T[][] = []
    for (let row = startRow; row <= endRow; row++) {
        const startIdx = row * columnsPerRow
        const endIdx = Math.min(startIdx + columnsPerRow, items.length)
        visibleRows.push(items.slice(startIdx, endIdx))
    }

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop)
    }, [])

    return (
        <div
            ref={containerRef}
            className={`overflow-auto ${className}`}
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleRows.map((row, rowIndex) => {
                    const actualRow = startRow + rowIndex
                    return (
                        <div
                            key={actualRow}
                            style={{
                                position: 'absolute',
                                top: actualRow * rowHeight,
                                left: 0,
                                right: 0,
                                display: 'flex',
                                gap: gap,
                                flexWrap: 'nowrap'
                            }}
                        >
                            {row.map((item, colIndex) => {
                                const actualIndex = actualRow * columnsPerRow + colIndex
                                return (
                                    <div
                                        key={actualIndex}
                                        style={{
                                            width: itemWidth,
                                            height: itemHeight,
                                            flexShrink: 0
                                        }}
                                    >
                                        {renderItem(item, actualIndex)}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// Hook for auto-calculating container dimensions
export function useContainerDimensions() {
    const ref = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    useEffect(() => {
        const updateDimensions = () => {
            if (ref.current) {
                setDimensions({
                    width: ref.current.offsetWidth,
                    height: ref.current.offsetHeight
                })
            }
        }

        updateDimensions()

        const observer = new ResizeObserver(updateDimensions)
        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [])

    return { ref, dimensions }
}
