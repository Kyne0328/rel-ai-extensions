# Rel.AI Extensions

This repository contains the public Rel.AI extension catalog, package specification, examples, and validation tools.

The catalog is for discovery and installation metadata. Keep each real extension in its own repository.

## Available extensions

`catalog.json` is the source of truth for this list. Run `npm run readme:update` after you change the catalog.

<!-- catalog:extensions:start -->
| Extension | Type | Version | Managed install | Description |
| --- | --- | --- | --- | --- |
| [OfficeCLI](https://github.com/Kyne0328/rel-ai-extension-officecli) | `cli` | `1.0.0` | Yes | Create, inspect, edit, validate, and visually review Word, Excel, and PowerPoint files. |
<!-- catalog:extensions:end -->

Review an extension repository before installation. A catalog entry does not grant extra access.

## Repository layout

```text
rel-ai-extensions/
├── catalog.json
├── schema/
│   └── relai-extension.schema.json
├── scripts/
│   ├── update-readme.mjs
│   └── validate.mjs
├── examples/
│   ├── hello-relai/
│   └── hello-relai-cli/
├── docs/
│   ├── DEVELOPMENT.md
│   └── PERMISSIONS.md
├── CONTRIBUTING.md
└── README.md
```

Use these directories for catalog infrastructure, examples, and documentation. Do not copy real extension packages into this repository.

## Extension types

Rel.AI 1.x supports two extension types.

- **skill**: A `SKILL.md` file tells ChatGPT how to use a workflow or Rel.AI capability.
- **cli**: A skill also uses a local command through Rel.AI execution tools.

A CLI extension can declare verified binaries for managed installation. Rel.AI downloads only the declared artifact for the current platform.

Rel.AI does not load extension packages as service code. Rel.AI still controls authorization, workspace access, execution, browser access, and audit records.

## Catalog

`catalog.json` is the public index that Rel.AI reads.

Each entry contains the extension identity, version, type, repository, manifest URL, publisher, permissions, and install metadata.

During installation, Rel.AI:

1. Downloads the selected manifest.
2. Checks its identity, version, type, permissions, and install metadata against the catalog.
3. Checks Rel.AI compatibility and local requirements.
4. Downloads only files that the manifest declares.
5. Checks each package file with SHA-256.
6. Checks a managed CLI binary with SHA-256 when the manifest declares one.
7. Installs the extension in Rel.AI local data.

Rel.AI does not install extension files in a project folder.

## Develop an extension

Requirements:

- Node.js 20 or later
- npm
- a separate GitHub repository for the extension

Start with an example:

- [Skill example](examples/hello-relai)
- [CLI example](examples/hello-relai-cli)

Read [Extension development](docs/DEVELOPMENT.md) for the full workflow.
Read [Permissions](docs/PERMISSIONS.md) before you declare permissions.

Validate a local extension manifest:

```bash
npm ci
npm run validate:manifest -- ../my-extension/relai-extension.json
```

## Publish an extension

1. Develop the extension in its own repository.
2. Publish the manifest and package files over HTTPS.
3. Add or update one entry in `catalog.json`.
4. Update `updatedAt`.
5. Run `npm run readme:update`.
6. Run `npm test`.
7. Open a pull request.

Do not edit the generated extension table by hand.

See [CONTRIBUTING.md](CONTRIBUTING.md) for review rules.

## License

This catalog repository uses the Apache License 2.0.

An extension can use a different license in its own repository. A catalog entry does not change the extension license.
