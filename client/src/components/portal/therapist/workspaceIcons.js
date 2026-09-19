import {
  ChatIcon,
  WorksheetsIcon,
  JournalIcon,
  SessionsIcon,
} from '../client/ClientPortalIcons'
import { InfoIcon } from './TherapistPortalIcons'

/**
 * The workspace tabs' icon lookup, kept out of both icon files.
 *
 * A module exporting components AND a plain object breaks fast refresh for the
 * whole file — the trap caught in StepIcons (2.5), ContactIcons (2.6),
 * CheckoutIcons (6.5) and the portal navs (7.1, 8.1).
 *
 * THE FOUR FEATURE ICONS ARE THE CLIENT PORTAL'S OWN, deliberately. Chat,
 * worksheets, sessions and the journal are the same four things on both sides
 * of the relationship, and drawing a second set would make the same feature
 * look like two different features to the two people using it.
 */
export const WORKSPACE_TAB_ICONS = {
  chat: ChatIcon,
  worksheets: WorksheetsIcon,
  sessions: SessionsIcon,
  journal: JournalIcon,
  info: InfoIcon,
}
