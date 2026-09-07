import { Person, Couple } from './QuestionnaireIcons'

/**
 * Whose question this is — one of you, or both of you.
 *
 * ONE FIGURE MEANS ONE PERSON, TWO FIGURES MEAN BOTH. The shared-account model
 * is carried by the mark rather than explained in a paragraph, and it reuses the
 * icons from the branch cards on screen 1, so the card someone chose at the
 * start becomes the mark they see all the way through.
 *
 * Shown on the couple branch only — on the individual path there is nothing to
 * distinguish, so nothing is added.
 *
 * It sits BELOW the heading. Above it, this would be an eyebrow.
 */
export default function ScopeMarker({ scope }) {
  const shared = scope === 'both'
  const IconComponent = shared ? Couple : Person

  return (
    <p className="mt-4 inline-flex items-center gap-2 font-body text-caption text-sage-deep">
      <IconComponent className="h-4 w-4 shrink-0" />
      {shared ? 'About both of you' : 'About one of you'}
    </p>
  )
}
