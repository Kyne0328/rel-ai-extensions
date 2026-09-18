---
name: officecli
description: Create, inspect, edit, validate, and visually review Word, Excel, and PowerPoint files with OfficeCLI through Rel.AI.
---

# OfficeCLI

Use this extension for `.docx`, `.xlsx`, and `.pptx` work when OfficeCLI's structured document operations or renderer are useful.

OfficeCLI is installed and executed as a local CLI through Rel.AI. Keep Rel.AI's workspace, authorization, process, browser, and audit boundaries intact.

## Execution

- Use `relai_exec` for one-shot `officecli` commands. Prefer direct executable + argv form when shell syntax is not needed.
- Use `relai_process` only for long-lived commands such as `officecli watch`.
- Use `relai_ui` or `relai_browser` for the localhost preview created by `officecli watch`.
- Set `OFFICECLI_SKIP_UPDATE=1` in the environment for every managed OfficeCLI invocation. Rel.AI pins the reviewed binary; OfficeCLI must not self-update it in place.
- Prefer `--json` whenever the command supports structured output.
- When unsure about a property, element, or command syntax, run `officecli help ...` instead of guessing.

## Strategy

Use the simplest layer that can complete the task:

1. L1 read/inspect: `view`, `get`, `query`, `validate`.
2. L2 document operations: `set`, `add`, `remove`, `move`, `swap`, `batch`.
3. L3 raw OOXML: `raw`, `raw-set`, and related low-level operations only when L1/L2 cannot express the required change.

Inspect an existing document before editing it. Preserve working content and formatting unless the user asks for broader redesign.

## Common workflow

1. Inspect structure and content with `view` or `get --json`.
2. Make targeted edits. Use `batch` for many related mutations.
3. For layout-sensitive Word/PowerPoint work, start `officecli watch <file>` as a managed watcher and inspect the localhost preview.
4. Run `officecli view <file> issues --json` and `officecli validate <file>`.
5. Fix relevant issues and re-check the rendered result.
6. Run `officecli close <file>` before another program, desktop app, upload, or delivery reads the finished file.

## Examples

Read a presentation:
`officecli get deck.pptx / --depth 2 --json`

Check document issues:
`officecli view report.docx issues --json`

Create a PowerPoint:
`officecli create deck.pptx`
`officecli add deck.pptx / --type slide --prop title="Q4 Report"`

Edit an Excel cell:
`officecli set data.xlsx /Sheet1/B2 --prop value="=SUM(B3:B20)"`

Open visual preview:
`officecli watch deck.pptx`

Do not install a second copy of OfficeCLI with curl, PowerShell, npm, Homebrew, or Scoop during normal extension use. Rel.AI manages the pinned extension binary when a compatible artifact is declared.