# Brain OS

This project is a neuroscience-inspired cognitive architecture packaged as a Claude Code plugin.

## Architecture

The thalamus routing protocol is injected via SessionStart hook from `thalamus/router.md`.
Brain region files live in `regions/` (not auto-discovered — dispatched by the thalamus).
Persistent data lives in `~/.config/brain-os/` (survives plugin updates).

## Development

- Region files: `regions/` — 15 brain region specifications
- Observer dashboard: `observer/` — Real-time visualization
- Tests: `test/` — Schema validators and integration tests

## Quick Start

Install as a Claude Code plugin, or work on it directly in this repo.
