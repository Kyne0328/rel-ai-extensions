---
name: exiftool
description: Use when ChatGPT needs to inspect, compare, remove, copy, rename from, or update EXIF, GPS, IPTC, XMP, QuickTime, camera, timestamp, and other embedded file metadata with ExifTool.
---

# ExifTool

Use `exiftool` for metadata work across images, video, audio, and supported document/file formats.

## Workflow

1. Read metadata first. Prefer structured output such as `-j` when it reduces parsing ambiguity.
2. Make the narrowest metadata change required by the task.
3. Preserve or deliberately manage ExifTool's backup behavior when writing files.
4. Do not use `-overwrite_original` casually.
5. Re-read affected metadata after privacy cleanup, timestamp repair, rename, or bulk edits.

For privacy sanitization, verify that targeted GPS, device, author, or other sensitive fields are actually gone from the output.

Do not surface unrelated sensitive metadata when it is unnecessary for the user's task. Use Rel.AI's normal authorization boundary for every command.
