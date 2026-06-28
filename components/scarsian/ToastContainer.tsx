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
  success: 'text-status-success border-status-success-border bg-status-success-bg',
  error:   'text-status-danger  border-status-danger-border  bg-status-danger-bg',
  warning: 'text-status-warning border-status-warning-border bg-status-warning-bg',
  info:    'text-status-info    border-status-info-border    bg-status-info-bg',
}

interface ToastContainerProps {
  toasts: Toast[]
  removeToast: (id: string) => void
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-toast flex flex-col gap-2 w-80 pointer-events-none">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-md ${colors[toast.type]} pointer-events-auto`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <p className="text-body-sm flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-black/5 rounded transition-colors duration-fast"
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
