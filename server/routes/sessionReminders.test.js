import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { createEmailServiceMock } from '../test/emailServiceMock.js';

const sendSessionReminderEmail = jest.fn(async () => ({ delivered: true }));
jest.unstable_mockModule('../services/email/email.service.js', () =>
  createEmailServiceMock({ sendSessionReminderEmail }),
);

const { User } = await import('../models/User.js');
const { Booking } = await import('../models/Booking.js');
const { Subscription } = await import('../models/Subscription.js');
const { ClientProfile } = await import('../models/ClientProfile.js');
const { TherapistProfile } = await import('../models/TherapistProfile.js');
const { Session } = await import('../models/Session.js');
const { hashPassword } = await import('../utils/password.js');
const { ROLES, USER_STATUS } = await import('../constants/roles.js');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_AMOUNT_MINOR, BOOKING_STATUS } = await import(
  '../constants/payments.js'
);
const { SESSION_STATUS } = await import('../constants/sessions.js');
const { runSessionReminders, dueKinds, whenText } = await import(
  '../services/sessionReminders.service.js'
);
const { sessionReminderEmail } = await import('../services/email/templates/sessionReminder.js');
// The sweep completes overdue sessions, which runs in a transaction.
const { startMemoryReplSet, stopMemoryMongo } = await import('../test/mongoMemory.js');

// Session reminders — §16, chunk 9.6. A reminder goes out only if the session
// was on the calendar that far ahead, and never twice.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const LINK = 'https://zoom.us/j/81234567890?pwd=secret';

const ids = {};
let booking;

const callsTo = (recipient) =>
  sendSessionReminderEmail.mock.calls.filter(([, payload]) => payload.recipient === recipient);

// A session, with the time it was booked stated outright.
const sessionFixture = ({ at, bookedAhead = 7 * DAY, ...extra }) =>
  Session.create({
    bookingId: booking._id,
    scheduledAt: at,
    timeSetAt: new Date(at.getTime() - bookedAhead),
    zoomLink: LINK,
    ...extra,
  });

beforeAll(async () => {
  await startMemoryReplSet();
  await Promise.all([User.init(), Booking.init(), Subscription.init(), Session.init()]);

  const passwordHash = await hashPassword('correct-horse-battery-staple');
  const make = async (key, email, role) => {
    const user = await User.create({ email, passwordHash, role, status: USER_STATUS.ACTIVE });
    ids[key] = user._id;
  };
  await make('client', 'sr96-client@example.com', ROLES.CLIENT);
  await make('therapist', 'sr96-therapist@example.com', ROLES.THERAPIST);

  await ClientProfile.create({
    userId: ids.client,
    type: 'individual',
    name: 'Marta',
    age: 34,
    gender: 'female',
    country: 'United States',
    city: 'New York',
    relationshipStatus: 'Single',
    concernTags: ['Anxiety'],
    therapistGenderPreference: 'no_preference',
    timezone: 'America/New_York',
  });

  await TherapistProfile.create({
    userId: ids.therapist,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName: 'Priya',
    lastName: 'Raman',
    gender: 'female',
    dateOfBirth: new Date('1985-04-02'),
    photoUrl: 'https://res.cloudinary.com/test/image/upload/p.jpg',
    streetAddress: '1 Quay Street',
    city: 'London',
    stateProvince: 'Greater London',
    zipPostal: 'EC1',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    therapistType: 'Clinical Psychologist',
    credentialType: 'Diploma/Degree',
    credentialInitials: 'PhD',
    yearsExperience: 9,
    educationSummary: 'Doctorate in clinical psychology.',
    currentWorkSituation: 'Private practice.',
    languages: ['English'],
    specialtyTags: ['Anxiety', 'Depression', 'Stress'],
    treatmentOrientations: ['CBT'],
    bio: 'Works with anxiety and low mood.',
    licensingStatus: 'Licensed in the UK.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    workingHours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: false, start: '', end: '' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '13:00' },
      saturday: { enabled: false, start: '', end: '' },
      sunday: { enabled: false, start: '', end: '' },
    },
    certificateUrl1: 'https://res.cloudinary.com/test/image/authenticated/c1',
    certificatePublicId1: 'cast-of-mind/certs/c1',
  });

  booking = await Booking.create({ clientId: ids.client, therapistId: ids.therapist });
}, 180000);

afterAll(async () => {
  await stopMemoryMongo();
}, 120000);

