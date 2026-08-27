import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { hashPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_BYTES } from '../utils/password.js';

// Creates the single admin account (Asad). Master spec Section 3: the admin is
// the only account created manually — clients arrive via payment webhook,
// therapists via admin approval.
//
// Run with:  npm run seed:admin
//            npm run seed:admin -- --force     (allow a second admin, see below)
//
// PRIVACY RULE: this script must never print ADMIN_PASSWORD. It reports the
// email and the resulting record only.

// ADMIN_EMAIL / ADMIN_PASSWORD are validated HERE, not in config/env.js, on
// purpose: they are needed by this script alone. Putting them in the server's
// required-vars list would stop the API from booting on a host that has no
// reason to hold admin credentials.
function readAdminCredentials() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  const problems = [];

  if (!email) {
    problems.push('ADMIN_EMAIL is missing.');
  }

  if (!password) {
    problems.push('ADMIN_PASSWORD is missing.');
  } else {
    if (password.length < MIN_PASSWORD_LENGTH) {
      problems.push(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
      // bcrypt truncates past this point, so anything longer is a silent trap.
      problems.push(`ADMIN_PASSWORD must be at most ${MAX_PASSWORD_BYTES} bytes.`);
    }
  }

  if (problems.length > 0) {
    console.error('Cannot seed the admin account:');
    problems.forEach((problem) => console.error(`  - ${problem}`));
    console.error('Set both values in server/.env — see .env.example.');
    process.exit(1);
  }

  return { email: email.trim().toLowerCase(), password };
}

async function seedAdmin() {
  const force = process.argv.includes('--force');
  const { email, password } = readAdminCredentials();

  await connectDB();

  // Make sure the unique index on email exists before writing, so a race or a
  // fresh database cannot admit a duplicate.
  await User.init();

  // Idempotent: never touch an account that already exists. Silently resetting a
  // live admin's password because someone re-ran a seed script would be a real
  // outage, and the spec's recovery path is "Forgot password", not re-seeding.
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin already exists for ${email} — no changes made.`);
    console.log(`  id: ${existing._id}  role: ${existing.role}  status: ${existing.status}`);
    return;
  }

  // The platform is specified for exactly one admin. If a different admin is
  // already present, stop rather than quietly building a second one.
  const otherAdmin = await User.findOne({ role: ROLES.ADMIN });

  if (otherAdmin && !force) {
    console.error(`An admin account already exists under a different email: ${otherAdmin.email}`);
    console.error('The platform is specified for a single admin (master spec Section 3).');
    console.error('Re-run with --force if a second admin is genuinely intended.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const admin = await User.create({
    email,
    passwordHash,
    role: ROLES.ADMIN,
    status: USER_STATUS.ACTIVE,
  });

  console.log('Admin account created.');
  console.log(`  id: ${admin._id}`);
  console.log(`  email: ${admin.email}`);
  console.log(`  role: ${admin.role}  status: ${admin.status}`);
  console.log('  password: stored as a bcrypt hash (never in readable form).');
}

seedAdmin()
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(`Seeding failed: ${err.message}`);
    if (mongoose.connection.readyState === 1) {
      await disconnectDB();
    }
    process.exit(1);
  });
