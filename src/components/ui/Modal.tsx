'use client'

import { type ReactNode } from 'react'
import { Dialog, VisuallyHidden } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
}

/**
 * Fenêtre modale sur Radix Dialog : piège du focus, fermeture à Échap,
 * blocage du défilement et annonce aux lecteurs d'écran. Même API qu'avant.
 */
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 os-scrim backdrop-blur-md" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <Dialog.Content
            aria-describedby={undefined}
            className={cn(
              'pointer-events-auto relative w-full max-h-[90vh] flex flex-col os-glass !bg-[rgba(24,24,30,0.86)] rounded-[28px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] animate-slide-up outline-none',
              sizeMap[size]
            )}
          >
            {title ? (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--kz-line)] shrink-0">
                <Dialog.Title className="text-[17px] font-semibold text-[var(--kz-ink)] tracking-tight">{title}</Dialog.Title>
                <Dialog.Close
                  aria-label="Fermer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] transition-colors"
                >
                  <X size={16} />
                </Dialog.Close>
              </div>
            ) : (
              <VisuallyHidden.Root><Dialog.Title>Fenêtre</Dialog.Title></VisuallyHidden.Root>
            )}
            <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
