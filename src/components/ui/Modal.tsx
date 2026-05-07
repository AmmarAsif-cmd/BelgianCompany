'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={cn(
        'relative w-full bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl sm:max-w-lg max-h-[92vh] flex flex-col',
        className
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3E2723]/10 shrink-0">
          <h2 className="text-base font-bold text-[#3E2723]">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#3E2723]/10 text-[#3E2723]/50">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
