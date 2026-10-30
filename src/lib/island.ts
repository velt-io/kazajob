/**
 * « Dynamic Island » : notification éphémère en haut de l'écran (thème OS 2027).
 * Utilisable partout (hooks, pages) sans dépendance React : on émet un événement,
 * le composant <DynamicIsland /> monté dans les providers l'affiche.
 */
export type IslandTone = 'success' | 'love' | 'info' | 'warning'

export interface IslandMessage {
  title: string
  subtitle?: string
  tone?: IslandTone
}

export const ISLAND_EVENT = 'kz:island'

export function island(message: IslandMessage) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<IslandMessage>(ISLAND_EVENT, { detail: message }))
}
