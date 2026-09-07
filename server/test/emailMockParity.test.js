import * as emailService from '../services/email/email.service.js';
import { createEmailServiceMock } from './emailServiceMock.js';

/**
 * Turns a confusing failure into a clear one.
 *
 * An ESM mock factory must provide every export of the module it replaces. When
 * a new sender is added to the email service and the shared mock is not updated,
 * four unrelated suites stop running with a link error that names a module none
 * of them are testing. This fails first, and says exactly what is missing.
 */
describe('the shared email service mock', () => {
  test('provides every export the real service has', () => {
    const mock = createEmailServiceMock();
    const missing = Object.keys(emailService).filter((name) => !(name in mock));

    expect(missing).toEqual([]);
  });

  test('provides nothing the real service does not have', () => {
    // A leftover in the mock is a sender that was removed and is still being
    // faked — the suites would keep passing against a function that is gone.
    const stale = Object.keys(createEmailServiceMock()).filter(
      (name) => !(name in emailService),
    );

    expect(stale).toEqual([]);
  });
});
