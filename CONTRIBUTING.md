# Contributing extensions

Rel.AI extensions should stay small, declarative, and explicit about the local capabilities they expect to use.

## Before publishing

- Keep ChatGPT Web as the reasoning and conversation host. Do not bundle or silently launch a separate model/agent runtime.
- Prefer a `skill` extension when instructions plus existing Rel.AI tools are enough.
- Use `cli` only when the workflow depends on an existing local command. The manifest declares that command; Rel.AI does not treat the extension package itself as an executable installer.
- Request only the permissions the workflow actually needs. Permission declarations are shown to the user but never bypass Rel.AI authorization.
- Package only files listed in `relai-extension.json` and include the SHA-256 hash of every file.
- Use HTTPS for repositories and catalog manifest URLs.

## Catalog entry

Add one entry to `catalog.json` with the extension id, display metadata, version, kind, raw HTTPS manifest URL, repository, publisher, and the same permissions declared by the manifest. Rel.AI rejects installs when catalog identity, version, kind, or permissions disagree with the downloaded manifest.

## Versioning and compatibility

Use semantic versioning for the extension version and a semantic-version range for `compatibility.relai`. Increase the extension version whenever any packaged file or manifest behavior changes and update its catalog entry at the same time.

## Review checklist

1. Validate the manifest against `schema/relai-extension.schema.json`.
2. Recompute every declared SHA-256 hash from the exact published file bytes.
3. Confirm `entrypoints.skill` is one of the declared files.
4. For CLI extensions, confirm `entrypoints.command` names the required existing command and list it under `requires.commands`.
5. Confirm requested permissions match the documented workflow.
6. Confirm the catalog entry matches the manifest.

OpenResearch is intentionally outside the initial extension set requested for this foundation.