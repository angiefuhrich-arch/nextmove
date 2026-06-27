'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { Toast } from '@/lib/types/ui'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'text-verdict-green border-verdict-green/30 bg-verdict-green/10',
  error: 'text-verdict-red border-verdict-red/30 bg-verdict-red/10',
  warning: 'text-verdict-amber border-verdict-amber/30 bg-verdict-amber/10',
  info: 'text-blue border-blue/30 bg-blue/10',
}

interface ToastContainerProps {
  toasts: Toast[]
  removeToast: (id: string) => void
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-[500] flex flex-col gap-2 w-80 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const Icon = icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors[toast.type]} backdrop-blur-sm pointer-events-auto`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm text-white/90 flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
