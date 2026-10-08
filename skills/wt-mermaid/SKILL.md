---
name: wt-mermaid
description: Turn a request into Mermaid diagrams and render them as a single self-contained static HTML page under ./work-together/diagrams/<slug>.html, assembled strictly from the HTML components in references/components/.
disable-model-invocation: true
---

# wt-mermaid

Generate Mermaid diagrams and present them in a polished, standalone static HTML page viewable directly in any browser. Reply in the user's language.

All HTML output is assembled strictly from the component snippets in [references/components/](references/components/), following the rules in [references/components/README.md](references/components/README.md). Never invent arbitrary HTML layout, styles, or scripts.

## Rules

1. **Fixed Components Only.** Every generated HTML file is constructed by taking [references/components/shell.html](references/components/shell.html) and populating its slot comments (`<!-- SLOT:... -->`) with filled snippets from `references/components/`. Run [scripts/assemble.mjs](scripts/assemble.mjs) to do this mechanically instead of hand-writing a script.
2. **Valid Mermaid Syntax.** Always follow [references/syntax/](references/syntax/) for the target diagram type (flowchart, sequence, class, state, ER). Keep labels compatible with `htmlLabels: false` (use standard line breaks within quotes, do NOT use `<br>` or HTML tags).
3. **Readable Labels in Both Themes.** Every `classDef`/`style` that sets `fill` MUST also set a `color` with at least 4.5:1 contrast. A fill without `color` inherits the theme text color, which is light in dark mode, so light pastel fills make the text disappear. See [references/syntax/flowchart.md](references/syntax/flowchart.md) section 5.
4. **Escaping.** When embedding Mermaid code into `<pre class="wt-source" hidden>{{mermaid_code}}</pre>`, escape `&` to `&amp;`, `<` to `&lt;`, and `>` to `&gt;`.
5. **Confirm Before Writing.** Always present the draft Mermaid code and diagram metadata in chat and receive the user's approval before creating the HTML file.

## Steps

### S1. Analyze

Analyze the user's request:
- Determine the goal, domain, and entities to represent.
- Decide how many diagrams are needed (1 or multiple).
- Select the best diagram type for each:
  - `flowchart` for workflows, processes, decision trees, architecture blocks.
  - `sequence` for chronological message flows between actors and systems.
  - `class` for object-oriented designs, domain models, relationships.
  - `state` for state machines, entity lifecycles, status transitions.
  - `er` for relational databases, database entities, foreign keys.
- Determine if legend, component annotations, or general notes are needed.

Done when the list of diagrams, their types, and core details are identified.

### S2. Collect context

If the diagram describes existing code or project components:
- Locate the relevant project under `./work-together/projects/<project>/` and inspect `project.md` / `memory.md`.
- Read existing source files to ensure entity names, function names, and flow steps match actual implementations.
- If no existing code is involved, skip this step.

Done when diagram entities and relationships reflect verified facts.

### S3. Clarify

If ambiguities or multiple plausible directions exist, ask 1-4 focused questions via `ask_question`. If the request is clear and straightforward, proceed directly to drafting.

Done when key requirements are settled.

### S4. Draft

Present the proposed Mermaid code in chat:
- For each diagram, show:
  - Diagram title & caption.
  - Mermaid code block in ` ```mermaid ` format.
  - Legend items (symbol / color / meaning) if applicable.
  - Component annotations (target node ID / name / note) if applicable.
  - General notes / explanations if applicable.
- Specify the proposed output file path: `./work-together/diagrams/<slug>.html` (where `<slug>` is short, descriptive kebab-case).
- Ask the user to confirm generating the HTML file.

Done when draft is shown in chat and confirmation is requested.

### S5. Iterate, then assemble

- **Changes requested:** Revise the Mermaid code or structure and present the draft again.
- **Confirmed:**
  1. Assemble with the script (recommended):
     - Build a spec JSON containing the page fields and every diagram (see the spec block at the top of `scripts/assemble.mjs`).
     - Run `node scripts/assemble.mjs < spec.json` (add `--out`/`--force` as needed) from the workspace root.
     - Read the warnings: they flag unreadable label colors, `<br>` usage, and unknown diagram types. Fix the spec and re-run until it reports only the diagrams you intend.
     - Skip to step 5 once it writes the file.
  2. Assemble by hand (fallback when the script is unavailable):
     - Read [references/components/README.md](references/components/README.md).
     - Read each component file needed from `references/components/`:
       - `shell.html`
       - `header.html`
       - `toc.html` & `toc-item.html` (include TOC only if there are 2 or more diagrams; if only 1 diagram, remove `<!-- SLOT:TOC -->`)
       - `diagram-card.html`
       - `legend.html` & `legend-item.html` (if legend is present)
       - `component-notes.html` & `component-note-item.html` (if component notes are present)
       - `notes.html` (if general notes are present)
     - Replace placeholders `{{placeholder}}` with actual escaped values.
     - Inject populated snippets into the respective `<!-- SLOT:... -->` markers. Remove any unused slot markers.
  3. Check if `./work-together/diagrams/<slug>.html` already exists; ask before overwriting if it does.
  4. Write the final assembled file to `./work-together/diagrams/<slug>.html`.

Done when the HTML file exists and is validated.

### S6. Hand off

Provide the user with:
- The absolute or workspace-relative path to the generated HTML file: `work-together/diagrams/<slug>.html`.
- A tip that they can double-click or open this file in any web browser to interact with the diagrams (zoom, pan, copy source, toggle theme, export SVG/PNG). Note that an active internet connection is required to load `mermaid@11` from CDN.

Done when the path and browser instructions are communicated.
