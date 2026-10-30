/**
 * Thème Quest : les décorations tropicales dessinées (soleil, palmes,
 * vagues…) de la DA cartoon n’ont pas leur place dans l’univers néon.
 * Les composants sont conservés (mêmes noms, mêmes props acceptées) mais ne
 * rendent rien : toutes les pages qui les utilisent s'allègent d'un coup.
 */
type DecorProps = Record<string, unknown>

export function Soleil(_props: DecorProps) { return null }
export function Palme(_props: DecorProps) { return null }
export function Montagne(_props: DecorProps) { return null }
export function Vague(_props: DecorProps) { return null }
export function Nuage(_props: DecorProps) { return null }
export function Hibiscus(_props: DecorProps) { return null }
export function Sparkle(_props: DecorProps) { return null }
