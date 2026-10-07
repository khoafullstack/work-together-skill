# work-together

A set of agent skills for spec-driven development. They turn a request into a confirmed plan, break the plan into tracked tasks, and implement the tasks with verification after every step.

All skills are user-invoked: you type the skill name, and no skill triggers on its own.

## Skills

| Skill | Purpose | Output |
|-------|---------|--------|
| `/wt-init` | Detect the projects in a workspace and record what each one is and how it runs | `work-together/projects/<project>/project.md`, `memory.md` |
| `/wt-plan` | Turn a request or an existing `plan.md` into a confirmed plan | `work-together/tasks/<task-slug>/plan.md` |
| `/wt-break-tasks` | Break a confirmed plan into a checklist of file-level tasks | `work-together/tasks/<task-slug>/tasks.md` |
| `/wt-implement` | Implement the tasks, verifying after every parent task | Code changes, updated `tasks.md` |
| `/wt-mermaid` | Turn a request into Mermaid diagrams rendered as a standalone interactive HTML page | `work-together/diagrams/<slug>.html` |

## Workflow

```
/wt-init            once per workspace
   │
/wt-plan            analyze, collect context, clarify, draft, confirm, write plan.md
   │
/wt-break-tasks     draft tasks, confirm, write tasks.md
   │
/wt-implement       implement, verify, close each parent task
```

`/wt-mermaid` runs independently on demand whenever architecture or workflow visualizations are requested.

Every step that writes a file shows a draft first and waits for your confirmation.

## Directory layout

Skills live in this repository. The files they generate live in the workspace you run them from.

```
skills/
├─ wt-init/
│  ├─ SKILL.md
│  └─ templates/        project.md, memory.md
├─ wt-plan/
│  ├─ SKILL.md
│  └─ templates/        plan.md
├─ wt-break-tasks/
│  ├─ SKILL.md
│  └─ templates/        tasks.md
├─ wt-implement/
│  └─ SKILL.md
└─ wt-mermaid/
   ├─ SKILL.md
   ├─ references/
   │  ├─ syntax/        flowchart.md, sequence.md, class.md, state.md, er.md
   │  ├─ components/    shell.html, header.html, toc.html, diagram-card.html, ...
   │  └─ examples/      sample.html
```

Generated files, for a workspace with `backend`, `frontend`, and `worker` projects:

```
work-together/
├─ projects/
│  ├─ backend/
│  │  ├─ project.md
│  │  └─ memory.md
│  ├─ frontend/
│  └─ worker/
├─ tasks/
│  └─ <task-slug>/
│     ├─ plan.md
│     └─ tasks.md
└─ diagrams/
   └─ <slug>.html
```

Paths are relative to the workspace root. The workspace can be a monorepo, or a folder that holds several repositories.

## Design rules

- **Fixed templates.** Every generated file is filled from a template shipped with the skill. The agent never invents the structure.
- **One project, one folder.** `project.md` holds what the project is and how to build, run, and verify it. `memory.md` holds conventions and short-term notes.
- **Confirm before writing.** Plans, task lists, and project facts are shown first and written only after you approve.
- **Stop on deviation.** `/wt-implement` stops and asks when reality differs from the plan.
- **Green after every parent task.** Tests, typecheck, and lint must pass before a parent task is marked done.
- **No commits without consent.** `/wt-implement` asks once whether it may commit, and never commits without a clear yes.

## Task list syntax

```
- [ ] #1 Task title
  - [ ] #1.1 CREATE `path/to/file`: what this file does
  - [ ] #1.2 MODIFY `path/to/file`: what changes in this file
  - [ ] #1.3 DELETE `path/to/file`: why it is removed
- [ ] #2 Next task (after #1)
```

Statuses: `[ ]` todo, `[~]` in progress, `[x]` done, `[!]` blocked.

## Installation

Copy or symlink the folders under `skills/` into your agent's skills directory, for example `~/.agents/skills/`.
