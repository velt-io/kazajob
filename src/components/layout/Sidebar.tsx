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
    <aside className="w-60 shrink-0 os-glass !border-y-0 !border-l-0 !bg-[rgba(18,18,22,0.6)] flex flex-col gap-1 p-3 h-full overflow-y-auto">
      {/* Header mobile uniquement */}
      <div className="flex items-center justify-between mb-2 lg:hidden">
        <Logo size={24} />
        {onMobileClose && (
          <button onClick={onMobileClose} aria-label="Fermer le menu" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14]">
            <X size={15} />
          </button>
        )}
      </div>

      {title && (
        <div className="text-[11px] font-semibold text-[var(--kz-mute)] px-3 pt-2 pb-1.5 truncate">{title}</div>
      )}

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200',
                active
                  ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] [&_svg]:text-[#0A84FF]'
                  : 'text-[var(--kz-text)] hover:bg-white/[0.06] [&_svg]:text-[var(--kz-mute)] hover:[&_svg]:text-[var(--kz-ink)]'
              )}
            >
              <span className="inline-flex shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span className="text-[10px] font-semibold min-w-[18px] text-center px-1.5 py-0.5 rounded-full bg-[#FF453A] text-white">
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
          <div className="fixed inset-0 os-scrim backdrop-blur-md z-40 lg:hidden" onClick={onMobileClose} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-slide-up" style={{ width: 240 }}>
            {content}
          </div>
        </>
      )}
    </>
  )
}
