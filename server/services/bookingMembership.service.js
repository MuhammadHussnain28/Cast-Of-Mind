import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { ROLES } from '../constants/roles.js';

/**
 * Is this caller one of the booking's two people? Extracted from chat in 9.1 so
 * chat and sessions share one check. The id comes from the URL, so it is proved
 * against the stored booking. Malformed, unknown and someone else's booking all
 * throw the caller's own 404 — a 403 would confirm the id is real.
 */
export async function loadBookingMember(bookingId, user, notFound) {
  if (!mongoose.isValidObjectId(bookingId)) throw notFound();

  const booking = await Booking.findById(bookingId);
  if (!booking) throw notFound();

  const isClient = String(booking.clientId) === String(user.id);
  const isTherapist = String(booking.therapistId) === String(user.id);
  if (!isClient && !isTherapist) throw notFound();

  return { booking, role: isClient ? ROLES.CLIENT : ROLES.THERAPIST };
}

export default loadBookingMember;
