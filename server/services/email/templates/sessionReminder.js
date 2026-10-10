import { baseTemplate, baseTextTemplate } from './base.js';
import { escapeHtml } from './escapeHtml.js';
import { BRAND } from '../../../constants/email.js';

// The session reminder — master spec §16, chunk 9.6.
//
// NO SESSION LENGTH, EVER (developer's instruction, 2026-09-19): how long a
// session runs is agreed between the two of them, so nothing here implies one.
// The client's email carries NO meeting link: they get it on their Sessions page
// when Join opens (9.4), and a link in an inbox outlives the session it belongs
// to. The therapist's email does carry it — it is their own room.

const forClient = (kind, otherName) =>
  kind === 'day'
    ? `Your session with ${otherName} is tomorrow`
    : `Your session with ${otherName} is coming up`;

const forTherapist = (kind, otherName) =>
  kind === 'day' ? `Your session with ${otherName} is tomorrow` : `Your session with ${otherName} is coming up`;

/**
 * @param {object} options
 * @param {'client'|'therapist'} options.recipient
 * @param {'day'|'hour'} options.kind
 * @param {string} options.when   "Thursday 14 August at 10:00 (New York time)"
 * @param {string} options.otherName  The other person in the session.
 * @param {string} [options.meetingLink]  Therapist only.
 * @param {string} options.portalUrl
 */
export function sessionReminderEmail({ recipient, kind, when, otherName, meetingLink, portalUrl }) {
  const isClient = recipient === 'client';
  const subject = isClient ? forClient(kind, otherName) : forTherapist(kind, otherName);
  const title = kind === 'day' ? 'Your session is tomorrow' : 'Your session is coming up';
  const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink};`;
  const strong = `margin:0 0 16px;font-size:18px;line-height:1.5;color:${BRAND.ink};font-weight:600;`;

  const opening = isClient
    ? `Your session with ${otherName} is coming up.`
    : `A reminder about your session with ${otherName}.`;

  const closing = isClient
    ? 'The Join button appears on your sessions page shortly before you start.'
    : 'The same link is on the client’s page in your portal.';

  const link = meetingLink ? escapeHtml(meetingLink) : '';
  const linkHtml = meetingLink
    ? `<p style="${p}">Meeting link: <a href="${link}" style="color:${BRAND.ink};">${link}</a></p>`
    : '';

  const bodyHtml = `
    <p style="${p}">${escapeHtml(opening)}</p>
    <p style="${strong}">${escapeHtml(when)}</p>
    ${linkHtml}
    <p style="${p}">${closing}</p>`;

  const bodyText = `${opening}

${when}
${meetingLink ? `\nMeeting link: ${meetingLink}\n` : ''}
${closing}`;

  return {
    subject,
    html: baseTemplate({
      title,
      bodyHtml,
      buttonLabel: isClient ? 'Go to your sessions' : 'Open your portal',
      buttonUrl: portalUrl,
    }),
    text: baseTextTemplate({ title, bodyText, buttonUrl: portalUrl }),
  };
}
