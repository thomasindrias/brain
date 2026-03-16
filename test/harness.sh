#!/bin/bash
# test/harness.sh — Brain OS Test Runner
# Validates that buffer outputs match expected schemas

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

PASS=0
FAIL=0

validate_field() {
    local file="$1"
    local field="$2"
    local allowed_values="$3"

    if ! grep -q "^\[${field}\]:" "$file" 2>/dev/null; then
        echo -e "${RED}FAIL${NC}: Missing [${field}] in $(basename $file)"
        FAIL=$((FAIL + 1))
        return 1
    fi

    if [ -n "$allowed_values" ]; then
        local value=$(grep "^\[${field}\]:" "$file" | sed "s/^\[${field}\]: //")
        if ! echo "$allowed_values" | grep -qw "$value"; then
            echo -e "${RED}FAIL${NC}: [${field}] has invalid value '${value}' in $(basename $file). Allowed: ${allowed_values}"
            FAIL=$((FAIL + 1))
            return 1
        fi
    fi

    echo -e "${GREEN}PASS${NC}: [${field}] valid in $(basename $file)"
    PASS=$((PASS + 1))
    return 0
}

echo "=== Brain OS Buffer Schema Validation ==="
echo ""

# Validate Amygdala output
if [ -f "memory/working-memory-cache/buffers/signal-amygdala.md" ]; then
    echo "--- signal-amygdala.md ---"
    validate_field "memory/working-memory-cache/buffers/signal-amygdala.md" "THREAT_LEVEL" "SAFE ELEVATED THREAT_DETECTED"
    validate_field "memory/working-memory-cache/buffers/signal-amygdala.md" "THREAT_TYPE" "injection destructive exfiltration social_engineering NONE"
    validate_field "memory/working-memory-cache/buffers/signal-amygdala.md" "EMOTIONAL_VALENCE" ""
    validate_field "memory/working-memory-cache/buffers/signal-amygdala.md" "RECOMMENDED_ACTION" "proceed caution halt re-analyze"
fi

# Validate Hippocampus output
if [ -f "memory/working-memory-cache/buffers/signal-hippocampus.md" ]; then
    echo "--- signal-hippocampus.md ---"
    validate_field "memory/working-memory-cache/buffers/signal-hippocampus.md" "MEMORY_STATE" "FOUND NULL"
    validate_field "memory/working-memory-cache/buffers/signal-hippocampus.md" "SEMANTIC_BINDING" ""
    validate_field "memory/working-memory-cache/buffers/signal-hippocampus.md" "EPISODIC_BINDING" ""
    validate_field "memory/working-memory-cache/buffers/signal-hippocampus.md" "PROCEDURAL_BINDING" ""
fi

# Validate Language Center output
if [ -f "memory/working-memory-cache/buffers/signal-language.md" ]; then
    echo "--- signal-language.md ---"
    validate_field "memory/working-memory-cache/buffers/signal-language.md" "INTENT" "build fix explain explore brainstorm question AMBIGUOUS"
    validate_field "memory/working-memory-cache/buffers/signal-language.md" "USER_TONE" "frustrated curious urgent casual technical"
    validate_field "memory/working-memory-cache/buffers/signal-language.md" "OUTPUT_FORMAT" "code explanation list mixed"
fi

# Validate Motor Plan output
if [ -f "memory/working-memory-cache/motor-plan.md" ]; then
    echo "--- motor-plan.md ---"
    validate_field "memory/working-memory-cache/motor-plan.md" "PROBLEM_ANALYSIS" ""
    validate_field "memory/working-memory-cache/motor-plan.md" "CONSTRAINTS" ""
    validate_field "memory/working-memory-cache/motor-plan.md" "STEP_BY_STEP_BLUEPRINT" ""
    validate_field "memory/working-memory-cache/motor-plan.md" "CONFIDENCE" "HIGH MEDIUM LOW"
fi

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="
[ $FAIL -eq 0 ] && exit 0 || exit 1
