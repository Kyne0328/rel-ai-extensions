---
name: difftastic
description: Use Difftastic as a syntax-aware diff aid when ordinary textual diffs make code changes hard to review.
---

# Difftastic

Use `difft` to improve review clarity for code changes.

## Workflow

1. Inspect the normal Git diff first.
2. Use Difftastic when syntax-aware presentation makes the change easier to understand.
3. Prefer one-shot Git integration or direct file comparison over global Git configuration.
4. Treat Difftastic as a review aid, not as semantic proof.
5. Validate behavior with the relevant tests separately.

## Boundaries

- Keep usage read-only.
- Do not modify repository-wide Git configuration just to display a diff.
