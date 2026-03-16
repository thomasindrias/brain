#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Brain OS — Session Start Hook
# Initializes data directory, generates session ID, injects router context.
# ---------------------------------------------------------------------------

# 1. Initialize data directory idempotently
BRAIN_DATA="${XDG_CONFIG_HOME:-$HOME/.config}/brain-os"
mkdir -p "$BRAIN_DATA"/{working-memory-cache/sessions,long-term/{episodic,semantic,procedural}}

if [ ! -f "$BRAIN_DATA/state-neuromodulators.md" ]; then
  SRC="${CLAUDE_PLUGIN_ROOT}/regions/1-chemical-and-health/state-neuromodulators.md"
  if [ -f "$SRC" ]; then
    cp "$SRC" "$BRAIN_DATA/"
  fi
fi

[ ! -f "$BRAIN_DATA/VERSION" ] && echo "1.0.0" > "$BRAIN_DATA/VERSION"

# 2. Generate session ID and persist via CLAUDE_ENV_FILE
BRAIN_SESSION_ID="$(date +%s)-$$-$RANDOM"

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export BRAIN_SESSION_ID=$BRAIN_SESSION_ID" >> "$CLAUDE_ENV_FILE"
  echo "export BRAIN_DATA_DIR=$BRAIN_DATA" >> "$CLAUDE_ENV_FILE"
fi

mkdir -p "$BRAIN_DATA/working-memory-cache/sessions/$BRAIN_SESSION_ID"

# 3. Read thalamus/router.md and output as additionalContext JSON
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    s="${s//$'\f'/\\u000c}"
    s="${s//$'\v'/\\u000b}"
    s="${s//$'\a'/\\u0007}"
    s="${s//$'\b'/\\u0008}"
    printf '%s' "$s"
}

ROUTER_FILE="${CLAUDE_PLUGIN_ROOT}/thalamus/router.md"

if [ ! -f "$ROUTER_FILE" ]; then
  echo '{"systemMessage":"WARN: Brain OS router.md not found at '"$ROUTER_FILE"'"}'
  exit 0
fi

ROUTER_CONTENT=$(cat "$ROUTER_FILE")

# Substitute path variables before injection (these become literal strings otherwise)
ROUTER_CONTENT="${ROUTER_CONTENT//\$\{CLAUDE_PLUGIN_ROOT\}/$CLAUDE_PLUGIN_ROOT}"
ROUTER_CONTENT="${ROUTER_CONTENT//\$\{BRAIN_SESSION_ID\}/$BRAIN_SESSION_ID}"
ROUTER_CONTENT="${ROUTER_CONTENT//\$\{BRAIN_DATA\}/\~\/.config\/brain-os}"

ESCAPED=$(escape_for_json "$ROUTER_CONTENT")

# Validate payload size
if [ ${#ESCAPED} -gt 200000 ]; then
  echo '{"systemMessage":"ERROR: Brain OS router too large for injection"}'
  exit 0
fi

cat <<EOF
{
  "hookSpecificOutput": {
    "additionalContext": "${ESCAPED}"
  }
}
EOF
