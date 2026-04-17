# CLAUDE.md — RECKIT Project Instructions

## ABSOLUTE PROHIBITION: Git Write Operations

**NEVER run ANY of these commands under ANY circumstance unless the user EXPLICITLY and DIRECTLY tells you to:**

- `git commit` (any form, any flags)
- `git push` (any form, any flags)
- `git tag`
- `git merge`
- `git rebase`
- `git reset --hard`
- `git checkout -- .`
- `git restore .`
- `git clean`
- `git stash drop`
- `git branch -D`
- `gh pr merge`
- `gh release create`

**"Create the commit text" means write to COMMIT.org. It does NOT mean run git commit.**
**"Do the PR" means write to PR.org or generate PR text. It does NOT mean run gh pr create.**

The user manages all git operations manually. Your job is to generate text, write code, and prepare files. The user commits, pushes, and manages the repository themselves.

There are ZERO exceptions to this rule.
