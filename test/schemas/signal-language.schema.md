# Signal Language Schema

## Required Fields

| Field | Allowed Values | Required |
|-------|---------------|----------|
| `[INTENT]` | `build`, `fix`, `explain`, `explore`, `brainstorm`, `question`, `AMBIGUOUS` | YES |
| `[ENTITIES]` | Comma-separated list | YES |
| `[USER_TONE]` | `frustrated`, `curious`, `urgent`, `casual`, `technical` | YES |
| `[OUTPUT_REGISTER]` | Free text | YES |
| `[OUTPUT_FORMAT]` | `code`, `explanation`, `list`, `mixed` | YES |
