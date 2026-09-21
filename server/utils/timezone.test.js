import {
  localTimeToUtc,
  partsInZone,
  formatInZone,
  isValidTimeZone,
  LOCAL_TIME_REASON,
} from './timezone.js';

// Fixed dates only, so these results never depend on the day the suite runs.
// 2026: UK clocks change 29 Mar / 25 Oct, US 8 Mar / 1 Nov.

const utc = (date, time, zone) => {
  const result = localTimeToUtc({ date, time }, zone);
  return result.instant ? result.instant.toISOString() : result.reason;
};

const wall = (iso, zone) => {
  const p = partsInZone(new Date(iso), zone);
  const pad = (n) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)} ${p.weekday}`;
};

// ICU puts a narrow no-break space before AM/PM.
const plain = (text) => text.replace(/\s/g, ' ');

describe("the brief's case: 3 PM in London, read in New York", () => {
  it('stores 15:00 London (summer, BST) as 14:00 UTC and shows 10:00 in New York', () => {
    const stored = utc('2026-07-15', '15:00', 'Europe/London');
    expect(stored).toBe('2026-07-15T14:00:00.000Z');
    expect(wall(stored, 'America/New_York')).toBe('2026-07-15 10:00 Wed');
  });

  it('stores 15:00 London (winter, GMT) as 15:00 UTC and shows 10:00 in New York', () => {
    const stored = utc('2026-01-15', '15:00', 'Europe/London');
    expect(stored).toBe('2026-01-15T15:00:00.000Z');
    expect(wall(stored, 'America/New_York')).toBe('2026-01-15 10:00 Thu');
  });

  it('formats it for each reader with their own abbreviation', () => {
    const instant = new Date('2026-07-15T14:00:00Z');

    const ny = formatInZone(instant, 'America/New_York', { locale: 'en-US' });
    expect(plain(ny.time)).toBe('10:00 AM');
    expect(ny.zone).toBe('EDT');

    const london = formatInZone(instant, 'Europe/London', { locale: 'en-GB' });
    expect(london.time).toBe('15:00');
    expect(london.zone).toBe('BST');
    expect(london.text).toBe('Wednesday, 15 July 2026, 15:00 BST');

    const winter = new Date('2026-01-15T15:00:00Z');
    expect(formatInZone(winter, 'America/New_York', { locale: 'en-US' }).zone).toBe('EST');
    expect(formatInZone(winter, 'Europe/London', { locale: 'en-GB' }).zone).toBe('GMT');
  });

  it('falls back to an offset where a zone has no common abbreviation', () => {
    const kolkata = formatInZone(new Date('2026-07-15T09:30:00Z'), 'Asia/Kolkata');
    expect(kolkata.time).toBe('15:00');
    expect(kolkata.zone).toBe('GMT+5:30');
  });
});

describe('the weeks when UK and US clocks disagree', () => {
  it('spring: US has moved, UK has not — London and New York are 4 hours apart, not 5', () => {
    const stored = utc('2026-03-20', '15:00', 'Europe/London');
    expect(stored).toBe('2026-03-20T15:00:00.000Z');
    expect(wall(stored, 'America/New_York')).toBe('2026-03-20 11:00 Fri');
  });

  it('autumn: UK has moved back, US has not — again 4 hours apart', () => {
    const stored = utc('2026-10-28', '15:00', 'Europe/London');
    expect(stored).toBe('2026-10-28T15:00:00.000Z');
    expect(wall(stored, 'America/New_York')).toBe('2026-10-28 11:00 Wed');
  });
});

describe('clocks going forward — times that do not exist', () => {
  it.each([
    ['2026-03-29', '01:00', 'Europe/London'],
    ['2026-03-29', '01:30', 'Europe/London'],
    ['2026-03-29', '01:59', 'Europe/London'],
    ['2026-03-08', '02:30', 'America/New_York'],
    ['2026-10-04', '02:30', 'Australia/Sydney'],
    // Lord Howe moves by 30 minutes.
    ['2026-10-04', '02:15', 'Australia/Lord_Howe'],
    // Samoa skipped the whole of 30 December 2011.
    ['2011-12-30', '12:00', 'Pacific/Apia'],
  ])('%s %s in %s is refused', (date, time, zone) => {
    const result = localTimeToUtc({ date, time }, zone);
    expect(result.reason).toBe(LOCAL_TIME_REASON.NONEXISTENT);
    expect(result.instant).toBeNull();
  });

  it('accepts the minutes either side of the London gap', () => {
    expect(utc('2026-03-29', '00:59', 'Europe/London')).toBe('2026-03-29T00:59:00.000Z');
    expect(utc('2026-03-29', '02:00', 'Europe/London')).toBe('2026-03-29T01:00:00.000Z');
  });

  it('accepts the half-hour after the Lord Howe gap', () => {
    expect(utc('2026-10-04', '02:30', 'Australia/Lord_Howe')).toBe('2026-10-03T15:30:00.000Z');
  });
});

describe('clocks going back — times that happen twice', () => {
  it.each([
    ['2026-10-25', '01:30', 'Europe/London', '2026-10-25T00:30:00.000Z'],
    ['2026-11-01', '01:30', 'America/New_York', '2026-11-01T05:30:00.000Z'],
    ['2026-04-05', '01:45', 'Australia/Lord_Howe', '2026-04-04T14:45:00.000Z'],
  ])('%s %s in %s uses the first one, every time', (date, time, zone, expected) => {
    const result = localTimeToUtc({ date, time }, zone);
    expect(result.instant.toISOString()).toBe(expected);
    expect(result.ambiguous).toBe(true);
  });

  it('marks an ordinary time as not ambiguous', () => {
    expect(localTimeToUtc({ date: '2026-07-15', time: '15:00' }, 'Europe/London').ambiguous).toBe(
      false,
    );
  });
});

describe('other zones', () => {
  it("keeps Kolkata's half-hour offset", () => {
    expect(utc('2026-07-15', '15:00', 'Asia/Kolkata')).toBe('2026-07-15T09:30:00.000Z');
  });

  it("follows Sydney's opposite season", () => {
    expect(utc('2026-01-15', '15:00', 'Australia/Sydney')).toBe('2026-01-15T04:00:00.000Z');
    expect(utc('2026-07-15', '15:00', 'Australia/Sydney')).toBe('2026-07-15T05:00:00.000Z');
  });

  it('rolls the day back: Monday 09:00 in Auckland is Sunday afternoon in New York', () => {
    const stored = utc('2026-07-13', '09:00', 'Pacific/Auckland');
    expect(stored).toBe('2026-07-12T21:00:00.000Z');
    expect(wall(stored, 'America/New_York')).toBe('2026-07-12 17:00 Sun');
  });

  it('treats UTC as UTC', () => {
    expect(utc('2026-07-15', '15:00', 'UTC')).toBe('2026-07-15T15:00:00.000Z');
  });
});

describe('bad input is refused, never guessed', () => {
  it.each([
    [{ date: '2026-02-30', time: '10:00' }, 'UTC', LOCAL_TIME_REASON.INVALID_DATE],
    [{ date: '2026-13-01', time: '10:00' }, 'UTC', LOCAL_TIME_REASON.INVALID_DATE],
    [{ date: '0050-01-01', time: '10:00' }, 'UTC', LOCAL_TIME_REASON.INVALID_DATE],
    [{ date: '15/07/2026', time: '10:00' }, 'UTC', LOCAL_TIME_REASON.INVALID_DATE],
    [{ date: '2026-01-01', time: '24:00' }, 'UTC', LOCAL_TIME_REASON.INVALID_TIME],
    [{ date: '2026-01-01', time: '9:00' }, 'UTC', LOCAL_TIME_REASON.INVALID_TIME],
    [{ date: '2026-01-01', time: '10:00' }, 'Mars/Olympus', LOCAL_TIME_REASON.INVALID_ZONE],
    [{ date: '2026-01-01', time: '10:00' }, '', LOCAL_TIME_REASON.INVALID_ZONE],
    [{ date: '2026-01-01', time: '10:00' }, undefined, LOCAL_TIME_REASON.INVALID_ZONE],
  ])('%j in %s → %s', (input, zone, reason) => {
    expect(localTimeToUtc(input, zone)).toEqual({ instant: null, reason, ambiguous: false });
  });

  it('accepts 29 February only in a leap year', () => {
    expect(utc('2028-02-29', '10:00', 'UTC')).toBe('2028-02-29T10:00:00.000Z');
    expect(utc('2027-02-29', '10:00', 'UTC')).toBe(LOCAL_TIME_REASON.INVALID_DATE);
  });

  it('knows a real zone from a made-up one', () => {
    expect(isValidTimeZone('Europe/London')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
  });
});

describe('a whole year, hour by hour, round-trips', () => {
  // Every hour of 2026 read as a wall clock and converted back must land on the
  // same instant — or, where the hour happened twice, on its first occurrence.
  it.each(['Europe/London', 'America/New_York', 'Australia/Lord_Howe'])(
    '%s',
    (zone) => {
      const start = Date.UTC(2026, 0, 1);
      const end = Date.UTC(2027, 0, 1);
      const pad = (n) => String(n).padStart(2, '0');
      let checked = 0;

      for (let t = start; t < end; t += 60 * 60 * 1000) {
        const p = partsInZone(t, zone);
        const result = localTimeToUtc(
          { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` },
          zone,
        );
        const back = result.instant.getTime();
        if (result.ambiguous) expect(back).toBeLessThanOrEqual(t);
        else expect(back).toBe(t);
        checked += 1;
      }

      expect(checked).toBe(8760);
    },
  );
});
