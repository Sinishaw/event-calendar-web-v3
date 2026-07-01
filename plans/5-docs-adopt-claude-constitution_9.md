# Plan — Adopt Claude Code Constitution Workflow

**Branch:** docs/adopt-claude-constitution_9
**Issue:** #9
**Date:** 2026-07-01

## Goal
Make the Antigravity `.agents/rules/constitution.md` spec-driven workflow
(Plan → Issue → Branch → Implement → Secrets Check → Save Plan → Confirm
Commit → Confirm PR) something Claude Code always follows for this project,
since Claude Code doesn't auto-load files under `.agents/rules/`.

## Approach
Considered two options:
1. A separate `.agents/rules/constitution.claude.md` file imported from
   `CLAUDE.md` via `@`.
2. Inlining the adapted workflow directly into `CLAUDE.md`.

Started with option 1, then consolidated into option 2 per user feedback —
one file is simpler to find and maintain than an import chain. The original
`.agents/rules/constitution.md` is left untouched as the Antigravity source
of truth; `CLAUDE.md` carries the Claude Code–adapted copy plus an exemption
clause (skip on explicit request, or for trivial/read-only asks) and a
precedence note (explicit user instruction wins for that request only).

## Changes
- `CLAUDE.md` — inlined the full adapted constitution workflow (sections 1–14)
  after the existing `@AGENTS.md` import.
