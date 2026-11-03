---
name: debug
description: Use when investigating a bug, error, failing build, or unexpected behavior in this repo. Finds the root cause with evidence, then applies a minimal fix.
---

# Debug

1. **Reproduce.** Get the exact error, request, or steps. Use `bun run build` / `bun run lint` for type and lint failures, and ise the most direct available reproduction method; for backend behavior,
   prefer curl against the local API when appropriate. If you can't reproduce it, say so and list what you need.
2. **Localize.** Trace the path across layers: frontend `lib/` call → route → controller → service → repository → model. For auth issues, also check the cookie flow, `TRUSTED_ORIGINS`, and `BETTER_AUTH_CROSS_SITE_COOKIES`. For data issues, check migrations and associations (`backend/src/associations.ts`).
   For backend or data bugs, use `docs/backend-architecture.md` (§2 request lifecycle, §1 ER diagram) to find the layer and tables involved.
3. **Form a hypothesis and test it.** Confirm the root cause with evidence (logs, a failing command, reading the code path), not by guessing.
4. **Fix minimally.** Change the cause, not the symptom, and don't refactor around it. Add a regression check if the repo has a place for one.
5. **Verify** that the original reproduction now passes and that the build and lint still pass.
6. **Report:** root cause, fix, verification, and any related risk you noticed but didn't change.

Never print `.env` contents while debugging, and don't run destructive DB commands against non-local data.

Keep the report to root cause, fix, and verification, one or two lines each. Don't narrate the investigation.
