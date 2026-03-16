# Test: Hippocampus Null Memory

## Setup
Empty `/memory/long-term/` directories (except user-profile.md)

## Input
User prompt: "How do I configure Kubernetes pod autoscaling?"

## Expected Buffer Output (signal-hippocampus.md)
[SEMANTIC_BINDING]: User = Software Engineer
[EPISODIC_BINDING]: NONE
[PROCEDURAL_BINDING]: NONE
[MEMORY_STATE]: NULL

## Pass Criteria
- [MEMORY_STATE] is NULL
- Agent exits quickly (sparse representation constraint)
