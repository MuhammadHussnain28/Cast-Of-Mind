import {
  hashPassword,
  comparePassword,
  BCRYPT_COST,
  MAX_PASSWORD_BYTES,
} from './password.js';

describe('hashPassword', () => {
  it('produces a bcrypt hash that is not the plaintext', async () => {
    const plain = 'correct-horse-battery-staple';
    const hash = await hashPassword(plain);

    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(plain);
    expect(hash).not.toContain(plain);
    // bcrypt format: $2b$<cost>$<22-char salt><31-char digest>
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);
  });

  it('applies the configured cost factor', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(hash.split('$')[2]).toBe(String(BCRYPT_COST));
  });

  it('salts, so the same password hashes differently every time', async () => {
    const plain = 'correct-horse-battery-staple';
    const [first, second] = await Promise.all([hashPassword(plain), hashPassword(plain)]);

    expect(first).not.toBe(second);
    // Both must still verify — different salt, same password.
    expect(await comparePassword(plain, first)).toBe(true);
    expect(await comparePassword(plain, second)).toBe(true);
  });

  it('rejects a missing or non-string password rather than hashing junk', async () => {
    await expect(hashPassword('')).rejects.toThrow(TypeError);
    await expect(hashPassword(undefined)).rejects.toThrow(TypeError);
    await expect(hashPassword(null)).rejects.toThrow(TypeError);
    await expect(hashPassword(12345678)).rejects.toThrow(TypeError);
  });
});

describe('comparePassword', () => {
  it('returns true for the correct password', async () => {
    const plain = 'correct-horse-battery-staple';
    const hash = await hashPassword(plain);

    expect(await comparePassword(plain, hash)).toBe(true);
  });

  it('returns false for an incorrect password', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');

    expect(await comparePassword('wrong-horse-battery-staple', hash)).toBe(false);
    expect(await comparePassword('Correct-horse-battery-staple', hash)).toBe(false);
    expect(await comparePassword('correct-horse-battery-stapl', hash)).toBe(false);
    expect(await comparePassword('', hash)).toBe(false);
  });

  it('returns false instead of throwing when the stored hash is unusable', async () => {
    // A corrupt or absent hash must fail the login cleanly, not raise a 500 that
    // would signal to an attacker that this record is unusual.
    await expect(comparePassword('anything', 'not-a-bcrypt-hash')).resolves.toBe(false);
    await expect(comparePassword('anything', '')).resolves.toBe(false);
    await expect(comparePassword('anything', undefined)).resolves.toBe(false);
    await expect(comparePassword('anything', null)).resolves.toBe(false);
  });

  it('documents bcrypt truncating input beyond the byte limit', async () => {
    // Not a bug being tolerated — proof of WHY MAX_PASSWORD_BYTES must be
    // enforced by the validation layer in the auth chunks. Two distinct
    // passwords sharing their first 72 bytes verify against the same hash.
    const base = 'a'.repeat(MAX_PASSWORD_BYTES);
    const hash = await hashPassword(`${base}FIRST`);

    expect(await comparePassword(`${base}SECOND`, hash)).toBe(true);
  });
});
