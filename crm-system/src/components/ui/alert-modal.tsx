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
    <>
      {/* Full Screen Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[24]"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed top-0 bottom-0 right-0 z-[25] flex items-center justify-center p-4 left-16 lg:left-80">
        <div
          className={`relative w-full max-w-md rounded-3xl border ${colorMap[variant]}`}
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/10" style={{
            background: '#0f0f0f',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            {title && <h3 className="text-xl font-bold text-yellow-400">{title}</h3>}
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-white/80">{message}</p>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 px-6 py-4 border-t border-white/10 flex items-center gap-3 justify-end" style={{
            background: '#0f0f0f',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            {onConfirm ? (
              <>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white transition-all duration-300 text-sm font-medium flex items-center space-x-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  {cancelText || 'Cancel'}
                </button>
                <button
                  onClick={onConfirm}
                  className="px-6 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-all duration-300 text-sm shadow-lg"
                >
                  {confirmText || 'Confirm'}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-all duration-300 text-sm shadow-lg"
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

