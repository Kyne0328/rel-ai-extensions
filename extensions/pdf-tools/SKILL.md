---
name: pdf-tools
description: Use when ChatGPT needs structural PDF operations such as checking, splitting, merging, selecting, rotating, linearizing, repairing/re-writing, or inspecting encryption and objects with qpdf.
---

# PDF Tools

Use `qpdf` for PDF container and structural operations.

## Workflow

1. Inspect or check the PDF before modifying it when structure or corruption matters.
2. Preserve the source file and write to a new output unless replacement is explicitly requested.
3. Use qpdf for page selection, merge/split, rotation, linearization, encryption inspection, and structural rewrite/repair.
4. Validate important outputs with `qpdf --check`.
5. Keep page-order and encryption changes explicit.

Do not use qpdf as a document layout or text editor. Use the appropriate document/Office tooling when the task is about authored content rather than the PDF container.

Only decrypt or change PDF security when the user is authorized and any required password is available. Use Rel.AI's normal authorization boundary for every command.
