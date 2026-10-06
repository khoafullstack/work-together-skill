---
name: wt-plan
description: Turn a request or an existing plan.md into a confirmed plan.md under ./work-together/tasks/<task-slug>/.
disable-model-invocation: true
---

# wt-plan

Input is either a request or a path to a `plan.md`. Reply in the user's language.

Output is filled from the fixed template [templates/plan.md](templates/plan.md), never from agent-invented structure. Copy it verbatim, then fill every section. Keep headings, order, and table columns unchanged. Write `N/A` in a section that does not apply.

## Steps

### S1. Analyze

Request: restate goal, scope, and constraints. `plan.md`: read it fully and list what it already settles.

Done when goal, scope, and every unknown are written down.

### S2. Collect context

Skip when the request touches no existing code. Otherwise name the projects in play from the folders under `./work-together/projects/`, read `project.md` and `memory.md` of each, and search the codebase for the affected modules, entry points, and related tests. When `./work-together/projects/` is missing, suggest `/wt-init` and continue by searching the codebase.

Done when each affected area is backed by a file path you have opened, and the plan's Projects line is settled.

### S3. Clarify

Ask 3-6 questions via AskUser. Ask only where the answer is unknown or several directions are viable, and offer each direction as an option. Never fill a gap by guessing.

Done when every unknown from S1 is answered or recorded as an explicit assumption the user accepted.

### S4. Draft

Show the draft plan in chat using the `templates/plan.md` structure, then ask the user to confirm creating `plan.md`. With an existing `plan.md`, show the proposed edits against it and ask to confirm applying them.

Done when the draft is shown and the confirmation question is asked.

### S5. Iterate, then write

Not confirmed or changes requested: analyze further (return to S2 or S3 if new unknowns appear), revise, and repeat S4 until the user confirms.

Confirmed: write `./work-together/tasks/<task-slug>/plan.md`. The slug is kebab-case, short, and derived from the goal. Existing `plan.md` is edited in place at its current path.

Done when the file exists and matches the confirmed draft.

### S6. Hand off

Tell the user the path of `plan.md` and suggest running `/wt-break-tasks <path>` to create the tracking `tasks.md`.

Done when the path and the suggestion are in your final message.
