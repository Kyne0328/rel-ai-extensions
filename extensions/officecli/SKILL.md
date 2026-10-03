---
name: officecli
description: Use when ChatGPT must create, inspect, edit, validate, render, convert, or visually review DOCX/Word documents, XLSX/Excel spreadsheets or workbooks, and PPTX/PowerPoint presentations, slides, or decks through Rel.AI with OfficeCLI.
---

# OfficeCLI

Use OfficeCLI as the document engine.
Keep Rel.AI as the authorization and execution boundary.

## Workflow

1. Inspect the document before you edit it.
2. Use the highest-level OfficeCLI operation that can do the task.
3. Make only the required changes.
4. Use a batch operation for related changes when it is useful.
5. Render the document when layout is important.
6. Run issue checks and validation.
7. Close the document before another program reads it.

## Execution

- Use `relai_exec` for one-shot `officecli` commands.
- Prefer direct executable and argument calls when shell syntax is not necessary.
- Use `relai_process` for long-running commands such as `officecli watch`.
- Use `relai_ui` or `relai_browser` for the local preview from `officecli watch`.
- Set `OFFICECLI_SKIP_UPDATE=1` for every managed OfficeCLI command.
- Rel.AI controls updates for the pinned OfficeCLI binary.
- Prefer `--json` when a command supports structured output.
- Run `officecli help ...` if you do not know the correct command syntax.

## Operation levels

Use the simplest level that can do the task.

1. Read and inspect with `view`, `get`, `query`, and `validate`.
2. Edit with `set`, `add`, `remove`, `move`, `swap`, and `batch`.
3. Use raw OOXML commands only when the higher-level commands cannot do the task.

Use stable object identifiers when OfficeCLI provides them.
Preserve existing content and formatting unless the user asks for a larger change.

## Visual checks

Use this procedure for layout-sensitive Word or PowerPoint work.

1. Start `officecli watch <file>` with `relai_process`.
2. Open the local preview with a Rel.AI browser tool.
3. Inspect the rendered result after important edits.
4. Run `officecli view <file> issues --json`.
5. Run `officecli validate <file>`.
6. Fix relevant issues.
7. Inspect the rendered result again.

Use `officecli get <file> selected --json` when a supported selection can make object targeting safer.

## Examples

Read a presentation:

`officecli get deck.pptx / --depth 2 --json`

Check document issues:

`officecli view report.docx issues --json`

Create a presentation:

`officecli create deck.pptx`

`officecli add deck.pptx / --type slide --prop title="Q4 Report"`

Edit an Excel cell:

`officecli set data.xlsx /Sheet1/B2 --prop value="=SUM(B3:B20)"`

Open a visual preview:

`officecli watch deck.pptx`

## Boundaries

- Do not start `officecli mcp`.
- Use the existing Rel.AI execution tools.
- Do not install another OfficeCLI copy during normal extension use.
- Rel.AI manages the pinned binary when the manifest declares a compatible artifact.
- Do not use desktop automation when OfficeCLI can do the task reliably.
