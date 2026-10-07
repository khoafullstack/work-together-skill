---
name: wt-archive
description: Move finished task folders from ./work-together/tasks/ to ./work-together/archive/<YYYY-MM-DD>-<task-slug>/, recording lessons with wt-learn first.
disable-model-invocation: true
---

# wt-archive

Input is zero or more task slugs or folder paths under `./work-together/tasks/`. Reply in the user's language.

A task is done when its `tasks.md` has no `[ ]`, `[~]`, or `[!]`. A folder without `tasks.md` counts as not done. Never create a commit.

## Steps

### S1. Select

Input given: resolve each entry to a folder under `./work-together/tasks/`; report entries that do not resolve. No input: list every folder under `./work-together/tasks/`, split into done and not done (with open-subtask count), and ask via AskUser which to archive (multi-select, done tasks first).

Done when the selected folders are known and each exists.

### S2. Check completion

For each selected folder that is not done, list its open subtasks with their status. Ask whether to archive it anyway. Yes: ask for the reason. No: drop it from the selection.

Done when every remaining folder is done or force-confirmed with a reason.

### S3. Confirm

Archive date is today. Target is `./work-together/archive/<YYYY-MM-DD>-<task-slug>/`; when it already exists, append `-2`, `-3`, and so on. Show, per folder: source, target, done or forced (with reason), and whether git will track the move. Ask the user to confirm.

Done when the user has confirmed the list.

### S4. Learn

Ask whether to record lessons before archiving. Yes: read [../wt-learn/SKILL.md](../wt-learn/SKILL.md) and follow its steps once per folder, with the folder as input. File missing: tell the user, suggest running `/wt-learn` separately, and continue.

Done when wt-learn has finished for each folder, or the user skipped it.

### S5. Mark

In each `plan.md`: set Status to `Archived` and the Archived line to the archive date; when the Archived line is missing, insert it right after Created. For forced folders, append to the Notes section of `tasks.md`: `Archived on <date> with open subtasks <#ids>: <reason>` (replace `N/A` if Notes holds only that). A folder without `plan.md`: skip marking it and say so.

Done when every `plan.md` and forced `tasks.md` is updated.

### S6. Move

Create `./work-together/archive/` if missing. A folder with any git-tracked file: `git mv <source> <target>`. Otherwise move it on the filesystem. Afterwards confirm the source is gone and the target holds every file; move any leftover file.

Done when every source folder is gone and every target exists.

### S7. Report

List each new path, the lessons recorded, and any skipped folder with its reason. When git tracked a move, say the changes are staged but not committed.

Done when the report is in your final message.
