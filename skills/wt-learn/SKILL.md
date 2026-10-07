---
name: wt-learn
description: Extract lessons from the agent conversation, related git history, and the user into the Lessons section of each affected project's memory.md.
disable-model-invocation: true
---

# wt-learn

Input is optional: a task folder (`./work-together/tasks/<task-slug>` or `./work-together/archive/<date>-<task-slug>`). Without input, learn from the current conversation alone. Reply in the user's language.

Lessons go only into the `## Lessons` section of `./work-together/projects/<project>/memory.md`, one line each, in the template form `- <lesson> (from `<task-slug>`, <YYYY-MM-DD>)`. Without a task folder, use `conversation` in place of the slug. A `memory.md` without a Lessons section: insert it between Conventions and Notes, as in [../wt-init/templates/memory.md](../wt-init/templates/memory.md). A project without a `memory.md`: skip it and suggest `/wt-init`.

A lesson is a reusable, project-specific rule a future task would get wrong without it: a pitfall hit, a command or convention discovered, an approach that failed and why. Not a summary of what was built.

## Steps

### S1. Scope

Task folder given: read `plan.md` for the slug and the Projects line, and `tasks.md` for the file paths touched. No task folder: take the projects and files from the conversation; ask via AskUser when unclear.

Done when the slug (or `conversation`), the target projects, and the touched paths are known.

### S2. Collect evidence

In priority order:

1. **Conversation.** Scan the current conversation for corrections the user made, failed attempts, surprises, commands that had to be discovered, and deviations from the plan.
2. **Git.** When the workspace is a git repo, list commits since the plan's Created date that touch the paths from S1 (`git log --since=<date> -- <paths>`) and read their messages and diffs. Skip when no commits match.
3. **User.** Ask once via AskUser whether the user has lessons to add.

Done when every source has been checked or reported as empty.

### S3. Draft

Turn the evidence into lesson lines, grouped by project. Drop anything already covered by that project's Conventions or Lessons. Show the draft in chat with the source of each lesson (conversation, commit hash, user) and ask the user to confirm, edit, or drop lines.

Done when the user has confirmed the final list, or confirmed there is nothing to record.

### S4. Write

Append the confirmed lines to the Lessons section of each project's `memory.md`. Change nothing else in the file.

Done when every confirmed lesson is in its project's `memory.md`. End with the files changed and the number of lessons added to each.
