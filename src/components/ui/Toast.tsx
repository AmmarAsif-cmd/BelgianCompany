'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type ToastMessage = {
  id: string
  message: string
  type: 'success' | 'error'
}

interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, 2500)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all duration-300',
        toast.type === 'success'
          ? 'bg-[#3E2723] text-[#FFF8E7]'
          : 'bg-[#C8102E] text-white',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      {toast.type === 'success'
        ? <CheckCircle size={16} />
        : <AlertCircle size={16} />
      }
      {toast.message}
    </div>
  )
}

// Simple hook to manage toast state
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  function addToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, addToast, dismissToast }
}
