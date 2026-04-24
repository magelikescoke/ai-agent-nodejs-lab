---
name: daily-progress-after-commit
description: Use after creating a git commit in this repository to inspect the latest commit, compare it with ../docs/ai-agent-nodejs-daily-todo-v2.md, and update the daily TODO progress checklist.
---

# Daily Progress After Commit

Use this skill immediately after every successful `git commit` in this repository.

## Workflow

1. Inspect the latest commit:

   ```bash
   git show --stat --oneline --name-only HEAD
   ```

2. Open the progress document:

   ```text
   ../docs/ai-agent-nodejs-daily-todo-v2.md
   ```

3. Match the commit contents to the relevant daily checklist items.

4. Update checklist status only when the commit provides concrete evidence:
   - Change `- [ ]` to `- [x]` for completed items.
   - Leave partially done items unchecked.
   - Do not mark learning, notes, articles, tags, or Python tasks complete unless the commit or workspace clearly includes that work.

5. If the commit affects setup, commands, APIs, or behavior, confirm the README or local docs already reflect it. If not, update project docs before the next commit.

6. Report what changed in the progress document, or state that no checklist item had enough evidence to update.

## Current Progress File

The expected file is:

```text
../docs/ai-agent-nodejs-daily-todo-v2.md
```

If a user mentions `daily-to-v2.md`, check whether they mean the existing `daily-todo-v2.md` file before creating a new file.
