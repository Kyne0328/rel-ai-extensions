---
name: ci-failure-triage
description: Use for concrete CI failures to isolate the newest failing boundary and apply the smallest behavior-preserving fix.
---

# CI Failure Triage

For a concrete failing CI command or log:

1. Treat the newest failure as a fresh debugging boundary.
2. Identify the exact failing tests, assertions, stack traces, and directly implicated code.
3. Inspect those paths first.
4. Find the smallest explanation that accounts for the observed failures.
5. Make the minimum behavior-preserving fix.
6. Run the previously failing tests.
7. Run the exact parent CI command that failed.
8. Broaden only if that command still fails or evidence proves a wider defect.

Do not use a targeted CI failure as a reason for an architecture-wide audit or speculative hardening.
