---
description: Sync with Cast of Mind spec, progress log, and coding rules before starting work
allowed-tools: Read, Glob, Grep, Bash(npm test:*), Bash(git status:*), Bash(git log:*)
---

Perform a fast context sync for the Cast of Mind project.

## 1. Read the core context files

- `Cast_of_Mind_Master_Spec.md` — the product specification and single source of truth (noting live decisions in ongoing.md supersede older spec text).
- `docs/ongoing.md` — **read the whole file, start to finish.**
  * **DO NOT read `docs/archive/ongoing-slices-0-6.md` under any circumstances.** It is strictly for cold storage; reading it will unnecessarily waste your context window.
- `.claude/rules/frontend.md` and `.claude/rules/backend.md` — coding, UI, and security standards.

## 2. Acknowledge the standing directives

- **Permanent UI Directive (2026-09-13):** Every screen must be genuinely premium, polished, **consistent**, and beautiful. **DO NOT put plain text inside bare boxes.** A stack of same-shaped bordered rectangles is NOT a finished screen. Carry ideas visually — text is the caption, not the payload. Use drawn icons at one stroke weight, considered hierarchy, real surface depth, and soft ambient radial glows (`bg-sage/10 blur-[130px]`). Never use harsh vertical band gradients.
- **Frontend Design Skill:** When designing or building any UI component or page, **always use the `impeccable` skill for frontend design guidance.**
- **Contrast.** Hold the WCAG AA floors on all text and control borders. Compute the values — the impeccable detector runs degraded on this machine and evaluates no contrast at all.
- **Code hygiene.** Comments stay short and high-signal. Durable reasoning belongs in `docs/ongoing.md`, not in file headers.
- **Database safety.** NEVER delete, drop, wipe, or modify any existing data or collections in the database without explicit permission from the user.
- **Plan first.** Show the implementation plan (60–70 lines per chunk log format) and get approval before writing any code.
- **Verify.** Run `npm test -- --runInBand` in `/server`, and update `docs/ongoing.md` when a chunk is complete.

## 3. Report back

Keep it to a few lines, in plain English:

- "Claude Code is 100% synced with Cast of Mind context! 🚀"
- The current active chunk, and what the last completed one was.
- The passing test count.
- Any open blockers that would affect the next piece of work.
- Explicit confirmation that the permanent UI directive (no bare boxes, visual-first, consistent) and database safety rules are acknowledged.
- "Ready for the next chunk instructions. What are we building?"