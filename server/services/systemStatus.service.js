import mongoose from 'mongoose';
import { Resend } from 'resend';
import env from '../config/env.js';
import { stripe, isStripeConfigured, isTestKey } from '../config/stripe.js';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import {
  HEALTH_CACHE_MS,
  HEALTH_STATUS,
  PROBE_TIMEOUT_MS,
  RESEND_TEST_DOMAIN,
  SERVICE_DETAIL,
  SERVICE_KEY,
  SERVICE_STATE,
} from '../constants/systemStatus.js';

// One check per service, run only when the admin dashboard asks — never on a timer.
// Fixed states out; vendor error text is never returned or logged (name only).

class ProbeError extends Error {
  constructor(name) {
    super(name);
    this.name = name;
  }
}

function withTimeout(promise) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new ProbeError('ProbeTimeout')), PROBE_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function probe(key, check) {
  const started = performance.now();

  try {
    const { state, detail = null } = await withTimeout(check());
    const latencyMs =
      state === SERVICE_STATE.NOT_CONFIGURED ? null : Math.round(performance.now() - started);
    return { key, state, detail, latencyMs };
  } catch (error) {
    // Cloudinary rejects with a plain object, so there may be no name at all.
    console.warn(`[system-status] ${key} check failed: ${error?.name || 'UnknownError'}`);
    return { key, state: SERVICE_STATE.DOWN, detail: null, latencyMs: null };
  }
}

async function checkDatabase() {
  if (mongoose.connection.readyState !== 1) throw new ProbeError('DatabaseNotConnected');
  await mongoose.connection.db.command({ ping: 1 });
  return { state: SERVICE_STATE.OPERATIONAL };
}

async function checkPayments() {
  if (!isStripeConfigured) return { state: SERVICE_STATE.NOT_CONFIGURED };
  await stripe.accounts.retrieve();
  return {
    state: SERVICE_STATE.OPERATIONAL,
    detail: isTestKey ? SERVICE_DETAIL.TEST_MODE : SERVICE_DETAIL.LIVE_MODE,
  };
}

/** "Cast of Mind <noreply@castofmind.com>" → "castofmind.com" */
export function senderDomain(from) {
  const match = /@([^>\s]+)>?\s*$/.exec(from ?? '');
  return match ? match[1].toLowerCase() : null;
}

async function checkEmail() {
  if (!env.resendApiKey) return { state: SERVICE_STATE.NOT_CONFIGURED };

  const domain = senderDomain(env.emailFrom);
  const onTestSender = domain === RESEND_TEST_DOMAIN;

  // Read at call time, so a changed key is picked up without a restart.
  const { data, error } = await new Resend(env.resendApiKey).domains.list();

  if (error) {
    // The key sends but may not read domains — reachable, not verifiable.
    if (error.name === 'restricted_api_key') {
      return onTestSender
        ? { state: SERVICE_STATE.ATTENTION, detail: SERVICE_DETAIL.TEST_SENDER }
        : { state: SERVICE_STATE.OPERATIONAL, detail: SERVICE_DETAIL.SENDING_KEY };
    }
    throw new ProbeError(`Resend_${error.name || 'error'}`);
  }

  if (onTestSender) return { state: SERVICE_STATE.ATTENTION, detail: SERVICE_DETAIL.TEST_SENDER };

  const verified = (data?.data ?? []).some(
    (entry) =>
      entry.status === 'verified' &&
      (domain === entry.name || domain?.endsWith(`.${entry.name}`)),
  );

  return verified
    ? { state: SERVICE_STATE.OPERATIONAL, detail: SERVICE_DETAIL.DOMAIN_VERIFIED }
    : { state: SERVICE_STATE.ATTENTION, detail: SERVICE_DETAIL.DOMAIN_UNVERIFIED };
}

async function checkStorage() {
  if (!isCloudinaryConfigured) return { state: SERVICE_STATE.NOT_CONFIGURED };
  const result = await cloudinary.api.ping();
  if (result?.status !== 'ok') throw new ProbeError('CloudinaryNotOk');
  return { state: SERVICE_STATE.OPERATIONAL };
}

export async function getSystemStatus() {
  const services = await Promise.all([
    probe(SERVICE_KEY.DATABASE, checkDatabase),
    probe(SERVICE_KEY.PAYMENTS, checkPayments),
    probe(SERVICE_KEY.EMAIL, checkEmail),
    probe(SERVICE_KEY.STORAGE, checkStorage),
  ]);

  return { checkedAt: new Date().toISOString(), services };
}

// ---------------------------------------------------------------------------
// Public health check (12.4) — database, email and storage, states only.
// ---------------------------------------------------------------------------

let healthCache = null; // { at, promise }

function overall({ database, email, storage }) {
  if (database !== SERVICE_STATE.OPERATIONAL) return HEALTH_STATUS.DOWN;
  const fine = [SERVICE_STATE.OPERATIONAL, SERVICE_STATE.NOT_CONFIGURED];
  return fine.includes(email) && fine.includes(storage) ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.DEGRADED;
}

async function runHealthProbes() {
  const [database, email, storage] = await Promise.all([
    probe(SERVICE_KEY.DATABASE, checkDatabase),
    probe(SERVICE_KEY.EMAIL, checkEmail),
    probe(SERVICE_KEY.STORAGE, checkStorage),
  ]);
  const services = { database: database.state, email: email.state, storage: storage.state };
  return { status: overall(services), checkedAt: new Date().toISOString(), services };
}

/** Cached for HEALTH_CACHE_MS; callers arriving together share one probe run. */
export function getHealthStatus(now = Date.now()) {
  if (!healthCache || now - healthCache.at >= HEALTH_CACHE_MS) {
    healthCache = { at: now, promise: runHealthProbes() };
  }
  return healthCache.promise;
}

/** Tests only. */
export function resetHealthCache() {
  healthCache = null;
}
