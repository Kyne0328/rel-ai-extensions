---
name: trivy
description: Use Trivy for explicit vulnerability, secret, filesystem, container, or configuration scanning tasks where security findings are requested.
---

# Trivy

Use Trivy only for explicit security-scanning work.

## Workflow

1. Prefer local filesystem or repository scans first.
2. Scan external images or targets only when the user asks for them.
3. Select only scanners relevant to the task.
4. Expect network access for vulnerability databases when needed.
5. Investigate findings before changing dependencies or configuration.

## Boundaries

- Never expose discovered secret values in chat or logs.
- Do not auto-upgrade unrelated dependencies merely because a scanner reports them.
- Distinguish scanner findings from confirmed exploitability.
