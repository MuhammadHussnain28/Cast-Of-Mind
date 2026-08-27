// The three roles and two account states from master spec Sections 3 and 10.1.
// Every role guard, model enum, and seed script reads from here so a role name
// is never a loose string literal that a typo can silently break.

export const ROLES = Object.freeze({
  CLIENT: 'client',
  THERAPIST: 'therapist',
  ADMIN: 'admin',
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

export const USER_STATUS_VALUES = Object.freeze(Object.values(USER_STATUS));
