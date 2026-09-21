import { isAllowedMeetingLink } from './meetingLink.js';
import { MEETING_LINK_MAX } from '../constants/sessions.js';

// A client clicks this link. Only Zoom and Google Meet, over https, on the real host.

describe('allowed meeting links', () => {
  it.each([
    'https://zoom.us/j/81234567890?pwd=abc123',
    'https://us02web.zoom.us/j/81234567890',
    'https://acme.zoom.us/my/dr.raman',
    'https://zoomgov.com/j/1612345678',
    'https://agency.zoomgov.com/j/1612345678',
    'https://meet.google.com/abc-defg-hij',
    'https://meet.google.com/abc-defg-hij?authuser=0',
    'https://ZOOM.US/j/81234567890',
  ])('%s', (link) => {
    expect(isAllowedMeetingLink(link)).toBe(true);
  });
});

describe('refused meeting links', () => {
  it.each([
    ['plain http', 'http://zoom.us/j/81234567890'],
    ['a lookalike suffix', 'https://zoom.us.evil.example/j/1'],
    ['a lookalike prefix', 'https://evilzoom.us/j/1'],
    ['a Meet subdomain', 'https://x.meet.google.com/abc-defg-hij'],
    ['another Google host', 'https://google.com/meet/abc'],
    ['another platform', 'https://teams.microsoft.com/l/meetup-join/1'],
    ['a random site', 'https://example.com/j/1'],
    ['a host hidden behind credentials', 'https://zoom.us@evil.example/j/1'],
    ['credentials on the real host', 'https://user:pass@zoom.us/j/1'],
    ['a backslash trick', 'https://evil.example\\@zoom.us/j/1'],
    ['an explicit port', 'https://zoom.us:8443/j/1'],
    ['a bare host', 'https://zoom.us'],
    ['a bare host with a slash', 'https://meet.google.com/'],
    ['a trailing-dot host', 'https://zoom.us./j/1'],
    ['whitespace inside', 'https://zoom.us/j/1 2'],
    ['a script URL', 'javascript:alert(1)'],
    ['not a URL', 'zoom.us/j/1'],
    ['empty', ''],
    ['not a string', 42],
    ['too long', `https://zoom.us/j/${'1'.repeat(MEETING_LINK_MAX)}`],
  ])('%s', (_label, link) => {
    expect(isAllowedMeetingLink(link)).toBe(false);
  });
});
