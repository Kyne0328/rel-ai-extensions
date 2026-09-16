# Rel.AI Extensions

This repository contains the public Rel.AI extension catalog and package specification.

Rel.AI extensions add workflows and adapters. ChatGPT Web remains the conversation and reasoning host.
Extensions use existing Rel.AI capabilities. Rel.AI authorization, workspace, and audit rules still apply.

## Extension types

Rel.AI 1.x supports two extension types:

- **skill** — A `SKILL.md` file tells ChatGPT how to use a project, workflow, or Rel.AI capability.
- **cli** — A skill also requires a local command. Rel.AI runs that command through its existing execution tools.

Rel.AI does not load extension packages as executable service code.
A manifest can declare required access. These declarations do not grant access.
Rel.AI authorization controls each local action.

## Package format

Each extension contains a `relai-extension.json` manifest and at least one package file.

The manifest records:

- extension identity and version
- compatible Rel.AI versions
- publisher and repository
- requested permissions
- local requirements
- entry points
- package files and SHA-256 hashes

See [`schema/relai-extension.schema.json`](schema/relai-extension.schema.json) for the machine-readable format.
See [`examples/hello-relai`](examples/hello-relai) for a minimal example.

## Catalog

[`catalog.json`](catalog.json) is the public extension index that Rel.AI uses.
Each catalog entry points to an HTTPS manifest.

During installation, Rel.AI:

1. downloads the selected manifest
2. checks its identity, version, type, and permissions against the catalog
3. checks Rel.AI compatibility and local requirements
4. downloads only the files that the manifest lists
5. verifies each file with its SHA-256 hash
6. installs the extension in Rel.AI local data

Rel.AI does not install extension files in a project folder.

## Publishing

1. Create `SKILL.md` and `relai-extension.json` in your repository.
2. Request only the permissions that the extension needs.
3. Calculate a SHA-256 hash for each package file.
4. Put each file and hash in the manifest.
5. Add one entry to `catalog.json`.
6. Set `manifestUrl` to the raw HTTPS manifest URL.
7. Validate the manifest against the schema before you submit it.
