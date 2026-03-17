# Test: Memory Metadata Header Retrieval

## Biological Basis
Hippocampal pattern completion — partial cues activate full memories.

## Setup
long-term/episodic/ contains 2 files:
- session-2026-03-16-01.md (NO metadata header — legacy file)
- session-2026-03-20-01.md (WITH metadata header: project=brain-os, tags=[routing, observer])

## Input
User asks about "observer dashboard" in brain-os project

## Expected Retrieval
1. List files in each long-term/ subdirectory
2. For files WITH headers: scan summary line only
3. For files WITHOUT headers: read first 5 lines as fallback
4. session-2026-03-20-01.md matches (tags include "observer", project matches)
5. Read full content of matched file only

## Pass Criteria
- Legacy files (no header) still retrievable via fallback
- Files with headers use optimized O(1-line) scan
- Cross-project weighting applied (2x for matching project)
