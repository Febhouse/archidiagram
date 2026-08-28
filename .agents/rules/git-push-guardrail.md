# Git Push Guardrail

- **Strict Constraint**: NEVER run `git push`, `git push origin main`, or any other synchronization command to remote repositories (GitHub, GitLab, etc.) unless the user EXPLICITLY commands you to do so (e.g., "bạn hãy đẩy lên Github").
- **Local Workflow**: It is acceptable to use `git add` and `git commit` to save work locally if it helps organize changes, but pushing to remotes must be explicitly authorized. 
- **Wait for Review**: Always stop and wait for the user to review local changes before proposing to sync them.
