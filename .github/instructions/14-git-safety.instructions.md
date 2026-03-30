---
applyTo: "**"
---

# Git Safety Rules (STRICT)

## Objective

Prevent agents from performing automatic Git write operations.

The user is the only authority responsible for persisting changes to the repository.

---

## Core rule (NON-NEGOTIABLE)

Agents MUST NOT execute Git write operations unless the user explicitly requests it.

This rule applies regardless of task type, agent type, or execution mode.

---

## Forbidden operations (DEFAULT)

The following commands are strictly forbidden unless explicitly requested by the user:

- `git add`
- `git commit`
- `git push`
- `git pull`
- `git merge`
- `git rebase`
- `git checkout`
- `git switch`
- `git reset`
- `git tag`
- branch creation
- branch deletion
- force push operations

---

## Allowed operations (READ-ONLY)

The following commands are allowed:

- `git status`
- `git diff`
- `git log`
- `git branch --show-current`
- `git show`
- `git diff --name-only`

These commands must not modify repository state.

---

## Mandatory behavior

When a task modifies files:

1. Apply code changes only
2. Stop after file modifications are complete
3. DO NOT stage changes
4. DO NOT create commits
5. DO NOT push changes

---

## Completion rule

A task is considered complete when:

- all required files are created or modified
- code compiles (if applicable)
- repository rules are satisfied

A task is NOT dependent on committing changes.

---

## Explicit override rule

Git operations are ONLY allowed if the user explicitly requests them.

Valid examples:

- "commit these changes"
- "create a commit"
- "push this branch"
- "create a new branch"

Without explicit instruction, Git operations must not be performed.

---

## Safety priority

This rule has higher priority than:

- speed of execution
- automation convenience
- agent autonomy
- workflow shortcuts

---

## Failure condition

If an agent performs a Git write operation without explicit user request:

→ The behavior is INVALID  
→ The instruction contract has been violated  

---

## Final rule

Agents modify files.

Users control Git.