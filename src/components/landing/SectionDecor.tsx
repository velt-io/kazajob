/**
 * Calque décoratif d'arrière-plan (style BD/cartoon) pour une section.
 *
 * Déposez vos images dans /public/assets/img/deco/ (ex: comment.png).
 * Si le fichier n'existe pas encore, RIEN ne s'affiche (pas d'erreur) —
 * la section garde simplement son fond de couleur actuel.
 *
 * Usage : mettre la <section> en `relative overflow-hidden`, placer
 * <SectionDecor src="/assets/img/deco/xxx.png" /> juste après l'ouverture,
 * et s'assurer que le contenu a un z-index supérieur (ex: relative z-10).
 */
/** Thème Quest : pas d'images décoratives de fond (conservé pour compatibilité). */
export function SectionDecor(_props: { src: string; opacity?: number; size?: string; position?: string; className?: string }) {
  return null
}
