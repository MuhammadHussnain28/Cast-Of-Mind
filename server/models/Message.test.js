import mongoose from 'mongoose';
import { Message } from './Message.js';
import { MESSAGE_TYPE, MESSAGE_TEXT_MAX } from '../constants/chat.js';
import { startMemoryMongo, stopMemoryMongo, clearCollections } from '../test/mongoMemory.js';

const bookingId = new mongoose.Types.ObjectId();
const senderId = new mongoose.Types.ObjectId();

const base = (overrides = {}) => ({ bookingId, senderId, text: 'Hello.', ...overrides });

beforeAll(async () => {
  await startMemoryMongo();
  await Message.init();
}, 60000);

afterAll(async () => {
  await stopMemoryMongo();
});

afterEach(async () => {
  await clearCollections();
});

describe('the messages schema', () => {
  it('stores a message with the spec fields and nothing else', async () => {
    const message = await Message.create(base());
    const raw = await mongoose.connection.db
      .collection('messages')
      .findOne({ _id: message._id });

    expect(Object.keys(raw).sort()).toEqual(
      ['_id', '__v', 'bookingId', 'senderId', 'text', 'type', 'read', 'createdAt'].sort(),
    );
  });

  it('defaults to a text message that has not been read', async () => {
    const message = await Message.create(base());
    expect(message.type).toBe(MESSAGE_TYPE.TEXT);
    expect(message.read).toBe(false);
  });

  it('carries createdAt but NOT updatedAt — a message is never edited', async () => {
    const message = await Message.create(base());
    expect(message.createdAt).toBeInstanceOf(Date);
    expect(message.updatedAt).toBeUndefined();
  });

  it('requires a booking, a sender and text', async () => {
    await expect(Message.create({ senderId, text: 'x' })).rejects.toThrow(/booking/i);
    await expect(Message.create({ bookingId, text: 'x' })).rejects.toThrow(/sender/i);
    await expect(Message.create({ bookingId, senderId })).rejects.toThrow(/empty/i);
  });

  it('refuses an empty or whitespace-only message', async () => {
    await expect(Message.create(base({ text: '' }))).rejects.toThrow(/empty/i);
    await expect(Message.create(base({ text: '   ' }))).rejects.toThrow(/empty/i);
  });

  it('trims surrounding whitespace', async () => {
    const message = await Message.create(base({ text: '  Hello.  ' }));
    expect(message.text).toBe('Hello.');
  });

  it(`accepts exactly ${MESSAGE_TEXT_MAX} characters and refuses one more`, async () => {
    await expect(Message.create(base({ text: 'a'.repeat(MESSAGE_TEXT_MAX) }))).resolves.toBeTruthy();
    await expect(Message.create(base({ text: 'a'.repeat(MESSAGE_TEXT_MAX + 1) }))).rejects.toThrow(
      new RegExp(`${MESSAGE_TEXT_MAX} characters`),
    );
  });

  it('allows the system type, for the platform to write in 9.3', async () => {
    const message = await Message.create(base({ type: MESSAGE_TYPE.SYSTEM }));
    expect(message.type).toBe(MESSAGE_TYPE.SYSTEM);
  });

  it('refuses an unknown type, and names the real list rather than a {VALUES} token', async () => {
    await expect(Message.create(base({ type: 'voice' }))).rejects.toThrow(/text, system/);
  });

  it('indexes the conversation fetch and the unread count', async () => {
    const names = (await Message.collection.indexes()).map((index) => index.key);

    expect(names).toContainEqual({ bookingId: 1, createdAt: -1, _id: -1 });
    expect(names).toContainEqual({ bookingId: 1, read: 1, senderId: 1 });
  });

  it('is the collection the rest of the platform expects to find', () => {
    expect(Message.collection.name).toBe('messages');
  });
});
