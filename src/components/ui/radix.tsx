'use client'
/**
 * KAZAJOB — Composants Radix UI habillés au thème « Quest » (MMORPG néon).
 * Radix apporte l'accessibilité (clavier, focus, ARIA, lecteurs d'écran) ;
 * ce fichier n'ajoute que le style. API volontairement proche de Radix.
 */
import { type ComponentProps, type ReactNode } from 'react'
import { Accordion as A, DropdownMenu as DM, Popover as P, Switch as S, Tabs as T, Tooltip as TT } from 'radix-ui'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const SURFACE = 'qx-panel backdrop-blur-xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]'
const ANIM = 'data-[state=open]:animate-[qx-rise_0.22s_cubic-bezier(0.2,0.8,0.2,1)]'

// ── Menu déroulant ────────────────────────────────────────────
export const Menu = DM.Root
export const MenuTrigger = DM.Trigger
export const MenuGroup = DM.Group

export function MenuContent({ className, align = 'end', sideOffset = 8, ...props }: ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content align={align} sideOffset={sideOffset}
        className={cn('z-50 min-w-[220px] rounded-2xl p-1.5 outline-none', SURFACE, ANIM, className)} {...props} />
    </DM.Portal>
  )
}

export function MenuItem({ className, destructive, ...props }: ComponentProps<typeof DM.Item> & { destructive?: boolean }) {
  return (
    <DM.Item
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium cursor-pointer outline-none select-none transition-colors',
        'data-[highlighted]:bg-[linear-gradient(120deg,#7C3AED,#C026D3)] data-[highlighted]:text-white data-[highlighted]:shadow-[0_0_18px_-6px_rgba(232,121,249,0.9)] [&_svg]:shrink-0',
        destructive ? 'text-[#FCA5A5] data-[highlighted]:bg-[#B91C1C]' : 'text-[var(--kz-ink)]',
        className,
      )}
      {...props}
    />
  )
}

export function MenuLabel({ className, ...props }: ComponentProps<typeof DM.Label>) {
  return <DM.Label className={cn('px-3 pt-2 pb-1.5', className)} {...props} />
}

export function MenuSeparator() {
  return <DM.Separator className="h-px bg-[#C084FC]/20 my-1 mx-2" />
}

// ── Popover ───────────────────────────────────────────────────
export const Popover = P.Root
export const PopoverTrigger = P.Trigger

export function PopoverContent({ className, align = 'end', sideOffset = 8, ...props }: ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content align={align} sideOffset={sideOffset}
        className={cn('z-50 rounded-2xl overflow-hidden outline-none', SURFACE, ANIM, className)} {...props} />
    </P.Portal>
  )
}

// ── Infobulle ─────────────────────────────────────────────────
export const TooltipProvider = TT.Provider

export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <TT.Root delayDuration={250}>
      <TT.Trigger asChild>{children}</TT.Trigger>
      <TT.Portal>
        <TT.Content side={side} sideOffset={6}
          className="z-[60] px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#F5EEFF] bg-[#1A0B2E] border border-[#C084FC]/45 shadow-[0_0_20px_-6px_rgba(232,121,249,0.8)] data-[state=delayed-open]:animate-[qx-rise_0.18s_ease-out]">
          {content}
        </TT.Content>
      </TT.Portal>
    </TT.Root>
  )
}

// ── Onglets (barre de sorts) ───────────────────────────────
export const Tabs = T.Root
export const TabsContent = T.Content

export function TabsList({ className, ...props }: ComponentProps<typeof T.List>) {
  return <T.List className={cn('inline-flex items-center gap-1 p-1 rounded-xl bg-[rgba(168,85,247,0.1)] border border-[#C084FC]/25 max-w-full overflow-x-auto', className)} {...props} />
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        'px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-[0.06em] whitespace-nowrap text-[var(--kz-mute)] transition-all duration-200 outline-none',
        'hover:text-white data-[state=active]:bg-[linear-gradient(120deg,#7C3AED,#C026D3)] data-[state=active]:text-white data-[state=active]:shadow-[0_0_18px_-6px_rgba(232,121,249,0.9)]',
        'focus-visible:ring-4 focus-visible:ring-[#E879F9]/40',
        className,
      )}
      {...props}
    />
  )
}

// ── Interrupteur « rune » ──────────────────────────────────────────
export function Switch({ className, ...props }: ComponentProps<typeof S.Root>) {
  return (
    <S.Root
      className={cn(
        'relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 outline-none',
        'bg-[rgba(168,85,247,0.25)] border border-[#C084FC]/40 data-[state=checked]:bg-[linear-gradient(120deg,#7C3AED,#E879F9)] data-[state=checked]:shadow-[0_0_16px_-4px_rgba(232,121,249,0.9)] focus-visible:ring-4 focus-visible:ring-[#E879F9]/40 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <S.Thumb className="block h-[27px] w-[27px] translate-x-[2px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.35)] transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
    </S.Root>
  )
}

// ── Accordéon ─────────────────────────────────────────────────
export const Accordion = A.Root

export function AccordionItem({ className, ...props }: ComponentProps<typeof A.Item>) {
  return <A.Item className={cn('qx-panel overflow-hidden transition-shadow data-[state=open]:shadow-[0_0_32px_-8px_rgba(232,121,249,0.7)]', className)} {...props} />
}

export function AccordionTrigger({ className, children, ...props }: ComponentProps<typeof A.Trigger>) {
  return (
    <A.Header>
      <A.Trigger
        className={cn('group w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[var(--kz-ink)] outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/40', className)}
        {...props}
      >
        {children}
        <ChevronDown size={18} className="shrink-0 text-[var(--kz-mute)] transition-transform duration-300 group-data-[state=open]:rotate-180" />
      </A.Trigger>
    </A.Header>
  )
}

export function AccordionContent({ className, children, ...props }: ComponentProps<typeof A.Content>) {
  return (
    <A.Content className={cn('overflow-hidden text-sm leading-relaxed text-[var(--kz-mute)] data-[state=open]:animate-[slide-up_0.3s_ease]', className)} {...props}>
      <div className="px-5 pb-5">{children}</div>
    </A.Content>
  )
}
