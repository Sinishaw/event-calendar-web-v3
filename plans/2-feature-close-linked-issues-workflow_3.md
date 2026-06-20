# Plan — Automate Linked Issue Closing Workflow

**Branch:** feature/close-linked-issues-workflow_3
**Issue:** #3
**Date:** 2026-06-20

## Goal
To automate closing referenced issues in PR bodies using a regex-based parser when a Pull Request is merged into the `develop` branch.

## Approach
- Created a new GitHub Actions workflow at `.github/workflows/close-linked-issues.yaml`.
- Configured trigger on Pull Request closures targeting `develop` only if merged.
- Configured step to parse PR body using `grep` and close matched issue numbers using `gh issue close`.

## Changes
- `.github/workflows/close-linked-issues.yaml` — Configured the GitHub Actions workflow.
