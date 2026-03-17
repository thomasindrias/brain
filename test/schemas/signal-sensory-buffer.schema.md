# Signal Sensory Buffer Schema

## Required Fields

| Field | Allowed Values | Required |
|-------|---------------|----------|
| `[RAW_INPUT]` | Free text (exact user prompt) | YES |
| `[MODALITIES_PRESENT]` | Comma-separated: `text`, `image`, `file`, `url`, `code` | YES |
| `[TEMPORAL_ORDER]` | Free text | YES |
| `[INPUT_LENGTH]` | Integer (character count) | YES |
| `[AMBIGUITY_FLAGS]` | Free text or `NONE` | YES |

NOTE: As of v2, sensory buffering is performed inline by the Thalamus.
This schema validates the buffer format when written for Observer visualization.
The buffer file may not exist in non-Observer sessions.
