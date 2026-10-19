/**
 * How It Works — the full seven steps. Everything here is true and traceable to
 * the master spec; sections cited per step.
 *
 * TWO THINGS DELIBERATELY NOT SAID:
 *  - The zero-match fallback. §15 returns every therapist silently when nothing
 *    overlaps, by explicit client decision. Explaining that here would broadcast
 *    the message they chose not to show.
 *  - Any timing claim ("takes five minutes", "matched within a day"). No basis.
 */

export const intro = {
  heading: 'What actually happens?',
  lede: '" 7 steps , from your 1 answer ➡ 1 session. "',
  body: 'You can stop after any of them. Nothing below is a surprise, and nothing asks you to decide more than the one thing in front of you.',
}

export const phases = [
  {
    id: 'before',
    title: 'Before you pay anything',
    // The most reassuring fact on the page, delivered by the structure.
    note: 'The first three steps cost nothing and create no account.',
    surface: 'light',
    ground: 'bg-paper',
    steps: [
      {
        id: 'questionnaire',
        icon: 'questionnaire',
        title: 'Tell us what is going on',
        // §6 questionnaire fields, individual/couple branch, 3-4 concern tags.
        body: 'A short questionnaire. First whether you are coming on your own or as a couple, then where you are and a little about you and the part that matters most, three or four words for what you are dealing with, chosen from a fixed list.',
        note: 'No account, no card. You can close the tab at any point.',
      },
      {
        id: 'matching',
        icon: 'matching',
        title: 'We match on what you chose',
        // §15 tag overlap; gender preference sorts and never filters.
        body: 'Therapists tag themselves from that same fixed list when they apply, and we show you the ones whose areas overlap with yours. If you said you would rather see a male or a female therapist, those come first , the preference orders the list, it never shortens it.',
        note: 'Where you live and what time zone you are in never narrow the list.',
      },
      {
        id: 'choosing',
        icon: 'choosing',
        title: 'You choose your therapist',
        // §24.7: cards show photo, name, specialties, bio. §6: client selects.
        body: 'You see a photograph, a name, the areas they work in, and a few lines in their own words. Read as many as you like, take as long as you like, then pick one.',
        note: 'You choose nobody is assigned to you.',
      },
    ],
  },
  {
    id: 'signing-up',
    title: 'Signing up',
    note: 'One plan, one price, and you can leave whenever you want.',
    surface: 'light',
    ground: 'bg-mist',
    steps: [
      {
        id: 'subscribe',
        icon: 'subscribe',
        title: 'Subscribe',
        // §2 price and inclusions; §12 hosted checkout, no raw card details.
        body: '€200 a month. That is four therapy sessions, one a week over Video, and unlimited chat with your therapist in between. Payment happens on the payment provider’s own secure page.',
        note: 'Your card details never reach us. Cancel any time.',
      },
      {
        id: 'credentials',
        icon: 'credentials',
        title: 'Your login arrives',
        // §12: account created on webhook confirmation, never on redirect.
        body: 'Your account is created once the payment clears, and your login details come by email. Nothing exists before that moment there is no half-made account sitting somewhere waiting for you.',
        note: 'It goes to the address you gave in the questionnaire.',
      },
    ],
  },
  {
    id: 'working',
    title: 'Working together',
    note: 'From here it is just you and your therapist.',
    surface: 'light',
    ground: 'bg-paper',
    steps: [
      {
        id: 'first-message',
        icon: 'message',
        title: 'You write the first message',
        // §7.1 mandatory first message, free text by design.
        body: 'Before ordinary chat begins you write one message about what is going on for you, in your own words rather than into a form. It means your therapist arrives already knowing something, and you never have to start from a blank page in a session.',
        note: 'There is no right length and no right way to write it.',
      },
      {
        id: 'sessions',
        icon: 'sessions',
        title: 'You meet over Video, weekly',
        // §7.4 therapist schedules; times in the viewer's own zone; §7.1 offline.
        body: 'Your therapist schedules each session and the link appears in your chat. Times show in your own time zone, so there is no arithmetic to do, and the join button becomes active when the session starts.',
        note: 'Between sessions, if your therapist is offline your message waits. It is not lost.',
      },
    ],
  },
]

export const closing = {
  heading: 'That is the whole of it.',
  body: 'Seven steps, and the only one that costs anything is the fourth.',
}