beforeEach(async () => {
  sendSessionReminderEmail.mockClear();
  await Session.deleteMany({});
  await Subscription.deleteMany({});
  await Subscription.create({
    bookingId: booking._id,
    clientId: ids.client,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    amount: SUBSCRIPTION_AMOUNT_MINOR,
    startDate: new Date(Date.now() - 5 * DAY),
    currentPeriodEnd: new Date(Date.now() + 25 * DAY),
    nextBillingDate: new Date(Date.now() + 25 * DAY),
  });
  await Promise.all([
    Booking.updateOne({ _id: booking._id }, { $set: { status: BOOKING_STATUS.ACTIVE } }),
    User.updateMany({}, { $set: { status: USER_STATUS.ACTIVE } }),
    ClientProfile.updateOne({ userId: ids.client }, { $set: { timezone: 'America/New_York' } }),
  ]);
});

describe('the two reminders', () => {
  it('sends the day reminder to both people, each in their own clock', async () => {
    const at = new Date(Date.now() + 3 * DAY);
    await sessionFixture({ at });

    const { sent } = await runSessionReminders({ now: new Date(at.getTime() - DAY + MINUTE) });

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ kind: 'day', client: true, therapist: true });
    expect(sendSessionReminderEmail).toHaveBeenCalledTimes(2);

    const [clientCall] = callsTo('client');
    const [therapistCall] = callsTo('therapist');
    expect(clientCall[0]).toBe('sr96-client@example.com');
    expect(clientCall[1].when).toContain('(New York time)');
    expect(clientCall[1].otherName).toBe('Dr. Priya Raman');
    expect(therapistCall[0]).toBe('sr96-therapist@example.com');
    expect(therapistCall[1].when).toContain('(London time)');
    expect(therapistCall[1].otherName).toBe('Marta');
  });

  it('sends the hour reminder, and both over the life of one session', async () => {
    const at = new Date(Date.now() + 3 * DAY);
    await sessionFixture({ at });

    await runSessionReminders({ now: new Date(at.getTime() - DAY + MINUTE) });
    await runSessionReminders({ now: new Date(at.getTime() - 59 * MINUTE) });

    expect(sendSessionReminderEmail).toHaveBeenCalledTimes(4);
    const stored = await Session.findOne({});
    expect(stored.reminders.day.clientSentAt).toBeInstanceOf(Date);
    expect(stored.reminders.hour.therapistSentAt).toBeInstanceOf(Date);
  });

  it('the client gets no meeting link; the therapist does', async () => {
    const at = new Date(Date.now() + 3 * DAY);
    await sessionFixture({ at });
    await runSessionReminders({ now: new Date(at.getTime() - DAY + MINUTE) });

    expect(callsTo('client')[0][1].meetingLink).toBeUndefined();
    expect(callsTo('therapist')[0][1].meetingLink).toBe(LINK);
  });
});

