import { Readable } from 'node:stream';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { worksheetFileKindSchema } from '../validation/worksheets.schema.js';
import {
  assignWorksheet,
  listWorksheets,
  fetchWorksheetFile,
  withdrawWorksheet,
  markWorksheetReviewed,
  listClientWorksheets,
  fetchClientWorksheetFile,
  submitWorksheet,
} from '../services/worksheet.service.js';

const notFound = () => new AppError('We could not find that worksheet.', 404, 'WORKSHEET_NOT_FOUND');

function parseWhich(value) {
  const which = worksheetFileKindSchema.safeParse(value);
  if (!which.success) throw notFound();
  return which.data;
}

// One set of download headers for both roles.
function sendFile(res, { body, contentType, contentLength, filename }) {
  res.setHeader('Content-Type', contentType);
  // ASCII fallback plus the RFC 5987 form for titles in any language.
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  if (contentLength) res.setHeader('Content-Length', contentLength);
  Readable.fromWeb(body).pipe(res);
}

function requireFile(req) {
  if (!req.file) throw new AppError('Choose a file to upload.', 400, 'UPLOAD_REJECTED');
  return req.file.buffer;
}

// ── therapist ──

export const assign = asyncHandler(async (req, res) => {
  const buffer = requireFile(req);
  const { bookingId, title } = req.body;
  res.status(201).json(await assignWorksheet(req.user.id, { bookingId, title, buffer }));
});

export const list = asyncHandler(async (req, res) => {
  const { cursor, limit } = req.validatedQuery;
  res.status(200).json(await listWorksheets(req.user.id, req.params.bookingId, { cursor, limit }));
});

export const download = asyncHandler(async (req, res) => {
  const which = parseWhich(req.params.which);
  sendFile(
    res,
    await fetchWorksheetFile(req.user.id, req.params.bookingId, req.params.worksheetId, which),
  );
});

export const withdraw = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(await withdrawWorksheet(req.user.id, req.params.bookingId, req.params.worksheetId));
});

export const review = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(await markWorksheetReviewed(req.user.id, req.params.bookingId, req.params.worksheetId));
});

// ── client ──

export const clientList = asyncHandler(async (req, res) => {
  const { cursor, limit } = req.validatedQuery;
  res.status(200).json(await listClientWorksheets(req.user.id, { cursor, limit }));
});

export const clientDownload = asyncHandler(async (req, res) => {
  const which = parseWhich(req.params.which);
  sendFile(res, await fetchClientWorksheetFile(req.user.id, req.params.worksheetId, which));
});

export const clientSubmit = asyncHandler(async (req, res) => {
  const buffer = requireFile(req);
  res.status(200).json(await submitWorksheet(req.user.id, req.params.worksheetId, buffer));
});
