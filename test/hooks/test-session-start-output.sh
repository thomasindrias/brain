#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PASS=0; FAIL=0

fail() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
pass() { echo "PASS: $1"; PASS=$((PASS + 1)); }

# Test: valid JSON output
output=$(CLAUDE_PLUGIN_ROOT="$PROJECT_ROOT" CLAUDE_ENV_FILE="/dev/null" bash "$PROJECT_ROOT/hooks/scripts/session-start.sh" 2>&1)
if echo "$output" | jq . > /dev/null 2>&1; then
  pass "Hook outputs valid JSON"
else
  fail "Hook output is not valid JSON: $output"
fi

# Test: hookSpecificOutput.additionalContext field exists
context=$(echo "$output" | jq -r '.hookSpecificOutput.additionalContext // empty')
if [ -n "$context" ]; then
  pass "additionalContext field exists and is non-empty"
else
  fail "additionalContext field missing or empty"
fi

# Test: contains routing protocol content
if echo "$context" | grep -q "Phase 0"; then
  pass "Contains Phase 0 reference (routing protocol loaded)"
else
  fail "Missing Phase 0 reference"
fi

# Test: contains Basal Ganglia depth classification
if echo "$context" | grep -q "COGNITIVE_DEPTH"; then
  pass "Contains COGNITIVE_DEPTH (depth classification loaded)"
else
  fail "Missing COGNITIVE_DEPTH reference"
fi

# Test: payload size < 200KB
size=${#output}
if [ "$size" -lt 200000 ]; then
  pass "Payload size ($size bytes) < 200KB limit"
else
  fail "Payload size ($size bytes) exceeds 200KB limit"
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
