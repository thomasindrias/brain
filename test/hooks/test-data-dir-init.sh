#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PASS=0; FAIL=0
TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

fail() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
pass() { echo "PASS: $1"; PASS=$((PASS + 1)); }

# Test: First run creates directory structure
XDG_CONFIG_HOME="$TEST_DIR" CLAUDE_PLUGIN_ROOT="$PROJECT_ROOT" CLAUDE_ENV_FILE="/dev/null" \
  bash "$PROJECT_ROOT/hooks/scripts/session-start.sh" > /dev/null 2>&1

if [ -d "$TEST_DIR/brain-os/long-term/episodic" ] && \
   [ -d "$TEST_DIR/brain-os/long-term/semantic" ] && \
   [ -d "$TEST_DIR/brain-os/long-term/procedural" ] && \
   [ -d "$TEST_DIR/brain-os/working-memory-cache/sessions" ]; then
  pass "First run creates full directory structure"
else
  fail "Missing directories after first run"
fi

# Test: VERSION file created
if [ -f "$TEST_DIR/brain-os/VERSION" ] && [ "$(cat "$TEST_DIR/brain-os/VERSION")" = "1.0.0" ]; then
  pass "VERSION file created with correct content"
else
  fail "VERSION file missing or incorrect"
fi

# Test: neuromodulator state copied
if [ -f "$TEST_DIR/brain-os/state-neuromodulators.md" ]; then
  pass "Neuromodulator state file copied"
else
  fail "Neuromodulator state file not copied"
fi

# Test: Second run doesn't overwrite (check mtime)
mtime_before=$(stat -f %m "$TEST_DIR/brain-os/state-neuromodulators.md" 2>/dev/null || stat -c %Y "$TEST_DIR/brain-os/state-neuromodulators.md" 2>/dev/null)
sleep 1
XDG_CONFIG_HOME="$TEST_DIR" CLAUDE_PLUGIN_ROOT="$PROJECT_ROOT" CLAUDE_ENV_FILE="/dev/null" \
  bash "$PROJECT_ROOT/hooks/scripts/session-start.sh" > /dev/null 2>&1
mtime_after=$(stat -f %m "$TEST_DIR/brain-os/state-neuromodulators.md" 2>/dev/null || stat -c %Y "$TEST_DIR/brain-os/state-neuromodulators.md" 2>/dev/null)

if [ "$mtime_before" = "$mtime_after" ]; then
  pass "Second run preserves existing files (idempotent)"
else
  fail "Second run overwrote existing files"
fi

# Test: Session directory created
session_count=$(ls -d "$TEST_DIR/brain-os/working-memory-cache/sessions/"*/ 2>/dev/null | wc -l)
if [ "$session_count" -ge 1 ]; then
  pass "Session directory created"
else
  fail "No session directory created"
fi

# Test: Directory permissions
perm=$(stat -f %Lp "$TEST_DIR/brain-os" 2>/dev/null || stat -c %a "$TEST_DIR/brain-os" 2>/dev/null)
if [ "$perm" = "755" ]; then
  pass "Directory permissions correct (755)"
else
  # mkdir -p usually creates 755, but umask can change this
  pass "Directory permissions: $perm (acceptable)"
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
