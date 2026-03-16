#!/bin/bash
set -euo pipefail

PASS=0; FAIL=0

fail() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
pass() { echo "PASS: $1"; PASS=$((PASS + 1)); }

# The escape function from session-start.sh
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

# Test: Backslashes
input='C:\path\to\file'
escaped=$(escape_for_json "$input")
json="{\"test\":\"$escaped\"}"
roundtrip=$(echo "$json" | jq -r '.test')
if [ "$roundtrip" = "$input" ]; then
  pass "Backslash escaping round-trips correctly"
else
  fail "Backslash escaping failed: got '$roundtrip', expected '$input'"
fi

# Test: Embedded quotes
input='nested "quotes" here'
escaped=$(escape_for_json "$input")
json="{\"test\":\"$escaped\"}"
roundtrip=$(echo "$json" | jq -r '.test')
if [ "$roundtrip" = "$input" ]; then
  pass "Quote escaping round-trips correctly"
else
  fail "Quote escaping failed: got '$roundtrip', expected '$input'"
fi

# Test: Newlines
input=$'line1\nline2\nline3'
escaped=$(escape_for_json "$input")
json="{\"test\":\"$escaped\"}"
roundtrip=$(echo "$json" | jq -r '.test')
if [ "$roundtrip" = "$input" ]; then
  pass "Newline escaping round-trips correctly"
else
  fail "Newline escaping failed"
fi

# Test: Tabs
input=$'col1\tcol2\tcol3'
escaped=$(escape_for_json "$input")
json="{\"test\":\"$escaped\"}"
roundtrip=$(echo "$json" | jq -r '.test')
if [ "$roundtrip" = "$input" ]; then
  pass "Tab escaping round-trips correctly"
else
  fail "Tab escaping failed"
fi

# Test: Carriage returns
input=$'line1\r\nline2'
escaped=$(escape_for_json "$input")
json="{\"test\":\"$escaped\"}"
roundtrip=$(echo "$json" | jq -r '.test')
if [ "$roundtrip" = "$input" ]; then
  pass "Carriage return escaping round-trips correctly"
else
  fail "Carriage return escaping failed"
fi

# Test: Unicode characters
input='Hello 世界 🌍'
escaped=$(escape_for_json "$input")
json="{\"test\":\"$escaped\"}"
roundtrip=$(echo "$json" | jq -r '.test')
if [ "$roundtrip" = "$input" ]; then
  pass "Unicode round-trips correctly"
else
  fail "Unicode failed: got '$roundtrip', expected '$input'"
fi

# Test: Mixed special characters
input=$'path\\to\\"file\"\nwith\ttabs'
escaped=$(escape_for_json "$input")
json="{\"test\":\"$escaped\"}"
if echo "$json" | jq . > /dev/null 2>&1; then
  pass "Mixed special characters produce valid JSON"
else
  fail "Mixed special characters produce invalid JSON"
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
