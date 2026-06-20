---
trigger: always_on
---

# Project Constitution — Spec-Driven Development Workflow

This file is a workspace **Rule**: always-on context for every agent session
here. It defines the mandatory workflow for any prompt that changes the
codebase (code, tests, config, docs, deps — anything committed). Purely
conversational / read-only prompts are exempt.

---

## 1. Golden Rule

> **Plan → Issue → Branch → Implement → Secrets Check → Save Plan → Confirm Commit → Confirm PR**

Every code-changing prompt follows this pipeline. Steps 2/3 either create new
artifacts or reuse existing ones — see Section 7.

---

## 2. Step 1 — Plan first

1. Produce a short plan: what changes, where, why, and the chosen approach if
   alternatives existed.
2. Iterate with the user until it stabilizes.
3. The **final agreed plan** is what gets written into the GitHub issue
   (Section 3) and the plan file (Section 8) — not the first draft.

---

## 3. Step 2 — GitHub Issue (User Story format)

### 3.1 New work
New piece of work (Section 7) → create an issue:

- **Title:** short, descriptive, Title Case
- **Label:** apply the label matching the branch `<type>` (see Section 12.1)
- **Assignee:** the `gh`-authenticated user (`--assignee "@me"`)
- **Body:**

```markdown
## User Story
As a <role>, I want <capability>, so that <benefit>.

## Context
<1-3 sentences>

## Execution Plan
<finalized plan>

## Tasks
- [ ] <subtask 1>
- [ ] <subtask 2>

## Files Touched
- `path` — what changed and why
```

Keep tasks and "Files Touched" updated as implementation proceeds.

### 3.2 Continuing work
Continuation of an open issue on the current branch (Section 7) → **no new
issue**. Add a comment instead:

```markdown
## Update — <summary>

### Execution Plan
<plan for this follow-up>

### New / Updated Tasks
- [ ] <subtask>

### Files Touched
- `path` — what changed and why
```

---

## 4. Step 3 — Branching

### 4.1 New work
1. Fetch and check out **`develop`** (always branch from `develop`, unless
   the current branch is the relevant continuing branch — Section 7).
2. New branch name: `<type>/<short-title>_<issueNumber>`
   - `<type>`: `feature`, `fix`, `enhancement`, `chore`, `refactor`, `docs`,
     `test`, etc.
   - `<short-title>`: lowercase, hyphenated slug
   - `<issueNumber>`: the new issue's number

   Example: `feature/csv-export-reports_1`
3. Add the issue to the linked Project board and set Status → `In progress`
   (see Section 12.3) — work has now started.

### 4.2 Continuing work
Stay on the existing branch. Don't create a new one even if its PR was
merged — if deleted, recreate from `develop` with the same name.

---

## 5. Step 4 — Implement
Make the planned changes. Keep the issue's task checklist and "Files Touched"
list in sync as you go.

---

## 6. Secrets, `.gitignore`, and Environment Variables

### 6.1 While implementing
- Add any likely-sensitive file (`.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`,
  `secrets.*`, local config, build output, etc.) to `.gitignore` (create it
  if missing) before/while introducing it.
- Never hardcode secrets, keys, tokens, passwords, or connection strings.
  Read them from environment variables. If a local env file is needed,
  maintain an `.env.example` with placeholder values only, and gitignore the
  real `.env`.

### 6.2 Pre-commit safety gate (before Section 9)
Before staging, scan the working tree/diff for sensitive files or values.

If found:
- Don't stage/commit it (unstage if needed).
- Add a `.gitignore` entry if it should never be tracked (flag separately if
  it was already committed/tracked).
- Stop, tell the developer what was found and why, then ask how to proceed —
  e.g. move to env var / secret manager, replace with a placeholder + gitignore,
  or rotate the credential if already committed.
- Wait for their decision before continuing to Section 9.

---

## 7. New work vs. continuing work
- **Continuing**: follow-up/fix/extension of the branch's current scope
  ("also handle X", "fix that typo") → reuse issue (3.2) and branch (4.2).
- **New**: unrelated feature/fix/enhancement → restart the pipeline: new plan
  → new issue (3.1) → new branch from `develop` (4.1).

If ambiguous, state your judgment before proceeding so the user can correct
it.

---

## 8. Step 5 — Save the plan to `/plans`

Once the plan is finalized and implemented, write it to `plans/` (create if
missing).

**Filename:** `plans/<sequence>-<branch-type>-<short-title>_<issueNumber>.md`
- `<sequence>`: global, ever-incrementing integer across the project (count
  existing files + 1; never resets).
- Branch name with `/` replaced by `-`.

