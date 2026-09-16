export default {
  testEnvironment: 'node',

  /**
   * 30 seconds, not Jest's default 5.
   *
   * Every suite in this project talks to a REAL MongoDB running in memory, and
   * several also stand up an HTTP server and open sockets. On a loaded machine
   * a single request can take several seconds through no fault of the code, and
   * at 5s that surfaces as a test failure in whichever file happened to be
   * unlucky — on 2026-09-16 it was `checkout.test.js`, which passes 33/33 in
   * isolation and timed out only at the end of a full run.
   *
   * A TIMEOUT IS NOT AN ASSERTION. It is a guard against a hang, and nothing
   * here is weakened by giving a slow machine room: 30s still catches a genuine
   * deadlock quickly, while removing a class of failure that says nothing about
   * correctness. A suite that fails at random is worse than a slow one, because
   * it teaches everybody to ignore red.
   *
   * Tests that legitimately need longer — the rate-limit walk, the socket
   * file's one HTTP call — still declare their own, so the intent stays visible
   * at the test rather than hidden in this default.
   */
  testTimeout: 30000,
};
