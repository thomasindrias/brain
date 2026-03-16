# Test: Hippocampus Memory Retrieval

## Setup
Ensure `memory/long-term/semantic/user-profile.md` contains: "File naming: kebab-case"

## Input
User prompt: "What naming convention should I use for files?"

## Expected Buffer Output (signal-hippocampus.md)
[SEMANTIC_BINDING]: User prefers kebab-case for file naming
[EPISODIC_BINDING]: NONE
[PROCEDURAL_BINDING]: NONE
[MEMORY_STATE]: FOUND

## Pass Criteria
- [MEMORY_STATE] is FOUND
- [SEMANTIC_BINDING] references kebab-case
