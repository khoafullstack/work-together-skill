---
name: wt-break-tasks
description: Break a confirmed plan.md into a tracked tasks.md next to it.
disable-model-invocation: true
---

# wt-break-tasks

## File boundaries

Create only `tasks.md` next to the selected `plan.md`, after the user confirms the draft. Creating any other file, including temporary files or additional documentation, requires an explicit user request. Keep drafts and reports in chat and update an existing `tasks.md` in place.

Input is the path to a `plan.md`, usually `./work-together/tasks/<task-slug>/plan.md`. Without a path, list the `plan.md` files under `./work-together/tasks/` and ask which one. Reply in the user's language.

Output is filled from the fixed template [templates/tasks.md](templates/tasks.md). Copy it verbatim, then fill it. Keep headings, order, and syntax unchanged.

## Steps

### S1. Read the plan

Read `plan.md` fully, then open every file path it cites.

Done when each plan section that implies work is listed, with the files it touches.

### S2. Draft tasks

Each parent task (`#1`) is one deliverable. Each subtask (`#1.1`) is one file change: `CREATE`, `MODIFY`, or `DELETE`, the path, and what happens in that file. Order parents by dependency and mark `(after #N)` where one blocks another. Cut parents so the codebase is green (test, typecheck, lint) when each one ends: a parent never leaves a half-finished change that breaks the build.

Show the draft in chat and ask the user to confirm. On changes, revise and show again until confirmed.

Done when every plan section that implies work maps to at least one task, every file the plan touches appears in exactly one subtask, every parent ends green, and the user has confirmed.

### S3. Write

Write `tasks.md` in the same folder as `plan.md`. Existing `tasks.md` is edited in place, keeping the status of every subtask that still exists.

Done when the file exists and matches the confirmed draft.
