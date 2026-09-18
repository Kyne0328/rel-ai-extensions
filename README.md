# Rel.AI Extensions

This repository contains the public Rel.AI extension catalog, package specification, examples, and validation tools.

Rel.AI extensions add workflows and adapters. ChatGPT Web remains the conversation and reasoning host.
Extensions use existing Rel.AI capabilities. Rel.AI authorization, workspace, and audit rules still apply.

## Extension types

Rel.AI 1.x supports two extension types:

- **skill** — A `SKILL.md` file tells ChatGPT how to use a project, workflow, or Rel.AI capability.
- **cli** — A skill also requires a local command. Rel.AI runs that command through its existing execution tools. A CLI extension may optionally declare SHA-256-pinned platform binaries for Rel.AI to auto-install when the command is missing.

Rel.AI does not load extension packages as executable service code.
A manifest can declare required access. These declarations do not grant access.
Rel.AI authorization controls each local action.

## Start developing

Requirements:

- Node.js 20 or later
- npm
- a GitHub repository for your extension

Published manifests and package files must use HTTPS and must be accessible without authentication.

Clone this repository and install the validator:

```bash
git clone https://github.com/Kyne0328/rel-ai-extensions.git
cd rel-ai-extensions
npm ci
npm run validate
```

Use [`examples/hello-relai`](examples/hello-relai) for a skill example.
Use [`examples/hello-relai-cli`](examples/hello-relai-cli) for a CLI example.

Read [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for the complete development and test workflow.
Read [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) before you declare permissions.

## Validate an extension

Run the validator against a local manifest:

```bash
npm run validate:manifest -- ../my-extension/relai-extension.json
```

The validator checks the manifest, package paths, file sizes, SHA-256 hashes, semantic versions, CLI requirements, and other runtime rules.

Run the complete repository validation with:

```bash
npm test
```

The complete validation also checks `catalog.json`.
For catalog entries, it checks the published manifest and package files.

## Package format

Each extension contains a `relai-extension.json` manifest and at least one package file.

The manifest records:

- extension identity and version
- compatible Rel.AI versions
- publisher and repository
- requested permissions
- local requirements
- entry points
- optional verified CLI binary artifacts
- package files and SHA-256 hashes

See [`schema/relai-extension.schema.json`](schema/relai-extension.schema.json) for the machine-readable format.

## Catalog

[`catalog.json`](catalog.json) is the public extension index that Rel.AI uses.
Each catalog entry points to an HTTPS manifest.

During installation, Rel.AI:

1. downloads the selected manifest
2. checks its identity, version, type, and permissions against the catalog
3. checks Rel.AI compatibility and local requirements
4. downloads only the files that the manifest lists
5. verifies each package file with its SHA-256 hash
6. when a CLI command is missing and the manifest declares a compatible binary artifact, downloads that HTTPS artifact and verifies its SHA-256 hash
7. installs the extension and any managed CLI binary in Rel.AI local data

Rel.AI does not install extension files in a project folder.

## Publish an extension

1. Develop and validate the extension in its own repository.
2. Test it with a temporary catalog on your fork or branch.
3. Fork this repository.
4. Add one entry to `catalog.json`.
5. Update `updatedAt`.
6. Run `npm test`.
7. Open a pull request.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the review rules.

## License

This repository uses the Apache License 2.0.

An extension can use a different license in its own repository.
Adding an extension to the catalog does not change the extension license.