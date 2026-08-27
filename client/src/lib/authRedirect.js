/**
 * Where each role goes after signing in — master spec §3.
 *
 * Client and therapist share /portal; the portal itself renders different
 * content by role. Admin is a separate route for security clarity (§9).
 *
 * Kept out of the components so the login redirect, the ProtectedRoute
 * bounce, and anything added later cannot drift apart.
 */
export const ROLE_HOME = {
  client: '/portal',
  therapist: '/portal',
  admin: '/admin',
}

export function homeForRole(role) {
  return ROLE_HOME[role] ?? '/'
}
