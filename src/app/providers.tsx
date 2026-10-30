'use client'

import { SessionProvider } from 'next-auth/react'
import { TooltipProvider } from '@/components/ui/radix'
import { QuestToast } from '@/components/quest/QuestToast'
import { MagicLayer } from '@/components/quest/MagicLayer'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider delayDuration={250}>
        {children}
        <QuestToast />
        <MagicLayer />
      </TooltipProvider>
    </SessionProvider>
  )
}
