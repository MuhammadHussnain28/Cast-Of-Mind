import { Readable } from 'node:stream';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import {
  listApplications,
  getApplication,
  fetchApplicationDocument,
} from '../services/adminApplications.service.js';
import {
  applicationIdSchema,
  documentFieldSchema,
} from '../validation/adminApplications.schema.js';
import {
  approveApplication,
  rejectApplication,
} from '../services/adminApprovals.service.js';

function parseId(rawId) {
  const result = applicationIdSchema.safeParse(rawId);
  if (!result.success) {
    throw new AppError(result.error.issues[0].message, 400, 'INVALID_APPLICATION_ID');
  }
  return result.data;
}

export const listApplicationsController = asyncHandler(async (req, res) => {
  const result = await listApplications(req.validatedQuery);
  res.status(200).json(result);
});

export const getApplicationController = asyncHandler(async (req, res) => {
  const application = await getApplication(parseId(req.params.id));
  res.status(200).json(application);
});

export const getApplicationDocumentController = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);

  const field = documentFieldSchema.safeParse(req.params.field);
  if (!field.success) {
    throw new AppError(field.error.issues[0].message, 400, 'UNKNOWN_DOCUMENT');
  }

  const { body, contentType, contentLength, filename } = await fetchApplicationDocument(
    id,
    field.data,
  );

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  // Belt and braces alongside helmet: the type above is already restricted to
  // an allowlist, and this stops a browser sniffing its way past it anyway.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Someone's credentials should not sit in a shared or proxy cache.
  res.setHeader('Cache-Control', 'private, no-store');
  if (contentLength) res.setHeader('Content-Length', contentLength);

  Readable.fromWeb(body).pipe(res);
});

export const approveApplicationController = asyncHandler(async (req, res) => {
  const result = await approveApplication(parseId(req.params.id));
  res.status(200).json(result);
});

export const rejectApplicationController = asyncHandler(async (req, res) => {
  const result = await rejectApplication(parseId(req.params.id), {
    reason: req.body.reason,
  });
  res.status(200).json(result);
});
