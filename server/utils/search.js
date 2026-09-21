/**
 * Admin list search.
 *
 * Extracted in chunk 4.5 rather than copied: applications and therapists both
 * search names and an email, and a second copy of the escape is exactly the
 * sort of thing that gets fixed in one place and left broken in the other.
 */

/**
 * Makes a user-supplied search term literal.
 *
 * Without this, `.*` matches every record and `(a+)+$` is catastrophic
 * backtracking pointed at our own database. Terms are length-capped by the
 * request schema; this makes what is left inert.
 */
export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive contains, on an already-escaped term. */
export const containsIgnoringCase = (term) => new RegExp(escapeRegex(term), 'i');

/**
 * Matches a term against a first name and a last name, in either order.
 *
 * A term with a space in it is treated as "first last" — otherwise searching
 * "Ada Lovelace" finds nobody, because no single field holds both words.
 */
export function nameClauses(term) {
  const whole = containsIgnoringCase(term);
  const clauses = [{ firstName: whole }, { lastName: whole }];

  const parts = term.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    const [first, ...rest] = parts;
    const firstRe = containsIgnoringCase(first);
    const restRe = containsIgnoringCase(rest.join(' '));

    clauses.push(
      { $and: [{ firstName: firstRe }, { lastName: restRe }] },
      { $and: [{ firstName: restRe }, { lastName: firstRe }] },
    );
  }

  return clauses;
}

/**
 * A term against a CLIENT's name, whichever shape the account is.
 *
 * An individual has one `name`; a couple has two, nested under `coupleData`
 * (§6). Searching only the first would make one partner unfindable in their
 * own account. Extracted in chunk 10.2 — the client list (10.1) and the
 * bookings overview both search clients, and two copies would drift.
 */
export function clientNameClauses(term) {
  const like = containsIgnoringCase(term);
  return [
    { name: like },
    { 'coupleData.partner1.name': like },
    { 'coupleData.partner2.name': like },
  ];
}
