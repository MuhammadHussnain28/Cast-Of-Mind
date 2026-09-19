/**
 * What a client is CALLED, everywhere the therapist sees them.
 *
 * A COUPLE IS ONE ACCOUNT WITH TWO PEOPLE IN IT (§6) — one `users` record, one
 * `clientProfile` with both partners nested — so the thread is with both of
 * them and the label has to say so. Naming only partner 1 would quietly erase
 * the other person from their own therapy.
 *
 * ONE IMPLEMENTATION ON PURPOSE. This was computed inside chat.service.js and
 * was about to be computed again for the 8.1 client list. Two copies that
 * disagree would put "Marta and Joris" at the top of the conversation and
 * "Marta" in the sidebar beside it, which reads as a bug in the product rather
 * than in the code.
 *
 * Returns null rather than a placeholder, so each caller decides what an
 * absent profile should say. Every client is created with one inside the
 * payment transaction (6.4), so null is a broken-state path, not a normal one.
 */
export function clientDisplayName(clientProfile) {
  if (!clientProfile) return null;

  if (clientProfile.type === 'couple') {
    const both = [
      clientProfile.coupleData?.partner1?.name,
      clientProfile.coupleData?.partner2?.name,
    ].filter(Boolean);

    return both.length ? both.join(' and ') : null;
  }

  return clientProfile.name ?? null;
}

export default clientDisplayName;
