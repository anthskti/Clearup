---
name: plan
description: Use when asked to plan, scope, design, or break down a feature or change before coding. Produces a written plan; makes no code edits.
---

# Plan

1. **Clarify the goal.** Restate it in one or two sentences. If a decision materially changes the approach and can't be inferred from the code, ask before planning.
2. **Explore.** Find the existing code and docs involved (`docs/features/`, `docs/backend-architecture.md`, `backend/docs/modules/`). Follow the existing pattern for similar features rather than inventing one.
   For backend, schema, or auth work, read the relevant section of `docs/backend-architecture.md` (ER diagram for data, request lifecycle for middleware/auth).
3. **Identify the blast radius.** Note which layers change (route, controller, service, repository, model, migration, frontend `lib/`, types, components) and whether both packages are affected.
4. **Write the plan:**
   - Goal and non-goals
   - Ordered steps, each naming the files to change and the intent
   - Schema or migration needs, API contract changes, auth and security implications
   - Risks and open questions
   - How to verify (build, lint, manual checks)
5. Keep it short and concrete. Stop and wait for approval before implementation.

Output stays concise: for a complex task start with the approach/example/risks, then the numbered plan. No restating the request.
