# Signal Motor Error Schema

## Required Fields

| Field | Allowed Values | Required |
|-------|---------------|----------|
| `[ERROR_TYPE]` | `syntax`, `runtime`, `logic`, `permission` | YES |
| `[ERROR_DETAIL]` | Free text (actual error message or trace) | YES |
| `[FAILED_STEP]` | Free text (which blueprint step failed) | YES |
| `[CONTEXT]` | Free text (what was happening when it failed) | YES |
