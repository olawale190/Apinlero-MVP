# Àpínlẹ̀rọ Version Control Skill

You are an AI assistant specialized in version control and code management for Àpínlẹ̀rọ, an African & Caribbean wholesale platform.

## Repository Info

- **Branch**: main
- **Remote**: GitHub/Vercel
- **Deployment**: apinlero.vercel.app

## Common Git Operations

### Check Status
```bash
# See what's changed
git status

# See detailed changes
git diff

# See commit history
git log --oneline -10
```

### Save Changes (Commit)
```bash
# Stage all changes
git add .

# Commit with message
git commit -m "feat: description of change"

# Push to remote
git push origin main
```

### Commit Message Format
```
feat: new feature
fix: bug fix
update: improvement to existing feature
refactor: code restructure
docs: documentation changes
style: formatting, no code change
```

### Rollback Operations

#### Undo Uncommitted Changes
```bash
# Discard changes to specific file
git checkout -- <filename>

# Discard ALL uncommitted changes
git checkout .

# Unstage files (keep changes)
git reset HEAD <filename>
```

#### Undo Last Commit
```bash
# Keep changes, remove commit
git reset --soft HEAD~1

# Remove commit AND changes (DANGEROUS)
git reset --hard HEAD~1
```

#### Rollback to Specific Version
```bash
# View history to find commit
git log --oneline

# Restore specific file from commit
git checkout <commit-hash> -- <filename>

# Create branch from old commit
git checkout -b rollback-branch <commit-hash>
```

### Safe Rollback Workflow
```bash
# 1. Create backup branch
git branch backup-before-changes

# 2. Make your changes
# ... edit files ...

# 3. If something breaks, rollback
git checkout backup-before-changes
git branch -D main
git checkout -b main
```

## Before Making Major Changes

Always create a checkpoint:
```bash
git add .
git commit -m "checkpoint: before [description]"
```

## View File History
```bash
# See all commits for a file
git log --oneline -- <filename>

# See who changed what
git blame <filename>

# See specific version of file
git show <commit-hash>:<filename>
```

## Branching Strategy

### Create Feature Branch
```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Work on changes...
git add .
git commit -m "feat: new feature"

# Merge back to main
git checkout main
git merge feature/new-feature
```

### Emergency Rollback
```bash
# If deployment breaks, rollback to last working version
git log --oneline  # Find last good commit
git revert <bad-commit-hash>  # Creates new commit that undoes changes
git push origin main  # Deploy the fix
```

## Àpínlẹ̀rọ Specific Files

### Critical Files (backup before editing)
- `src/App.tsx` - Main app component
- `src/lib/supabase.ts` - Database connection
- `src/components/` - UI components
- `supabase/migrations/` - Database schema

### Safe to Edit
- `.claude/skills/` - Claude skills
- `docs/` - Documentation
- `README.md` - Project info

### Never Commit
- `.env` - Contains secrets
- `node_modules/` - Dependencies
- `.env.local` - Local config

## Quick Reference

| I want to... | Command |
|--------------|---------|
| Save my work | `git add . && git commit -m "message"` |
| Undo file changes | `git checkout -- filename` |
| Undo last commit | `git reset --soft HEAD~1` |
| See history | `git log --oneline` |
| Go back to version | `git checkout <hash> -- file` |
| Push to deploy | `git push origin main` |
| Create backup | `git branch backup-$(date +%Y%m%d)` |

## Vercel Deployment

Vercel auto-deploys when you push to main:
```bash
git push origin main
# Wait 1-2 minutes for deployment
# Check: apinlero.vercel.app
```

### Rollback Deployment
If deployment breaks:
1. Go to vercel.com dashboard
2. Find previous working deployment
3. Click "Promote to Production"

Or via Git:
```bash
git revert HEAD
git push origin main
```
