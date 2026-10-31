'use client'

import { useEffect, useState } from 'react'
import { Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import type { Profile } from '@/lib/types'
import { timeAgo } from '@/lib/utils'
import { ACCENT, EmptyPanel, PageHeader, SearchField, StatusPill } from '@/components/os/recruiter/primitives'

const ROLE_ACCENT: Record<string, string> = {
  candidate: ACCENT.green,
  recruiter: ACCENT.violet,
  admin: ACCENT.orange,
}
const ROLE_LABEL: Record<string, string> = {
  candidate: 'Candidat',
  recruiter: 'Recruteur',
  admin: 'Admin',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`)
        if (res.ok) setUsers((await res.json()) as Profile[])
      } catch { /* noop */ }
      setLoading(false)
    }
    fetchUsers()
  }, [search])

  const updateRole = async (userId: string, role: Profile['role']) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u))
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <PageHeader
        eyebrow="Comptes"
        title="Utilisateurs"
        subtitle={`${users.length} compte(s)`}
        actions={
          <SearchField value={search} onChange={setSearch} placeholder="Rechercher un utilisateur..." className="w-full sm:w-72" />
        }
      />

      {loading ? <PageLoader /> : users.length === 0 ? (
        <div className="osr-panel">
          <EmptyPanel icon={<Users size={26} />} title="Aucun utilisateur"
            description={search ? 'Aucun compte ne correspond à cette recherche.' : 'Aucun compte pour le moment.'} />
        </div>
      ) : (
        <div className="osr-table-wrap">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                {['Utilisateur', 'Email', 'Rôle', 'Inscription', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.full_name} src={user.avatar_url} avatarConfig={user.avatar_config} size={32} color="var(--osr-fill-3)" />
                      <span className="text-sm font-semibold text-white">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-[var(--kz-mute)]">{user.email}</td>
                  <td className="px-4 py-2.5">
                    <StatusPill accent={ROLE_ACCENT[user.role] ?? ACCENT.mute}>{ROLE_LABEL[user.role] ?? user.role}</StatusPill>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-[var(--kz-mute)]">{timeAgo(user.created_at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      {user.role !== 'admin' && (
                        <Button kind="soft" size="sm" icon={<Shield size={12} />} onClick={() => updateRole(user.id, 'admin')}>
                          Admin
                        </Button>
                      )}
                      {user.role !== 'candidate' && (
                        <Button kind="soft" size="sm" onClick={() => updateRole(user.id, 'candidate')}>
                          Candidat
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
