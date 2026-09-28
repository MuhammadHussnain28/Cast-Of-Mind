import { asyncHandler } from '../middleware/asyncHandler.js';
import { getClientPortalState, saveClientTimezone } from '../services/clientPortal.service.js';
import { createBillingPortalSession } from '../services/billingPortal.service.js';
import { cancelMySubscription, reactivateMySubscription } from '../services/clientSubscription.service.js';
import { startResubscription } from '../services/resubscription.service.js';
import { getBillingHistory } from '../services/billingHistory.service.js';

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(await getClientPortalState(req.user.id));
});

export const saveTimezone = asyncHandler(async (req, res) => {
  res.status(200).json(await saveClientTimezone(req.user.id, req.body.timezone));
});

export const openBillingPortal = asyncHandler(async (req, res) => {
  res.status(200).json(await createBillingPortalSession(req.user.id));
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  res.status(200).json(await cancelMySubscription(req.user.id));
});

export const reactivateSubscription = asyncHandler(async (req, res) => {
  res.status(200).json(await reactivateMySubscription(req.user.id));
});

export const resubscribe = asyncHandler(async (req, res) => {
  res.status(200).json(await startResubscription(req.user.id));
});

export const billingHistory = asyncHandler(async (req, res) => {
  res.status(200).json(await getBillingHistory(req.user.id, { page: req.validatedQuery.page }));
});
