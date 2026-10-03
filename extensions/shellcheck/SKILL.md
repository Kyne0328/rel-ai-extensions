---
name: shellcheck
description: Use ShellCheck to find correctness and portability problems in shell scripts while respecting the script's actual shell runtime.
---

# ShellCheck

Use ShellCheck for targeted shell-script static analysis.

## Workflow

1. Check the script's shebang and intended runtime.
2. Run ShellCheck on affected scripts first.
3. Fix behaviorally meaningful diagnostics with the smallest change.
4. Use narrow suppressions only when the warning is intentionally accepted.
5. Re-run the real script behavior or repository checks after fixes.

## Boundaries

- Do not rewrite scripts merely for style.
- Do not assume Bash semantics for scripts that target another shell.
