---
name: wt-init
description: Register the projects in the current workspace and write project.md and memory.md for each under ./work-together/projects/<project>/.
disable-model-invocation: true
---

# wt-init

Run from the workspace root: a monorepo root, or a folder holding several repos. Reply in the user's language.

Output is filled from fixed templates, never from agent-invented structure. Copy each verbatim, then fill every section. Keep headings, order, and table columns unchanged. Write `N/A` in a section that does not apply.

Each project gets its own folder, the single source of truth for that project:

- [templates/project.md](templates/project.md) becomes `./work-together/projects/<project>/project.md`
- [templates/memory.md](templates/memory.md) (conventions and short-term notes) becomes `./work-together/projects/<project>/memory.md`

The folders under `./work-together/projects/` are the project registry. A project name is kebab-case, taken from its manifest (`package.json` name, `go.mod` module, `Cargo.toml` package, folder name otherwise). A project path is relative to the workspace root; a project at the root has path `.`.

## Steps

### S1. Detect projects

Search for workspace definitions (`workspaces` in `package.json`, `pnpm-workspace.yaml`, `go.work`, Cargo `[workspace]`, `settings.gradle`, `*.sln`) and for manifests in subfolders (including nested `.git` repos). Skip `node_modules`, build output, and vendored folders. List the folders already under `./work-together/projects/`.

Done when every candidate has a name, a path, and the file that revealed it.

### S2. Confirm projects

Show the candidates and ask the user to confirm via AskUser. Offer to drop, rename, or add projects. Repeat until confirmed.

Done when the user has confirmed the exact project list.

### S3. Collect memory

For each project, read its manifest, scripts, CI config, lint and format config, test layout, README, and `AGENTS.md`. Fill every section of both templates from this evidence.

Every command, port, and env location must trace to a file that defines it. Gather what the files cannot answer into one AskUser batch per run.

Done when every section of every project's two files is filled from evidence or a user answer.

### S4. Write

Write both files for each project.

Files already exist: update in place. Show every fact that would change and ask before changing it. Keep the content of the Notes sections in both files untouched.

Done when both files exist for every confirmed project.
