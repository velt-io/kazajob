'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'

export interface NavItem {
  href: string
  label: string
  icon: ReactNode
  badge?: number | string
}

interface SidebarProps {
  items: NavItem[]
  title?: string
  footer?: ReactNode
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ items, title, footer, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const content = (
    <aside className="w-60 shrink-0 border-r border-[#C084FC]/20 bg-[linear-gradient(180deg,rgba(30,14,56,0.92),rgba(12,5,24,0.96))] flex flex-col gap-1 p-3 h-full overflow-y-auto">
      {/* Header mobile uniquement */}
      <div className="flex items-center justify-between mb-2 lg:hidden">
        <Logo size={24} />
        {onMobileClose && (
          <button onClick={onMobileClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--kz-edge)] bg-[var(--kz-paper)]">
            <X size={15} />
          </button>
        )}
      </div>

      {title && (
        <div className="kz-eyebrow text-[var(--qx-gold)] px-3 pt-2 pb-2 truncate">{title}</div>
      )}

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all border',
                active
                  ? 'text-white border-[#E879F9]/50 bg-[linear-gradient(90deg,rgba(168,85,247,0.35),rgba(232,121,249,0.08))] shadow-[0_0_18px_-6px_rgba(232,121,249,0.8)] [&_svg]:text-[#F0ABFC] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-[#FACC15]'
                  : 'text-[var(--kz-text)] border-transparent hover:bg-[rgba(168,85,247,0.12)] [&_svg]:text-[var(--kz-mute)]'
              )}
            >
              <span className="inline-flex shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[var(--kz-edge)]',
                  active ? 'bg-[var(--kz-orange)] text-[var(--kz-ink)]' : 'bg-[var(--kz-orange-soft)] text-[var(--kz-ink)]')}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />
      {footer}
    </aside>
  )

  return (
    <>
      {/* Desktop : sidebar fixe */}
      <div className="hidden lg:block h-full">{content}</div>

      {/* Mobile : overlay drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-[var(--kz-inverse)]/50 z-40 lg:hidden" onClick={onMobileClose} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden" style={{ width: 224 }}>
            {content}
          </div>
        </>
      )}
    </>
  )
}
