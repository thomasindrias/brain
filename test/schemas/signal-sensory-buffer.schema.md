# Signal Sensory Buffer Schema

## Required Fields

| Field | Allowed Values | Required |
|-------|---------------|----------|
| `[RAW_INPUT]` | Free text (exact user prompt) | YES |
| `[MODALITIES_PRESENT]` | Comma-separated: `text`, `image`, `file`, `url`, `code` | YES |
| `[TEMPORAL_ORDER]` | Free text | YES |
| `[INPUT_LENGTH]` | Integer (character count) | YES |
| `[AMBIGUITY_FLAGS]` | Free text or `NONE` | YES |
