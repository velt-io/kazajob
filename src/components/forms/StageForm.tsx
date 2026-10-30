'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { REUNION_CITIES, JOB_SECTORS, KZ, INTERNSHIP_LEVELS, INTERNSHIP_DURATIONS } from '@/lib/constants'
import type { Job } from '@/lib/types'

const CITY_OPTIONS    = REUNION_CITIES.map((c) => ({ value: c, label: c }))
const SECTOR_OPTIONS  = JOB_SECTORS.map((s) => ({ value: s, label: s }))
const LEVEL_OPTIONS   = [{ value: '', label: 'Non spécifié' }, ...INTERNSHIP_LEVELS.map((l) => ({ value: l.id, label: l.label }))]
const DURATION_OPTIONS = [{ value: '', label: 'Non spécifié' }, ...INTERNSHIP_DURATIONS.map((d) => ({ value: d, label: d }))]

interface StageFormProps {
  job?: Partial<Job>
  companyId?: string
  onSuccess?: () => void
}

export function StageForm({ job, companyId, onSuccess }: StageFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(job?.title ?? '')
  const [description, setDescription] = useState(job?.description ?? '')
  const [requirements, setRequirements] = useState(job?.requirements ?? '')
  const [missions, setMissions] = useState((job as Record<string, unknown>)?.missions as string ?? '')
  const [location, setLocation] = useState(job?.location ?? '')
  const [sector, setSector] = useState(job?.sector ?? '')
  const [remote, setRemote] = useState(job?.remote ?? false)
  const [level, setLevel] = useState((job as Record<string, unknown>)?.required_level as string ?? '')
  const [startDate, setStartDate] = useState((job as Record<string, unknown>)?.start_date as string ?? '')
  const [duration, setDuration] = useState((job as Record<string, unknown>)?.internship_duration as string ?? '')
  const [paid, setPaid] = useState<'true' | 'false' | ''>((job as Record<string, unknown>)?.internship_paid === true ? 'true' : (job as Record<string, unknown>)?.internship_paid === false ? 'false' : '')
  const [compensation, setCompensation] = useState((job as Record<string, unknown>)?.internship_compensation as string ?? '')
  const [agreementRequired, setAgreementRequired] = useState((job as Record<string, unknown>)?.internship_agreement_required as boolean ?? true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !location) {
      setError('Titre, description et localisation sont obligatoires.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      title,
      description,
      missions: missions || null,
      requirements: requirements || null,
      location,
      job_type: 'Stage',
      sector: sector || null,
      remote,
      salary_min: null,
      salary_max: null,
      required_level: level || null,
      start_date: startDate || null,
      internship_duration: duration || null,
      internship_paid: paid === '' ? null : paid === 'true',
      internship_compensation: compensation || null,
      internship_agreement_required: agreementRequired,
    }

    const res = job?.id
      ? await fetch(`/api/recruiter/jobs/${job.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/recruiter/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, companyId: companyId ?? null }),
        })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Une erreur est survenue. Réessayez.')
      setSaving(false)
      return
    }

    setSaving(false)
    onSuccess?.()
    router.push('/recruiter/stages')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Informations principales */}
      <div className="kz-card p-5 bg-white">
        <h2 className="text-sm font-extrabold text-[#1A1410] mb-4">Informations principales</h2>
        <div className="flex flex-col gap-4">
          <Input
            label="Titre du stage"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Stage Développeur Web"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Ville" options={[{ value: '', label: 'Choisir une ville' }, ...CITY_OPTIONS]}
              value={location} onChange={(e) => setLocation(e.target.value)} required />
            <Select label="Secteur" options={[{ value: '', label: 'Choisir un secteur' }, ...SECTOR_OPTIONS]}
              value={sector} onChange={(e) => setSector(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Niveau d'études" options={LEVEL_OPTIONS}
              value={level} onChange={(e) => setLevel(e.target.value)} />
            <label className="flex items-center gap-2 text-sm font-medium text-[#2A2018] cursor-pointer mt-5">
              <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} className="w-4 h-4" />
              Télétravail possible
            </label>
          </div>
          <Textarea label="Description du stage" value={description}
            onChange={(e) => setDescription(e.target.value)} rows={5}
            placeholder="Présentez l'entreprise, le contexte du stage et l'environnement de travail..." required />
          <Textarea label="Missions" value={missions}
            onChange={(e) => setMissions(e.target.value)} rows={4}
            placeholder="Détaillez les principales missions confiées au stagiaire..." />
          <Textarea label="Profil recherché" value={requirements}
            onChange={(e) => setRequirements(e.target.value)} rows={3}
            placeholder="Formation, compétences ou qualités attendues..." />
        </div>
      </div>

      {/* Conditions du stage */}
      <div className="kz-card p-5 bg-white">
        <h2 className="text-sm font-extrabold text-[#1A1410] mb-4">Conditions du stage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Durée" options={DURATION_OPTIONS}
            value={duration} onChange={(e) => setDuration(e.target.value)} />
          <Input label="Date de début souhaitée" type="text"
            value={startDate} onChange={(e) => setStartDate(e.target.value)}
            placeholder="Ex : Septembre 2026" />
          <Select
            label="Gratification"
            options={[{ value: '', label: 'Non précisé' }, { value: 'true', label: 'Stage gratifié' }, { value: 'false', label: 'Stage non gratifié' }]}
            value={paid}
            onChange={(e) => setPaid(e.target.value as 'true' | 'false' | '')}
          />
          {paid === 'true' && (
            <Input label="Montant / détails" value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
              placeholder="Ex : 590€/mois" />
          )}
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-[#2A2018] cursor-pointer mt-4">
          <input type="checkbox" checked={agreementRequired} onChange={(e) => setAgreementRequired(e.target.checked)} className="w-4 h-4" />
          Convention de stage obligatoire
        </label>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <div className="flex gap-3">
        <Button type="button" kind="outline" full onClick={() => router.push('/recruiter/stages')}>
          Annuler
        </Button>
        <Button type="submit" kind="primary" full loading={saving}>
          {job?.id ? 'Enregistrer' : 'Publier le stage'}
        </Button>
      </div>
    </form>
  )
}
