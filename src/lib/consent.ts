export interface ConsentState {
  necessary: true
  analytics: boolean
  marketing: boolean
}

export const CONSENT_KEY = 'kazajob_consent_v2'
export const CONSENT_EVENT = 'kazajob:consent-change'

export function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ConsentState
  } catch {
    return null
  }
}

export function writeConsent(state: ConsentState): void {
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(state)) } catch { /* storage off */ }
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }))
}

export function hasConsent(category: 'analytics' | 'marketing'): boolean {
  const state = readConsent()
  return state?.[category] ?? false
}
