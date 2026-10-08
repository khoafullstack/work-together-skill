---
name: wt-commit
description: Inspect staged and unstaged changes, draft one commit or logical commit groups, and commit only after approval and Git identity confirmation.
disable-model-invocation: true
---

# wt-commit

## File boundaries

This skill authorizes no new working-tree files or temporary files. Creating any such file, including additional documentation, requires an explicit user request. Keep drafts, review snapshots, and reports in chat or memory. Approved Git operations may write Git's internal metadata as needed.

Input is optional: a repository path. Without input, use the current repository. Reply in the user's language.

Output is one or more local commits containing only the changes and messages the user approved. Until the draft and identity are confirmed, inspection is read-only: leave the working tree, index, Git configuration, and history unchanged.

## Steps

### S1. Inspect changes

Resolve the repository root and branch. Outside a repository: stop and ask for a repository path via AskUser. Multiple repositories in a workspace: ask which to use; handle each repository separately.

Read applicable `AGENTS.md`, contribution rules, commit-message configuration (such as commitlint), and recent commit messages (`git log -10 --format=%B`). An unborn branch has no history; continue with the available rules.

Inspect all three sources, always targeting the resolved repository explicitly:

- `git status --short --branch --untracked-files=all`: branch, conflicts, and changed paths.
- `git diff --cached` and `git diff --cached --stat`: staged content.
- `git diff` and `git diff --stat`: unstaged tracked content.
- `git ls-files --others --exclude-standard`: untracked paths. Review their content with file-reading tools before proposing them for a commit; identify binary or generated files separately.

Treat paths literally and preserve spaces and special characters. Inspect both versions of a partially staged file, including modifications, deletions, and renames. Record a review snapshot: HEAD (or unborn state), status, both diffs, and the content or fingerprints of untracked candidates.

Summarize what changed, with staged/unstaged/untracked labels and related features or fixes. No changes: report it and stop without asking about commits. Unresolved conflicts, a merge/rebase/cherry-pick in progress, a detached HEAD, or modified nested repositories/submodules: explain the blocker and stop for the user to resolve it. Do not silently commit in a different repository.

Exclude ignored files and suspected secrets from proposals. Report a sensitive path without reproducing secret values; stop until the user removes or safely excludes it. Flag generated artifacts and unrelated changes rather than assuming they belong.

Done when every changed path is accounted for, the review snapshot is captured, and the applicable commit convention and any exclusions are known.

### S2. Ask how to commit

Use AskUser to ask which approach the user wants:

- **One commit:** combine all reviewed, eligible staged, unstaged, and untracked changes into one commit.
- **Logical groups:** propose separate, coherent commits by purpose, not by their current staging state.

The choice selects the draft strategy, not permission to stage or commit. If the user narrows the scope, keep excluded changes untouched and list them in the draft.

Done when the user has explicitly selected an approach and any scope exclusions.

### S3. Draft, confirm, then commit

#### Draft and revise

For each proposed commit, show this fixed structure in chat:

```text
Commit <N>
Purpose: <one logical change and why it belongs together>
Changes: <exact paths, staged/unstaged/untracked sources, and hunks when needed>
Index preparation: <explicit paths to stage or unstage; partial-file method if needed>
Message:
<complete subject, optional body, and required footers>
Validation: <checks already run, checks to run, and anything not verified>
Left out: <changes that remain, or None>
```

One-commit mode includes the reviewed final working-tree versions, not just the existing index. Explain that staging a partially staged file also includes its reviewed unstaged changes. Grouped mode orders dependencies so each commit is coherent and independently verifiable.

Assign every approved change to exactly one commit. When a file spans groups, specify the hunks and how to stage them non-interactively without editing or discarding working-tree content. Keep an indivisible change in one group; if splitting safely is unclear, ask the user to regroup instead of guessing.

Use repository-enforced message rules first. Otherwise use Conventional Commits:

```text
<type>(<optional-scope>)<optional-!>: <imperative summary>

<optional body explaining why>

<optional BREAKING CHANGE: explanation and other required footers>
```

