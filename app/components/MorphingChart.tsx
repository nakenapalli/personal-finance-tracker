"use client"

import { motion } from "framer-motion"

type Slice = { value: number; color: string; label: string }

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
        x: cx + (r * Math.cos(angleInRadians)),
        y: cy + (r * Math.sin(angleInRadians))
    }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

    // We add line commands to close the shape properly for morphing
    // M center -> L start -> A arc -> L center -> Z
    return [
        `M ${cx} ${cy}`,
        `L ${start.x} ${start.y}`,
        `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        `L ${cx} ${cy}`,
        'Z'
    ].join(' ')
}

function describeBar(x: number, y: number, width: number, height: number) {
    // Draw a rounded rectangle path
    // M x,y L x+w,y L x+w,y+h L x,y+h Z
    return [
        `M ${x} ${y}`,
        `L ${x + width} ${y}`,
        `L ${x + width} ${y + height}`,
        `L ${x} ${y + height}`,
        'Z'
    ].join(' ')
}

export default function MorphingChart({
    slices,
    width = 160,
    height = 160,
    expanded,
    barHeight = 12,
    gap = 8,
    itemHeight = 32
}: {
    slices: Slice[];
    width?: number;
    height?: number;
    expanded: boolean;
    barHeight?: number;
    gap?: number;
    itemHeight?: number;
}) {
    const total = slices.reduce((s, sl) => s + sl.value, 0) || 1
    const maxVal = Math.max(...slices.map(s => s.value))

    // Compute Pie Segments
    const { segments: pieSegments } = slices.reduce(
        (acc, s) => {
            const value = (s.value / total) * 360
            const start = acc.current
            const end = start + value
            acc.segments.push({ ...s, start, end })
            acc.current = end
            return acc
        },
        { current: 0, segments: [] as Array<Slice & { start: number; end: number }> }
    )

    return (
        <motion.svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="mx-auto overflow-visible"
            animate={{ width, height, viewBox: `0 0 ${width} ${height}` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {pieSegments.map((s, i) => {
                // Pie State
                // Center the pie in the available width/height
                // We use a fixed radius for the pie state (based on default size or width)
                const pieRadius = 160 / 2 - 8
                const piePath = describeArc(width / 2, 160 / 2, pieRadius, s.start, s.end)

                // Bar State
                // Width proportional to value relative to max (so biggest bar fills width)
                const barWidth = (s.value / maxVal) * width

                // Calculate Y position to center the bar within the list item
                // i * (itemHeight + gap) gets us to the top of the item slot
                // + (itemHeight - barHeight) / 2 centers the bar vertically in that slot
                const barY = i * (itemHeight + gap) + (itemHeight - barHeight) / 2

                const barPath = describeBar(0, barY, barWidth, barHeight)

                return (
                    <motion.path
                        key={s.label}
                        d={expanded ? barPath : piePath}
                        fill={s.color}
                        stroke="#fff"
                        strokeWidth={1}
                        initial={false}
                        animate={{ d: expanded ? barPath : piePath }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            delay: expanded ? i * 0.05 : (pieSegments.length - i) * 0.05 // Staggered delay
                        }}
                    />
                )
            })}
        </motion.svg>
    )
}
