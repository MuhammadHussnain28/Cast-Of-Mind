import {
  AccountIcon,
  ChatIcon,
  JournalIcon,
  SessionsIcon,
  WorksheetsIcon,
} from './ClientPortalIcons'

/**
 * The nav's icon lookup, kept out of the icon file.
 *
 * A module that exports components AND a plain object breaks fast refresh for
 * the whole file — the trap caught in StepIcons (2.5), ContactIcons (2.6) and
 * CheckoutIcons (6.5). Both the rail and the tab bar read this, so it also
 * cannot simply live inside one of them.
 */
export const NAV_ICONS = {
  chat: ChatIcon,
  worksheets: WorksheetsIcon,
  journal: JournalIcon,
  sessions: SessionsIcon,
  account: AccountIcon,
}
