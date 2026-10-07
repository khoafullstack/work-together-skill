# HTML Components Catalog

This catalog documents the core components used to assemble a standalone Mermaid HTML document. Every generated HTML page must be composed strictly from these files.

## Component Inventory

| File | Purpose | Slots & Placeholders | Parent / Injection Target |
|---|---|---|---|
| `shell.html` | Master document shell, styles, responsive layout, theme engine, toolbar controllers | `{{lang}}`<br>`{{page_title}}`<br>`<!-- SLOT:HEADER -->`<br>`<!-- SLOT:TOC -->`<br>`<!-- SLOT:CONTENT -->` | Root file |
| `header.html` | Page header containing title, summary, metadata | `{{title}}`<br>`{{description}}`<br>`{{created_date}}`<br>`{{diagram_count}}` | Injected into `<!-- SLOT:HEADER -->` |
| `toc.html` | Table of contents navigation sidebar | `<!-- SLOT:TOC_ITEMS -->` | Injected into `<!-- SLOT:TOC -->` (only when >= 2 diagrams) |
| `toc-item.html` | Individual link item in TOC | `{{diagram_id}}`<br>`{{diagram_title}}` | Repeated inside `<!-- SLOT:TOC_ITEMS -->` |
| `diagram-card.html` | Card container for a diagram with action toolbar | `{{diagram_id}}`<br>`{{diagram_title}}`<br>`{{caption}}`<br>`{{mermaid_code}}`<br>`<!-- SLOT:LEGEND -->`<br>`<!-- SLOT:COMPONENT_NOTES -->`<br>`<!-- SLOT:NOTES -->` | Repeated inside `<!-- SLOT:CONTENT -->` |
| `legend.html` | Legend container for a diagram | `<!-- SLOT:LEGEND_ITEMS -->` | Injected into `<!-- SLOT:LEGEND -->` (inside `diagram-card.html`) |
| `legend-item.html` | Individual legend row with color swatch & symbol | `{{color}}`<br>`{{symbol}}`<br>`{{meaning}}` | Repeated inside `<!-- SLOT:LEGEND_ITEMS -->` |
| `component-notes.html` | Container for component/node-specific notes | `<!-- SLOT:COMPONENT_NOTE_ITEMS -->` | Injected into `<!-- SLOT:COMPONENT_NOTES -->` (inside `diagram-card.html`) |
| `component-note-item.html` | Individual note linked directly to a diagram node/component | `{{target_node_id}}`<br>`{{component_name}}`<br>`{{note_content}}` | Repeated inside `<!-- SLOT:COMPONENT_NOTE_ITEMS -->` |
| `notes.html` | General explanatory text notes for a diagram | `{{notes_html}}` | Injected into `<!-- SLOT:NOTES -->` (inside `diagram-card.html`) |

## Assembly Process

Follow these steps in exact sequence:

1. **Read `shell.html`**:
   - Set `{{lang}}` (e.g. `en` or `vi`).
   - Set `{{page_title}}`.
2. **Build Header**:
   - Read `header.html`.
   - Replace `{{title}}`, `{{description}}`, `{{created_date}}` (YYYY-MM-DD), `{{diagram_count}}`.
   - Replace `<!-- SLOT:HEADER -->` in `shell.html` with this content.
3. **Build TOC (Conditional)**:
   - If there is **only 1 diagram**: completely remove `<!-- SLOT:TOC -->` from `shell.html`.
   - If there are **2 or more diagrams**:
     - Read `toc.html`.
     - For each diagram, read `toc-item.html`, replace `{{diagram_id}}` and `{{diagram_title}}`.
     - Join items and inject into `<!-- SLOT:TOC_ITEMS -->` of `toc.html`.
     - Replace `<!-- SLOT:TOC -->` in `shell.html` with the assembled `toc.html`.
4. **Build Diagram Cards**:
   - For each diagram:
     - Read `diagram-card.html`.
     - Replace `{{diagram_id}}` (kebab-case, e.g. `user-registration-flow`), `{{diagram_title}}`, `{{caption}}`.
     - Replace `{{mermaid_code}}` with the escaped Mermaid code (`&` -> `&amp;`, `<` -> `&lt;`, `>` -> `&gt;`).
     - **Legend (optional):** If diagram has a legend, read `legend.html`, repeat `legend-item.html` with `{{color}}` (hex code), `{{symbol}}` (e.g., `:::primary` or `-->`), and `{{meaning}}`. Inject into `<!-- SLOT:LEGEND -->`. If none, remove `<!-- SLOT:LEGEND -->`.
     - **Component Notes (optional):** If diagram has notes for specific components/nodes, read `component-notes.html`, repeat `component-note-item.html` with `{{target_node_id}}` (matching the node ID/participant in the Mermaid code), `{{component_name}}`, and `{{note_content}}`. Inject into `<!-- SLOT:COMPONENT_NOTES -->`. If none, remove `<!-- SLOT:COMPONENT_NOTES -->`.
     - **General Notes (optional):** If diagram has general notes, read `notes.html`, fill `{{notes_html}}` (using only standard semantic tags: `<p>`, `<ul>`, `<ol>`, `<li>`, `<code>`, `<strong>`, `<em>`), and inject into `<!-- SLOT:NOTES -->`. If none, remove `<!-- SLOT:NOTES -->`.
   - Join all assembled cards together and inject into `<!-- SLOT:CONTENT -->` in `shell.html`.
5. **Clean & Validate**:
   - Ensure no unreplaced `{{...}}` or `<!-- SLOT:... -->` remain.
   - Save to `./work-together/diagrams/<slug>.html`.

## Placeholder Escaping Rules

- `{{mermaid_code}}`: Must escape `&` to `&amp;`, `<` to `&lt;`, `>` to `&gt;`.
- `{{diagram_id}}`: Lowercase letters, digits, and hyphens only (`[a-z0-9-]+`).
- `{{title}}`, `{{diagram_title}}`, `{{description}}`, `{{caption}}`, `{{meaning}}`: Standard plain text (escape `<` and `>`).
- `{{notes_html}}`: Semantic HTML subset only (`<p>`, `<ul>`, `<ol>`, `<li>`, `<code>`, `<strong>`, `<em>`).
