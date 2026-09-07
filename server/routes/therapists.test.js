import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { PUBLIC_THERAPIST_DETAIL_FIELDS } from '../constants/matching.js';
import { therapistDetailRateLimiter } from './therapists.routes.js';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

beforeAll(async () => {
  await startMemoryMongo();
  await TherapistProfile.init();
});

afterEach(async () => {
  await clearCollections();
  therapistDetailRateLimiter.resetKey('::ffff:127.0.0.1');
  therapistDetailRateLimiter.resetKey('127.0.0.1');
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
  note: 'Some note',
};

async function makeTherapist({ status = USER_STATUS.ACTIVE } = {}) {
  const user = await User.create({
    email: 'anna@example.com',
    passwordHash: 'x'.repeat(20),
    role: ROLES.THERAPIST,
    status,
  });

  return TherapistProfile.create({
    userId: user._id,
    applicationId: new mongoose.Types.ObjectId(),
    title: 'Dr.',
    firstName: 'Anna',
    lastName: 'Test',
    gender: 'female',
    dateOfBirth: new Date('1985-01-01'),
    photoUrl: 'https://example.com/p.jpg',
    streetAddress: '1 Example Street',
    city: 'Galway',
    stateProvince: 'Connacht',
    zipPostal: 'H91',
    country: 'Ireland',
    timezone: 'Europe/Dublin',
    therapistType: 'Clinical Psychologist',
    credentialType: 'Diploma/Degree',
    credentialInitials: 'PhD',
    licenseNumber: 'LIC-SECRET-123',
    taxpayerIdNumber: 'TAX-SECRET-456',
    yearsExperience: 9,
    educationSummary: 'EDUCATION-SECRET',
    currentWorkSituation: 'WORK-SECRET',
    languages: ['English'],
    specialtyTags: ['Anxiety', 'Grief', 'Stress'],
    treatmentOrientations: ['CBT'],
    bio: 'A bio.',
    licensingStatus: 'Licensed.',
    disciplinaryActions: false,
    malpracticeInsurance: true,
    workingHours: hours,
    certificateUrl1: 'https://example.com/c.pdf',
    status,
  });
}

const get = (id) => request(app).get(`/api/v1/therapists/${id}`);

describe('public therapist profile', () => {
  it('returns an active therapist', async () => {
    const profile = await makeTherapist();
    const res = await get(profile._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Anna');
    expect(res.body.data.id).toBe(profile._id.toString());
  });

  it('includes the working hours the detail page needs', async () => {
    const profile = await makeTherapist();
    const res = await get(profile._id.toString());

    expect(res.body.data.workingHours.monday.start).toBe('09:00');
    expect(res.body.data.timezone).toBe('Europe/Dublin');
  });

  it('is public — no token required', async () => {
    const profile = await makeTherapist();
    expect((await get(profile._id.toString())).status).toBe(200);
  });

  it('404s an inactive therapist rather than showing them', async () => {
    // A client must never reach a profile they cannot be matched with.
    const profile = await makeTherapist({ status: USER_STATUS.INACTIVE });
    expect((await get(profile._id.toString())).status).toBe(404);
  });

  it('404s an unknown id', async () => {
    expect((await get(new mongoose.Types.ObjectId().toString())).status).toBe(404);
  });

  it('404s a malformed id — the same answer, so ids cannot be probed', async () => {
    const malformed = await get('not-an-id');
    const unknown = await get(new mongoose.Types.ObjectId().toString());

    expect(malformed.status).toBe(404);
    expect(malformed.body).toEqual(unknown.body);
  });
});

describe('public therapist profile — the projection', () => {
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
  ])('never returns %s', async (field) => {
    const profile = await makeTherapist();
    const res = await get(profile._id.toString());
    expect(res.body.data).not.toHaveProperty(field);
  });

  it('leaks no secret value anywhere in the payload', async () => {
    const profile = await makeTherapist();
    const body = JSON.stringify((await get(profile._id.toString())).body);

    expect(body).not.toContain('TAX-SECRET-456');
    expect(body).not.toContain('LIC-SECRET-123');
    expect(body).not.toContain('EDUCATION-SECRET');
    expect(body).not.toContain('WORK-SECRET');
    expect(body).not.toContain('anna@example.com');
    expect(body).not.toContain('1 Example Street');
  });

  it('returns exactly the allowlisted fields plus the public id', async () => {
    const profile = await makeTherapist();
    const res = await get(profile._id.toString());

    expect(Object.keys(res.body.data).sort()).toEqual(
      ['id', ...PUBLIC_THERAPIST_DETAIL_FIELDS].sort(),
    );
  });

  it('exposes the PROFILE id, never the user id', async () => {
    const profile = await makeTherapist();
    const res = await get(profile._id.toString());

    expect(res.body.data.id).toBe(profile._id.toString());
    expect(JSON.stringify(res.body)).not.toContain(profile.userId.toString());
  });

  it('carries no star rating or review data — reviews are admin-only', async () => {
    const profile = await makeTherapist();
    const body = JSON.stringify((await get(profile._id.toString())).body).toLowerCase();

    expect(body).not.toContain('rating');
    expect(body).not.toContain('stars');
    expect(body).not.toContain('review');
  });
});
