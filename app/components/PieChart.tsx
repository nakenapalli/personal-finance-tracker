"use client"

import React from "react"

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

  const d = [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z'
  ].join(' ')

  return d
}

export default function PieChart({ slices, size = 140 }: { slices: Slice[]; size?: number }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1
  // compute start/end for each segment without side-effects
  const { segments } = slices.reduce(
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {segments.map((s, i) => {
        const path = describeArc(size / 2, size / 2, size / 2 - 8, s.start, s.end)

        return <path key={i} d={path} fill={s.color} stroke="#fff" strokeWidth={1} />
      })}

      {/* center hole */}
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 34} fill="#fff" />
    </svg>
  )
}
