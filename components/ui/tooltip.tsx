'use client'

import { useState, useRef, useEffect, useId, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  maxWidth?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = 240,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipId = useId()

  function show() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    showTimerRef.current = setTimeout(() => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const GAP = 8
      let top = 0
      let left = 0
      if (position === 'top') {
        top = rect.top + window.scrollY - GAP
        left = rect.left + window.scrollX + rect.width / 2
      } else if (position === 'bottom') {
        top = rect.bottom + window.scrollY + GAP
        left = rect.left + window.scrollX + rect.width / 2
      } else if (position === 'left') {
        top = rect.top + window.scrollY + rect.height / 2
        left = rect.left + window.scrollX - GAP
      } else {
        top = rect.top + window.scrollY + rect.height / 2
        left = rect.right + window.scrollX + GAP
      }
      setCoords({ top, left })
      setVisible(true)
    }, delay)
  }

  function hide(immediate = false) {
    if (showTimerRef.current) clearTimeout(showTimerRef.current)
    hideTimerRef.current = setTimeout(() => setVisible(false), immediate ? 0 : 100)
  }

  useEffect(() => {
    const handleScroll = () => setVisible(false)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', () => setVisible(false))
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  const positionStyles: Record<string, React.CSSProperties> = {
    top:    { transform: 'translate(-50%, -100%)' },
    bottom: { transform: 'translate(-50%, 0)' },
    left:   { transform: 'translate(-100%, -50%)' },
    right:  { transform: 'translate(0, -50%)' },
  }

  const arrowStyles: Record<string, string> = {
    top:    'absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-ink',
    bottom: 'absolute left-1/2 -translate-x-1/2 top-[-4px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-ink',
    left:   'absolute top-1/2 -translate-y-1/2 right-[-4px] w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[5px] border-l-ink',
    right:  'absolute top-1/2 -translate-y-1/2 left-[-4px] w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-ink',
  }

  const tooltipEl = visible ? createPortal(
    <div
      id={tooltipId}
      role="tooltip"
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        maxWidth,
        zIndex: 400,
        ...positionStyles[position],
      }}
      className={cn(
        'bg-ink text-white text-body-sm px-3 py-2 rounded-lg shadow-md pointer-events-none',
        className
      )}
    >
      {content}
      <span className={arrowStyles[position]} aria-hidden="true" />
    </div>,
    document.body
  ) : null

  return (
    <>
      <span
        ref={triggerRef}
        aria-describedby={visible ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={() => hide()}
        onFocus={show}
        onBlur={() => hide(true)}
        onKeyDown={(e) => { if (e.key === 'Escape') hide(true) }}
        className="inline-flex"
      >
        {children}
      </span>
      {tooltipEl}
    </>
  )
}
