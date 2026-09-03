import { asyncHandler } from '../middleware/asyncHandler.js';
import * as applicationService from '../services/therapistApplication.service.js';
import { SUBMISSION_SUCCESS_MESSAGE } from '../constants/therapistApplications.js';

export const submitApplication = asyncHandler(async (req, res) => {
  const result = await applicationService.submitApplication(req.body);

  // The id is returned so the applicant can check their status later. It is the
  // only identifier they get; nothing else about the application comes back.
  res.status(201).json({
    id: result.id,
    status: result.status,
    submittedAt: result.submittedAt,
    message: SUBMISSION_SUCCESS_MESSAGE,
  });
});

export const getApplicationStatus = asyncHandler(async (req, res) => {
  const status = await applicationService.getApplicationStatus(req.params.id);

  res.status(200).json(status);
});
