#!/bin/bash
set -euo pipefail

PASS=0; FAIL=0

fail() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
pass() { echo "PASS: $1"; PASS=$((PASS + 1)); }

# Classify depth based on the heuristics from the plan.
# Heuristic order is adjusted so DEEP keywords are checked before
# the short-input SHALLOW check (a short "refactor X" is still DEEP).
classify_depth() {
    local input="$1"
    local routine_match="${2:-FALSE}"
    local noradrenaline="${3:-LOW}"
    local serotonin="${4:-DEFAULT}"
    local acetylcholine="${5:-MEDIUM}"

    local depth="MEDIUM"  # default (heuristic 5)

    # Heuristic 1: routine match
    if [ "$routine_match" = "TRUE" ]; then
        depth="SHALLOW"
    # Heuristic 3: images, Figma, multiple files
    elif echo "$input" | grep -qE '\.png|\.jpg|\.svg|figma\.com' || \
         [ "$(echo "$input" | grep -oE '/[a-zA-Z0-9._-]+\.(ts|js|py|md|go|rs)' | wc -l)" -ge 3 ]; then
        depth="DEEP"
    # Heuristic 4: keywords (checked BEFORE short-input to catch short DEEP prompts)
    elif echo "$input" | grep -qiE 'refactor|redesign|migrate|architecture'; then
        depth="DEEP"
    # Heuristic 2: short input, no code/file/URL modality
    elif [ ${#input} -lt 80 ] && ! echo "$input" | grep -qE '\.(ts|js|py|md|tsx|jsx|go|rs)|/|https?://'; then
        depth="SHALLOW"
    fi
    # else: default MEDIUM (heuristic 5)

    # Neuromodulator overrides
    if [ "$noradrenaline" = "HIGH" ]; then
        case "$depth" in
            DEEP) depth="MEDIUM" ;;
            MEDIUM) depth="SHALLOW" ;;
        esac
    fi

    if [ "$serotonin" = "HIGH" ] && [ "$serotonin" != "DEFAULT" ]; then
        case "$depth" in
            SHALLOW) depth="MEDIUM" ;;
            MEDIUM) depth="DEEP" ;;
        esac
    fi

    if [ "$acetylcholine" = "HIGH" ]; then
        case "$depth" in
            SHALLOW) depth="MEDIUM" ;;
            MEDIUM) depth="DEEP" ;;
        esac
    fi

    echo "$depth"
}

# Test cases
result=$(classify_depth "hello")
[ "$result" = "SHALLOW" ] && pass "\"hello\" -> SHALLOW" || fail "\"hello\" -> $result (expected SHALLOW)"

result=$(classify_depth "fix the bug in auth.ts line 42")
[ "$result" = "MEDIUM" ] && pass "\"fix bug in auth.ts\" -> MEDIUM" || fail "\"fix bug in auth.ts\" -> $result (expected MEDIUM)"

result=$(classify_depth "Check this screenshot.png and implement it")
[ "$result" = "DEEP" ] && pass "Image reference -> DEEP" || fail "Image reference -> $result (expected DEEP)"

result=$(classify_depth "refactor the OAuth2 flow")
[ "$result" = "DEEP" ] && pass "\"refactor\" keyword -> DEEP" || fail "\"refactor\" -> $result (expected DEEP)"

result=$(classify_depth "migrate the database schema to v2")
[ "$result" = "DEEP" ] && pass "\"migrate\" keyword -> DEEP" || fail "\"migrate\" -> $result (expected DEEP)"

# Neuromodulator overrides
result=$(classify_depth "fix the bug in auth.ts line 42" "FALSE" "HIGH")
[ "$result" = "SHALLOW" ] && pass "Noradrenaline HIGH + MEDIUM -> SHALLOW" || fail "NA HIGH + MEDIUM -> $result (expected SHALLOW)"

result=$(classify_depth "fix the bug in auth.ts line 42" "FALSE" "LOW" "HIGH")
[ "$result" = "DEEP" ] && pass "Serotonin HIGH + MEDIUM -> DEEP" || fail "5HT HIGH + MEDIUM -> $result (expected DEEP)"

result=$(classify_depth "hello" "FALSE" "LOW" "DEFAULT" "HIGH")
[ "$result" = "MEDIUM" ] && pass "Acetylcholine HIGH + SHALLOW -> MEDIUM" || fail "ACh HIGH + SHALLOW -> $result (expected MEDIUM)"

# Default case: input with code modality (has file extension) but not a DEEP keyword
result=$(classify_depth "Can you help me understand the handleAuth function in auth.ts and how it connects to the middleware?")
[ "$result" = "MEDIUM" ] && pass "Default moderate input -> MEDIUM" || fail "Default -> $result (expected MEDIUM)"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
