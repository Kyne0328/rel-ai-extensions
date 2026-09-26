---
name: pandoc
description: Use when ChatGPT needs reliable document-format conversion with Pandoc, especially between Markdown, HTML, DOCX, EPUB, LaTeX, reStructuredText, and other Pandoc-supported text/document formats.
---

# Pandoc

Use `pandoc` primarily as a format-conversion engine.

## Workflow

1. Identify the source and target formats before conversion.
2. Specify `-f` and `-t` when format detection is ambiguous.
3. Use `--standalone` when the output must be a complete document rather than a fragment.
4. Use project-provided reference documents, templates, filters, or metadata only when the task requires them.
5. Preserve the source and write to an explicit output path.
6. Verify that the output exists and is structurally plausible.

Do not use Pandoc as a substitute for precise Office layout editing; use OfficeCLI or the relevant document tool for layout-sensitive DOCX/PPTX work.

Do not promise perfect round-trip fidelity between formats with different layout models. Use Rel.AI's normal authorization boundary for every command.
