import { SPECIALTY_TAGS } from './specialtyTags.js'

/**
 * The 27 concern tags, grouped into five themes so the list can be scanned
 * rather than read.
 *
 * THESE ARE THE CANONICAL VALUES, byte-identical to specialtyTags.js, because
 * whatever is chosen here is stored and compared by the matching engine. The
 * home page has its own grouping with reworded prose labels ("Panic attacks",
 * "Trauma and/or abuse") — that is safe there because that page never sends a
 * tag anywhere, and it must never be copied into this file.
 *
 * The five theme names and their membership match the home page's, so someone
 * who read it meets the same organisation here.
 *
 * Every one of the 27 appears exactly once. A tag added to the master list must
 * be added to a group here too, or it silently disappears from the one screen
 * where it can actually be chosen — covered by the parity check in
 * server/test/constantsParity.test.js.
 */
export const CONCERN_THEMES = Object.freeze([
  {
    id: 'mood',
    name: 'Anxiety and low mood',
    tags: [
      'Anxiety',
      'Depression',
      'Panic Attacks',
      'Social Anxiety',
      'Stress',
      'Phobias',
      'Speech Anxiety',
    ],
  },
  {
    id: 'relationships',
    name: 'Relationships and family',
    tags: [
      'Relationship Issues',
      'Marriage Issues',
      'Divorce',
      'Family Issues',
      'Parenting',
      'Children & Teens',
    ],
  },
  {
    id: 'trauma',
    name: 'Trauma, abuse and grief',
    tags: ['Trauma and/or Abuse', 'Domestic Violence', 'Grief'],
  },
  {
    id: 'habits',
    name: 'Habits, body and daily life',
    tags: [
      'Addictions',
      'Eating & Food Disorders',
      'Weight Loss',
      'Sleep Issues or Insomnia',
      'Procrastination',
      'Anger Management',
    ],
  },
  {
    id: 'self',
    name: 'Self, work and neurodivergence',
    tags: [
      'Self Esteem',
      'Career Counselling',
      'ADHD & Attention Issues',
      'Autism',
      "Alzheimer's",
    ],
  },
])

/** Every grouped tag, flat — used by the parity check. */
export const GROUPED_CONCERN_TAGS = CONCERN_THEMES.flatMap((theme) => theme.tags)

/**
 * Themes filtered by a search term, keeping the group headings so context is
 * not lost mid-search. Empty term returns everything.
 */
export function filterThemes(term) {
  const needle = term.trim().toLowerCase()
  if (!needle) return CONCERN_THEMES

  return CONCERN_THEMES.map((theme) => ({
    ...theme,
    tags: theme.tags.filter((tag) => tag.toLowerCase().includes(needle)),
  })).filter((theme) => theme.tags.length > 0)
}

/** Sanity: the grouping must cover the master list exactly. */
export const COVERS_MASTER_LIST =
  GROUPED_CONCERN_TAGS.length === SPECIALTY_TAGS.length &&
  SPECIALTY_TAGS.every((tag) => GROUPED_CONCERN_TAGS.includes(tag))
