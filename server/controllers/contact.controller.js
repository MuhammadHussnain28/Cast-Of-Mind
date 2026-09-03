import { asyncHandler } from '../middleware/asyncHandler.js';
import * as contactService from '../services/contact.service.js';
import { CONTACT_SUCCESS_MESSAGE } from '../constants/contact.js';

export const submitContact = asyncHandler(async (req, res) => {
  await contactService.submitContactMessage(req.body);

  // The same reply whether the message was sent or discarded as spam.
  res.status(200).json({ success: true, message: CONTACT_SUCCESS_MESSAGE });
});
