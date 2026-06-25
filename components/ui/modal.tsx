'use client'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative z-10 bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4', className)}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-slate-100 text-slate-500"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}
