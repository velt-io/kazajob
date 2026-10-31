'use client'

import { useEffect, useState } from 'react'
import { Database, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/radix'
import { ACCENT, EmptyPanel, IconButton, PageHeader, SkeletonList, StatusPill, Widget, tint } from '@/components/os/recruiter/primitives'

interface BackupResult {
  ok:          boolean
  fileId?:     string
  fileName?:   string
  webViewLink?:string
  sizeHuman?:  string
  exportedAt?: string
  summary?:    string
  error?:      string
}

interface BackupFile {
  id:          string
  name:        string
  createdTime: string
  size:        string
}

export default function AdminBackupPage() {
  const [running, setRunning]   = useState(false)
  const [result, setResult]     = useState<BackupResult | null>(null)
  const [backups, setBackups]   = useState<BackupFile[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const fetchList = async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/admin/backup')
      const data = await res.json()
      setBackups(data.backups ?? [])
    } catch {
      setBackups([])
    }
    setLoadingList(false)
  }

  useEffect(() => { fetchList() }, [])

  const handleBackup = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST' })
      const data = await res.json()
      setResult(data)
      if (data.ok) await fetchList()
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' })
    }
    setRunning(false)
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <PageHeader eyebrow="Données" title="Sauvegarde" subtitle="Export JSON de toutes les tables vers Google Drive" />

      {/* Déclencher un backup */}
      <Widget title="Sauvegarde manuelle" icon={<Database size={14} />} accent={ACCENT.blue} className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
          <p className="text-[13px] text-[var(--kz-mute)] leading-relaxed">
            Export de toutes les tables + upload sur Google Drive.<br />
            Le cron automatique tourne chaque dimanche à 06h00 (heure Réunion).
          </p>
          <Button
            kind="primary"
            size="md"
            icon={<Database size={15} />}
            loading={running}
            onClick={handleBackup}
            className="shrink-0"
          >
            Sauvegarder maintenant
          </Button>
        </div>

        {/* Résultat */}
        {result && (
          <div
            role="status"
            className="os-pop mt-4 p-4 rounded-[16px]"
            style={{
              background: tint(result.ok ? ACCENT.green : ACCENT.red, 12),
              border: `1px solid color-mix(in srgb, ${result.ok ? ACCENT.green : ACCENT.red} 35%, transparent)`,
            }}
          >
            <div className="flex items-start gap-3">
              {result.ok
                ? <CheckCircle size={18} className="shrink-0 mt-0.5 text-[var(--kz-green)]" />
                : <AlertCircle size={18} className="shrink-0 mt-0.5 text-[var(--osr-red)]" />}
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-white">
                  {result.ok ? 'Sauvegarde réussie' : 'Erreur de sauvegarde'}
                </div>
                {result.ok ? (
                  <div className="text-[12px] text-[var(--kz-mute)] mt-1 space-y-0.5">
                    <div className="break-all">Fichier : <strong className="text-[var(--kz-text)]">{result.fileName}</strong> ({result.sizeHuman})</div>
                    <div>Exporté : {result.exportedAt ? new Date(result.exportedAt).toLocaleString('fr-FR') : '—'}</div>
                  </div>
                ) : (
                  <div className="text-[12px] text-[var(--osr-red)] mt-1 break-words">{result.error}</div>
                )}
                {result.webViewLink && (
                  <a
                    href={result.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] font-semibold mt-2 text-[var(--kz-blue)] hover:brightness-125"
                  >
                    <ExternalLink size={11} /> Ouvrir dans Drive
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </Widget>

      {/* Configuration requise */}
      <Widget title="Configuration requise" sub="Variables d'environnement" className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { key: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Supabase → Settings → API' },
            { key: 'GOOGLE_SERVICE_ACCOUNT_EMAIL', desc: 'Google Cloud → IAM → Service Accounts' },
            { key: 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY', desc: 'Clé JSON → private_key' },
            { key: 'GOOGLE_DRIVE_FOLDER_ID', desc: 'ID depuis l\'URL Drive' },
            { key: 'CRON_SECRET', desc: 'Secret aléatoire pour cron Vercel' },
          ].map(v => (
            <div key={v.key} className="osr-inset px-3 py-2.5 min-w-0">
              <code className="font-mono font-semibold text-white text-[11px] break-all">{v.key}</code>
              <div className="text-[11px] text-[var(--kz-mute)] mt-0.5">{v.desc}</div>
            </div>
          ))}
        </div>
      </Widget>

      {/* Historique */}
      <Widget
        title="Historique des sauvegardes"
        icon={<Clock size={14} />}
        accent={ACCENT.indigo}
        bodyClassName="px-2 pb-2"
        action={
          <IconButton label="Actualiser" onClick={fetchList}>
            <RefreshCw size={14} className={loadingList ? 'animate-spin' : ''} />
          </IconButton>
        }
      >
        {loadingList ? (
          <SkeletonList rows={3} height={44} className="px-3 pb-2" />
        ) : backups.length === 0 ? (
          <EmptyPanel
            icon={<Database size={24} />}
            title="Aucune sauvegarde"
            description={process.env.NODE_ENV === 'development'
              ? 'Aucun backup trouvé. Vérifiez les variables d\'env Google.'
              : 'Aucune sauvegarde pour le moment.'}
            accent={ACCENT.indigo}
            className="py-10"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2.5 uppercase">Fichier</th>
                  <th className="text-left px-3 py-2.5 uppercase hidden sm:table-cell">Date</th>
                  <th className="text-right px-3 py-2.5 uppercase">Taille</th>
                  <th className="px-3 py-2.5"><span className="sr-only">Ouvrir</span></th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b, i) => (
                  <tr key={b.id}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {i === 0 && <StatusPill accent={ACCENT.green} live>Dernier</StatusPill>}
                        <span className="text-[12px] font-mono text-[var(--kz-text)] truncate max-w-[220px]">{b.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-[var(--kz-mute)] hidden sm:table-cell">
                      {new Date(b.createdTime).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-right text-[var(--kz-mute)]">
                      {b.size ? `${Math.round(parseInt(b.size) / 1024)} KB` : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <Tooltip content="Ouvrir dans Drive">
                        <a
                          href={`https://drive.google.com/file/d/${b.id}/view`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Ouvrir ${b.name} dans Drive`}
                          className="osr-icon-btn"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Widget>
    </div>
  )
}
