import { jest } from '@jest/globals';

/**
 * One place that knows every export of the email service.
 *
 * WHY THIS EXISTS. An ESM mock factory must provide EVERY export of the module
 * it replaces, or importing `app.js` fails to link — and the failure surfaces as
 * four unrelated suites refusing to run, with a message about a module none of
 * them are testing. That has now happened three times (chunks 1.5, 2.6 and 4.3)
 * and each time it cost more to diagnose than to fix.
 *
 * Adding a real export now means editing this file only, and
 * `emailMockParity.test.js` fails with a clear message naming the missing
 * function if that is forgotten.
 *
 * Pass overrides for whatever the suite needs to observe:
 *
 *   jest.unstable_mockModule(
 *     '../services/email/email.service.js',
 *     () => createEmailServiceMock({ sendEmail: mySpy }),
 *   );
 */
export function createEmailServiceMock(overrides = {}) {
  return {
    sendEmail: jest.fn(async () => ({ delivered: true })),
    sendPasswordResetEmail: jest.fn(async () => ({ delivered: true })),
    sendTherapistWelcomeEmail: jest.fn(async () => ({ delivered: true })),
    sendClientWelcomeEmail: jest.fn(async () => ({ delivered: true })),
    sendSessionReminderEmail: jest.fn(async () => ({ delivered: true })),
    sendEmailChangedNotices: jest.fn(async () => ({
      oldAddressNotified: true,
      newAddressNotified: true,
    })),
    ...overrides,
  };
}