Choose the type from the actual changes (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `style`, or `revert`). Omit an unnecessary scope; keep the subject concise (aim for 72 characters unless repo rules differ), with no trailing period. Use the repo's message language; default to English if none is established. Include `!` or a `BREAKING CHANGE:` footer only for verified breaking changes. Never invent issue references or passing test results.

Include attribution required by repository or active-agent instructions in the draft. In Factory Droid, include:

```text
Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
```

Ask via AskUser whether to approve the exact draft, request edits, or cancel. An approval can cover the displayed ordered batch; it does not authorize later changes to scope, grouping, messages, or staging actions. Edits: revise and ask again. Cancel or no clear approval: stop with no Git writes.

#### Confirm username and email

After draft approval, and before any staging or commit, read the configured `user.name` and `user.email` and the effective author/committer identities (`git var GIT_AUTHOR_IDENT`, `git var GIT_COMMITTER_IDENT`). Explain that Git's username here means the commit name, not necessarily a hosting-service login.

Always ask via AskUser for the username/name and email to use, even when Git is already configured. Offer confirmation of the displayed configured pair, or let the user provide their pair in a custom answer. This question must also make clear that confirmation authorizes creating the approved local commits.

The confirmed pair must match the configured and effective author/committer name and email. Missing configuration or a mismatch: stop, report an environment configuration blocker, and ask the user to configure Git themselves, then re-read and re-confirm. Never set or override identity through `git config`, `git -c user.*`, `--author`, or `GIT_AUTHOR_*` / `GIT_COMMITTER_*` environment variables. A pair mentioned earlier in the conversation is not a substitute for this confirmation.

#### Execute the approved commits

Recheck the review snapshot and confirmed identity before Git writes. New edits, a changed HEAD, or a changed index invalidate approval: return to S1 and show a revised draft for confirmation. Keep later approved groups tied to their reviewed content as earlier commits advance HEAD.

Stage only explicit approved paths using `git add -- <paths>` or a reviewed non-interactive patch applied only to the index. For deletions and renames, include all affected paths. Never use a blanket `git add .`, `git add -A`, or `git commit -a`.

Grouped commits may require unstaging paths that belong to later groups or are excluded. Execute those index-only operations only if the draft explicitly authorized them. Preserve working-tree content and the original staged content of excluded changes; if that restoration cannot be guaranteed, stop and propose a safer grouping. Never discard changes, stash user work, or rewrite existing commits to arrange groups.

Before each commit, review `git diff --cached`, `git diff --cached --stat`, and `git status --short`. The entire index must exactly match that approved group's content, with no excluded or later-group changes. A mismatch: stop and re-draft.

Run the applicable repository checks before committing. Validation must cover the proposed group's content together with preceding commits, not merely the final working tree containing later groups. If that cannot be checked safely, report the limitation and obtain explicit approval to proceed unverified or regroup. Failed checks: stop and report; fixing code is outside this skill and requires the user's permission. Recheck the index and remaining changes after validation; check-generated edits require a revised draft and approval.

Pass the complete approved message through safe multiline quoting or UTF-8 standard input with `git commit -F -`, using the host shell's syntax and preserving the exact message. Run normal hooks; never bypass them with `--no-verify`. Do not embed untrusted paths or message text as shell code. If a required check or hook would create files outside Git's internal metadata, obtain an explicit user request for those files before running it.

If a hook changes files, inspect the changes and show any new content for confirmation before staging it. If no commit was created, retry only that group after approval. If a commit succeeded but a hook modified files, amend that newly created local commit once to include approved hook changes, as required by active-agent instructions. Never amend an older commit or silently add hook changes; if confirmation is declined or changes remain after that amendment, stop and report the state.

If any commit fails, stop the batch. Report completed commits and the remaining staged/unstaged changes; do not roll back successful commits or retry blindly. No push, remote write, or rewriting of pre-existing history is authorized by this skill.

#### Verify and report

Inspect each new commit's message and diff against its approved draft. Recheck status and verify that excluded changes still have their original content and staging. Report hashes, subjects, checks run (including failures or skipped checks), and what remains uncommitted.

Done when the approved commits are verified and the remaining state is reported, or the skill has stopped with a clear blocker and an accurate account of any partial progress.
