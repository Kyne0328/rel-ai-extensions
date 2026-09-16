# Contributing extensions

Keep extensions small and declarative. State which local capabilities the extension needs.

## Before publishing

- Keep ChatGPT Web as the reasoning and conversation host.
- Do not package or start another model or agent runtime.
- Use `skill` when instructions and existing Rel.AI tools are sufficient.
- Use `cli` only when the workflow requires an existing local command.
- Declare the required command in the manifest.
- Do not use the extension package as an executable installer.
- Request only the permissions that the workflow needs.
- Permission declarations inform the user. Rel.AI authorization still controls access.
- List every package file in `relai-extension.json`.
- Include the SHA-256 hash of every package file.
- Use HTTPS for repository URLs and catalog manifest URLs.

## Catalog entry

Add one entry to `catalog.json` for each published extension.

The entry must contain:

- extension id
- display name and description
- version
- extension type
- raw HTTPS manifest URL
- repository
- publisher
- permissions

The catalog permissions must match the manifest permissions.
Rel.AI rejects installation if the catalog and manifest disagree about identity, version, type, or permissions.

## Versioning and compatibility

Use semantic versioning for the extension version.
Use a semantic-version range for `compatibility.relai`.

Increase the extension version when a package file changes or extension behavior changes.
Update the catalog entry when you publish the new version.

## Review checklist

1. Validate the manifest against `schema/relai-extension.schema.json`.
2. Calculate each SHA-256 hash from the exact published file bytes.
3. Confirm that `entrypoints.skill` names a file in the manifest.
4. For a CLI extension, confirm that `entrypoints.command` names the required command.
5. For a CLI extension, list the same command in `requires.commands`.
6. Confirm that the requested permissions match the documented workflow.
7. Confirm that the catalog entry matches the manifest.
