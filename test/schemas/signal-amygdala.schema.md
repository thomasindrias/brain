# Signal Amygdala Schema

## Required Fields

| Field | Allowed Values | Required |
|-------|---------------|----------|
| `[THREAT_LEVEL]` | `SAFE`, `ELEVATED`, `THREAT_DETECTED` | YES |
| `[THREAT_TYPE]` | `injection`, `destructive`, `exfiltration`, `social_engineering`, `NONE` | YES |
| `[EVIDENCE]` | Free text | YES |
| `[EMOTIONAL_VALENCE]` | `-2` to `+2` (integer) | YES |
| `[RECOMMENDED_ACTION]` | `proceed`, `caution`, `halt`, `re-analyze` | YES |
