import { BuildNote, ScreenHeader } from '../../../components/portal/client/ScreenScaffold'
import { SCREENS } from '../../../data/clientPortalContent'
import { Text } from '../../../components/ui'

/**
 * §7.2. The worksheet loop, drawn as the sequence it is.
 *
 * Numbered markers are earned here: the craft rules ban section numbering
 * unless the order carries information the reader needs, and here it does —
 * download before you fill it in, fill it in before you upload it back. The
 * same exception §24.7 grants the How It Works page.
 *
 * The steps sit on one continuous rail rather than in four cards, so the loop
 * reads as a path with a beginning and an end.
 */
export default function Worksheets() {
  const screen = SCREENS.worksheets

  return (
    <section>
      <ScreenHeader title={screen.title} lead={screen.lead} />

      <ol className="relative mt-8 space-y-6 border-l border-sage/40 pl-8">
        {screen.steps.map((step, index) => (
          <li key={step.label} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[2.3125rem] top-0 flex size-[1.625rem] items-center justify-center rounded-full bg-paper font-body text-caption font-medium text-sage-deep ring-1 ring-sage-deep"
            >
              {index + 1}
            </span>

            <p className="font-body text-ui font-medium text-ink">{step.label}</p>
            <Text size="caption" tone="muted" className="mt-1 max-w-measure">
              {step.detail}
            </Text>
          </li>
        ))}
      </ol>

      <BuildNote>
        This tab is not switched on yet. When it is, anything your therapist has
        set for you will appear here on its own.
      </BuildNote>
    </section>
  )
}
