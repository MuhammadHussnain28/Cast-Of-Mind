import { describe, expect, it } from '@jest/globals';
import { localTimeToUtc, partsInZone } from '../utils/timezone.js';
import { MEETING_LINK_HOSTS, MEETING_LINK_MAX } from '../constants/sessions.js';
import { isAllowedMeetingLink } from '../utils/meetingLink.js';
import { resolveWallTime } from '../../client/src/lib/workingHours.js';
import {
  MEETING_LINK_HOSTS as CLIENT_HOSTS,
  MEETING_LINK_MAX as CLIENT_MAX,
  isAllowedMeetingLink as clientAllows,
} from '../../client/src/lib/therapist/meetingLink.js';

// THIS TEST REACHES ACROSS THE CLIENT/SERVER BOUNDARY ON PURPOSE, as constantsParity does.
// The scheduling preview (9.2) converts in the browser; the server converts again
// when it stores. If the two ever disagree, a therapist is shown one time and the
// client gets another. These tests hold them to the same answer.

const pad = (n) => String(n).padStart(2, '0');
const ZONES = ['Europe/London', 'America/New_York', 'Australia/Lord_Howe', 'Asia/Kolkata'];

function compare(date, time, zone) {
  const server = localTimeToUtc({ date, time }, zone);
  const client = resolveWallTime({ date, time }, zone);
  return {
    server: [server.instant?.getTime() ?? null, server.reason, server.ambiguous],
    client: [client.instant?.getTime() ?? null, client.reason, client.ambiguous],
  };
}

// The days either side of each clock change in 2026, found rather than listed.
function transitionDays(zone) {
  const days = new Set();
  let before = partsInZone(Date.UTC(2026, 0, 1) - 60 * 60 * 1000, zone);
  for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += 60 * 60 * 1000) {
    const now = partsInZone(t, zone);
    const offsetNow = Date.UTC(now.year, now.month - 1, now.day, now.hour, now.minute) - t;
    const prev = t - 60 * 60 * 1000;
    const offsetPrev =
      Date.UTC(before.year, before.month - 1, before.day, before.hour, before.minute) - prev;
    if (offsetNow !== offsetPrev) {
      for (const shift of [-1, 0, 1]) {
        const d = new Date(t + shift * 24 * 60 * 60 * 1000);
        days.add(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
      }
    }
    before = now;
  }
  return [...days];
}

describe('the browser preview and the server place a time identically', () => {
  it.each(ZONES)('%s — every quarter hour on the days around each clock change', (zone) => {
    const days = transitionDays(zone);
    // Kolkata has no clock changes; the others have two each.
    expect(days.length).toBe(zone === 'Asia/Kolkata' ? 0 : 6);

    let checked = 0;
    for (const date of days) {
      for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
        const time = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
        const { server, client } = compare(date, time, zone);
        expect(client).toEqual(server);
        checked += 1;
      }
    }
    expect(checked).toBe(days.length * 96);
  });

  it.each(ZONES)('%s — 15:00 on every day of 2026', (zone) => {
    for (let day = 0; day < 365; day += 1) {
      const d = new Date(Date.UTC(2026, 0, 1 + day));
      const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
      const { server, client } = compare(date, '15:00', zone);
      expect(client).toEqual(server);
    }
  });

  it('agrees that a skipped time does not exist, and a repeated one takes the first', () => {
    expect(compare('2026-03-29', '01:30', 'Europe/London').client[1]).toBe('nonexistent');
    expect(compare('2026-10-25', '01:30', 'Europe/London').client[2]).toBe(true);
  });

  it.each([
    ['2026-02-30', '10:00', 'UTC'],
    ['2026-01-01', '24:00', 'UTC'],
    ['2026-01-01', '10:00', 'Mars/Olympus'],
    ['0050-01-01', '10:00', 'UTC'],
    ['', '10:00', 'UTC'],
  ])('refuses %s %s in %s the same way', (date, time, zone) => {
    const { server, client } = compare(date, time, zone);
    expect(client).toEqual(server);
  });
});

describe('the meeting-link rule is the same on both sides', () => {
  it('has the same hosts and limit', () => {
    expect(CLIENT_HOSTS.map((h) => ({ ...h }))).toEqual(MEETING_LINK_HOSTS.map((h) => ({ ...h })));
    expect(CLIENT_MAX).toBe(MEETING_LINK_MAX);
  });

  it.each([
    'https://zoom.us/j/81234567890?pwd=abc',
    'https://acme.zoom.us/my/room',
    'https://zoomgov.com/j/1',
    'https://meet.google.com/abc-defg-hij',
    'http://zoom.us/j/1',
    'https://zoom.us.evil.example/j/1',
    'https://x.meet.google.com/abc',
    'https://zoom.us@evil.example/j/1',
    'https://user:pass@zoom.us/j/1',
    'https://zoom.us:8443/j/1',
    'https://zoom.us',
    'javascript:alert(1)',
    '',
  ])('%s', (link) => {
    expect(clientAllows(link)).toBe(isAllowedMeetingLink(link));
  });
});
