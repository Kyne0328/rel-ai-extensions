---
name: ffmpeg
description: Use when ChatGPT needs deterministic local video or audio inspection, conversion, trimming, compression, stream extraction, frame generation, concatenation, normalization, or codec/container work with FFmpeg.
---

# FFmpeg

Use `ffprobe` to inspect media before changing it, then use `ffmpeg` for the smallest required transformation.

## Workflow

1. Inspect streams, duration, codecs, dimensions, frame rate, and audio layout with `ffprobe`.
2. Prefer stream copy (`-c copy`) when no re-encoding is required.
3. Re-encode only when the requested output requires it.
4. Preserve the source file; use an explicit output path.
5. Use overwrite flags only when replacement is intentional.
6. Validate important outputs with `ffprobe` after conversion.

Avoid speculative codec tuning. Match the user's actual compatibility, quality, size, resolution, frame-rate, or audio requirements.

For batch jobs, keep naming deterministic and do not silently replace unrelated files. Use Rel.AI's normal authorization boundary for every command.
