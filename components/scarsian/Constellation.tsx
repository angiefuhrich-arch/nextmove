'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface Node {
  x: number
  y: number
  connections: number[]
  delay: number
}

interface ConstellationProps {
  width?: number
  height?: number
  nodeCount?: number
  opacity?: number
  animated?: boolean
  className?: string
  variant?: 'background' | 'radiating' | 'loading'
  centerX?: number
  centerY?: number
}

function generateNodes(count: number, w: number, h: number, variant: string, cx?: number, cy?: number): Node[] {
  const nodes: Node[] = []

  if (variant === 'radiating' && cx !== undefined && cy !== undefined) {
    const arms = 5
    for (let i = 0; i < arms; i++) {
      const angle = (i / arms) * Math.PI * 2 - Math.PI / 2
      const dist = Math.min(w, h) * 0.35
      nodes.push({ x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist, connections: [0], delay: i * 0.1 })
    }
    nodes.unshift({ x: cx, y: cy, connections: [1, 2, 3, 4, 5], delay: 0 })
    for (let i = 0; i < count - arms - 1; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.min(w, h) * (0.2 + Math.random() * 0.35)
      nodes.push({ x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist, connections: [Math.floor(Math.random() * 3)], delay: 0.5 + Math.random() * 0.5 })
    }
  } else {
    for (let i = 0; i < count; i++) {
      nodes.push({ x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.8, connections: [], delay: Math.random() * 2 })
    }
    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i === j) return
        const dx = node.x - other.x
        const dy = node.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 0.25 && node.connections.length < 3) node.connections.push(j)
      })
    })
  }

  return nodes
}

export function Constellation({
  width = 800,
  height = 600,
  nodeCount = 20,
  opacity = 0.06,
  animated = true,
  className = '',
  variant = 'background',
  centerX,
  centerY,
}: ConstellationProps) {
  const nodes = useMemo(
    () => generateNodes(nodeCount, width, height, variant, centerX ? centerX / width : 0.5, centerY ? centerY / height : 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodeCount, width, height, variant]
  )

  const nodeRadius = variant === 'radiating' ? 3 : 2
  const lineWidth = variant === 'radiating' ? 0.8 : 0.5

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`pointer-events-none ${className}`}
      style={{ opacity }}
    >
      {nodes.map((node, i) =>
        node.connections.map((ci) => {
          const target = nodes[ci]
          if (!target) return null
          const x1 = variant === 'background' ? node.x * width : node.x
          const y1 = variant === 'background' ? node.y * height : node.y
          const x2 = variant === 'background' ? target.x * width : target.x
          const y2 = variant === 'background' ? target.y * height : target.y
          return (
            <motion.line
              key={`${i}-${ci}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#0E5A5E"
              strokeWidth={lineWidth}
              initial={animated ? { pathLength: 0, opacity: 0 } : false}
              animate={animated ? { pathLength: 1, opacity: 1 } : false}
              transition={{ duration: 1.2, delay: node.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          )
        })
      )}
      {nodes.map((node, i) => {
        const x = variant === 'background' ? node.x * width : node.x
        const y = variant === 'background' ? node.y * height : node.y
        return (
          <motion.circle
            key={i}
            cx={x} cy={y} r={nodeRadius}
            fill="#0E5A5E"
            initial={animated ? { scale: 0, opacity: 0 } : false}
            animate={animated ? { scale: 1, opacity: 1 } : false}
            transition={{ duration: 0.4, delay: node.delay + 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
          />
        )
      })}
    </svg>
  )
}
