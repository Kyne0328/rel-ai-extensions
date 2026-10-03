---
name: actionlint
description: Use actionlint to statically validate GitHub Actions workflow files and diagnose workflow YAML errors.
---

# Actionlint

Use actionlint for GitHub Actions workflow validation.

## Workflow

1. Start with the workflow files implicated by the task or CI failure.
2. Run `actionlint` and read the exact diagnostics.
3. Fix the smallest workflow defect that explains the failure.
4. Do not weaken conditions, assertions, or security controls to silence diagnostics.
5. Run the repository's own workflow validation after the focused fix.

## Boundaries

- Keep the task scoped to actual workflow problems.
- Do not redesign CI unless evidence requires it.
