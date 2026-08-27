import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// A real MongoDB instance, in memory, per test file.
//
// A real database is not optional here: `unique: true` on a schema is an index
// enforced by MongoDB on write, not a Mongoose validator. Mocking the driver
// would make the duplicate-email test assert nothing.

let mongod;

export async function startMemoryMongo() {
  mongod = await MongoMemoryServer.create();
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
