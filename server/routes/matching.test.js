import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { PUBLIC_THERAPIST_FIELDS } from '../constants/matching.js';
import { matchingRateLimiter } from './matching.routes.js';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

const ENDPOINT = '/api/v1/matching';

beforeAll(async () => {
  await startMemoryMongo();
  await TherapistProfile.init();
});

afterEach(async () => {
  await clearCollections();
  matchingRateLimiter.resetKey('::ffff:127.0.0.1');
  matchingRateLimiter.resetKey('127.0.0.1');
});

afterAll(stopMemoryMongo);

const hours = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: false, start: '', end: '' },
  wednesday: { enabled: false, start: '', end: '' },
  thursday: { enabled: false, start: '', end: '' },
  friday: { enabled: false, start: '', end: '' },
  saturday: { enabled: false, start: '', end: '' },
  sunday: { enabled: false, start: '', end: '' },
  note: '',
};

// Therapists must carry 3-4 specialty tags (§23), so fixtures declaring fewer
// are padded. The fillers are deliberately tags NO test ever queries, so padding
// can never create an overlap a test did not intend.
const FILLER_TAGS = ['Phobias', 'Divorce', 'Procrastination', "Alzheimer's"];

function padTags(tags) {
  const padded = [...tags];
  for (const filler of FILLER_TAGS) {
    if (padded.length >= 3) break;
    if (!padded.includes(filler)) padded.push(filler);
  }
  return padded;
}

/** Creates the two documents a real approval creates. */
async function makeTherapist({
  firstName,
  gender = 'female',
  specialtyTags = ['Anxiety'],
  status = USER_STATUS.ACTIVE,
  country = 'Ireland',
  treatmentOrientations = ['CBT'],
}) {
  const user = await User.create({
    email: `${firstName.toLowerCase()}@example.com`,
    passwordHash: 'x'.repeat(20),
    role: ROLES.THERAPIST,
    status,
  });

  return TherapistProfile.create({
    userId: user._id,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName,
    lastName: 'Test',
    gender,
    dateOfBirth: new Date('1985-01-01'),
    photoUrl: 'https://example.com/p.jpg',
    streetAddress: '1 Example Street',
    city: 'Galway',
    stateProvince: 'Connacht',
    zipPostal: 'H91',
    country,
    timezone: 'Europe/Dublin',
    therapistType: 'Clinical Psychologist',
    credentialType: 'Diploma/Degree',
    credentialInitials: 'PhD',
    licenseNumber: 'LIC-SECRET-123',
    taxpayerIdNumber: 'TAX-SECRET-456',
    yearsExperience: 9,
    educationSummary: 'Education summary.',
    currentWorkSituation: 'Private practice.',
    languages: ['English'],
    specialtyTags: padTags(specialtyTags),
    treatmentOrientations,
    bio: 'A bio.',
    licensingStatus: 'Licensed.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    workingHours: hours,
    certificateUrl1: 'https://example.com/c.pdf',
    status,
  });
}

const post = (body) => request(app).post(ENDPOINT).send(body);
const names = (res) => res.body.data.map((t) => t.firstName);

describe('matching — specialty overlap decides who appears', () => {
  beforeEach(async () => {
    await makeTherapist({ firstName: 'Anna', specialtyTags: ['Anxiety', 'Depression', 'Stress'] });
    await makeTherapist({ firstName: 'Ben', gender: 'male', specialtyTags: ['Anxiety'] });
    await makeTherapist({ firstName: 'Cara', specialtyTags: ['Addictions', 'Parenting'] });
  });

  it('returns therapists whose tags overlap, and only those', async () => {
    const res = await post({ concernTags: ['Anxiety'] });

    expect(res.status).toBe(200);
    expect(names(res).sort()).toEqual(['Anna', 'Ben']);
    expect(names(res)).not.toContain('Cara');
  });

  it('matches on ANY overlapping tag, not all of them', async () => {
    const res = await post({ concernTags: ['Depression', 'Grief'] });
    expect(names(res)).toEqual(['Anna']);
  });

  it('orders more overlap first', async () => {
    const res = await post({ concernTags: ['Anxiety', 'Depression', 'Stress'] });
    // Anna shares three, Ben one.
    expect(names(res)).toEqual(['Anna', 'Ben']);
  });

  it('reports the total in meta', async () => {
    const res = await post({ concernTags: ['Anxiety'] });
    expect(res.body.meta.total).toBe(2);
  });
});

