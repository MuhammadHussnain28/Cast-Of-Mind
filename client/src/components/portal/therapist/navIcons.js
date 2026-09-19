import { ProfileIcon, NotificationsIcon } from './TherapistPortalIcons'

/**
 * The global nav's icon lookup, kept out of the icon file.
 *
 * A module that exports components AND a plain object breaks fast refresh for
 * the whole file — the trap caught in StepIcons (2.5), ContactIcons (2.6),
 * CheckoutIcons (6.5) and the client rail (7.1). The rail and the phone list
 * both read this, so it cannot live inside either.
 */
export const THERAPIST_NAV_ICONS = {
  profile: ProfileIcon,
  notifications: NotificationsIcon,
}
