# Extension development

This guide describes the development, validation, test, and publishing workflow for Rel.AI extensions.

## Requirements

Install Node.js 20 or later and npm.
Create a GitHub repository for the extension source.

The published manifest and package files must use HTTPS.
Rel.AI must be able to download them without authentication.

Clone the catalog repository:

```bash
git clone https://github.com/Kyne0328/rel-ai-extensions.git
cd rel-ai-extensions
npm ci
```

## Create a skill extension

Start from [`examples/hello-relai`](../examples/hello-relai).

Create these files in your extension repository:

```text
relai-extension.json
SKILL.md
```

Add other package files only when the skill needs them.
List every package file in `relai-extension.json`.

## Create a CLI extension

Start from [`examples/hello-relai-cli`](../examples/hello-relai-cli).

A CLI extension uses an existing command on the user's computer.
It does not install that command.

Set `entrypoints.command` to the command name.
Add the same command to `requires.commands`.

Declare `command.execute` when the workflow expects Rel.AI to run the command.

## Calculate package hashes

Calculate the SHA-256 hash from the exact bytes that you publish.

PowerShell:

```powershell
(Get-FileHash -Algorithm SHA256 .\SKILL.md).Hash.ToLower()
```

macOS or Linux:

```bash
sha256sum SKILL.md
```

Put the lowercase hash in the matching `files` entry.

## Validate before you publish

From this catalog repository, run:

```bash
npm run validate:manifest -- ../my-extension/relai-extension.json
```

The validator checks the same package limits and cross-field rules that Rel.AI uses.
It also verifies each local package file and SHA-256 hash.

Run the repository checks with:

```bash
npm test
```

## Test an unpublished extension

Rel.AI accepts an HTTPS catalog override through `REL_AI_EXTENSIONS_CATALOG_URL`.
Use a temporary catalog on a public GitHub fork or branch.

Do not add a local-file installer path.
The test uses the same HTTPS download path as the public catalog.

1. Push the extension manifest and package files to a public test branch in the extension repository.
2. Fork `Kyne0328/rel-ai-extensions`.
3. Create a test branch in the fork.
4. Add a temporary catalog entry for the extension.
5. Set `manifestUrl` to the raw HTTPS manifest URL from the extension test branch.
6. Push the temporary catalog branch.
7. Set `REL_AI_EXTENSIONS_CATALOG_URL` before you start Rel.AI.
8. Start Rel.AI from the same shell.
9. Open Extensions > Discover.
10. Refresh the catalog.
11. Review the declared permissions.
12. Install and test the extension.

PowerShell example:

```powershell
$env:REL_AI_EXTENSIONS_CATALOG_URL="https://raw.githubusercontent.com/<user>/rel-ai-extensions/<branch>/catalog.json"
npm start
```

macOS or Linux example:

```bash
export REL_AI_EXTENSIONS_CATALOG_URL="https://raw.githubusercontent.com/<user>/rel-ai-extensions/<branch>/catalog.json"
npm start
```

Replace `npm start` with the command that you use to start Rel.AI.
The process must inherit the environment variable.

Remove the temporary catalog entry after the test.

## Publish to the public catalog

Publish the extension files before you submit the catalog entry.
The public manifest URL must return the exact manifest that you validated.
All published package files must remain accessible without authentication.

Then:

1. Fork this repository.
2. Add the extension entry to `catalog.json`.
3. Update `updatedAt`.
4. Run `npm test`.
5. Push the branch.
6. Open a pull request.

GitHub Actions runs the same validation on the pull request.

## Update an extension

Increase the extension version when a package file changes or extension behavior changes.
Update all changed SHA-256 values.
Update the catalog version at the same time.

Rel.AI compares the catalog version with the installed version.
The Extensions page shows an update when the catalog contains a newer semantic version.
