/**
 * Shared look for text-like form controls.
 * Kept out of the component files so Vite's fast refresh keeps working
 * (a file that exports components must not also export plain values).
 *
 * The 16px text size is deliberate: iOS Safari zooms the page when a focused
 * input uses text smaller than 16px.
 *
 * Border and placeholder opacities are set by measurement, not by eye:
 * ink/50 border = 3.3:1 against paper (WCAG 1.4.11 needs 3:1 for control
 * edges), and ink/60 placeholder = 4.6:1 (needs 4.5:1). Lighter values were
 * tried first and failed.
 */
export const controlBase =
  'w-full min-h-11 rounded-xl border bg-paper px-4 py-2.5 font-body text-ui text-ink-deep ' +
  'transition-colors duration-200 ease-out placeholder:text-ink/60 ' +
  'disabled:cursor-not-allowed disabled:bg-mist disabled:opacity-60'

export const controlBorder = (invalid) =>
  invalid ? 'border-clay hover:border-clay' : 'border-ink/50 hover:border-ink/70'
