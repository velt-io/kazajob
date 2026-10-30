'use client'
/**
 * KAZAJOB — Composants Radix UI habillés au thème « OS 2027 ».
 * Radix apporte l'accessibilité (clavier, focus, ARIA, lecteurs d'écran) ;
 * ce fichier n'ajoute que le style. API volontairement proche de Radix.
 */
import { type ComponentProps, type ReactNode } from 'react'
import { Accordion as A, DropdownMenu as DM, Popover as P, Switch as S, Tabs as T, Tooltip as TT } from 'radix-ui'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const SURFACE = 'os-glass !bg-[rgba(28,28,34,0.9)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)]'
const ANIM = 'data-[state=open]:animate-[os-pop_0.22s_cubic-bezier(0.2,0.8,0.2,1)]'

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
        'data-[highlighted]:bg-[#0A84FF] data-[highlighted]:text-white [&_svg]:shrink-0',
        destructive ? 'text-[#FF6961] data-[highlighted]:bg-[#FF453A]' : 'text-[var(--kz-ink)]',
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
  return <DM.Separator className="h-px bg-white/[0.08] my-1 mx-2" />
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
          className="z-[60] px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-white bg-[rgba(40,40,46,0.95)] border border-white/10 backdrop-blur-xl shadow-lg data-[state=delayed-open]:animate-[os-pop_0.18s_ease-out]">
          {content}
        </TT.Content>
      </TT.Portal>
    </TT.Root>
  )
}

// ── Onglets (contrôle segmenté) ───────────────────────────────
export const Tabs = T.Root
export const TabsContent = T.Content

export function TabsList({ className, ...props }: ComponentProps<typeof T.List>) {
  return <T.List className={cn('inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.07] border border-white/[0.06] max-w-full overflow-x-auto', className)} {...props} />
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap text-[var(--kz-mute)] transition-all duration-200 outline-none',
        'hover:text-white data-[state=active]:bg-white/[0.16] data-[state=active]:text-white data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]',
        'focus-visible:ring-4 focus-visible:ring-[#0A84FF]/40',
        className,
      )}
      {...props}
    />
  )
}

// ── Interrupteur iOS ──────────────────────────────────────────
export function Switch({ className, ...props }: ComponentProps<typeof S.Root>) {
  return (
    <S.Root
      className={cn(
        'relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 outline-none',
        'bg-white/[0.16] data-[state=checked]:bg-[#30D158] focus-visible:ring-4 focus-visible:ring-[#0A84FF]/40 disabled:opacity-50',
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
  return <A.Item className={cn('rounded-[20px] os-glass overflow-hidden transition-colors data-[state=open]:bg-white/[0.06]', className)} {...props} />
}

export function AccordionTrigger({ className, children, ...props }: ComponentProps<typeof A.Trigger>) {
  return (
    <A.Header>
      <A.Trigger
        className={cn('group w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[var(--kz-ink)] outline-none focus-visible:ring-4 focus-visible:ring-[#0A84FF]/40', className)}
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
