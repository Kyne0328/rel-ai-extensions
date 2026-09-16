# Rel.AI Extensions

Canonical catalog and package specification for extensions used by Rel.AI MCP.

Rel.AI extensions add reusable workflows and adapters without replacing the model. **ChatGPT Web remains the conversation and reasoning host.** Extensions use Rel.AI's existing local capabilities, authorization policy, workspace boundaries, and audit behavior.

## Extension types

Rel.AI 1.x supports two declarative extension types:

- **skill** — a `SKILL.md` that teaches ChatGPT how to use an external project, workflow, or existing Rel.AI capability.
- **cli** — a skill plus a required local command. ChatGPT still reasons in the conversation and invokes the CLI through Rel.AI's existing execution tools.

Extensions are not imported as arbitrary executable code into the Rel.AI service process. A manifest may declare the access an extension expects, but those declarations do not grant authority; normal Rel.AI authorization remains the enforcement boundary.

## Package format

Every extension has a `relai-extension.json` manifest and at least one hashed package file. The manifest declares identity, semantic version, compatible Rel.AI versions, publisher, repository, requested permissions, local requirements, entrypoints, and SHA-256 hashes.

See [`schema/relai-extension.schema.json`](schema/relai-extension.schema.json) for the machine-readable format and [`examples/hello-relai`](examples/hello-relai) for a minimal reference package.

## Catalog

[`catalog.json`](catalog.json) is the canonical public index consumed by Rel.AI. Catalog entries point to HTTPS manifests in extension repositories. Rel.AI downloads the selected manifest server-side, verifies catalog identity/version/kind/permissions, checks compatibility, downloads only declared files, verifies every SHA-256 checksum, and installs the package into Rel.AI local data rather than a project folder.

## Publishing

1. Create `SKILL.md` and `relai-extension.json` in your repository.
2. Keep requested permissions limited to the workflow's actual needs.
3. Hash every packaged file and put the SHA-256 values in the manifest.
4. Add one entry to `catalog.json` that points to the raw HTTPS manifest URL.
5. Validate the manifest against the schema before submitting it.

OpenResearch is intentionally not included in the initial catalog foundation.