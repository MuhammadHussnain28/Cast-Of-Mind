import mongoose from 'mongoose';
import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { SEED_THERAPISTS, SEED_EMAIL_DOMAIN } from './seedTherapists.data.js';
import { SPECIALTY_TAGS } from '../constants/specialtyTags.js';

/**
 * Fake therapists, so the matching engine can be exercised by hand.
 *
 *   npm run seed:therapists          create them
 *   npm run seed:therapists:remove   delete every one of them
 *
 * WHY THIS EXISTS: with one real therapist in the database, every matching
 * scenario returns that one person — the gender sort is invisible, and a match
 * and the silent fallback look identical. The rule the engine is built around
 * is precisely the one that cannot be checked.
 *
 * TWO SAFETY PROPERTIES, BOTH DELIBERATE:
 *
 *  1. IT REFUSES TO RUN IN PRODUCTION. A fake therapist on the live site is a
 *     real person choosing someone who does not exist, and paying for it.
 *  2. IT ONLY EVER TOUCHES ITS OWN RECORDS. Every seeded account lives on
 *     @seed.castofmind.test — `.test` is reserved (RFC 2606) and can never be a
 *     real address — and the teardown deletes by that suffix and nothing else.
 *     Real therapists cannot be caught by it.
 */

const SEED_PASSWORD = 'SeedTherapist!2026';

function refuseInProduction() {
  if (env.isProduction || process.env.NODE_ENV === 'production') {
    console.error('Refusing to run: this script is for development only.');
    console.error('Seeded therapists on a live site would be shown to real people.');
    process.exit(1);
  }
}

async function createSeeds() {
  const passwordHash = await hashPassword(SEED_PASSWORD);
  let createdUsers = 0;
  let createdProfiles = 0;
  let repaired = 0;

  for (const therapist of SEED_THERAPISTS) {
    const { slug, email, ...profileFields } = therapist;
    void slug;

    // FIND-OR-CREATE EACH DOCUMENT INDEPENDENTLY, rather than skipping the whole
    // therapist when the user already exists.
    //
    // The first version skipped, and that was wrong: the very first real run
    // failed after writing a user but before its profile, leaving an orphaned
    // user that every later run then skipped for ever. That is the half-created
    // account the spec calls a serious failure state. Written independently, a
    // re-run repairs it instead of entrenching it.
    let user = await User.findOne({ email });
    const userExisted = Boolean(user);

    if (!user) {
      user = await User.create({
        email,
        passwordHash,
        role: ROLES.THERAPIST,
        status: USER_STATUS.ACTIVE,
      });
      createdUsers += 1;
    }

    const profile = await TherapistProfile.findOne({ userId: user._id });
    if (!profile) {
      await TherapistProfile.create({
        ...profileFields,
        userId: user._id,
        // Required by the model (4.3, linking back to the application). A seed
        // has no application, so this points nowhere — another marker that the
        // record is not real.
        applicationId: new mongoose.Types.ObjectId(),
        status: USER_STATUS.ACTIVE,
      });
      createdProfiles += 1;
      if (userExisted) repaired += 1;
    }
  }

  const total = await TherapistProfile.countDocuments({ status: USER_STATUS.ACTIVE });

  console.log('');
  console.log(`Created ${createdUsers} user(s) and ${createdProfiles} profile(s).`);
  if (repaired > 0) {
    console.log(`Repaired ${repaired} user(s) left without a profile by an earlier partial run.`);
  }
  console.log(`Active therapists in the database now: ${total}`);
  console.log('');
  console.log(`Sign in as any of them with: ${SEED_PASSWORD}`);
  console.log(`Emails follow firstname-lastname@${SEED_EMAIL_DOMAIN}`);
  console.log('');
  await reportFallbackTags();
  console.log('');
  console.log('Remove them all with: npm run seed:therapists:remove');
  console.log('');
}

/**
 * Which tags does NOBODY currently carry?
 *
 * COMPUTED, NOT ASSUMED. The first version hardcoded three tags it believed
 * were free — and one of them was carried by the real therapist already in the
 * database, so the "fallback" scenario quietly returned a genuine match of one
 * instead. Whatever real therapists exist, this always names tags that actually
 * trigger the fallback.
 */
async function reportFallbackTags() {
  const active = await TherapistProfile.find({ status: USER_STATUS.ACTIVE }).select('specialtyTags');
  const taken = new Set(active.flatMap((profile) => profile.specialtyTags));
  const free = SPECIALTY_TAGS.filter((tag) => !taken.has(tag));

  if (free.length === 0) {
    console.log('Every concern tag is carried by someone, so the silent fallback');
    console.log('cannot be reached right now. Deactivate a therapist to free one up.');
    return;
  }

  console.log('To see the SILENT FALLBACK, choose ONLY from these in the questionnaire:');
  console.log(`  ${free.join(' | ')}`);
  console.log('Nobody in the database carries them, so nothing overlaps and every');
  console.log('therapist comes back with no message at all - which is the rule.');
}

async function removeSeeds() {
  const pattern = new RegExp(`@${SEED_EMAIL_DOMAIN.replace(/\./g, '\\.')}$`, 'i');

  const users = await User.find({ email: pattern }).select('_id email');
  const ids = users.map((user) => user._id);

  const profiles = await TherapistProfile.deleteMany({ userId: { $in: ids } });
  const removed = await User.deleteMany({ _id: { $in: ids } });

  // Proof the teardown was surgical: whatever else is in there is still there.
  const remainingUsers = await User.countDocuments();
  const remainingProfiles = await TherapistProfile.countDocuments();

  console.log('');
  console.log(`Removed ${removed.deletedCount} seeded user(s) and ${profiles.deletedCount} profile(s).`);
  console.log(`Untouched records remaining: ${remainingUsers} user(s), ${remainingProfiles} profile(s).`);
  console.log('');
}

async function main() {
  refuseInProduction();

  const remove = process.argv.includes('--remove');
  await connectDB();

  try {
    if (remove) await removeSeeds();
    else await createSeeds();
  } finally {
    await disconnectDB();
  }
}

main().catch(async (error) => {
  console.error('Seed script failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
