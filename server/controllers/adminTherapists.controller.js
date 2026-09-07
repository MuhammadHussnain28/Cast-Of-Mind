import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { USER_STATUS } from '../constants/roles.js';
import {
  listTherapists,
  getTherapist,
  updateTherapist,
  setTherapistStatus,
  resetTherapistPassword,
} from '../services/adminTherapists.service.js';
import { therapistIdSchema } from '../validation/adminTherapists.schema.js';

function parseId(rawId) {
  const result = therapistIdSchema.safeParse(rawId);
  if (!result.success) {
    throw new AppError(result.error.issues[0].message, 400, 'INVALID_THERAPIST_ID');
  }
  return result.data;
}

export const listTherapistsController = asyncHandler(async (req, res) => {
  res.status(200).json(await listTherapists(req.validatedQuery));
});

export const getTherapistController = asyncHandler(async (req, res) => {
  res.status(200).json(await getTherapist(parseId(req.params.id)));
});

export const updateTherapistController = asyncHandler(async (req, res) => {
  const { changedFields, therapist } = await updateTherapist(parseId(req.params.id), req.body);

  // Field NAMES only, for the admin action log. Editing someone's credentials is
  // exactly the event §18 wants accountability for — but an email address in a
  // rotating host log is personal data with no reason to be there.
  res.locals.adminActionDetail = `fields=${changedFields.join(',')}`;

  res.status(200).json({ changedFields, therapist });
});

export const deactivateTherapistController = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(await setTherapistStatus(parseId(req.params.id), USER_STATUS.INACTIVE));
});

export const reactivateTherapistController = asyncHandler(async (req, res) => {
  res.status(200).json(await setTherapistStatus(parseId(req.params.id), USER_STATUS.ACTIVE));
});

export const resetTherapistPasswordController = asyncHandler(async (req, res) => {
  res.status(200).json(await resetTherapistPassword(parseId(req.params.id)));
});
