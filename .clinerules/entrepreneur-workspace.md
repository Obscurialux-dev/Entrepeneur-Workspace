# Entrepreneur Workspace — Cline Rules

## Project context
Build Entrepreneur Workspace for HIMA's Entrepreneur division. Read `docs/project.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/security.md`, and `docs/task.md` before implementation.

## Work protocol
1. Start by inspecting the current repository, OS/tool versions, package scripts, Git status, and existing files.
2. Do not overwrite or delete existing files without inspecting them first.
3. Work only on the current task in `docs/task.md`. Do not implement the whole backlog at once.
4. Before coding, state a short plan and acceptance criteria.
5. Prefer small, reviewable changes over large rewrites.
6. After changes, run relevant lint, typecheck, tests, and build. If a check cannot run, state why.
7. Summarize changed files, commands run, results, risks, and next task.
8. Update docs and task status only when supported by actual implementation and test results.
9. If requirements conflict or an architectural decision is missing, stop and ask instead of guessing.
10. Use Indonesian for user-facing explanations and English for code identifiers where conventional.

## Engineering rules
- TypeScript strict mode.
- Use the selected package manager consistently and commit its lockfile.
- Never commit `.env`, credentials, API keys, OAuth tokens, service-account JSON, or other secrets.
- Keep `.env.example` placeholders only.
- Keep Firebase Admin SDK and server secrets out of client bundles.
- Validate untrusted input at server boundaries.
- Never trust client-supplied role, price, total, payment status, campaign status, or stock.
- Enforce authorization in server/backend and Firestore Security Rules, not only in UI.
- Use atomic transactions for stock/order operations where consistency matters.
- Use idempotency for public order creation and external API synchronization.
- Use server timestamps for critical records.
- Add pagination for potentially large lists.
- Avoid `any` unless justified and documented.
- Avoid unnecessary dependencies and speculative abstractions.
- Add tests for business logic, permissions, and important failure cases.
- Never claim a test passed unless it was actually run and passed.

## Product rules
- Research and Marketing share one workspace and database.
- Research owns product/market research, vendor research, research reports, and production of educational content/materials/designs.
- Marketing owns promotional planning, campaign planning, publishing schedules, Instagram publishing, and social archive.
- Public Open PO forms do not require an internal user account.
- Public users must not read internal orders or finance records.
- Firestore is the source of truth. Google Sheets is for exports/reporting.
- Google Calendar sync starts one-way from app to Google Calendar.
- Manual Instagram publishing is acceptable for MVP.
- Finance reports must distinguish revenue, profit, receivables, and cash flow.
- Historical order price/HPP snapshots must not change when product prices are edited.

## Cline model usage
- The intended primary model is DeepSeek Flash via the DeepSeek provider.
- Use a configured backup model when the primary model hits a quota/rate limit.
- Do not assume automatic model fallback unless it is configured and tested in the Cline environment.
- When switching models, provide the task ID, current git diff/status, decisions, acceptance criteria, and test results.
- Never expose or print API keys or secrets.

## Completion checklist
Before marking a task complete:
- [ ] Scope matches the task.
- [ ] No secrets added.
- [ ] Authorization and validation reviewed.
- [ ] Relevant checks/tests run.
- [ ] Documentation updated if needed.
- [ ] Git diff reviewed.
- [ ] Final summary states results honestly.
