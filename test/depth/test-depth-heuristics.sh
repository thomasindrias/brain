#!/bin/bash
set -euo pipefail

PASS=0; FAIL=0

fail() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
pass() { echo "PASS: $1"; PASS=$((PASS + 1)); }

# Classify depth based on content-aware heuristics.
# Replaces the old <80 chars rule with conversational pattern matching
# and adds multi-entity escalation + expanded DEEP keywords.
classify_depth() {
    local input="$1"
    local routine_match="${2:-FALSE}"
    local noradrenaline="${3:-LOW}"
    local serotonin="${4:-DEFAULT}"
    local acetylcholine="${5:-MEDIUM}"

    local depth="MEDIUM"  # default (heuristic 7)

    # Heuristic 1: routine match
    if [ "$routine_match" = "TRUE" ]; then
        depth="SHALLOW"
    # Heuristic 2: conversational/trivial patterns (replaces <80 chars rule)
    elif echo "$input" | grep -qxiE '(hi|hello|hey|yes|no|ok|sure|thanks|thank you|got it|sounds good|cool|nice|yep|nope|right|agreed)'; then
        depth="SHALLOW"
    # Heuristic 3: images, Figma, 3+ file paths
    elif echo "$input" | grep -qE '\.png|\.jpg|\.svg|figma\.com' || \
         [ "$(echo "$input" | grep -oE '/[a-zA-Z0-9._-]+\.(ts|js|py|md|go|rs)' | wc -l)" -ge 3 ]; then
        depth="DEEP"
    # Heuristic 4: DEEP keywords (expanded)
    elif echo "$input" | grep -qiE 'refactor|redesign|migrate|architecture|implement|design system|security audit'; then
        depth="DEEP"
    # Heuristic 5: action verb + target (regardless of length)
    elif echo "$input" | grep -qiE '(fix|add|update|change|remove|create|build|write|delete)\b.*\b(bug|error|feature|function|component|page|endpoint|test|module)'; then
        depth="MEDIUM"
    fi
    # Heuristic 7: default MEDIUM (implicit)

    # Heuristic 6: multi-entity escalation (3+ distinct entities)
    local entity_count=$(echo "$input" | grep -oE '\b[A-Z][a-zA-Z]+\b' | sort -u | wc -l | tr -d ' ')
    local file_count=$(echo "$input" | grep -oE '[a-zA-Z0-9._-]+\.(ts|js|py|md|go|rs|tsx|jsx)' | sort -u | wc -l | tr -d ' ')
    local total_entities=$((entity_count > file_count ? entity_count : file_count))
    if [ "$total_entities" -ge 3 ] && [ "$depth" != "DEEP" ]; then
        case "$depth" in
            SHALLOW) depth="MEDIUM" ;;
            MEDIUM) depth="DEEP" ;;
        esac
    fi

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

# === v2 Edge Cases: Short but complex ===
result=$(classify_depth "fix the auth bug")
[ "$result" = "MEDIUM" ] && pass "\"fix the auth bug\" -> MEDIUM" || fail "\"fix the auth bug\" -> $result (expected MEDIUM)"

result=$(classify_depth "why is this failing?")
[ "$result" = "MEDIUM" ] && pass "\"why is this failing?\" -> MEDIUM" || fail "\"why is this failing?\" -> $result (expected MEDIUM)"

result=$(classify_depth "add error handling to auth.ts, user.ts, and middleware.ts")
[ "$result" = "DEEP" ] && pass "3+ entities -> DEEP" || fail "3+ entities -> $result (expected DEEP)"

# === v2 Edge Cases: Genuinely trivial ===
result=$(classify_depth "yes")
[ "$result" = "SHALLOW" ] && pass "\"yes\" -> SHALLOW" || fail "\"yes\" -> $result (expected SHALLOW)"

result=$(classify_depth "thanks")
[ "$result" = "SHALLOW" ] && pass "\"thanks\" -> SHALLOW" || fail "\"thanks\" -> $result (expected SHALLOW)"

result=$(classify_depth "ok")
[ "$result" = "SHALLOW" ] && pass "\"ok\" -> SHALLOW" || fail "\"ok\" -> $result (expected SHALLOW)"

result=$(classify_depth "got it")
[ "$result" = "SHALLOW" ] && pass "\"got it\" -> SHALLOW" || fail "\"got it\" -> $result (expected SHALLOW)"

# === v2 Edge Cases: Multi-entity escalation ===
result=$(classify_depth "update the Button, Modal, and Tooltip components")
[ "$result" = "DEEP" ] && pass "3 component names -> DEEP" || fail "3 components -> $result (expected DEEP)"

# === v2: New DEEP keywords ===
result=$(classify_depth "implement the new auth flow")
[ "$result" = "DEEP" ] && pass "\"implement\" keyword -> DEEP" || fail "\"implement\" -> $result (expected DEEP)"

result=$(classify_depth "design system audit")
[ "$result" = "DEEP" ] && pass "\"design system\" keyword -> DEEP" || fail "\"design system\" -> $result (expected DEEP)"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
