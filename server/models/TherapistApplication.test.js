import { describe, expect, it, beforeAll, afterAll, afterEach } from '@jest/globals';
import {
  TherapistApplication,
  APPLICATION_STATUS,
  THERAPIST_TYPE_MAX,
  MIN_YEARS_EXPERIENCE,
} from './TherapistApplication.js';
import { SPECIALTY_TAGS } from '../constants/specialtyTags.js';
import { TREATMENT_ORIENTATIONS } from '../constants/treatmentOrientations.js';
import { hashPassword } from '../utils/password.js';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

let passwordHash;

beforeAll(async () => {
  await startMemoryMongo();
  // The partial unique index on email is a MongoDB index, not a validator.
  // Build it before asserting on duplicates or the test passes for the wrong reason.
  await TherapistApplication.init();
  passwordHash = await hashPassword('correct-horse-battery-staple');
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

afterEach(async () => {
  await clearCollections();
});

// A date comfortably clear of the 18-year floor.
const ADULT_DOB = new Date('1985-04-17T00:00:00.000Z');

function validApplication(overrides = {}) {
  return {
    title: 'Dr.',
    firstName: 'Amara',
    lastName: 'Okafor',
    gender: 'female',
    dateOfBirth: ADULT_DOB,
    email: 'amara@example.com',
    passwordHash,
    photoUrl: 'https://res.cloudinary.com/demo/image/upload/abc123.jpg',

    streetAddress: '14 Rue des Lilas',
    city: 'Lyon',
    stateProvince: 'Auvergne-Rhône-Alpes',
    zipPostal: '69003',
    country: 'France',
    timezone: 'Europe/Paris',
    languages: ['English', 'French'],
    workingHours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '10:00', end: '18:30' },
      note: '',
    },

    therapistType: 'Clinical Psychologist',
    credentialType: 'Diploma/Degree',
    credentialInitials: 'PhD',
    yearsExperience: 9,
    educationSummary: 'PhD in Clinical Psychology, Université Lumière Lyon 2.',
    currentWorkSituation: 'Private practice, part time.',

    specialtyTags: ['Anxiety', 'Depression', 'Grief'],
    treatmentOrientations: ['CBT', 'EMDR'],
    bio: 'I work with adults navigating anxiety, low mood and bereavement.',
    licensingStatus: 'Licensed to practise in France.',
    disciplinaryActions: false,

    malpracticeInsurance: true,
    certificateUrl1: 'https://res.cloudinary.com/demo/image/authenticated/cert1.pdf',

    ...overrides,
  };
}

async function expectInvalid(overrides, pathFragment) {
  const doc = new TherapistApplication(validApplication(overrides));
  await expect(doc.validate()).rejects.toThrow();

  if (pathFragment) {
    const error = await doc.validate().catch((e) => e);
    const paths = Object.keys(error.errors).join(' ');
    expect(paths).toContain(pathFragment);
  }
}

describe('TherapistApplication — a valid application', () => {
  it('saves', async () => {
    const saved = await TherapistApplication.create(validApplication());
    expect(saved._id).toBeDefined();
    expect(saved.firstName).toBe('Amara');
  });

  it('defaults status to pending, sets submittedAt, leaves reviewedAt null', async () => {
    const saved = await TherapistApplication.create(validApplication());
    expect(saved.status).toBe(APPLICATION_STATUS.PENDING);
    expect(saved.submittedAt).toBeInstanceOf(Date);
    expect(saved.reviewedAt).toBeNull();
  });

  it('lowercases and trims the email', async () => {
    const saved = await TherapistApplication.create(
      validApplication({ email: '  Amara@Example.COM  ' }),
    );
    expect(saved.email).toBe('amara@example.com');
  });

  it('accepts an application with every optional field filled', async () => {
    const saved = await TherapistApplication.create(
      validApplication({
        licenseNumber: 'FR-99182',
        taxpayerIdNumber: '1850417123456',
        insuranceDetails: 'AXA, policy 55-2211, €2m cover.',
        certificateUrl2: 'https://res.cloudinary.com/demo/cert2.pdf',
        licenseDocUrl: 'https://res.cloudinary.com/demo/licence.pdf',
      }),
    );
    expect(saved.licenseNumber).toBe('FR-99182');
    expect(saved.certificateUrl2).toContain('cert2');
  });
});

