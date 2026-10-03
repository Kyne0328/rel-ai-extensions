---
name: hyperfine
description: Use Hyperfine for controlled command-line performance comparisons when the task explicitly depends on measured runtime.
---

# Hyperfine

Use Hyperfine only for performance-sensitive tasks.

## Workflow

1. Make compared commands equivalent in input, environment, and side effects.
2. Use warmups or setup commands when needed.
3. Avoid benchmarking destructive or state-changing commands without isolation.
4. Report variability and environmental caveats with the result.
5. Do not optimize code solely from a noisy benchmark.

## Boundaries

- Prefer correctness tests before performance tuning.
- Use the smallest benchmark that answers the performance question.
