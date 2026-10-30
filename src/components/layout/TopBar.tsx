'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Menu, LogOut, User, Settings, ChevronDown, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { Logo } from './Logo'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import { useNotifications, getNotifIcon } from '@/features/notifications/useNotifications'
import { KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { Menu as DropMenu, MenuTrigger, MenuContent, MenuItem, MenuLabel, MenuSeparator, Popover, PopoverTrigger, PopoverContent } from '@/components/ui/radix'

interface TopBarProps {
  searchPlaceholder?: string
  onSearch?: (q: string) => void
  onMenuClick?: () => void
}

export function TopBar({ searchPlaceholder, onSearch, onMenuClick }: TopBarProps) {
  const { profile, signOut } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(profile?.id)
  const router = useRouter()
  const [bellOpen, setBellOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleNotifClick = async (n: typeof notifications[0]) => {
    if (!n.read) await markRead(n.id)

    // Navigation contextuelle selon le type
    const data = n.data ?? {}
    if (n.type === 'application_status' && data.applicationId) {
      router.push('/candidate/applications')
    } else if (n.type === 'new_job_match' && data.jobId) {
      router.push(`/candidate/jobs/${data.jobId}`)
    } else if (n.type === 'interview_scheduled') {
      router.push('/candidate/agenda')
    }
    setBellOpen(false)
  }

  const profilePath = profile?.role === 'recruiter'
    ? '/recruiter/dashboard'
    : profile?.role === 'admin' ? '/admin/dashboard' : '/candidate/profile'

  const settingsPath = profile?.role === 'candidate' ? '/candidate/settings' : '/recruiter/dashboard'

  return (
    <header className="h-14 lg:h-[60px] px-4 os-glass !border-x-0 !border-t-0 !bg-[rgba(18,18,22,0.65)] flex items-center gap-3 shrink-0 z-10">
      {/* Hamburger mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] shrink-0"
      >
        <Menu size={16} />
      </button>

      <div className="lg:hidden"><Logo size={24} /></div>
      <div className="hidden lg:block"><Logo size={28} /></div>

      {/* Barre de recherche */}
      {searchPlaceholder && (
        <div className="hidden sm:flex flex-1 max-w-sm">
          <div className="flex items-center gap-2 h-9 px-3.5 bg-white/[0.07] border border-white/[0.06] rounded-full text-sm text-[var(--kz-mute)] w-full transition-all focus-within:bg-white/[0.1] focus-within:ring-4 focus-within:ring-[#0A84FF]/25">
            <Search size={15} className="shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none placeholder:text-[var(--kz-mute)] text-[var(--kz-text)]"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* ── Notifications (Radix Popover) ── */}
        {profile && (
          <Popover open={bellOpen} onOpenChange={setBellOpen}>
            <PopoverTrigger
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lues` : 'Notifications'}
              className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.07] hover:bg-white/[0.14] transition-colors outline-none focus-visible:ring-4 focus-visible:ring-[#0A84FF]/40"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#FF453A] text-[9px] font-semibold text-white flex items-center justify-center px-1 ring-2 ring-[#050507]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-[340px] max-w-[calc(100vw-24px)]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#FF453A] text-white">{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#0A84FF] hover:brightness-125 transition">
                    <CheckCheck size={13} /> Tout lire
                  </button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[380px] p-1.5">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell size={28} className="mx-auto mb-2 text-[var(--kz-mute)] opacity-50" />
                    <p className="text-sm text-[var(--kz-text)]">Aucune notification</p>
                    <p className="text-xs text-[var(--kz-mute)] mt-1">Les mises à jour de tes candidatures apparaîtront ici</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button key={n.id} onClick={() => handleNotifClick(n)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.07] transition-colors">
                      <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-base shrink-0 bg-white/[0.08]">
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[13px] font-semibold truncate ${n.read ? 'text-[var(--kz-mute)]' : 'text-white'}`}>{n.title}</span>
                          <span className="text-[10px] text-[var(--kz-mute)] shrink-0">{timeAgo(n.created_at)}</span>
                        </div>
                        <p className="text-xs text-[var(--kz-mute)] mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#0A84FF] shrink-0 mt-2" />}
                    </button>
                  ))
                )}
              </div>
              {profile?.role === 'candidate' && (
                <div className="px-4 py-2.5 border-t border-white/[0.06]">
                  <Link href="/candidate/settings" onClick={() => setBellOpen(false)}
                    className="text-xs font-semibold text-[#0A84FF] hover:underline">
                    Gérer les préférences de notifications
                  </Link>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* ── Profil (Radix DropdownMenu) ── */}
        {profile && (
          <DropMenu>
            <MenuTrigger
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-white/[0.07] hover:bg-white/[0.12] transition-colors outline-none focus-visible:ring-4 focus-visible:ring-[#0A84FF]/40"
            >
              <Avatar name={profile.full_name} src={profile.avatar_url} avatarConfig={profile.avatar_config} size={28} color={KZ.orangeSoft} badge />
              <span className="hidden md:block text-sm font-semibold text-[var(--kz-ink)] max-w-[100px] truncate">
                {profile.full_name.split(' ')[0]}
              </span>
              <ChevronDown size={13} className="hidden md:block text-[var(--kz-mute)]" />
            </MenuTrigger>
            <MenuContent className="w-60">
              <MenuLabel>
                <div className="text-[13px] font-semibold text-white truncate">{profile.full_name}</div>
                <div className="text-[11px] text-[var(--kz-mute)] truncate">{profile.email}</div>
              </MenuLabel>
              <MenuSeparator />
              <MenuItem onSelect={() => router.push(profilePath)}><User size={15} />Mon profil</MenuItem>
              <MenuItem onSelect={() => router.push(settingsPath)}><Settings size={15} />Paramètres</MenuItem>
              <MenuSeparator />
              <MenuItem destructive onSelect={handleSignOut}><LogOut size={15} />Se déconnecter</MenuItem>
            </MenuContent>
          </DropMenu>
        )}
      </div>
    </header>
  )
}
