import { escapeHtml } from '../services/email/templates/escapeHtml.js';
import { sessionReminderEmail } from '../services/email/templates/sessionReminder.js';
import { clientWelcomeEmail } from '../services/email/templates/clientWelcome.js';
import { therapistWelcomeEmail } from '../services/email/templates/therapistWelcome.js';
import { therapistNewClientEmail } from '../services/email/templates/therapistNewClient.js';
import {
  emailChangedOldAddress,
  emailChangedNewAddress,
} from '../services/email/templates/emailChanged.js';

// 12.3 (C4): names are free text. Unescaped, this becomes a real link inside a
// genuine Cast of Minds email.
const INJECTED = '<a href="https://evil.example/file">View your client file</a>';
const RAW_LINK = '<a href="https://evil.example';
const ESCAPED = '&lt;a href=&quot;https://evil.example/file&quot;&gt;';

const expectNeutralised = (html) => {
  expect(html).not.toContain(RAW_LINK);
  expect(html).toContain(ESCAPED);
};

describe('escapeHtml', () => {
  it('escapes all five HTML-significant characters', () => {
    expect(escapeHtml(`<b>"Tom" & 'Jo'</b>`)).toBe(
      '&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jo&#39;&lt;/b&gt;',
    );
  });

  it('leaves ordinary names untouched', () => {
    expect(escapeHtml('Marta and Joris')).toBe('Marta and Joris');
  });
});

describe('templates escape user text in their HTML (12.3)', () => {
  it('SESSION REMINDER: a client name cannot inject a link into the THERAPIST\'s email', () => {
    const { html } = sessionReminderEmail({
      recipient: 'therapist',
      kind: 'day',
      when: 'Thursday 14 August at 15:00 (London time)',
      otherName: INJECTED,
      meetingLink: 'https://zoom.us/j/123456789',
      portalUrl: 'https://castofmind.com/portal',
    });
    expectNeutralised(html);
    // The real meeting link still renders as a link.
    expect(html).toContain('<a href="https://zoom.us/j/123456789"');
  });

  it('session reminder: a therapist name is escaped in the client\'s email', () => {
    const { html } = sessionReminderEmail({
      recipient: 'client',
      kind: 'hour',
      when: 'Thursday 14 August at 10:00 (New York time)',
      otherName: INJECTED,
      portalUrl: 'https://castofmind.com/portal/sessions',
    });
    expectNeutralised(html);
  });

  it('session reminder: a quote in a meeting link cannot break out of href', () => {
    const { html } = sessionReminderEmail({
      recipient: 'therapist',
      kind: 'day',
      when: 'Thursday',
      otherName: 'Rosa',
      meetingLink: 'https://zoom.us/j/1"onmouseover="alert(1)',
      portalUrl: 'https://castofmind.com/portal',
    });
    expect(html).not.toContain('"onmouseover="');
    expect(html).toContain('&quot;onmouseover=&quot;');
  });

  it('client welcome: name, email and therapist name are escaped', () => {
    const { html, text } = clientWelcomeEmail({
      name: INJECTED,
      email: 'rosa@example.com',
      temporaryPassword: 'Abc23456Defg789h',
      loginUrl: 'https://castofmind.com/login',
      therapistName: INJECTED,
    });
    expectNeutralised(html);
    // Credentials still render exactly; the plain-text part is untouched.
    expect(html).toContain('Abc23456Defg789h');
    expect(text).toContain('Abc23456Defg789h');
  });

  it('therapist welcome: the first name is escaped', () => {
    const { html } = therapistWelcomeEmail({
      firstName: INJECTED,
      loginUrl: 'https://castofmind.com/login',
    });
    expectNeutralised(html);
  });

  it('email changed: both notices escape the first name', () => {
    for (const build of [emailChangedOldAddress, emailChangedNewAddress]) {
      const { html } = build({
        firstName: INJECTED,
        newEmail: 'new@example.com',
        loginUrl: 'https://castofmind.com/login',
      });
      expectNeutralised(html);
      expect(html).toContain('new@example.com');
    }
  });

  it('therapist new client: escapes therapist and client names, carries login link', () => {
    const { html, text } = therapistNewClientEmail({
      firstName: INJECTED,
      clientName: INJECTED,
      loginUrl: 'https://castofmind.com/login',
    });
    expectNeutralised(html);
    expect(html).toContain('https://castofmind.com/login');
    expect(html).toContain('Sign in to Cast of Minds');
    expect(text).toContain('https://castofmind.com/login');
  });

  it('an ordinary name renders exactly as before', () => {
    const { html } = therapistWelcomeEmail({
      firstName: 'Priya',
      loginUrl: 'https://castofmind.com/login',
    });
    expect(html).toContain('Hello Priya,');
  });
});
