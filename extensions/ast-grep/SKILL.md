---
name: ast-grep
description: Use structural code search and rewrite with ast-grep when plain text search is too imprecise for code shapes.
---

# AST-grep

Use ast-grep for syntax-aware code search and targeted rewrites.

## Workflow

1. Use normal Rel.AI text search first when it is sufficient.
2. Use `sg` when the task depends on code structure rather than exact text.
3. Start with a read-only query and constrain language and paths.
4. Preview any rewrite before applying it.
5. Review the resulting diff and run the directly affected tests.

## Boundaries

- Do not broaden a targeted fix into repository-wide rewriting.
- Do not treat a structural match as proof of runtime behavior.
- Prefer the smallest query that answers the task.
