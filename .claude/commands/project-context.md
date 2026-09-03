---
description: Sync with Cast of Mind spec, progress log, and coding rules before starting work
allowed-tools: Read, Glob, Grep, Bash(npm test:*), Bash(git status:*), Bash(git log:*)
---

Perform a fast context sync for the Cast of Mind project.

## 1. Read the core context files

- `Cast_of_Mind_Master_Spec.md` — the product specification and single source of truth.
- `docs/ongoing.md` — **read the whole file, start to finish.** It is long , and reading
  only the end is how past decisions get contradicted: the SHA-256 refresh-token choice, the
  "never put a TTL index on `refreshTokenExpiresAt`" warning, and the parallel-test flake are all
  in early entries, not recent ones.
- `.claude/rules/frontend.md` and `.claude/rules/backend.md` — coding and security standards.

## 2. Acknowledge the standing directives

- **Visual-first UI.** Never use vertical band gradients (`from-ink-deep to-paper`). Use flat
  section seams and soft ambient radial glows (`bg-sage/10 blur-[130px]`). Carry ideas visually;
  text is the caption, not the payload.
- **Contrast.** Hold the WCAG AA floors on all text and control borders. Compute the values — the
  impeccable detector runs degraded on this machine and evaluates no contrast at all.
- **Code hygiene.** Comments stay short and high-signal. Durable reasoning belongs in
  `docs/ongoing.md`, not in file headers.
- **Plan first.** Show the implementation plan and get approval before writing any code.
- **Verify.** Run `npm test -- --runInBand` in `/server` (parallel runs flake on this machine), and
  update `docs/ongoing.md` when a chunk is complete.

## 3. Report back

Keep it to a few lines, in plain English:

- "Claude Code is 100% synced with Cast of Mind context! 🚀"
- The current active chunk, and what the last completed one was.
- The passing test count.
- Any open blockers that would affect the next piece of work.
- "Ready for the next chunk instructions. What are we building?"
