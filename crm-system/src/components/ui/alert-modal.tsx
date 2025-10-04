'use client'

import React from 'react'

interface AlertModalProps {
  open: boolean
  title?: string
  message: string
  variant?: 'info' | 'success' | 'error' | 'warning'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onClose: () => void
}

export function AlertModal({ open, title, message, variant = 'info', confirmText, cancelText, onConfirm, onClose }: AlertModalProps) {
  if (!open) return null

  const colorMap: Record<string, string> = {
    info: 'bg-white text-black border-white/20',
    success: 'bg-green-600 text-white border-green-400/50',
    error: 'bg-red-600 text-white border-red-400/50',
    warning: 'bg-yellow-500 text-black border-yellow-300/70',
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative w-full max-w-sm rounded-xl shadow-xl border ${colorMap[variant]} mx-4`}>
        <div className="p-4">
          {title && <h3 className="font-semibold mb-1">{title}</h3>}
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <div className="px-4 pb-4 flex items-center gap-2 justify-end">
          {onConfirm ? (
            <>
              <button onClick={onClose} className="px-3 py-1.5 rounded-md bg-black/10 hover:bg-black/20 text-sm">{cancelText || 'Cancel'}</button>
              <button onClick={onConfirm} className="px-3 py-1.5 rounded-md bg-black/20 hover:bg-black/30 text-sm">{confirmText || 'Confirm'}</button>
            </>
          ) : (
            <button onClick={onClose} className="px-3 py-1.5 rounded-md bg-black/20 hover:bg-black/30 text-sm">OK</button>
          )}
        </div>
      </div>
    </div>
  )
}

