#!/bin/bash
# test/harness.sh — Brain OS Test Runner
# Validates that buffer outputs match expected schemas
# Supports both plugin mode (session-scoped buffers) and legacy mode
#
# NOTE: In Brain OS v2, some buffer files are intentionally absent when agents
# are gated (activation threshold not met) or phases run inline. SKIP is normal.

# Resolve project root (parent of test/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0

# Determine buffer directory
if [ -n "${BRAIN_SESSION_ID:-}" ] && [ -n "${BRAIN_DATA_DIR:-}" ]; then
    BUFFER_DIR="$BRAIN_DATA_DIR/working-memory-cache/sessions/$BRAIN_SESSION_ID"
    WM_DIR="$BUFFER_DIR"
elif [ -d "memory/working-memory-cache/buffers" ]; then
    BUFFER_DIR="memory/working-memory-cache/buffers"
    WM_DIR="memory/working-memory-cache"
else
    echo -e "${YELLOW}No buffer directory found. Set BRAIN_SESSION_ID and BRAIN_DATA_DIR, or use legacy memory/ layout.${NC}"
    exit 0
fi

validate_field() {
    local file="$1"
    local field="$2"
    local allowed_values="$3"

    if ! grep -q "^\[${field}\]:" "$file" 2>/dev/null; then
        echo -e "${RED}FAIL${NC}: Missing [${field}] in $(basename $file)"
        FAIL=$((FAIL + 1))
        return 0
    fi

    if [ -n "$allowed_values" ]; then
        local value=$(grep "^\[${field}\]:" "$file" | sed "s/^\[${field}\]: //")
        if ! echo "$allowed_values" | grep -qw "$value"; then
            echo -e "${RED}FAIL${NC}: [${field}] has invalid value '${value}' in $(basename $file). Allowed: ${allowed_values}"
            FAIL=$((FAIL + 1))
            return 0
        fi
    fi

    echo -e "${GREEN}PASS${NC}: [${field}] valid in $(basename $file)"
    PASS=$((PASS + 1))
    return 0
}

echo "=== Brain OS Buffer Schema Validation ==="
echo "Buffer dir: $BUFFER_DIR"
echo ""

# Validate Sensory Buffer output
if [ -f "$BUFFER_DIR/signal-sensory-buffer.md" ]; then
    echo "--- signal-sensory-buffer.md ---"
    validate_field "$BUFFER_DIR/signal-sensory-buffer.md" "RAW_INPUT" ""
    validate_field "$BUFFER_DIR/signal-sensory-buffer.md" "MODALITIES_PRESENT" ""
    validate_field "$BUFFER_DIR/signal-sensory-buffer.md" "TEMPORAL_ORDER" ""
    validate_field "$BUFFER_DIR/signal-sensory-buffer.md" "INPUT_LENGTH" ""
    validate_field "$BUFFER_DIR/signal-sensory-buffer.md" "AMBIGUITY_FLAGS" ""
else
    echo -e "${YELLOW}SKIP${NC}: signal-sensory-buffer.md not found"
    SKIP=$((SKIP + 1))
fi

# Validate Amygdala output
if [ -f "$BUFFER_DIR/signal-amygdala.md" ]; then
    echo "--- signal-amygdala.md ---"
    validate_field "$BUFFER_DIR/signal-amygdala.md" "THREAT_LEVEL" "SAFE ELEVATED THREAT_DETECTED"
    validate_field "$BUFFER_DIR/signal-amygdala.md" "THREAT_TYPE" "injection destructive exfiltration social_engineering NONE"
    validate_field "$BUFFER_DIR/signal-amygdala.md" "EVIDENCE" ""
    validate_field "$BUFFER_DIR/signal-amygdala.md" "EMOTIONAL_VALENCE" ""
    validate_field "$BUFFER_DIR/signal-amygdala.md" "RECOMMENDED_ACTION" "proceed caution halt re-analyze"
else
    echo -e "${YELLOW}SKIP${NC}: signal-amygdala.md not found"
    SKIP=$((SKIP + 1))
fi

# Validate Hippocampus output
if [ -f "$BUFFER_DIR/signal-hippocampus.md" ]; then
    echo "--- signal-hippocampus.md ---"
    validate_field "$BUFFER_DIR/signal-hippocampus.md" "MEMORY_STATE" "FOUND NULL"
    validate_field "$BUFFER_DIR/signal-hippocampus.md" "SEMANTIC_BINDING" ""
    validate_field "$BUFFER_DIR/signal-hippocampus.md" "EPISODIC_BINDING" ""
    validate_field "$BUFFER_DIR/signal-hippocampus.md" "PROCEDURAL_BINDING" ""
else
    echo -e "${YELLOW}SKIP${NC}: signal-hippocampus.md not found"
    SKIP=$((SKIP + 1))
fi

# Validate Language Center output
if [ -f "$BUFFER_DIR/signal-language.md" ]; then
    echo "--- signal-language.md ---"
    validate_field "$BUFFER_DIR/signal-language.md" "INTENT" "build fix explain explore brainstorm question AMBIGUOUS"
    validate_field "$BUFFER_DIR/signal-language.md" "ENTITIES" ""
    validate_field "$BUFFER_DIR/signal-language.md" "USER_TONE" "frustrated curious urgent casual technical"
    validate_field "$BUFFER_DIR/signal-language.md" "OUTPUT_REGISTER" ""
    validate_field "$BUFFER_DIR/signal-language.md" "OUTPUT_FORMAT" "code explanation list mixed"
else
    echo -e "${YELLOW}SKIP${NC}: signal-language.md not found"
    SKIP=$((SKIP + 1))
fi

# Validate Cerebellum output
if [ -f "$BUFFER_DIR/signal-cerebellum.md" ]; then
    echo "--- signal-cerebellum.md ---"
    validate_field "$BUFFER_DIR/signal-cerebellum.md" "VALIDATION" "PASS FAIL"
    validate_field "$BUFFER_DIR/signal-cerebellum.md" "CORRECTIONS" ""
else
    echo -e "${YELLOW}SKIP${NC}: signal-cerebellum.md not found (only present after Phase 4)"
    SKIP=$((SKIP + 1))
fi

# Validate Motor Error output (only present on execution errors)
if [ -f "$BUFFER_DIR/signal-error.md" ]; then
    echo "--- signal-error.md ---"
    validate_field "$BUFFER_DIR/signal-error.md" "ERROR_TYPE" "syntax runtime logic permission"
    validate_field "$BUFFER_DIR/signal-error.md" "ERROR_DETAIL" ""
    validate_field "$BUFFER_DIR/signal-error.md" "FAILED_STEP" ""
    validate_field "$BUFFER_DIR/signal-error.md" "CONTEXT" ""
fi

# Validate Motor Plan output
if [ -f "$WM_DIR/motor-plan.md" ]; then
    echo "--- motor-plan.md ---"
    validate_field "$WM_DIR/motor-plan.md" "PROBLEM_ANALYSIS" ""
    validate_field "$WM_DIR/motor-plan.md" "CONSTRAINTS" ""
    validate_field "$WM_DIR/motor-plan.md" "STEP_BY_STEP_BLUEPRINT" ""
    validate_field "$WM_DIR/motor-plan.md" "EDGE_CASES" ""
    validate_field "$WM_DIR/motor-plan.md" "CONFIDENCE" "HIGH MEDIUM LOW"
else
    echo -e "${YELLOW}SKIP${NC}: motor-plan.md not found"
    SKIP=$((SKIP + 1))
fi

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed, ${SKIP} skipped ==="
[ $FAIL -eq 0 ] && exit 0 || exit 1
