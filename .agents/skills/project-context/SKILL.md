---
name: project-context
description: Quickly syncs the agent with the master spec, current project status, and active chunk without bloating context.
---

# Project Context Initializer

When this command is called, perform a fast, clean synchronization:

1. **Read Core Context Files:**
   - Read `Cast_of_Mind_Master_Spec.md` (to align with product requirements and business architecture).
   - Read `docs/ongoing.md` (to know the exact current chunk, test count, decisions, and open blockers).
   - Read `.claude/rules/frontend.md` and `.claude/rules/backend.md` (for design, motion, and security rules).

2. **Acknowledge Key Project Constraints:**
   - Strict Read-Only Mode (explain, review, and plan; do not edit source files directly).
   - Permission Required (you are strictly not allowed to touch or modify the codebase without explicit permission).
   - Database Safety Rule: Never delete anything or the entire database. If any task requires touching, modifying, migrating, or deleting any data or collection in the database, you must stop and ask for explicit permission first.
   - Easy English responses (no complex jargon).
   - Visual-first UI design (NO vertical black-to-white band gradients; soft ambient radial glows only).

3. **Status Report to User:**
   - State: *"Context synced successfully! ⚡"*
   - State the current Chunk we are on (from `docs/ongoing.md`).
   - Confirm backend test count.
   - Ask: *"I am ready! What would you like to build next?"*