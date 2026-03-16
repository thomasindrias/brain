# Signal Cerebellum Schema

## Required Fields (Pass)

| Field | Allowed Values | Required |
|-------|---------------|----------|
| `[VALIDATION]` | `PASS`, `FAIL` | YES |
| `[CORRECTIONS]` | `NONE` or free text | YES |

## Additional Fields (Fail only)

| Field | Allowed Values | Required |
|-------|---------------|----------|
| `[ERROR_INTERCEPT]` | Free text (list of errors) | When FAIL |
| `[SUGGESTED_FIX]` | Free text | When FAIL |
| `[RETURN_TO]` | `PREFRONTAL` | When FAIL |
