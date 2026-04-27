# Agent Guide

## Commit Message

Use Conventional Commits for every commit:

```text
<type>(<scope>): <subject>
```

Allowed common types:

- `feat`: new user-facing behavior or capability
- `fix`: bug fix
- `docs`: documentation-only changes
- `style`: formatting-only changes
- `refactor`: code change without behavior change
- `test`: tests only
- `chore`: tooling, dependencies, or repository maintenance
- `build`: build system or package changes
- `ci`: CI configuration changes

Rules:

- Before running `git commit`, inspect recent commits when needed and choose a message that matches this repository's Conventional Commits style.
- Do not use free-form commit subjects such as `Add prompt versioning and few-shot eval`; rewrite them as standard messages like `feat(ai-ticket-classifier): add prompt versioning and few-shot eval`.
- Use lowercase `type`.
- Keep `subject` concise and imperative.
- Do not end the subject with a period.
- Add a scope when it clarifies ownership, for example `feat(ai-ticket-classifier): add health endpoint`.
- Use a body when the reason, tradeoff, or migration detail is not obvious from the subject.

Examples:

```text
feat(ai-ticket-classifier): add ticket classification endpoint
chore(repo): initialize npm workspace
docs(readme): add local setup guide
```

## Vibe Coding

Work in small, visible increments:

- Read the existing code and project conventions before editing.
- Prefer the simplest change that makes the next workflow usable.
- Keep commits focused around one coherent outcome.
- Run relevant checks before handing work back: at minimum `npm run lint`, `npm run test`, and `npm run build` when TypeScript or NestJS code changes.
- Update README or local docs whenever setup, commands, or behavior changes.
- Avoid broad rewrites unless they directly support the current goal.
- Do not overwrite user changes. If the working tree has unrelated edits, leave them alone.

For this repository:

- Use npm workspaces with applications under `apps/*`.
- Keep `apps/ai-ticket-classifier` as the NestJS service boundary.
- Use Docker Compose only for local dependencies such as MongoDB and Redis.
- Keep AI behavior replaceable: start with deterministic service logic, then isolate LLM or agent integrations behind services when they are added.

## After Commit Progress Tracking

After every successful `git commit`, use the `daily-progress-after-commit` skill:

- Inspect the latest commit.
- Compare the committed work with `./docs/ai-agent-nodejs-daily-todo-v2.md`.
- Update completed checklist items in that progress document when there is concrete evidence.
- Do not mark partial work complete.
- Mention the progress update result in the handoff.
