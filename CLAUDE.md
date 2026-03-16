# Claude Code — Project Instructions

## Fixture maintenance

When any editor extension or toolbar feature is added, removed, or modified under
`admin/src/extensions/`, `admin/src/utils/buildExtensions.ts`, or `shared/types.ts`
(specifically `TiptapPresetConfig` or `PRESET_FEATURE_KEYS`), you **must** update
`fixtures/all-features-payload.json` so it exercises every supported node, mark,
and attribute. The payload uses Tiptap/ProseMirror JSON format.
