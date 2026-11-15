---
name: pr-review
description: Review the current branch or a pull request for real defects only — logic, security, ownership, API contract, data model, and tests that don't test what they claim. Explains each problem for a learner without rewriting the code. Use when asked to review changes in this repository.
---

# Review

I am learning. Explain each problem and the concept behind it. Do not rewrite my code or give full solutions unless I ask.

## What to review

- Locally: the diff of this branch against main, including uncommitted changes (`git diff main`) and new untracked files (`git status`).
- On GitHub: the pull request's diff.
- The changed files in full, plus their direct callers. Do not survey the rest of the codebase.

## Check against

- docs/api.md: every endpoint returns exactly the status codes, response shape and error format listed there.
- docs/data-model.md: keys, unique rules, ON DELETE behaviour and indexes match.
- Ownership: the user id comes from the token, never from the request body or query. A user can never read or change another user's data.
- Tests: would they fail if the code were wrong?
- AGENTS.md rules.

## Severity

Report only:

- **P0**: data loss, a security hole, one user seeing or changing another user's data, a crash a user can reach.
- **P1**: a real bug with a concrete failure path, or code that contradicts docs/api.md or docs/data-model.md.

Every finding needs a concrete scenario: the input or state that triggers it, and the wrong result. Re-read the code and confirm nothing already prevents it. Drop anything that doesn't survive.

## Ignore

Formatting, naming, import order, file layout, comments, and refactors that don't fix a bug.

## Output

One entry per finding:

**[P0|P1] file:line** — What breaks. The input that breaks it. The concept to learn. What to change, in one sentence, without code.

If nothing survives, reply `No issues found.` and stop. No summary, no praise.