describe('NEVER TWICE', () => {
  it('a second sweep in the same window sends nothing', async () => {
    const at = new Date(Date.now() + 3 * DAY);
    await sessionFixture({ at });
    const now = new Date(at.getTime() - DAY + MINUTE);

    await runSessionReminders({ now });
    sendSessionReminderEmail.mockClear();
    const second = await runSessionReminders({ now: new Date(now.getTime() + 5 * MINUTE) });

    expect(second.sent).toHaveLength(0);
    expect(sendSessionReminderEmail).not.toHaveBeenCalled();
  });

  it('THREE SWEEPS AT ONCE send one reminder between them', async () => {
    const at = new Date(Date.now() + 3 * DAY);
    await sessionFixture({ at });
    const now = new Date(at.getTime() - DAY + MINUTE);

    const runs = await Promise.all([
      runSessionReminders({ now }),
      runSessionReminders({ now }),
      runSessionReminders({ now }),
    ]);

    expect(runs.reduce((total, run) => total + run.sent.length, 0)).toBe(1);
    expect(sendSessionReminderEmail).toHaveBeenCalledTimes(2);
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * THE SHORT-NOTICE RULES — the developer's two cases.
 * ──────────────────────────────────────────────────────────────────────────── */

describe('a session booked at short notice', () => {
  it('BOOKED 3 HOURS AHEAD: no day reminder, but the hour one still goes', async () => {
    const at = new Date(Date.now() + 3 * HOUR);
    await sessionFixture({ at, bookedAhead: 3 * HOUR });

    // The day reminder's window has long opened, and it must stay shut.
    const early = await runSessionReminders({ now: new Date(at.getTime() - 2.5 * HOUR) });
    expect(early.sent).toHaveLength(0);

    const late = await runSessionReminders({ now: new Date(at.getTime() - 45 * MINUTE) });
    expect(late.sent).toHaveLength(1);
    expect(late.sent[0].kind).toBe('hour');
    expect(sendSessionReminderEmail).toHaveBeenCalledTimes(2);
  });

  it('BOOKED 15 MINUTES AHEAD: neither reminder is ever sent', async () => {
    const at = new Date(Date.now() + 15 * MINUTE);
    await sessionFixture({ at, bookedAhead: 15 * MINUTE });

    for (const before of [14 * MINUTE, 12 * MINUTE, 11 * MINUTE]) {
      const run = await runSessionReminders({ now: new Date(at.getTime() - before) });
      expect(run.sent).toHaveLength(0);
    }
    expect(sendSessionReminderEmail).not.toHaveBeenCalled();
  });

  it('booked 50 minutes ahead: no hour reminder either', async () => {
    const at = new Date(Date.now() + 50 * MINUTE);
    await sessionFixture({ at, bookedAhead: 50 * MINUTE });

    const run = await runSessionReminders({ now: new Date(at.getTime() - 40 * MINUTE) });
    expect(run.sent).toHaveLength(0);
  });

  it('a moved session is reminded about again, and a move to short notice is not', async () => {
    const at = new Date(Date.now() + 3 * DAY);
    const therapySession = await sessionFixture({ at });
    await runSessionReminders({ now: new Date(at.getTime() - DAY + MINUTE) });
    sendSessionReminderEmail.mockClear();

    // Moved a day later, with plenty of notice: the day reminder is due again.
    const moved = new Date(at.getTime() + DAY);
    await Session.updateOne(
      { _id: therapySession._id },
      { $set: { scheduledAt: moved, timeSetAt: new Date(moved.getTime() - 2 * DAY) } },
    );
    const again = await runSessionReminders({ now: new Date(moved.getTime() - DAY + MINUTE) });
    expect(again.sent).toHaveLength(1);

    // Moved again, this time to twenty minutes away: nothing more goes out.
    sendSessionReminderEmail.mockClear();
    const soon = new Date(Date.now() + 20 * MINUTE);
    await Session.updateOne(
      { _id: therapySession._id },
      { $set: { scheduledAt: soon, timeSetAt: new Date(soon.getTime() - 20 * MINUTE) } },
    );
    const short = await runSessionReminders({ now: new Date(soon.getTime() - 15 * MINUTE) });
    expect(short.sent).toHaveLength(0);
    expect(sendSessionReminderEmail).not.toHaveBeenCalled();
  });

  it('the windows open and close exactly where they should', () => {
    const at = new Date('2026-07-15T14:00:00Z');
    const booked = (ahead) => ({ scheduledAt: at, timeSetAt: new Date(at.getTime() - ahead) });
    const at24 = new Date(at.getTime() - DAY);

    expect(dueKinds(booked(7 * DAY), at24)).toEqual(['day']);
    expect(dueKinds(booked(7 * DAY), new Date(at24.getTime() - MINUTE))).toEqual([]);
    expect(dueKinds(booked(7 * DAY), new Date(at.getTime() - 2 * HOUR))).toEqual([]);
    expect(dueKinds(booked(7 * DAY), new Date(at.getTime() - HOUR))).toEqual(['hour']);
    expect(dueKinds(booked(7 * DAY), new Date(at.getTime() - 10 * MINUTE))).toEqual([]);
  });
});

describe('who is never reminded', () => {
  const at = () => new Date(Date.now() + 3 * DAY);
  const sweep = (when) => runSessionReminders({ now: new Date(when.getTime() - DAY + MINUTE) });

  it('a cancelled session', async () => {
    const when = at();
    await sessionFixture({ at: when, status: SESSION_STATUS.CANCELLED, cancelledAt: new Date() });
    expect((await sweep(when)).sent).toHaveLength(0);
    expect(sendSessionReminderEmail).not.toHaveBeenCalled();
  });

  it('a client whose subscription has ended', async () => {
    const when = at();
    await sessionFixture({ at: when });
    await Subscription.updateOne({}, { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } });

    const run = await sweep(when);
    expect(run.sent[0].skipped).toBe('subscription');
    expect(sendSessionReminderEmail).not.toHaveBeenCalled();
  });

  it('but a past-due client is reminded — §13 keeps their access', async () => {
    const when = at();
    await sessionFixture({ at: when });
    await Subscription.updateOne({}, { $set: { status: SUBSCRIPTION_STATUS.PAST_DUE } });

    expect((await sweep(when)).sent[0]).toMatchObject({ client: true, therapist: true });
  });

  it('and so is one who cancelled but is still inside the period they paid for', async () => {
    const when = at();
    await sessionFixture({ at: when });
    await Subscription.updateOne(
      {},
      { $set: { status: SUBSCRIPTION_STATUS.CANCELLED, cancelledAt: new Date() } },
    );

    expect((await sweep(when)).sent[0]).toMatchObject({ client: true, therapist: true });
  });

  it('a booking that has ended', async () => {
    const when = at();
    await sessionFixture({ at: when });
    await Booking.updateOne({ _id: booking._id }, { $set: { status: BOOKING_STATUS.ENDED } });

    expect((await sweep(when)).sent[0].skipped).toBe('booking');
    expect(sendSessionReminderEmail).not.toHaveBeenCalled();
  });

  it('a deactivated account, on either side', async () => {
    const when = at();
    await sessionFixture({ at: when });
    await User.updateOne({ _id: ids.client }, { $set: { status: USER_STATUS.INACTIVE } });

    expect((await sweep(when)).sent[0].skipped).toBe('account');
    expect(sendSessionReminderEmail).not.toHaveBeenCalled();
  });
});

describe('the time each person reads', () => {
  it('is their own clock, from one stored instant', () => {
    const at = new Date('2026-07-15T14:00:00Z');
    expect(whenText(at, 'Europe/London')).toBe('Wednesday, 15 July 2026 at 15:00 (London time)');
    expect(whenText(at, 'America/New_York')).toBe('Wednesday, 15 July 2026 at 10:00 (New York time)');
  });

  it("falls back to the therapist's clock, named, when the client has no zone yet", async () => {
    const at = new Date(Date.now() + 3 * DAY);
    await ClientProfile.updateOne({ userId: ids.client }, { $unset: { timezone: 1 } });
    await sessionFixture({ at });

    await runSessionReminders({ now: new Date(at.getTime() - DAY + MINUTE) });
    expect(callsTo('client')[0][1].when).toContain('(London time)');
  });
});

describe('the email itself', () => {
  const build = (recipient, kind) =>
    sessionReminderEmail({
      recipient,
      kind,
      when: 'Wednesday, 15 July 2026 at 10:00 (New York time)',
      otherName: 'Dr. Priya Raman',
      meetingLink: recipient === 'therapist' ? LINK : undefined,
      portalUrl: 'https://castofmind.com/portal/sessions',
    });

  it('never states how long a session lasts', () => {
    for (const recipient of ['client', 'therapist']) {
      for (const kind of ['day', 'hour']) {
        const { subject, text, html } = build(recipient, kind);
        expect(`${subject} ${text} ${html}`).not.toMatch(/\b60\b|minutes|\bhours?\b|duration|lasts/i);
      }
    }
  });

  it("carries no link in the client's copy, and the link in the therapist's", () => {
    expect(build('client', 'day').text).not.toContain('zoom.us');
    expect(build('client', 'day').html).not.toContain('zoom.us');
    expect(build('therapist', 'day').text).toContain(LINK);
  });

  it('says the time and who it is with, and ships a plain-text part', () => {
    const { subject, text } = build('client', 'day');
    expect(subject).toBe('Your session with Dr. Priya Raman is tomorrow');
    expect(text).toContain('Wednesday, 15 July 2026 at 10:00 (New York time)');
    expect(text.length).toBeGreaterThan(50);
  });
});

describe('what the sweep writes to the log', () => {
  it('names the session and the role, never an address or a link', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const at = new Date(Date.now() + 3 * DAY);
    const therapySession = await sessionFixture({ at });

    await runSessionReminders({ now: new Date(at.getTime() - DAY + MINUTE) });

    const lines = log.mock.calls.map((call) => call.join(' ')).join(' | ');
    expect(lines).toContain(String(therapySession._id));
    expect(lines).toMatch(/sent to the client/);
    expect(lines).toMatch(/sent to the therapist/);
    expect(lines).not.toContain('@example.com');
    expect(lines).not.toContain('zoom.us');
    log.mockRestore();
  });
});

describe('the sweep also keeps the counter right (from 9.5)', () => {
  it('completes a session nobody has looked at', async () => {
    await sessionFixture({ at: new Date(Date.now() - 2 * HOUR) });

    const { completed } = await runSessionReminders();

    expect(completed).toBe(1);
    expect((await Session.findOne({})).status).toBe(SESSION_STATUS.COMPLETED);
    expect((await Subscription.findOne({})).sessionsRemaining).toBe(3);
  });
});
