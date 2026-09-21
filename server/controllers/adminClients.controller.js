import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { USER_STATUS } from '../constants/roles.js';
import {
  listClients,
  getClient,
  cancelClientSubscription,
  setClientStatus,
  resetClientPassword,
} from '../services/adminClients.service.js';
import { clientIdSchema } from '../validation/adminClients.schema.js';

function parseId(rawId) {
  const result = clientIdSchema.safeParse(rawId);
  if (!result.success) {
    throw new AppError(result.error.issues[0].message, 400, 'INVALID_CLIENT_ID');
  }
  return result.data;
}

export const listClientsController = asyncHandler(async (req, res) => {
  res.status(200).json(await listClients(req.validatedQuery));
});

export const getClientController = asyncHandler(async (req, res) => {
  res.status(200).json(await getClient(parseId(req.params.id)));
});

export const cancelClientSubscriptionController = asyncHandler(async (req, res) => {
  const result = await cancelClientSubscription(parseId(req.params.id));

  // Whether it did anything, for the admin action log. No name, no email, no
  // amount — §18 wants accountability, not personal data in a rotating log.
  res.locals.adminActionDetail = `cancelled=${result.cancelled}`;

  res.status(200).json(result);
});

export const deactivateClientController = asyncHandler(async (req, res) => {
  res.status(200).json(await setClientStatus(parseId(req.params.id), USER_STATUS.INACTIVE));
});

export const reactivateClientController = asyncHandler(async (req, res) => {
  res.status(200).json(await setClientStatus(parseId(req.params.id), USER_STATUS.ACTIVE));
});

export const resetClientPasswordController = asyncHandler(async (req, res) => {
  res.status(200).json(await resetClientPassword(parseId(req.params.id)));
});
