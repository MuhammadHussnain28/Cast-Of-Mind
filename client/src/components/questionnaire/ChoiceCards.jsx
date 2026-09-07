import { cx } from '../../lib/cx'
import { Person, Couple, Check } from './QuestionnaireIcons'

const ICONS = { person: Person, couple: Couple }

/**
 * The branch question, as two things you can look at rather than a dropdown.
 *
 * A real radio group underneath: the input is visually hidden, not replaced, so
 * arrow keys move between options, the group is announced as a group, and it
 * submits like a form control. Same approach as the Checkbox and Radio
 * primitives from chunk 0.4.
 *
 * SELECTION IS NEVER COLOUR ALONE (WCAG 1.4.1) — the chosen card also gains a
 * check and a heavier border.
 */
export default function ChoiceCards({ name, options, value, onChange, error }) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={`${name}-label`}
      aria-invalid={error ? 'true' : undefined}
      className="grid gap-4 sm:grid-cols-2"
    >
      {options.map((option) => {
        const IconComponent = ICONS[option.icon]
        const selected = value === option.value

        return (
          <label
            key={option.value}
            className={cx(
              'group relative flex cursor-pointer flex-col gap-4 rounded-2xl border p-6 transition-colors duration-200',
              // The real radio is sr-only, so its own :focus-visible outline
              // would be drawn on a clipped 1px box and be invisible. The ring
              // is carried by the card instead, using the same token.
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)]',
              // Elevation is declared once — a border, never a border plus a
              // shadow. The selected state changes the border and the ground.
              selected
                ? 'border-sage-deep bg-sage/12'
                : 'border-ink/50 bg-paper hover:bg-mist',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />

            <span
              className={cx(
                'inline-flex h-14 w-14 items-center justify-center rounded-2xl ring-1 transition-colors duration-200',
                selected ? 'bg-paper ring-sage-deep/40' : 'bg-mist ring-sage/30',
              )}
            >
              <IconComponent
                className={cx('h-7 w-7', selected ? 'text-sage-deep' : 'text-sage')}
              />
            </span>

            <span>
              <span className="block font-body text-subsection font-medium text-ink">
                {option.label}
              </span>
              <span className="mt-1 block font-body text-ui text-ink/70">{option.blurb}</span>
            </span>

            {selected && (
              <span
                aria-hidden="true"
                className="absolute right-5 top-5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sage-deep"
              >
                <Check className="h-4 w-4 text-paper" />
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}
