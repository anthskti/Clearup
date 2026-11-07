---
name: review
description: Use when asked to review a diff, branch, PR, or set of files. Reports high-confidence bugs, security issues, and convention violations without editing code.
---

# Review

1. **Get the change.** Use `git diff` (staged and unstaged) or the branch diff against the base, and read the surrounding code for context. For model or migration changes, compare against the ER diagram in `docs/backend-architecture.md`.
2. **Check, in priority order:**
   - **Correctness:** logic errors, unhandled edge cases, wrong async handling, broken types
   - **Security:** missing `requireAuth` / `requireAdmin` / `requireMutationHeader`, unvalidated input, injectable queries, leaked secrets or PII, CORS or cookie changes
   - **Data:** migrations that are missing, non-idempotent, or lack a working `down`; association and model drift
   - **Contract drift:** backend payload changes without matching frontend `lib/` or `types/` updates
   - **Conventions:** layering violations, mutations without `no-store` and `mutationHeaders()`, unnecessary `"use client"`
3. **Verify claims** by running `bun run build` / `bun run lint` where relevant; don't report type or lint errors you haven't confirmed.
4. **Report** findings ordered by severity, each with file, line, the problem, and a suggested fix. Skip style nitpicks and pre-existing issues. If nothing significant is found, say so.

Findings only, one short entry each. No summary of the diff and no praise or filler.
