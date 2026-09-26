---
name: imagemagick
description: Use when ChatGPT needs deterministic local image inspection, resize, crop, format conversion, optimization, compositing, padding, transparency, contact-sheet, or batch pixel/file transformations with ImageMagick.
---

# ImageMagick

Use `magick` for deterministic image-file transformations.

## Workflow

1. Inspect format, dimensions, color information, and frame count when they affect the result.
2. Preserve the original unless the user explicitly requests replacement.
3. Use explicit output paths and preserve aspect ratio unless the task requires otherwise.
4. Prefer one clear `magick` operation over generating a temporary image-processing script.
5. Verify dimensions/format after important batch transformations.

Use `mogrify` only when its in-place or batch semantics are deliberate and the destination is safe.

For browser documentation screenshots, prefer Rel.AI's semantic UI capture/annotation capabilities when available; ImageMagick should handle generic pixel/file transformations rather than rediscovering DOM targets from pixels.

Use Rel.AI's normal authorization boundary for every command.
