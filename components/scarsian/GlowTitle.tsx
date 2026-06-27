'use client'

import { motion } from 'framer-motion'

interface GlowTitleProps {
  text: string
  className?: string
}

export function GlowTitle({ text, className = '' }: GlowTitleProps) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0, 0, 0.2, 1] }}
      className={`text-5xl md:text-7xl lg:text-[80px] font-bold text-white leading-[1.1] tracking-[-2px] text-center animate-glow-pulse whitespace-pre-line text-glow ${className}`}
    >
      {text}
    </motion.h1>
  )
}
