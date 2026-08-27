import {
  requireRole,
  requireClient,
  requireTherapist,
  requireAdmin,
} from './requireRole.js';
import { ROLES } from '../constants/roles.js';

// Unit tests on the guard alone — no server, no database, no tokens. The full
// request path is covered separately in routes/roleGuards.test.js.

function run(guard, req = {}) {
  return new Promise((resolve) => {
    guard(req, {}, (err) => resolve(err));
  });
}

describe('requireRole — allowing the right role', () => {
  it.each([ROLES.CLIENT, ROLES.THERAPIST, ROLES.ADMIN])('lets a %s through its own guard', async (role) => {
    const err = await run(requireRole(role), { user: { id: 'x', role } });
    expect(err).toBeUndefined();
  });

  it('accepts any one of several allowed roles', async () => {
    const guard = requireRole(ROLES.THERAPIST, ROLES.ADMIN);

    expect(await run(guard, { user: { id: 'x', role: ROLES.THERAPIST } })).toBeUndefined();
    expect(await run(guard, { user: { id: 'x', role: ROLES.ADMIN } })).toBeUndefined();

    const blocked = await run(guard, { user: { id: 'x', role: ROLES.CLIENT } });
    expect(blocked.statusCode).toBe(403);
  });
});

describe('requireRole — blocking the wrong role', () => {
  it('returns 403 for a role that is not allowed', async () => {
    const err = await run(requireAdmin, { user: { id: 'x', role: ROLES.CLIENT } });

    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('does not name the required role in the message', async () => {
    // Telling a client "admins only" hands out a map of the admin surface.
    const err = await run(requireAdmin, { user: { id: 'x', role: ROLES.CLIENT } });

    expect(err.message.toLowerCase()).not.toContain('admin');
    expect(err.message.toLowerCase()).not.toContain('role');
  });
});

describe('requireRole — FAILS CLOSED when misused', () => {
  // The scenario: a future route is written as
  //   router.get('/admin/clients', requireAdmin, handler)
  // with requireAuth left off by mistake. req.user is then undefined. The guard
  // must refuse. A guard that waves the request through when misused is worse
  // than no guard, because the route LOOKS protected and nobody re-checks it.

  it('rejects when req.user is missing entirely', async () => {
    const err = await run(requireAdmin, {});

    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHENTICATED');
  });

  it('rejects when req.user exists but carries no role', async () => {
    const err = await run(requireAdmin, { user: { id: 'x' } });

    expect(err.statusCode).toBe(401);
  });

  it.each([null, undefined, {}, { user: null }, { user: {} }, { user: { role: null } }])(
    'never calls next() cleanly for a malformed request: %p',
    async (req) => {
      const err = await run(requireAdmin, req || {});
      expect(err).toBeDefined();
      expect([401, 403]).toContain(err.statusCode);
    },
  );

  it('rejects a role that is not one of the three, however plausible', async () => {
    for (const role of ['superadmin', 'Admin', 'ADMIN', 'user', '', 'client ']) {
      const err = await run(requireAdmin, { user: { id: 'x', role } });
      expect(err).toBeDefined();
    }
  });
});

describe('requireRole — catching mistakes at startup', () => {
  // These throw when the route file loads, not when a request arrives. A typo
  // like requireRole('admins') would otherwise reject everyone silently and
  // for ever, while the route still looked protected.
  it('throws on an unknown role name', () => {
    expect(() => requireRole('admins')).toThrow(/invalid role/i);
    expect(() => requireRole('superuser')).toThrow(/invalid role/i);
  });

  it('throws when called with no roles at all', () => {
    expect(() => requireRole()).toThrow(/invalid role/i);
  });
});

describe('the convenience guards', () => {
  it('each allows only its own role', async () => {
    const cases = [
      [requireClient, ROLES.CLIENT],
      [requireTherapist, ROLES.THERAPIST],
      [requireAdmin, ROLES.ADMIN],
    ];

    for (const [guard, ownRole] of cases) {
      for (const role of Object.values(ROLES)) {
        const err = await run(guard, { user: { id: 'x', role } });

        if (role === ownRole) {
          expect(err).toBeUndefined();
        } else {
          expect(err.statusCode).toBe(403);
        }
      }
    }
  });
});
