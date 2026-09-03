import { baseTemplate, baseTextTemplate } from './base.js';
import { BRAND } from '../../../constants/email.js';

/** Escapes applicant-supplied text before it enters the HTML body. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Notifies the admin that an application arrived.
 *
 * Deliberately a HEADLINE, not the full submission. Two reasons: the admin
 * portal (slice 4) is where an application is actually reviewed, with the
 * credential documents attached; and pasting all 34 fields into an email would
 * put an applicant's address and taxpayer id into an inbox for no benefit.
 *
 * Every value is escaped — the name and therapist type are written by an
 * untrusted stranger.
 */
export function newApplicationEmail({
  firstName,
  lastName,
  title,
  therapistType,
  country,
  specialtyTags,
  applicationId,
}) {
  const fullName = escapeHtml(`${title} ${firstName} ${lastName}`.trim());
  const safeType = escapeHtml(therapistType);
  const safeCountry = escapeHtml(country);
  const safeTags = specialtyTags.map(escapeHtml).join(', ');

  const row = (label, value) => `
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${BRAND.inkMuted};">
      <strong style="color:${BRAND.ink};">${label}:</strong> ${value}
    </p>`;

  const bodyHtml = `
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${BRAND.ink};">
      A new therapist application is waiting for review.
    </p>
    <div style="margin:0 0 24px;padding:20px;background-color:${BRAND.mist};">
      ${row('Name', fullName)}
      ${row('Type', safeType)}
      ${row('Country', safeCountry)}
      ${row('Specialties', safeTags)}
      ${row('Reference', escapeHtml(applicationId))}
    </div>
    <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.inkMuted};">
      Open the admin portal to read the full application and the uploaded documents.
    </p>
  `;

  const text = `A new therapist application is waiting for review.

Name: ${title} ${firstName} ${lastName}
Type: ${therapistType}
Country: ${country}
Specialties: ${specialtyTags.join(', ')}
Reference: ${applicationId}

Open the admin portal to read the full application and the uploaded documents.`;

  return {
    subject: `New therapist application from ${title} ${firstName} ${lastName}`,
    html: baseTemplate({ title: 'New therapist application', bodyHtml }),
    text: baseTextTemplate({ title: 'New therapist application', bodyText: text }),
  };
}
