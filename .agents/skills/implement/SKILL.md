---
name: implement
description: Use when asked to build a feature, make a code change, or carry out an approved plan in this repo. Makes the edits and verifies them.
---

# Implement

1. **Read before writing.** Open the neighboring files and mirror their naming, structure, and error handling (`lib/httpError.ts` on the backend, `lib/*` clients on the frontend).
2. **Make surgical edits.** Respect the backend layering and put new schema changes in a numbered migration. Update frontend `lib/` clients and `types/` whenever an API contract changes.
3. **Honor security conventions.** Guard routes with `requireAuth` / `requireAdmin`, add `requireMutationHeader` to mutating routes where the existing ones have it, and validate input in controllers. Never log or expose secrets.
4. **Verify.** Run, in each package you touched:
   - Backend: `bun run build`
   - Frontend: `bun run lint` and `bun run build`
     Fix failures caused by your change. Report pre-existing failures without fixing them.
5. **Update docs** only where the change makes them wrong (`docs/`, `backend/docs/modules/`, README tables).
6. **Report.** Summarize files changed, what was verified, and anything not verified.

Keep the final report to a few bullets: files changed, what was verified, what wasn't. Don't re-explain the request or narrate edits.