describe('matching — gender preference SORTS, it never filters', () => {
  beforeEach(async () => {
    await makeTherapist({ firstName: 'Fiona', gender: 'female', specialtyTags: ['Grief'] });
    await makeTherapist({ firstName: 'Malik', gender: 'male', specialtyTags: ['Grief'] });
    await makeTherapist({ firstName: 'Alex', gender: 'other', specialtyTags: ['Grief'] });
  });

  it('puts the preferred gender first', async () => {
    const res = await post({ concernTags: ['Grief'], therapistGenderPreference: 'male' });
    expect(names(res)[0]).toBe('Malik');
  });

  it('STILL RETURNS everyone else beneath them', async () => {
    const res = await post({ concernTags: ['Grief'], therapistGenderPreference: 'male' });
    expect(names(res)).toHaveLength(3);
    expect(names(res)).toEqual(expect.arrayContaining(['Fiona', 'Alex']));
  });

  it('returns the SAME SET whichever preference is stated — only the order moves', async () => {
    const female = await post({ concernTags: ['Grief'], therapistGenderPreference: 'female' });
    const male = await post({ concernTags: ['Grief'], therapistGenderPreference: 'male' });
    const none = await post({ concernTags: ['Grief'], therapistGenderPreference: 'no_preference' });

    expect(names(female).sort()).toEqual(names(male).sort());
    expect(names(male).sort()).toEqual(names(none).sort());
    expect(names(female)[0]).toBe('Fiona');
    expect(names(male)[0]).toBe('Malik');
  });

  it('never drops a therapist whose gender nobody asked for', async () => {
    const res = await post({ concernTags: ['Grief'], therapistGenderPreference: 'female' });
    expect(names(res)).toContain('Alex');
  });

  it('ignores gender entirely when no preference is stated', async () => {
    const res = await post({ concernTags: ['Grief'] });
    expect(res.body.meta.total).toBe(3);
  });

  it('keeps the preferred group ahead even when an unpreferred one fits better', async () => {
    await makeTherapist({
      firstName: 'Owen',
      gender: 'male',
      specialtyTags: ['Grief', 'Anxiety', 'Depression'],
    });

    const res = await post({
      concernTags: ['Grief', 'Anxiety', 'Depression'],
      therapistGenderPreference: 'female',
    });

    // Fiona shares one tag, Owen three — but the stated preference wins first.
    expect(names(res)[0]).toBe('Fiona');
    expect(names(res)).toContain('Owen');
  });
});

