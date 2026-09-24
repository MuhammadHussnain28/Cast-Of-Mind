import mongoose from 'mongoose';
import { Worksheet } from '../models/Worksheet.js';
import { Booking } from '../models/Booking.js';
import { AppError } from '../utils/AppError.js';
import { encodeCursor, decodeCursor } from '../utils/cursor.js';
import { signedDocumentUrl } from '../utils/cloudinaryDelivery.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { emitWorksheetsUpdate, getSocketServer } from '../realtime/emitter.js';
import { notifyQuietly } from './notification.service.js';
import { NOTIFICATION_TYPE } from '../constants/notifications.js';
import { uploadFile, destroyFile } from './upload.service.js';
import { loadOwnBooking } from './therapistClient.service.js';
import { BOOKING_STATUS } from '../constants/payments.js';
import { UPLOAD_NOT_CONFIGURED_MESSAGE } from '../constants/uploads.js';
import {
  WORKSHEET_STATUS,
  WORKSHEET_FILE_KINDS,
  WORKSHEET_CONTENT_TYPES,
  WORKSHEETS_PAGE_SIZE,
  WORKSHEET_NOT_FOUND_MESSAGE,
  WORKSHEET_NOT_FOUND_CODE,
  BOOKING_ENDED_MESSAGE,
  BOOKING_ENDED_CODE,
  WITHDRAW_REFUSED_MESSAGE,
  WITHDRAW_REFUSED_CODE,
  FILE_NOT_AVAILABLE_MESSAGE,
  ALREADY_REVIEWED_MESSAGE,
  ALREADY_REVIEWED_CODE,
  NOT_RETURNED_MESSAGE,
  NOT_RETURNED_CODE,
} from '../constants/worksheets.js';

// Worksheets — §7.2, §8.3. Files only; no in-app forms.
// privateNotes is never imported or reached from here.
// Titles are never logged: they can name the client or their difficulty.

const notFound = () => new AppError(WORKSHEET_NOT_FOUND_MESSAGE, 404, WORKSHEET_NOT_FOUND_CODE);
const unavailable = () => new AppError(FILE_NOT_AVAILABLE_MESSAGE, 502, 'FILE_UNAVAILABLE');

// ── shared ──────────────────────────────────────────────────────────────────

// What either browser gets. No URL and no storage id, ever.
function present(worksheet) {
  const file = (prefix) =>
    worksheet[`${prefix}FilePublicId`]
      ? { format: worksheet[`${prefix}FileFormat`], bytes: worksheet[`${prefix}FileBytes`] ?? null }
      : null;

  return {
    id: String(worksheet._id),
    title: worksheet.title,
    status: worksheet.status,
    assignedAt: worksheet.assignedAt,
    completedAt: worksheet.completedAt ?? null,
    reviewedAt: worksheet.reviewedAt ?? null,
    assignedFile: file('assigned'),
    completedFile: file('completed'),
  };
}

// A worksheet only exists for the booking it was assigned in.
async function loadWorksheet(booking, worksheetId) {
  if (!mongoose.isValidObjectId(worksheetId)) throw notFound();
  const worksheet = await Worksheet.findOne({ _id: worksheetId, bookingId: booking._id });
  if (!worksheet) throw notFound();
  return worksheet;
}

async function pageOf(booking, { cursor, limit } = {}) {
  const pageSize = limit ?? WORKSHEETS_PAGE_SIZE;
  const query = { bookingId: booking._id };
  if (cursor) {
    const at = decodeCursor(cursor);
    if (!at) throw new AppError('That page reference is not valid.', 400, 'INVALID_CURSOR');
    query.$or = [{ assignedAt: { $lt: at.at } }, { assignedAt: at.at, _id: { $lt: at.id } }];
  }

  const [rows, counts] = await Promise.all([
    Worksheet.find(query).sort({ assignedAt: -1, _id: -1 }).limit(pageSize + 1),
    Worksheet.aggregate([
      { $match: { bookingId: booking._id } },
      { $group: { _id: '$status', n: { $sum: 1 } } },
    ]),
  ]);

  const hasMore = rows.length > pageSize;
  const page = hasMore ? rows.slice(0, pageSize) : rows;
  const last = page[page.length - 1];
  const byStatus = Object.fromEntries(counts.map((row) => [row._id, row.n]));

  return {
    data: page.map(present),
    meta: {
      hasMore,
      nextCursor: hasMore && last ? encodeCursor(last.assignedAt, last._id) : null,
      counts: {
        assigned: byStatus[WORKSHEET_STATUS.ASSIGNED] ?? 0,
        completed: byStatus[WORKSHEET_STATUS.COMPLETED] ?? 0,
      },
    },
  };
}

