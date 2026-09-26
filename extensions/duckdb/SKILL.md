---
name: duckdb
description: Use when ChatGPT needs to analyze, query, summarize, join, or transform local CSV, Parquet, JSON/NDJSON, DuckDB, or other tabular data with DuckDB instead of loading large datasets into model context.
---

# DuckDB

Use `duckdb` as the local analytical engine for data-heavy work.

## Workflow

1. Inspect the source schema and a small sample before writing a large query.
2. Prefer SQL aggregation, filtering, joins, and profiling over reading entire datasets into ChatGPT context.
3. Keep source files unchanged unless the user asks for a transformation.
4. Write derived files only to explicit workspace paths.
5. Return concise query results and the query that produced them when useful.

Useful readers include `read_parquet`, `read_csv_auto`, and `read_json_auto`.

For exploratory work, use `DESCRIBE`, `SUMMARIZE`, `SELECT ... LIMIT`, counts, and null/distinct checks before broader analysis.

Do not install DuckDB extensions or enable external access unless the current task requires them. Use Rel.AI's normal authorization boundary for every command.