describe('matching — the silent fallback (§15)', () => {
  beforeEach(async () => {
    await makeTherapist({ firstName: 'Anna', specialtyTags: ['Anxiety'] });
    await makeTherapist({ firstName: 'Ben', gender: 'male', specialtyTags: ['Addictions'] });
  });

  it('returns EVERY active therapist when nothing overlaps', async () => {
    const res = await post({ concernTags: ['Weight Loss'] });

    expect(res.status).toBe(200);
    expect(names(res).sort()).toEqual(['Anna', 'Ben']);
  });

  it('NEVER returns an empty list just because nothing matched', async () => {
    const res = await post({ concernTags: ['Weight Loss', 'Speech Anxiety'] });
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('still honours the gender preference in the fallback', async () => {
    const res = await post({
      concernTags: ['Weight Loss'],
      therapistGenderPreference: 'male',
    });
    expect(names(res)[0]).toBe('Ben');
  });

  it('SAYS NOTHING ABOUT IT — the payload is shape-identical to a real match', async () => {
    const matched = await post({ concernTags: ['Anxiety'] });
    const fellBack = await post({ concernTags: ['Weight Loss'] });

    expect(Object.keys(fellBack.body).sort()).toEqual(Object.keys(matched.body).sort());
    expect(Object.keys(fellBack.body.meta).sort()).toEqual(Object.keys(matched.body.meta).sort());
  });

  it('carries no flag a UI could turn into a "no exact match" banner', async () => {
    const res = await post({ concernTags: ['Weight Loss'] });
    const body = JSON.stringify(res.body).toLowerCase();

    for (const word of ['fallback', 'nomatch', 'no_match', 'matched', 'exact', 'message']) {
      expect(body).not.toContain(word);
    }
  });
});

describe('matching — what is NEVER a filter (§15)', () => {
  it('matches a therapist in another country', async () => {
    await makeTherapist({ firstName: 'Yuki', country: 'Japan', specialtyTags: ['Anxiety'] });
    const res = await post({ concernTags: ['Anxiety'] });
    expect(names(res)).toEqual(['Yuki']);
  });

  it('matches regardless of treatment orientation', async () => {
    await makeTherapist({
      firstName: 'Ida',
      specialtyTags: ['Anxiety'],
      treatmentOrientations: ['Hypnotherapy', 'Music Therapy'],
    });
    const res = await post({ concernTags: ['Anxiety'] });
    expect(names(res)).toEqual(['Ida']);
  });

  it('ignores country, timezone and orientation sent in the request', async () => {
    await makeTherapist({ firstName: 'Ida', country: 'Japan', specialtyTags: ['Anxiety'] });

    const res = await post({
      concernTags: ['Anxiety'],
      country: 'Ireland',
      timezone: 'Europe/Dublin',
      treatmentOrientations: ['EMDR'],
    });

    // Stripped, not honoured — a filter the endpoint cannot receive is a filter
    // it can never accidentally apply.
    expect(names(res)).toEqual(['Ida']);
  });

  it('excludes deactivated therapists', async () => {
    await makeTherapist({ firstName: 'Active', specialtyTags: ['Anxiety'] });
    await makeTherapist({
      firstName: 'Gone',
      specialtyTags: ['Anxiety'],
      status: USER_STATUS.INACTIVE,
    });

    const res = await post({ concernTags: ['Anxiety'] });
    expect(names(res)).toEqual(['Active']);
  });

  it('does not resurrect a deactivated therapist through the fallback', async () => {
    await makeTherapist({
      firstName: 'Gone',
      specialtyTags: ['Anxiety'],
      status: USER_STATUS.INACTIVE,
    });

    const res = await post({ concernTags: ['Weight Loss'] });
    expect(res.body.data).toHaveLength(0);
    expect(res.body.meta.total).toBe(0);
  });
});

describe('matching — the public projection', () => {
  beforeEach(async () => {
    await makeTherapist({ firstName: 'Anna', specialtyTags: ['Anxiety'] });
  });

  it.each([
    'email',
    'userId',
    '_id',
    'passwordHash',
    'streetAddress',
    'stateProvince',
    'zipPostal',
    'dateOfBirth',
    'taxpayerIdNumber',
    'licenseNumber',
    'licensingStatus',
    'disciplinaryActions',
    'disciplinaryDetails',
    'malpracticeInsurance',
    'insuranceDetails',
    'certificateUrl1',
    'certificateUrl2',
    'licenseDocUrl',
    'applicationId',
    'status',
    'educationSummary',
    'currentWorkSituation',
    'workingHours',
  ])('never returns %s', async (field) => {
    const res = await post({ concernTags: ['Anxiety'] });
    expect(res.body.data[0]).not.toHaveProperty(field);
  });

  it('leaks no secret value anywhere in the payload', async () => {
    const res = await post({ concernTags: ['Anxiety'] });
    const body = JSON.stringify(res.body);

    expect(body).not.toContain('TAX-SECRET-456');
    expect(body).not.toContain('LIC-SECRET-123');
    expect(body).not.toContain('anna@example.com');
    expect(body).not.toContain('1 Example Street');
  });

  it('returns exactly the allowlisted fields plus the public id', async () => {
    const res = await post({ concernTags: ['Anxiety'] });
    expect(Object.keys(res.body.data[0]).sort()).toEqual(
      ['id', ...PUBLIC_THERAPIST_FIELDS].sort(),
    );
  });

  it('exposes the PROFILE id, not the user id', async () => {
    const profile = await TherapistProfile.findOne({ firstName: 'Anna' });
    const res = await post({ concernTags: ['Anxiety'] });

    expect(res.body.data[0].id).toBe(profile._id.toString());
    expect(res.body.data[0].id).not.toBe(profile.userId.toString());
  });

  it('includes what the card needs to be chosen from', async () => {
    const res = await post({ concernTags: ['Anxiety'] });
    const therapist = res.body.data[0];

    expect(therapist.firstName).toBe('Anna');
    expect(therapist.photoUrl).toBeTruthy();
    expect(therapist.bio).toBeTruthy();
    expect(therapist.specialtyTags).toContain('Anxiety');
    expect(therapist.gender).toBe('female');
  });
});

describe('matching — validation', () => {
  it('rejects a tag that is not on the master list', async () => {
    const res = await post({ concernTags: ['Burnout'] });
    expect(res.status).toBe(422);
  });

  it('rejects an empty selection', async () => {
    const res = await post({ concernTags: [] });
    expect(res.status).toBe(422);
  });

  it('rejects more than four', async () => {
    const res = await post({
      concernTags: ['Anxiety', 'Depression', 'Grief', 'Stress', 'Autism'],
    });
    expect(res.status).toBe(422);
  });

  it('rejects duplicates', async () => {
    const res = await post({ concernTags: ['Anxiety', 'Anxiety'] });
    expect(res.status).toBe(422);
  });

  it('rejects an unknown gender preference', async () => {
    const res = await post({ concernTags: ['Anxiety'], therapistGenderPreference: 'any' });
    expect(res.status).toBe(422);
  });

  it('rejects a missing body', async () => {
    const res = await post({});
    expect(res.status).toBe(422);
  });

  it('never leaks a database detail in the error', async () => {
    const res = await post({ concernTags: ['Burnout'] });
    const body = JSON.stringify(res.body).toLowerCase();
    expect(body).not.toContain('mongo');
    expect(body).not.toContain('therapistprofile');
  });
});

describe('matching — paging never excludes anyone', () => {
  beforeEach(async () => {
    for (const name of ['A', 'B', 'C']) {
      await makeTherapist({ firstName: `T${name}`, specialtyTags: ['Anxiety'] });
    }
  });

  it('pages without changing the total', async () => {
    const first = await post({ concernTags: ['Anxiety'], limit: 2, offset: 0 });
    const second = await post({ concernTags: ['Anxiety'], limit: 2, offset: 2 });

    expect(first.body.data).toHaveLength(2);
    expect(second.body.data).toHaveLength(1);
    expect(first.body.meta.total).toBe(3);
    expect(second.body.meta.total).toBe(3);
  });

  it('returns every therapist across the pages, with none repeated', async () => {
    const first = await post({ concernTags: ['Anxiety'], limit: 2, offset: 0 });
    const second = await post({ concernTags: ['Anxiety'], limit: 2, offset: 2 });

    const all = [...names(first), ...names(second)];
    expect(new Set(all).size).toBe(3);
  });

  it('gives a stable order across identical requests', async () => {
    const one = await post({ concernTags: ['Anxiety'] });
    const two = await post({ concernTags: ['Anxiety'] });
    expect(names(one)).toEqual(names(two));
  });

  it('rejects an absurd page size rather than serving it', async () => {
    const res = await post({ concernTags: ['Anxiety'], limit: 5000 });
    expect(res.status).toBe(422);
  });
});

describe('matching — the endpoint itself', () => {
  it('is public: no token required', async () => {
    await makeTherapist({ firstName: 'Anna', specialtyTags: ['Anxiety'] });
    const res = await post({ concernTags: ['Anxiety'] });
    expect(res.status).toBe(200);
  });

  it('writes nothing', async () => {
    await makeTherapist({ firstName: 'Anna', specialtyTags: ['Anxiety'] });
    const before = await mongoose.connection.db.listCollections().toArray();

    await post({ concernTags: ['Anxiety'] });

    const users = await User.countDocuments();
    const profiles = await TherapistProfile.countDocuments();
    const after = await mongoose.connection.db.listCollections().toArray();

    expect(users).toBe(1);
    expect(profiles).toBe(1);
    expect(after).toHaveLength(before.length);
  });

  it('returns an empty list, not an error, when there are no therapists at all', async () => {
    const res = await post({ concernTags: ['Anxiety'] });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });
});
