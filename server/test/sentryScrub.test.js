import { scrubEvent, redactText, stripQuery } from '../utils/sentryScrub.js';
import { initSentry, isSentryEnabled, PRIVATE_DATA_COLLECTION } from '../config/sentry.js';

// 12.4: what reaches Sentry must carry no therapy content, no credentials and no
// identity beyond a pseudonymous id. Every value below is fake.
const MESSAGE_TEXT = 'I have not slept properly since the funeral';
const JOURNAL_TEXT = 'Today I could not get out of bed at all';
const NOTE_TEXT = 'Client presents with intrusive thoughts';
const PASSWORD = 'correct-horse-battery-staple';
const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.c2lnbmF0dXJl';
const EMAIL = 'rosa.client@example.com';
const USER_ID = '64b7f0c2a1b2c3d4e5f60718';

const SENSITIVE = [MESSAGE_TEXT, JOURNAL_TEXT, NOTE_TEXT, PASSWORD, JWT, EMAIL, 'Rosa Client', 'reset-token-abc', '10.1.2.3'];

const realisticEvent = () => ({
  event_id: 'abc',
  level: 'error',
  environment: 'production',
  message: `Failed for ${EMAIL}`,
  exception: {
    values: [
      {
        type: 'ValidationError',
        // How Mongoose echoes a value back — the shape that leaks journal text.
        value: `Journal validation failed: text: Path \`text\` (\`${JOURNAL_TEXT}\`) is longer than the maximum allowed length. Bearer ${JWT}`,
        stacktrace: {
          frames: [
            {
              filename: '/app/services/journal.service.js',
              lineno: 42,
              function: 'createEntry',
              context_line: 'const entry = await Journal.create(payload);',
              vars: { payload: { text: JOURNAL_TEXT }, password: PASSWORD },
            },
          ],
        },
      },
    ],
  },
  request: {
    method: 'POST',
    url: 'https://api.castofmind.com/api/v1/admin/clients?q=Rosa%20Client&token=reset-token-abc',
    query_string: 'q=Rosa+Client',
    data: { text: MESSAGE_TEXT, password: PASSWORD },
    cookies: { refreshToken: JWT },
    headers: {
      Authorization: `Bearer ${JWT}`,
      Cookie: `refreshToken=${JWT}`,
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/json',
      'X-Forwarded-For': '10.1.2.3',
    },
  },
  user: { id: USER_ID, email: EMAIL, username: 'Rosa Client', ip_address: '10.1.2.3' },
  extra: { body: { text: NOTE_TEXT }, password: PASSWORD, note: NOTE_TEXT, safeCount: 3 },
  contexts: { react: { componentStack: `at Journal (text: "${JOURNAL_TEXT}")` }, runtime: { version: 'v22' } },
  tags: { email: EMAIL, route: '/api/v1/client/journal' },
  breadcrumbs: [{ category: 'console', message: `GET /api/v1/admin/clients?q=Rosa ${EMAIL}` }],
});

describe('scrubEvent (12.4)', () => {
  const scrubbed = () => scrubEvent(realisticEvent());

  it('NOTHING SENSITIVE SURVIVES ANYWHERE IN THE EVENT', () => {
    const out = JSON.stringify(scrubbed());
    for (const value of SENSITIVE) expect(out).not.toContain(value);
  });

  it('drops the request body, cookies, query string and every non-allowlisted header', () => {
    const { request } = scrubbed();
    expect(request).not.toHaveProperty('data');
    expect(request).not.toHaveProperty('cookies');
    expect(request).not.toHaveProperty('query_string');
    expect(Object.keys(request.headers).sort()).toEqual(['Content-Type', 'User-Agent']);
    expect(request.url).toBe('https://api.castofmind.com/api/v1/admin/clients');
  });

  it('keeps ONLY the pseudonymous user id', () => {
    expect(scrubbed().user).toEqual({ id: USER_ID });
  });

  it('drops a user that is not a MongoDB id at all', () => {
    expect(scrubEvent({ user: { id: EMAIL } })).not.toHaveProperty('user');
    expect(scrubEvent({ user: { email: EMAIL } })).not.toHaveProperty('user');
  });

  it('removes stack-frame variables but keeps the frame itself', () => {
    const [frame] = scrubbed().exception.values[0].stacktrace.frames;
    expect(frame).not.toHaveProperty('vars');
    expect(frame).toMatchObject({ filename: '/app/services/journal.service.js', lineno: 42, function: 'createEntry' });
  });

  it('keeps the error type and enough of the message to debug', () => {
    const [entry] = scrubbed().exception.values;
    expect(entry.type).toBe('ValidationError');
    expect(entry.value).toContain('Journal validation failed');
    expect(entry.value).toContain('[redacted]');
  });

  it('removes sensitive keys from extra, contexts and tags, keeping harmless ones', () => {
    const out = scrubbed();
    expect(out.extra).toEqual({ safeCount: 3 });
    expect(out.tags).toEqual({ route: '/api/v1/client/journal' });
    expect(out.contexts.runtime).toEqual({ version: 'v22' });
  });

  it('sends no breadcrumbs from the server', () => {
    expect(scrubbed().breadcrumbs).toEqual([]);
  });

  it('caps a long message', () => {
    expect(redactText('x'.repeat(1000)).length).toBeLessThanOrEqual(301);
  });

  it('strips query strings and fragments', () => {
    expect(stripQuery('/reset-password?token=abc#x')).toBe('/reset-password');
  });
});

describe('the Sentry client itself (12.4)', () => {
  it('stays OFF outside production — the test suite sends nothing', () => {
    expect(initSentry()).toBe(false);
    expect(isSentryEnabled()).toBe(false);
  });

  it('tells the SDK to collect no personal data at all', () => {
    expect(PRIVATE_DATA_COLLECTION).toMatchObject({
      userInfo: false,
      cookies: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
      httpHeaders: { response: false },
    });
    expect(PRIVATE_DATA_COLLECTION.httpHeaders.request.allow).toEqual(['user-agent', 'content-type']);
  });
});
