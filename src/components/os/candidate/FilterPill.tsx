'use client'

import { useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/radix'
import { cn } from '@/lib/utils'

/**
 * Filtre en pilule (thème OS 2027) : un bouton compact qui ouvre une liste
 * de choix façon menu iOS. La pilule s'allume quand un filtre est actif.
 */
export function FilterPill({ label, icon, valueLabel, options, value, onSelect, align = 'start', listClassName }: {
  label: string
  icon?: ReactNode
  /** Libellé affiché quand une valeur est active (null = inactif). */
  valueLabel?: string | null
  options: { value: string; label: string }[]
  value: string
  onSelect: (value: string) => void
  align?: 'start' | 'center' | 'end'
  listClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const active = !!valueLabel
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label}${valueLabel ? ` : ${valueLabel}` : ''}`}
          className={cn(
            'osc-press shrink-0 inline-flex items-center gap-1.5 h-9 pl-3.5 pr-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap border outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]',
            active
              ? 'bg-[var(--kz-ink)] text-[var(--kz-inverse)] border-transparent'
              : 'bg-[var(--osc-surface,transparent)] text-[var(--kz-text)] border-[var(--kz-edge)] hover:bg-[var(--osc-surface-hi,transparent)] data-[state=open]:bg-[var(--osc-surface-hi,transparent)]',
          )}
        >
          {icon && <span className="inline-flex opacity-80">{icon}</span>}
          <span className="max-w-[160px] truncate">{valueLabel || label}</span>
          <ChevronDown size={14} className={cn('transition-transform duration-300', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[min(280px,calc(100vw-32px))] p-1.5">
        <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)]">{label}</p>
        <div className={cn('max-h-[min(340px,60vh)] overflow-y-auto flex flex-col', listClassName)}>
          {options.map((o) => {
            const selected = o.value === value
            return (
              <button
                key={o.value || '__all'}
                type="button"
                aria-pressed={selected}
                onClick={() => { onSelect(o.value); setOpen(false) }}
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] outline-none transition-colors',
                  'hover:bg-[var(--kz-line)] focus-visible:bg-[var(--kz-blue)] focus-visible:text-white',
                  selected ? 'text-[var(--kz-ink)] font-semibold' : 'text-[var(--kz-text)]',
                )}
              >
                <span className="truncate">{o.label}</span>
                {selected && <Check size={16} className="text-[var(--kz-blue)] shrink-0" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
