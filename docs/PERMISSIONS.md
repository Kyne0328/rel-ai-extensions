# Extension permissions

Permissions describe the Rel.AI capabilities that an extension expects to use.

A permission declaration does not grant access.
Rel.AI authorization still controls each local action.

Request only the permissions that the workflow needs.

| Permission | Declare it when the workflow needs to |
| --- | --- |
| `workspace.read` | Read files or repository data in the active workspace. |
| `workspace.write` | Create, edit, move, or delete files in the active workspace. |
| `command.execute` | Run an existing local command or program through Rel.AI. |
| `git` | Read or change Git state through Rel.AI Git operations. |
| `network` | Make network requests through an authorized Rel.AI capability. |
| `browser` | Open or control browser pages through Rel.AI browser tools. |
| `computer` | Control desktop applications through Rel.AI computer tools. |

## Skill example

A skill that only explains how to inspect source files can declare:

```json
"permissions": ["workspace.read"]
```

Add `workspace.write` only if the workflow can change workspace files.

## CLI example

A CLI extension that runs an existing formatter can declare:

```json
"permissions": ["workspace.read", "workspace.write", "command.execute"]
```

The CLI program must also appear in `requires.commands`.

## Catalog rule

The `permissions` array in `catalog.json` must match the manifest array.
Rel.AI compares both values before installation.
