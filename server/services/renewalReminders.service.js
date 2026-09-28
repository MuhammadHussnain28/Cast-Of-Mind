import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { SUBSCRIPTION_STATUS, formatMinorUnits } from '../constants/payments.js';
import {
  LIFECYCLE_SWEEP_BATCH,
  RENEWAL_REMINDER_CUTOFF_MS,
  RENEWAL_REMINDER_LEAD_MS,
} from '../constants/subscriptionLifecycle.js';
import { formatInZone, isValidTimeZone } from '../utils/timezone.js';
import { sendRenewalReminderEmail } from './email/email.service.js';

// The pre-renewal reminder — chunk 11.6, §13's third transparency point.
//
// ONE PER CYCLE, NEVER TWICE. Each reminder is claimed in one atomic update
// keyed to the exact billing date before anything is sent, so two sweeps at once
// send one email. A renewal moves the billing date, which is a new cycle.
// A FAILED SEND IS RETRIED (developer's call): the claim is released, and the
// next sweep tries again — this email protects the client, and a Resend blip
// must not lose it. Logs carry ids only.

/** "Tuesday 14 October 2026", in the client's zone; labelled when it is UTC. */
function renewsOnText(instant, timeZone) {
  const zone = isValidTimeZone(timeZone) ? timeZone : 'UTC';
  const { date } = formatInZone(instant, zone, { locale: 'en-GB' });
  return zone === 'UTC' ? `${date} (UTC)` : date;
}

async function send(subscription) {
  const [user, profile] = await Promise.all([
    User.findById(subscription.clientId).select('email').lean(),
    ClientProfile.findOne({ userId: subscription.clientId }).select('name coupleData timezone').lean(),
  ]);
  if (!user?.email) throw new Error('no email address on file');

  await sendRenewalReminderEmail(user.email, {
    name: profile?.name ?? profile?.coupleData?.partner1?.name ?? null,
    renewsOn: renewsOnText(subscription.nextBillingDate, profile?.timezone),
    amount: formatMinorUnits(subscription.amount, subscription.currency),
  });
}

/** @returns {Promise<{ sent: number, failed: number }>} */
export async function sendRenewalReminders({ now = new Date() } = {}) {
  const due = await Subscription.find({
    status: SUBSCRIPTION_STATUS.ACTIVE,
    nextBillingDate: {
      $gt: new Date(now.getTime() + RENEWAL_REMINDER_CUTOFF_MS),
      $lte: new Date(now.getTime() + RENEWAL_REMINDER_LEAD_MS),
    },
    // Not yet reminded for THIS billing date.
    $expr: { $ne: ['$renewalReminderFor', '$nextBillingDate'] },
  })
    .select('_id clientId nextBillingDate amount currency')
    .sort({ nextBillingDate: 1 })
    .limit(LIFECYCLE_SWEEP_BATCH)
    .lean();

  const result = { sent: 0, failed: 0 };

  for (const subscription of due) {
    const billingDate = subscription.nextBillingDate;
    const claimed = await Subscription.updateOne(
      {
        _id: subscription._id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        nextBillingDate: billingDate,
        renewalReminderFor: { $ne: billingDate },
      },
      { $set: { renewalReminderFor: billingDate } },
    );
    if (claimed.modifiedCount === 0) continue; // another sweep has it, or it changed

    try {
      await send(subscription);
      result.sent += 1;
      console.log(`[reminders] ${subscription._id} renewal reminder sent`);
    } catch (error) {
      // Released only if still ours for this date, so the next sweep retries.
      await Subscription.updateOne(
        { _id: subscription._id, renewalReminderFor: billingDate },
        { $unset: { renewalReminderFor: 1 } },
      );
      result.failed += 1;
      console.error(`[reminders] ${subscription._id} renewal reminder failed (${error?.name ?? 'Error'}) — will retry`);
    }
  }

  return result;
}

export default sendRenewalReminders;
