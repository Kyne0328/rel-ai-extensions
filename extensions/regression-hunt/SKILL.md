---
name: regression-hunt
description: Use Git regression hunting and bisect when a deterministic bug has a known good revision and a known bad revision.
---

# Regression Hunt

Use Git bisect only when there is a reliable good/bad range.

## Workflow

1. Confirm the failure is deterministic enough to classify revisions.
2. Protect dirty user changes before changing revisions.
3. Identify one known-good and one known-bad revision.
4. Prefer automated `git bisect run` when the test command is reliable.
5. Skip revisions that cannot be classified.
6. Inspect the first bad commit and verify the causal change.
7. Always reset the bisect and restore the original worktree state.

## Boundaries

- Do not bisect flaky failures.
- Do not bisect when direct evidence has already localized the defect.
