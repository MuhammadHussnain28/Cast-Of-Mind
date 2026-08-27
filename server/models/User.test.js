import mongoose from 'mongoose';
import { User } from './User.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { hashPassword } from '../utils/password.js';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

let passwordHash;

beforeAll(async () => {
  await startMemoryMongo();
  // `unique: true` is an index. Build it before asserting on duplicates, or a
  // duplicate insert can succeed and the test passes for the wrong reason.
  await User.init();
  passwordHash = await hashPassword('correct-horse-battery-staple');
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

afterEach(async () => {
  await clearCollections();
});

function validUser(overrides = {}) {
  return {
    email: 'therapist@example.com',
    passwordHash,
    role: ROLES.THERAPIST,
    ...overrides,
  };
}

describe('email', () => {
  it('rejects a duplicate email', async () => {
    await User.create(validUser({ email: 'asad@example.com' }));

    await expect(
      User.create(validUser({ email: 'asad@example.com', role: ROLES.CLIENT })),
    ).rejects.toMatchObject({ code: 11000 });

    expect(await User.countDocuments({ email: 'asad@example.com' })).toBe(1);
  });

  it('treats differently-cased emails as the same account', async () => {
    // One email = one account = one role (master spec Section 3). Without
    // lowercasing, Asad@example.com and asad@example.com would be two people.
    await User.create(validUser({ email: 'Asad@Example.COM' }));

    await expect(
      User.create(validUser({ email: 'asad@example.com' })),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('lowercases and trims on save', async () => {
    const user = await User.create(validUser({ email: '  Asad@Example.COM  ' }));
    expect(user.email).toBe('asad@example.com');
  });

  it('requires an email', async () => {
    await expect(User.create(validUser({ email: undefined })))
      .rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('rejects a malformed email', async () => {
    await expect(User.create(validUser({ email: 'not-an-email' })))
      .rejects.toThrow(mongoose.Error.ValidationError);
  });
});

describe('role', () => {
  it.each([ROLES.CLIENT, ROLES.THERAPIST, ROLES.ADMIN])('accepts the %s role', async (role) => {
    const user = await User.create(validUser({ email: `${role}@example.com`, role }));
    expect(user.role).toBe(role);
  });

  it('rejects a role outside the three defined ones', async () => {
    await expect(User.create(validUser({ role: 'superadmin' })))
      .rejects.toThrow(mongoose.Error.ValidationError);

    await expect(User.create(validUser({ role: 'Client' })))
      .rejects.toThrow(mongoose.Error.ValidationError);

    expect(await User.countDocuments()).toBe(0);
  });

  it('requires a role', async () => {
    await expect(User.create(validUser({ role: undefined })))
      .rejects.toThrow(mongoose.Error.ValidationError);
  });
});

describe('status', () => {
  it('defaults to active', async () => {
    const user = await User.create(validUser());
    expect(user.status).toBe(USER_STATUS.ACTIVE);
  });

  it('rejects a status outside active/inactive', async () => {
    await expect(User.create(validUser({ status: 'suspended' })))
      .rejects.toThrow(mongoose.Error.ValidationError);
  });
});

describe('password and token fields', () => {
  it('requires a password hash', async () => {
    await expect(User.create(validUser({ passwordHash: undefined })))
      .rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('never stores the plaintext password anywhere on the document', async () => {
    const user = await User.create(validUser());
    const raw = await mongoose.connection.collection('users').findOne({ _id: user._id });

    expect(JSON.stringify(raw)).not.toContain('correct-horse-battery-staple');
    expect(raw.passwordHash).toBe(passwordHash);
  });

  it('omits the hashes from ordinary queries', async () => {
    await User.create(validUser());
    const found = await User.findOne({ email: 'therapist@example.com' });

    expect(found.passwordHash).toBeUndefined();
    expect(found.refreshTokenHash).toBeUndefined();
    expect(found.refreshTokenExpiresAt).toBeUndefined();
  });

  it('returns the hash only when explicitly selected, as login will do', async () => {
    await User.create(validUser());
    const found = await User.findOne({ email: 'therapist@example.com' }).select('+passwordHash');

    expect(found.passwordHash).toBe(passwordHash);
  });

  it('strips the hashes from toJSON even when they were selected', async () => {
    // Second line of defence: a hash must not reach a response body even if a
    // future controller fetches the document with its hidden fields.
    await User.create(validUser());
    const found = await User.findOne({ email: 'therapist@example.com' })
      .select('+passwordHash +refreshTokenHash +refreshTokenExpiresAt');

    const serialised = JSON.parse(JSON.stringify(found));

    expect(serialised.passwordHash).toBeUndefined();
    expect(serialised.refreshTokenHash).toBeUndefined();
    expect(serialised.refreshTokenExpiresAt).toBeUndefined();
    expect(serialised.email).toBe('therapist@example.com');
    expect(serialised.role).toBe(ROLES.THERAPIST);
  });

  it('defaults the refresh token fields to null for a new user', async () => {
    const user = await User.create(validUser());
    const found = await User.findById(user._id).select('+refreshTokenHash +refreshTokenExpiresAt');

    expect(found.refreshTokenHash).toBeNull();
    expect(found.refreshTokenExpiresAt).toBeNull();
  });
});

describe('timestamps', () => {
  it('records createdAt and updatedAt', async () => {
    const user = await User.create(validUser());

    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});
