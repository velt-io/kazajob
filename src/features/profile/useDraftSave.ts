import { useCallback, useEffect, useRef, useState } from 'react'

export type DraftSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface UseDraftSaveOptions {
  debounceMs?: number
  enabled?: boolean
}

export function useDraftSave<T>(
  data: T,
  save: (data: T) => Promise<{ ok: boolean; error?: string }>,
  { debounceMs = 2000, enabled = true }: UseDraftSaveOptions = {},
) {
  const [status, setStatus] = useState<DraftSaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const savingRef = useRef(false)
  const dataRef = useRef(data)
  dataRef.current = data

  const flush = useCallback(async () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (savingRef.current) return
    savingRef.current = true
    setStatus('saving')
    const { ok, error: err } = await save(dataRef.current)
    savingRef.current = false
    if (ok) { setStatus('saved'); setError(null) }
    else { setStatus('error'); setError(err ?? 'Erreur d\'enregistrement') }
  }, [save])

  useEffect(() => {
    if (!enabled) return
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setStatus('dirty')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { flush() }, debounceMs)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enabled, debounceMs])

  return { status, error, flush, isDirty: status === 'dirty' || status === 'saving' }
}

export const DRAFT_SAVE_LABEL: Record<DraftSaveStatus, string> = {
  idle:    '',
  dirty:   'Modifications non enregistrées',
  saving:  'Enregistrement en cours…',
  saved:   'Toutes les modifications sont enregistrées',
  error:   'Erreur d\'enregistrement',
}