describe('TherapistApplication — specialty tags (drives matching)', () => {
  it('rejects fewer than 3', async () => {
    await expectInvalid({ specialtyTags: ['Anxiety', 'Depression'] }, 'specialtyTags');
  });

  it('rejects more than 4', async () => {
    await expectInvalid(
      { specialtyTags: ['Anxiety', 'Depression', 'Grief', 'Stress', 'Parenting'] },
      'specialtyTags',
    );
  });

  it('rejects an empty array', async () => {
    await expectInvalid({ specialtyTags: [] }, 'specialtyTags');
  });

  it('accepts exactly 3', async () => {
    const doc = new TherapistApplication(
      validApplication({ specialtyTags: ['Anxiety', 'Depression', 'Grief'] }),
    );
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it('accepts exactly 4', async () => {
    const doc = new TherapistApplication(
      validApplication({ specialtyTags: ['Anxiety', 'Depression', 'Grief', 'Stress'] }),
    );
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it('rejects a tag that is not in the master list', async () => {
    await expectInvalid({ specialtyTags: ['Anxiety', 'Depression', 'OCD'] }, 'specialtyTags');
  });

  it('rejects a tag whose case does not match the master list exactly', async () => {
    // Values are stored verbatim; "anxiety" would silently never match.
    await expectInvalid({ specialtyTags: ['anxiety', 'Depression', 'Grief'] }, 'specialtyTags');
  });

  // Without this check, three identical tags satisfy "3 to 4" while leaving the
  // therapist with effectively one specialty.
  it('rejects duplicates even when the count is in range', async () => {
    await expectInvalid({ specialtyTags: ['Anxiety', 'Anxiety', 'Anxiety'] }, 'specialtyTags');
  });

  it('accepts every tag in the master list as a valid choice', async () => {
    for (const tag of SPECIALTY_TAGS) {
      const others = SPECIALTY_TAGS.filter((t) => t !== tag).slice(0, 2);
      const doc = new TherapistApplication(validApplication({ specialtyTags: [tag, ...others] }));
      await expect(doc.validate()).resolves.toBeUndefined();
    }
  });
});

describe('TherapistApplication — treatment orientations (display only)', () => {
  it('rejects an empty array', async () => {
    await expectInvalid({ treatmentOrientations: [] }, 'treatmentOrientations');
  });

  it('rejects more than 5', async () => {
    await expectInvalid(
      { treatmentOrientations: ['ACT', 'CBT', 'DBT', 'EMDR', 'Mindfulness', 'Art Therapy'] },
      'treatmentOrientations',
    );
  });

  it('accepts exactly 1', async () => {
    const doc = new TherapistApplication(validApplication({ treatmentOrientations: ['CBT'] }));
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it('accepts exactly 5', async () => {
    const doc = new TherapistApplication(
      validApplication({
        treatmentOrientations: ['ACT', 'CBT', 'DBT', 'EMDR', 'Mindfulness'],
      }),
    );
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it('rejects a value not in the 33-item list', async () => {
    await expectInvalid({ treatmentOrientations: ['Reiki'] }, 'treatmentOrientations');
  });

  it('rejects duplicates', async () => {
    await expectInvalid({ treatmentOrientations: ['CBT', 'CBT'] }, 'treatmentOrientations');
  });

  it('has 33 orientations available, and accepts each one', async () => {
    expect(TREATMENT_ORIENTATIONS).toHaveLength(33);
    for (const orientation of TREATMENT_ORIENTATIONS) {
      const doc = new TherapistApplication(
        validApplication({ treatmentOrientations: [orientation] }),
      );
      await expect(doc.validate()).resolves.toBeUndefined();
    }
  });
});

describe('TherapistApplication — therapistType character limit', () => {
  it(`accepts exactly ${THERAPIST_TYPE_MAX} characters`, async () => {
    const doc = new TherapistApplication(
      validApplication({ therapistType: 'x'.repeat(THERAPIST_TYPE_MAX) }),
    );
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it(`rejects ${THERAPIST_TYPE_MAX + 1} characters`, async () => {
    await expectInvalid({ therapistType: 'x'.repeat(THERAPIST_TYPE_MAX + 1) }, 'therapistType');
  });

  it('rejects an empty therapist type', async () => {
    await expectInvalid({ therapistType: '' }, 'therapistType');
  });
});

describe('TherapistApplication — working hours', () => {
  it('rejects an application with no day enabled', async () => {
    await expectInvalid(
      { workingHours: { monday: { enabled: false }, note: '' } },
      'workingHours',
    );
  });

  it('rejects an enabled day with no times', async () => {
    await expectInvalid({ workingHours: { tuesday: { enabled: true } } }, 'workingHours.tuesday');
  });

  it('rejects a non 24-hour time', async () => {
    await expectInvalid(
      { workingHours: { monday: { enabled: true, start: '9am', end: '5pm' } } },
      'workingHours.monday',
    );
  });

  it('rejects an hour above 23', async () => {
    await expectInvalid(
      { workingHours: { monday: { enabled: true, start: '25:00', end: '26:00' } } },
      'workingHours.monday',
    );
  });

  it('rejects an end time before the start time', async () => {
    await expectInvalid(
      { workingHours: { monday: { enabled: true, start: '17:00', end: '09:00' } } },
      'workingHours.monday',
    );
  });

  it('rejects an end time equal to the start time', async () => {
    await expectInvalid(
      { workingHours: { monday: { enabled: true, start: '09:00', end: '09:00' } } },
      'workingHours.monday',
    );
  });

  it('ignores times on days that are not enabled', async () => {
    const doc = new TherapistApplication(
      validApplication({
        workingHours: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '18:00', end: '09:00' },
        },
      }),
    );
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it('accepts all seven days enabled', async () => {
    const everyDay = {};
    for (const day of [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]) {
      everyDay[day] = { enabled: true, start: '08:00', end: '20:00' };
    }
    const doc = new TherapistApplication(validApplication({ workingHours: everyDay }));
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it('keeps the free-text note for unusual availability', async () => {
    const saved = await TherapistApplication.create(
      validApplication({
        workingHours: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          note: 'Also available 22:00-02:00 on request.',
        },
      }),
    );
    expect(saved.workingHours.note).toContain('22:00-02:00');
  });
});

describe('TherapistApplication — conditional and numeric rules', () => {
  it('requires details when disciplinary actions is true', async () => {
    await expectInvalid({ disciplinaryActions: true }, 'disciplinaryDetails');
  });

  it('accepts disciplinary actions true when details are given', async () => {
    const doc = new TherapistApplication(
      validApplication({
        disciplinaryActions: true,
        disciplinaryDetails: 'Formal warning in 2014, resolved.',
      }),
    );
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  // The model records; the admin decides. Neither of these auto-rejects.
  it('stores a disclosed disciplinary action rather than rejecting it', async () => {
    const saved = await TherapistApplication.create(
      validApplication({
        disciplinaryActions: true,
        disciplinaryDetails: 'Formal warning in 2014, resolved.',
      }),
    );
    expect(saved.status).toBe(APPLICATION_STATUS.PENDING);
  });

  it('stores a "no insurance" answer rather than rejecting it', async () => {
    const saved = await TherapistApplication.create(
      validApplication({ malpracticeInsurance: false }),
    );
    expect(saved.malpracticeInsurance).toBe(false);
    expect(saved.status).toBe(APPLICATION_STATUS.PENDING);
  });

  it(`rejects fewer than ${MIN_YEARS_EXPERIENCE} years of experience`, async () => {
    await expectInvalid({ yearsExperience: 1 }, 'yearsExperience');
  });

  it(`accepts exactly ${MIN_YEARS_EXPERIENCE} years`, async () => {
    const doc = new TherapistApplication(
      validApplication({ yearsExperience: MIN_YEARS_EXPERIENCE }),
    );
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it('rejects a fractional number of years', async () => {
    await expectInvalid({ yearsExperience: 4.5 }, 'yearsExperience');
  });

  it('rejects an implausible number of years', async () => {
    await expectInvalid({ yearsExperience: 200 }, 'yearsExperience');
  });

  it('rejects a date of birth in the future', async () => {
    const future = new Date(Date.now() + 86400000);
    await expectInvalid({ dateOfBirth: future }, 'dateOfBirth');
  });

  it('rejects an applicant under 18', async () => {
    const sixteen = new Date();
    sixteen.setFullYear(sixteen.getFullYear() - 16);
    await expectInvalid({ dateOfBirth: sixteen }, 'dateOfBirth');
  });

  it('rejects a malformed email', async () => {
    await expectInvalid({ email: 'not-an-email' }, 'email');
  });

  it('rejects an unknown title', async () => {
    await expectInvalid({ title: 'Captain' }, 'title');
  });

  it('rejects an unknown credential type', async () => {
    await expectInvalid({ credentialType: 'Honorary' }, 'credentialType');
  });

  it('rejects an empty languages list', async () => {
    await expectInvalid({ languages: [] }, 'languages');
  });

  it('rejects duplicate languages', async () => {
    await expectInvalid({ languages: ['English', 'English'] }, 'languages');
  });
});

describe('TherapistApplication — required fields', () => {
  const mandatory = [
    'title',
    'firstName',
    'lastName',
    'gender',
    'dateOfBirth',
    'email',
    'passwordHash',
    'photoUrl',
    'streetAddress',
    'city',
    'stateProvince',
    'zipPostal',
    'country',
    'timezone',
    'therapistType',
    'credentialType',
    'credentialInitials',
    'yearsExperience',
    'educationSummary',
    'currentWorkSituation',
    'bio',
    'licensingStatus',
    'disciplinaryActions',
    'malpracticeInsurance',
    'certificateUrl1',
  ];

  it.each(mandatory)('rejects an application missing %s', async (field) => {
    const data = validApplication();
    delete data[field];
    const doc = new TherapistApplication(data);
    await expect(doc.validate()).rejects.toThrow();
  });

  const optional = [
    'licenseNumber',
    'taxpayerIdNumber',
    'insuranceDetails',
    'certificateUrl2',
    'licenseDocUrl',
  ];

  it.each(optional)('accepts an application without %s', async (field) => {
    const data = validApplication();
    delete data[field];
    const doc = new TherapistApplication(data);
    await expect(doc.validate()).resolves.toBeUndefined();
  });
});

describe('TherapistApplication — password safety', () => {
  it('does not return the password hash on an ordinary query', async () => {
    await TherapistApplication.create(validApplication());
    const found = await TherapistApplication.findOne({ email: 'amara@example.com' });
    expect(found.passwordHash).toBeUndefined();
  });

  it('strips the password hash from toJSON even when explicitly selected', async () => {
    await TherapistApplication.create(validApplication());
    const found = await TherapistApplication.findOne({ email: 'amara@example.com' }).select(
      '+passwordHash',
    );
    expect(found.passwordHash).toBeDefined();
    expect(JSON.stringify(found)).not.toContain(found.passwordHash);
  });

  it('has no plaintext password field at all', () => {
    expect(TherapistApplication.schema.path('password')).toBeUndefined();
  });
});

describe('TherapistApplication — one live application per email', () => {
  it('rejects a second pending application for the same address', async () => {
    await TherapistApplication.create(validApplication());
    await expect(
      TherapistApplication.create(validApplication({ firstName: 'Someone else' })),
    ).rejects.toThrow(/duplicate key/i);
  });

  it('allows a reapplication after the first was rejected', async () => {
    const first = await TherapistApplication.create(validApplication());
    first.status = APPLICATION_STATUS.REJECTED;
    first.reviewedAt = new Date();
    await first.save();

    const second = await TherapistApplication.create(validApplication());
    expect(second.status).toBe(APPLICATION_STATUS.PENDING);

    // Both records are retained — the history is not overwritten.
    expect(await TherapistApplication.countDocuments({ email: 'amara@example.com' })).toBe(2);
  });

  it('allows a different address to apply while one is pending', async () => {
    await TherapistApplication.create(validApplication());
    const other = await TherapistApplication.create(
      validApplication({ email: 'other@example.com' }),
    );
    expect(other._id).toBeDefined();
  });
});