Example: branch `feature/csv-export-reports_1`, 4th plan ever →
`plans/4-feature-csv-export-reports_1.md`

**Content:** enhanced summary of the prompt + agreed approach (not a
transcript):

```markdown
# Plan — <title>

**Branch:** <branch-name>
**Issue:** #<issueNumber>
**Date:** <date>

## Goal
<summary>

## Approach
<approach, alternatives considered>

## Changes
- <file/area> — <what changed>
```

A new plan file (next sequence number) is created for **every prompt**,
including continuing-work prompts — multiple files can share a branch/issue
suffix, showing the build-up of work over time.

---

## 9. Step 6 — Stage & commit (confirm once, at the end)

After the prompt's implementation is complete, ask:

> "Implementation is complete. Should I stage and commit these changes?"

- **No** → stop, leave uncommitted.
- **Yes** →
  1. `git add -A` (or only relevant files).
  2. Commit message:

```
<type>: <concise description>

<optional 1-3 sentence body>

#<issueNumber>
```

  - `<type>` mirrors the branch type (`feature`→`feat`, `fix`→`fix`, etc.)
  - Append `#<issueNumber>` plainly — never `Closes/Fixes #N` (a branch may
    get multiple commits across prompts).

---

## 10. Step 7 — Pull Request (confirm once, after commit)

If committed, ask:

> "Changes are committed. Should I push this branch and open a PR to
> `develop`?"

- **No** → stop.
- **Yes** →
  1. `git push -u origin <branch-name>`.
  2. Open PR `<branch-name>` → `develop` (via `gh pr create`, then GitHub
     MCP, then manual instructions — Section 11).
  3. PR body summarizes changes and references the issue (`Refs
     #<issueNumber>`, not auto-close).
  4. Update the linked issue's Project board Status → `In review` (see Section
     12.3), signaling the reviewer it's ready for review.
  5. Agent does not review/approve/merge — that's a human reviewer's job.

If a PR already exists and is open, don't duplicate it — note that new
commits were added.

---

## 11. Tooling fallback order
For all GitHub operations:
1. `gh` CLI (assume installed & authenticated).
2. Connected GitHub MCP connector if `gh` unavailable.
3. If neither: tell the user what's missing and provide exact
   commands/content (issue, branch, commit message, PR) to run manually.
   Don't silently skip Sections 2–10 — surface the blocker and proceed with
   non-GitHub parts (branch via plain `git`, plan file, etc.) where possible.

---

## 12. GitHub Project Board Integration

Applies to issues/PRs in repos linked to a GitHub Projects (v2) board, e.g.
[Flutter - Event Calendar V3](https://github.com/users/Sinishaw/projects/2).

### 12.1 Labels (used in Section 3.1)
Apply the label matching the branch `<type>`:

| `<type>` | Label |
|---|---|
| `feature` | `feature` |
| `fix` | `fix` |
| `enhancement` | `enhancement` |
| `refactor` | `refactor` |
| `docs` | `documentation` |
| other (`chore`, `test`, etc.) | `enhancement` (default) |

If the label doesn't exist in the repo yet, create it first
(`gh label create`).

### 12.2 Assignee (used in Section 3.1)
Always `--assignee "@me"` — resolves to whoever `gh auth login`
authenticated, no hardcoded usernames.

### 12.3 Project status transitions
- **Issue created + branch checked out** (3.1/4.1) → add the issue to the
  Project board, Status → `In progress`.
- **PR opened** (10) → linked issue's Status → `In review`.
- **PR merged** → Status → `Done` for both the issue and the PR item, and
  the issue should auto-close. This step happens outside any agent session
  (a human merges later), so it is **not** performed by the agent — instead,
  configure it once via the Project's built-in Workflows (⋯ → Workflows →
  "Pull request merged" / "Item closed" → set Status: Done).

### 12.4 One-time setup (per repo)
1. `gh auth refresh -s project` (default `gh auth login` scopes don't cover
   Projects v2).
2. Ensure labels `documentation`, `enhancement`, `feature`, `fix`,
   `refactor` exist in the repo.
3. Confirm the repo is linked to the correct Project board, and enable the
   "Done on merge/close" Workflows described in 12.3.

---

## 13. Quick reference

| Situation | Issue | Branch | Plan file |
|---|---|---|---|
| New feature/fix/enhancement | New issue (User Story) | New, from `develop` | New, next sequence # |
| Follow-up, same scope | Comment on existing issue | Same branch (reuse/recreate by name) | New, next sequence #, same branch suffix |
| Unrelated prompt mid-session | New issue | New, from `develop` | New, next sequence #, new branch suffix |