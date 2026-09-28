import mongoose from 'mongoose';
import { Subscription } from '../models/Subscription.js';
import { PaymentEvent } from '../models/PaymentEvent.js';
import { PAYMENT_PLATFORM } from '../constants/payments.js';
import { STRIPE_EVENT } from '../constants/webhooks.js';
import {
  BILLING_HISTORY_PAGE_SIZE,
  BILLING_HISTORY_SCAN_LIMIT,
  BILLING_STATUS,
} from '../constants/subscriptionLifecycle.js';
import { invoiceLinePeriod } from './subscriptionRenewal.service.js';

// A client's billing history — chunk 11.5, from the `paymentEvents` ledger.
//
// FOUND FROM THE TOKEN, never the request: only this client's subscriptions.
// ONE ROW PER INVOICE: Stripe's retries are grouped, so a card that failed twice
// and then paid reads as one paid month, not three alarming lines.
// DERIVED FIELDS ONLY leave this file — never the raw payload, a Stripe id, or
// anything about the card.

const HISTORY_EVENTS = [STRIPE_EVENT.INVOICE_PAID, STRIPE_EVENT.INVOICE_FAILED];

const fromSeconds = (seconds) => (Number.isInteger(seconds) ? new Date(seconds * 1000) : null);

/** Group ledger rows by invoice, newest first. */
function groupByInvoice(events) {
  const invoices = new Map();

  for (const event of events) {
    const invoice = event.rawPayload?.data?.object;
    if (!invoice?.id) continue;
    const entry = invoices.get(invoice.id) ?? { paid: null, failed: [], first: event, invoice };
    if (event.eventType === STRIPE_EVENT.INVOICE_PAID) entry.paid = { event, invoice };
    else entry.failed.push({ event, invoice });
    invoices.set(invoice.id, entry);
  }

  return [...invoices.values()].map(({ paid, failed, first }) => {
    const settled = paid ?? failed.reduce((a, b) => (b.event.receivedAt > a.event.receivedAt ? b : a));
    const { invoice, event } = settled;
    const period = invoiceLinePeriod(invoice);
    const date = paid
      ? fromSeconds(invoice.status_transitions?.paid_at) ?? event.receivedAt
      : event.receivedAt;
    const amount = paid ? invoice.amount_paid : invoice.amount_due;

    return {
      // Our ledger row's id — never Stripe's invoice id.
      id: String(first._id),
      date,
      status: paid ? BILLING_STATUS.PAID : BILLING_STATUS.FAILED,
      retried: Boolean(paid) && failed.length > 0,
      amount: Number.isInteger(amount) ? amount : event.amount ?? null,
      currency: invoice.currency ? String(invoice.currency).toUpperCase() : event.currency ?? null,
      periodStart: period?.start ?? null,
      periodEnd: period?.end ?? null,
    };
  });
}

/**
 * @returns {Promise<{ data: object[], meta: { page: number, pageSize: number, total: number, hasMore: boolean } }>}
 */
export async function getBillingHistory(userId, { page = 1 } = {}) {
  const clientId = new mongoose.Types.ObjectId(String(userId));
  const subscriptions = await Subscription.find({ clientId }).select('_id platformSubscriptionId').lean();
  const platformIds = subscriptions.map((s) => s.platformSubscriptionId).filter((id) => typeof id === 'string');

  const events = await PaymentEvent.find({
    platform: PAYMENT_PLATFORM.STRIPE,
    eventType: { $in: HISTORY_EVENTS },
    $or: [
      { platformSubscriptionId: { $in: platformIds } },
      // Rows linked before 11.5 stored the platform id.
      { subscriptionId: { $in: subscriptions.map((s) => s._id) } },
      { clientId },
    ],
  })
    .select('+rawPayload eventType amount currency receivedAt')
    .sort({ receivedAt: -1 })
    .limit(BILLING_HISTORY_SCAN_LIMIT)
    .lean();

  const rows = groupByInvoice(events).sort((a, b) => new Date(b.date) - new Date(a.date));
  const start = (page - 1) * BILLING_HISTORY_PAGE_SIZE;

  return {
    data: rows.slice(start, start + BILLING_HISTORY_PAGE_SIZE),
    meta: {
      page,
      pageSize: BILLING_HISTORY_PAGE_SIZE,
      total: rows.length,
      hasMore: start + BILLING_HISTORY_PAGE_SIZE < rows.length,
    },
  };
}

export default getBillingHistory;