// "Grief reflection (week 2)" → "Grief reflection week 2.pdf"; never empty.
export function downloadFilename(title, format) {
  const safe = String(title ?? '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return `${safe || 'worksheet'}.${format}`;
}

async function streamFile(worksheet, which) {
  const prefix = which === WORKSHEET_FILE_KINDS.COMPLETED ? 'completed' : 'assigned';
  const publicId = worksheet[`${prefix}FilePublicId`];
  const format = worksheet[`${prefix}FileFormat`];
  const resourceType = worksheet[`${prefix}FileResourceType`] ?? 'image';
  if (!publicId || !format) throw notFound();

  if (!isCloudinaryConfigured) {
    throw new AppError(UPLOAD_NOT_CONFIGURED_MESSAGE, 503, 'UPLOADS_NOT_CONFIGURED');
  }

  let upstream;
  try {
    // A raw file's extension is part of its public id, so no format is passed.
    upstream = await fetch(
      signedDocumentUrl({ publicId, resourceType, format: resourceType === 'raw' ? undefined : format }),
    );
  } catch (error) {
    console.error('Worksheet file fetch failed:', error?.message ?? error);
    throw unavailable();
  }
  if (!upstream.ok) {
    console.error(`Worksheet file fetch failed [http ${upstream.status}]`);
    throw unavailable();
  }

  const suffix = prefix === 'completed' ? ' answers' : '';
  return {
    body: upstream.body,
    // From our own list — the upstream's header is never trusted.
    contentType: WORKSHEET_CONTENT_TYPES[format] ?? 'application/octet-stream',
    contentLength: upstream.headers.get('content-length'),
    filename: downloadFilename(`${worksheet.title}${suffix}`, format),
  };
}

// Tell the client's open portal how many are still to complete (the nav dot).
// Best effort: the write already succeeded, so a failure here is only logged.
async function pushPending(booking) {
  if (!getSocketServer()) return;
  try {
    emitWorksheetsUpdate(booking.clientId, await countPendingWorksheets(booking._id));
  } catch (error) {
    console.error('Worksheet count push failed:', error?.message ?? error);
  }
}

// ── therapist ───────────────────────────────────────────────────────────────

export async function assignWorksheet(therapistUserId, { bookingId, title, buffer }) {
  // Ownership BEFORE the upload, so nothing is stored for someone else's client.
  const booking = await loadOwnBooking(bookingId, therapistUserId);
  if (booking.status === BOOKING_STATUS.ENDED) {
    throw new AppError(BOOKING_ENDED_MESSAGE, 409, BOOKING_ENDED_CODE);
  }

  const stored = await uploadFile({ buffer, kind: 'worksheet' });

  let worksheet;
  try {
    worksheet = await Worksheet.create({
      bookingId: booking._id,
      title,
      assignedFileUrl: stored.url,
      assignedFilePublicId: stored.publicId,
      assignedFileResourceType: stored.resourceType,
      assignedFileFormat: stored.type,
      assignedFileBytes: stored.bytes,
    });
  } catch (error) {
    // No record means no file: never leave an orphan in storage.
    await destroyFile({ publicId: stored.publicId, resourceType: stored.resourceType });
    throw error;
  }

  await pushPending(booking);
  return present(worksheet);
}

export async function listWorksheets(therapistUserId, bookingId, options) {
  const booking = await loadOwnBooking(bookingId, therapistUserId);
  return pageOf(booking, options);
}

export async function fetchWorksheetFile(therapistUserId, bookingId, worksheetId, which) {
  const booking = await loadOwnBooking(bookingId, therapistUserId);
  return streamFile(await loadWorksheet(booking, worksheetId), which);
}

export async function withdrawWorksheet(therapistUserId, bookingId, worksheetId) {
  const booking = await loadOwnBooking(bookingId, therapistUserId);
  if (!mongoose.isValidObjectId(worksheetId)) throw notFound();

  // One atomic step: a client returning it at the same moment keeps their work.
  const removed = await Worksheet.findOneAndDelete({
    _id: worksheetId,
    bookingId: booking._id,
    status: WORKSHEET_STATUS.ASSIGNED,
  });

  if (!removed) {
    const stillThere = await Worksheet.exists({ _id: worksheetId, bookingId: booking._id });
    if (stillThere) throw new AppError(WITHDRAW_REFUSED_MESSAGE, 409, WITHDRAW_REFUSED_CODE);
    throw notFound();
  }

  await destroyFile({
    publicId: removed.assignedFilePublicId,
    resourceType: removed.assignedFileResourceType ?? 'image',
  });
  await pushPending(booking);

  return { id: String(removed._id), withdrawn: true };
}

// Idempotent: reviewing twice keeps the first date.
export async function markWorksheetReviewed(therapistUserId, bookingId, worksheetId) {
  const booking = await loadOwnBooking(bookingId, therapistUserId);
  const worksheet = await loadWorksheet(booking, worksheetId);

  if (worksheet.status !== WORKSHEET_STATUS.COMPLETED) {
    throw new AppError(NOT_RETURNED_MESSAGE, 409, NOT_RETURNED_CODE);
  }
  if (worksheet.reviewedAt) return present(worksheet);

  const updated = await Worksheet.findOneAndUpdate(
    { _id: worksheet._id, status: WORKSHEET_STATUS.COMPLETED, reviewedAt: null },
    { $set: { reviewedAt: new Date() } },
    { new: true },
  );
  return present(updated ?? (await Worksheet.findById(worksheet._id)));
}

// ── client ──────────────────────────────────────────────────────────────────

// The client's own active booking — found from the token, never from a URL.
async function loadClientBooking(clientUserId) {
  const booking = await Booking.findOne({ clientId: clientUserId, status: BOOKING_STATUS.ACTIVE });
  if (!booking) throw notFound();
  return booking;
}

export async function listClientWorksheets(clientUserId, options) {
  return pageOf(await loadClientBooking(clientUserId), options);
}

export async function fetchClientWorksheetFile(clientUserId, worksheetId, which) {
  const booking = await loadClientBooking(clientUserId);
  return streamFile(await loadWorksheet(booking, worksheetId), which);
}

export async function submitWorksheet(clientUserId, worksheetId, buffer) {
  const booking = await loadClientBooking(clientUserId);
  const existing = await loadWorksheet(booking, worksheetId);

  // Refused before any upload, so a locked worksheet never costs storage.
  if (existing.reviewedAt) throw new AppError(ALREADY_REVIEWED_MESSAGE, 409, ALREADY_REVIEWED_CODE);

  const stored = await uploadFile({ buffer, kind: 'worksheetReturn' });

  // Atomic: only while NOT reviewed. `previous` holds any file being replaced.
  let previous;
  try {
    previous = await Worksheet.findOneAndUpdate(
      { _id: existing._id, bookingId: booking._id, reviewedAt: null },
      {
        $set: {
          status: WORKSHEET_STATUS.COMPLETED,
          completedAt: new Date(),
          completedFileUrl: stored.url,
          completedFilePublicId: stored.publicId,
          completedFileResourceType: stored.resourceType,
          completedFileFormat: stored.type,
          completedFileBytes: stored.bytes,
        },
      },
      { new: false },
    );
  } catch (error) {
    await destroyFile({ publicId: stored.publicId, resourceType: stored.resourceType });
    throw error;
  }

  if (!previous) {
    // Reviewed (or withdrawn) between the check and the write.
    await destroyFile({ publicId: stored.publicId, resourceType: stored.resourceType });
    const stillThere = await Worksheet.exists({ _id: existing._id });
    if (stillThere) throw new AppError(ALREADY_REVIEWED_MESSAGE, 409, ALREADY_REVIEWED_CODE);
    throw notFound();
  }

  // A replaced file is removed only after the new one is safely recorded.
  if (previous.completedFilePublicId) {
    await destroyFile({
      publicId: previous.completedFilePublicId,
      resourceType: previous.completedFileResourceType ?? 'image',
    });
  }

  await pushPending(booking);

  // 10.4: the therapist's bell. Written after the worksheet is safely recorded,
  // carries no title, and can never fail the return — a client's answers are in
  // whatever the bell does.
  await notifyQuietly({
    userId: booking.therapistId,
    type: NOTIFICATION_TYPE.WORKSHEET_SUBMITTED,
    bookingId: booking._id,
  });

  return present(await Worksheet.findById(existing._id));
}

export async function countPendingWorksheets(bookingId) {
  return Worksheet.countDocuments({ bookingId, status: WORKSHEET_STATUS.ASSIGNED });
}
