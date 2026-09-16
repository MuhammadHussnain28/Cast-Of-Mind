import mongoose from 'mongoose';
import { MongoMemoryServer, MongoMemoryReplSet } from 'mongodb-memory-server';

// A real MongoDB instance, in memory, per test file.
//
// A real database is not optional here: `unique: true` on a schema is an index
// enforced by MongoDB on write, not a Mongoose validator. Mocking the driver
// would make the duplicate-email test assert nothing.

let mongod;

/**
 * How long to let `mongod` get to the point of listening.
 *
 * The library's default is 10 seconds, and on a loaded Windows machine that is
 * not enough: a whole suite fails with "Instance failed to start within
 * 10000ms" and every single test in the file reports as broken, which looks
 * exactly like a code failure and is not one. Observed repeatedly on 2026-09-16
 * whenever anything else was running alongside the run.
 *
 * Raising it costs nothing when the machine is idle — the binary is already on
 * disk, so nothing is downloaded and a healthy start still takes a second or
 * two. It only changes how long we wait before declaring a slow start dead.
 */
const LAUNCH_TIMEOUT_MS = 60_000;

export async function startMemoryMongo() {
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: LAUNCH_TIMEOUT_MS } });
  await mongoose.connect(mongod.getUri());
}

/**
 * The same, but as a single-node REPLICA SET.
 *
 * MongoDB transactions are unavailable on a standalone instance, so a rollback
 * test against `startMemoryMongo` would pass while proving nothing — the writes
 * would simply all succeed. The approval flow (chunk 4.3) creates `users` and
 * `therapistProfiles` atomically and must be tested against real transactions.
 *
 * It is a separate export rather than the default because a replica set takes
 * around four seconds to elect, and only one suite needs it.
 */
export async function startMemoryReplSet() {
  mongod = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [{ launchTimeout: LAUNCH_TIMEOUT_MS }],
  });
  await mongoose.connect(mongod.getUri());
}

export async function stopMemoryMongo() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

export async function clearCollections() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
}
