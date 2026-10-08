---
name: wt-implement
description: Implement a task folder's plan.md and tasks.md, verifying after every parent task.
disable-model-invocation: true
---

# wt-implement

## Scope and file boundaries

Implement only the work specified in the confirmed `plan.md` and `tasks.md`. Create a file only when an explicit `CREATE` subtask names that exact path and the change is within the plan. Creating any other file, including temporary files or additional documentation, requires an explicit user request. Do not expand the scope with extra features, refactors, or supporting artifacts.

Never create a Markdown (`.md`) file unless the user explicitly requests that file; a general instruction to implement, document, or report progress is not such a request. Keep progress, verification results, and deviations in the existing `tasks.md` and in chat. Apply these boundaries to subagents and tools as well.

Input is a folder, `./work-together/tasks/<task-slug>`, holding `plan.md` and `tasks.md`. Either file missing: stop and tell the user which skill creates it (`/wt-plan`, `/wt-break-tasks`). Reply in the user's language.

`tasks.md` is the live progress record. Only the main agent edits it, one status change at a time: `[~]` when a subtask starts, `[x]` when it is done. A parent becomes `[x]` only after its verification is green.

## Steps

### S1. Orient

Read `plan.md` and `tasks.md`. Report progress (done, in progress, blocked, todo) and the next parent task, and wait for the user to confirm before touching code. Ask in the same message whether you may commit. Without a clear yes, never create a commit.

Take the verify commands (test, typecheck, lint) from the Entry Point table in `./work-together/projects/<project>/project.md` for each project in the plan's Projects line. A project without a `project.md`: find them in the repo (`package.json`, `Makefile`, CI config, `AGENTS.md`) and suggest `/wt-init`. Ask the user only when one is unclear.

Done when the user has confirmed, the commit answer is recorded, and every verify command is known.

### S2. Implement a parent task

Do its subtasks in order. Each subtask is exactly its file, action, and described change. Mark `[~]` before, `[x]` after.

Parent tasks with no `(after #N)` link and no shared files are independent: hand each to a subagent to run in parallel. Subagents implement their subtasks and report back; they do not edit `tasks.md`.

Plan and reality diverge (missing file, a file outside the list needs changes, the planned approach fails): stop, state what you found, and ask the user. Continue only on their answer, record the deviation under Notes in `tasks.md`, and update the existing plan/tasks to reflect the approved change before implementing it. Any new file still requires the explicit authorization described above.

Done when every subtask of the parent is `[x]`.

### S3. Verify

Run test, typecheck, and lint for every project the parent's subtasks touched, using each project's own commands. If a command would create files outside the allowed paths, obtain an explicit user request for those files before running it. Red: fix within the confirmed plan/tasks and rerun; a fix outside that scope follows the deviation procedure in S2. After 3 failed attempts on the same failure, stop and ask the user. After parallel parents, verify once all have returned.

Done when all three are green. A parent never closes red.

### S4. Close and continue

Mark the parent `[x]`. Commit only if the user said yes in S1, with one commit per parent. Then return to S2 for the next parent.

Done when no `[ ]`, `[~]`, or `[!]` remains in `tasks.md`. End with a summary of changes, verify results, and deviations recorded in Notes.
