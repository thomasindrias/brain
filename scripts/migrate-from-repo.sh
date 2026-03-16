#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Brain OS — Migrate from Repo Layout
# One-time migration: copies repo-local memory and state into ~/.config/brain-os
# ---------------------------------------------------------------------------

BRAIN_DATA="${XDG_CONFIG_HOME:-$HOME/.config}/brain-os"
REPO_ROOT="${1:-.}"
MIGRATED=0

echo "Brain OS Migration"
echo "  Source repo : $REPO_ROOT"
echo "  Target data : $BRAIN_DATA"
echo ""

# Ensure target directories exist
mkdir -p "$BRAIN_DATA"/{long-term/{episodic,semantic,procedural},working-memory-cache/sessions}

# Migrate long-term memory
if [ -d "$REPO_ROOT/memory/long-term" ]; then
  for subdir in episodic semantic procedural; do
    src="$REPO_ROOT/memory/long-term/$subdir"
    dst="$BRAIN_DATA/long-term/$subdir"
    if [ -d "$src" ]; then
      count=0
      for f in "$src"/*; do
        [ -f "$f" ] || continue
        fname=$(basename "$f")
        if [ ! -f "$dst/$fname" ]; then
          cp "$f" "$dst/$fname"
          echo "  Copied: long-term/$subdir/$fname"
          count=$((count + 1))
          MIGRATED=$((MIGRATED + 1))
        else
          echo "  Skipped (exists): long-term/$subdir/$fname"
        fi
      done
    fi
  done
else
  echo "  No memory/long-term/ found in repo — skipping memory migration."
fi

# Migrate neuromodulators state
# Check regions/ first (post-rename), fall back to skills/ (pre-rename)
if [ -f "$REPO_ROOT/regions/1-chemical-and-health/state-neuromodulators.md" ]; then
  NEURO_SRC="$REPO_ROOT/regions/1-chemical-and-health/state-neuromodulators.md"
else
  NEURO_SRC="$REPO_ROOT/skills/1-chemical-and-health/state-neuromodulators.md"
fi
NEURO_DST="$BRAIN_DATA/state-neuromodulators.md"
if [ -f "$NEURO_SRC" ] && [ ! -f "$NEURO_DST" ]; then
  cp "$NEURO_SRC" "$NEURO_DST"
  echo "  Copied: state-neuromodulators.md"
  MIGRATED=$((MIGRATED + 1))
elif [ -f "$NEURO_DST" ]; then
  echo "  Skipped (exists): state-neuromodulators.md"
else
  echo "  No state-neuromodulators.md found in repo — skipping."
fi

# Write VERSION file
if [ ! -f "$BRAIN_DATA/VERSION" ]; then
  echo "1.0.0" > "$BRAIN_DATA/VERSION"
  echo "  Created: VERSION (1.0.0)"
  MIGRATED=$((MIGRATED + 1))
else
  echo "  Skipped (exists): VERSION"
fi

echo ""
echo "Migration complete. $MIGRATED item(s) migrated."
