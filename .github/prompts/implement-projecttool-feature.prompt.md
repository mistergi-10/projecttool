---
description: "Implement and verify one Projecttool Inno feature across the React frontend and Express API"
name: "Implement Projecttool Inno Feature"
argument-hint: "Describe the feature, acceptance criteria, and any relevant file or endpoint"
agent: "agent"
---
Implement this Projecttool Inno feature:

${input:feature:Describe the requested feature and acceptance criteria}

Use the repository's existing architecture and conventions. Treat [src/App.tsx](../../src/App.tsx) as the frontend entry point, [server/index.ts](../../server/index.ts) as the API entry point, [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) as the system overview, and [package.json](../../package.json) as the source of available checks.

Workflow:
1. Inspect the nearest owning implementation, related API types or routes, and an existing neighboring UI flow before editing.
2. State one concise hypothesis about the controlling code path and one focused check that could disconfirm it.
3. Make the smallest coherent change. Keep frontend state, API validation, response shapes, and user-visible behavior consistent.
4. Update [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) or other documentation only when the feature changes the documented contract.
5. Run the narrowest relevant validation first, then run `npm run lint` and `npm run build` when the change affects production code.
6. Do not commit changes or rewrite unrelated work already present in the working tree.

Finish with:
- a short summary of the behavior changed
- files changed with their roles
- validation commands and results
- any remaining assumptions, test gaps, or follow-up work
