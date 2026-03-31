# Chapter 14: Memory and CLAUDE.md

> CLAUDE.md is your "project manual" for Claude, and the Memory system is Claude's "long-term memory".

---

## 14.1 AI's Memory Problem

LLMs are inherently stateless: each API call is independent, and the model doesn't remember previous conversations.

This is a major problem for AI programming assistants:
- Each new session, Claude doesn't know the project background
- Each time, coding standards need to be re-explained
- Each time, team conventions need to be re-stated

Claude Code solves this problem through two mechanisms: **CLAUDE.md** (explicit memory) and **Memory system** (automatic memory).

---

## 14.2 CLAUDE.md: Explicit Project Memory

CLAUDE.md is a Markdown file placed in the project root (or any subdirectory), automatically read by Claude Code at startup.

**Discovery mechanism** (`src/utils/claudemd.ts`):

```typescript
// Search upward from current directory for CLAUDE.md
async function getMemoryFiles(): Promise<string[]> {
  const files = []
  let dir = cwd

  while (dir !== path.dirname(dir)) {  // Until root directory
    const claudeMd = path.join(dir, 'CLAUDE.md')
    if (await fileExists(claudeMd)) {
      files.push(claudeMd)
    }
    dir = path.dirname(dir)
  }

  // Also check ~/.claude/CLAUDE.md (global config)
  const globalClaudeMd = path.join(os.homedir(), '.claude', 'CLAUDE.md')
  if (await fileExists(globalClaudeMd)) {
    files.push(globalClaudeMd)
  }

  return files
}
```

**Multi-level CLAUDE.md**:
```
~/.claude/CLAUDE.md          # Global config (shared across all projects)
/project/CLAUDE.md           # Project-level config
/project/src/CLAUDE.md       # Subdirectory-level config (more specific)
/project/src/auth/CLAUDE.md  # Module-level config (most specific)
```

All found CLAUDE.md files are read and merged in order from global to specific.

---

## 14.3 CLAUDE.md Best Practices

A good CLAUDE.md should contain:

```markdown
# Project Name

## Project Overview
Brief description of what the project is and does.

## Tech Stack
- Language: TypeScript 5.x
- Framework: Next.js 14
- Database: PostgreSQL + Prisma
- Testing: Jest + Testing Library

## Directory Structure
- src/app/        Next.js App Router pages
- src/components/ Reusable components
- src/lib/        Utility functions and services
- src/types/      TypeScript type definitions

## Coding Standards
- Use functional components, not class components
- All functions must have TypeScript types
- Prohibit use of any type
- File naming: kebab-case
- Component naming: PascalCase

## Common Commands
- npm run dev      Start dev server (port 3000)
- npm test         Run tests
- npm run build    Build production version
- npm run lint     Run ESLint

## Important Conventions
- Don't directly modify src/generated/ directory
- Database migrations must be verified in staging first
- API routes must have authentication middleware
- All user input must be validated

## Current Work
- Refactoring authentication module (see src/auth/)
- TODO: User permission system
```

---

## 14.4 CLAUDE.md @ Reference Syntax

CLAUDE.md supports `@` syntax to reference other files:

```markdown
# Project Configuration

## API Specification
@docs/api-spec.md

## Database Schema
@prisma/schema.prisma

## Environment Variables
@.env.example
```

This allows CLAUDE.md to reference existing project documentation, avoiding duplicate maintenance.

---

## 14.5 Memory System: Automatic Memory

Besides manually maintained CLAUDE.md, Claude Code has an automatic Memory system (`src/memdir/`).

**Memory file storage location**:
```
~/.claude/projects/<project-hash>/memory/
├── user_role.md          # User role information
├── feedback_testing.md   # Testing-related feedback
├── project_context.md    # Project context
└── MEMORY.md             # Memory index
```

**Memory types** (`src/memdir/memoryTypes.ts`):

```typescript
type MemoryType =
  | 'user'       // User information (role, preferences, knowledge background)
  | 'feedback'   // User feedback (do/don't do)
  | 'project'    // Project information (goals, constraints, decisions)
  | 'reference'  // External resource references
```

---

## 14.6 Automatic Memory Extraction

Claude Code can automatically extract Memory from conversations (`src/services/extractMemories/`):

```typescript
// When user says "remember this", automatically save
User: Remember: Our API uses JWT authentication, token valid for 24 hours

// Claude creates a Memory file
// ~/.claude/projects/.../memory/project_auth.md
---
name: API Authentication Config
type: project
---
API uses JWT authentication, token valid for 24 hours.
```

**Trigger conditions**:
- User explicitly says "remember", "record"
- User corrects Claude's behavior ("don't do this")
- User confirms Claude's non-obvious choices

---

## 14.7 Memory Relevance Search

Not all Memory is loaded in every conversation. Claude Code uses relevance search (`src/memdir/findRelevantMemories.ts`):

```typescript
// Find relevant Memory based on current task
async function findRelevantMemories(
  currentTask: string,
  allMemories: Memory[]
): Promise<Memory[]> {
  // Simple keyword matching
  // Or use embedding vector similarity (if enabled)
  return allMemories.filter(memory =>
    isRelevant(memory, currentTask)
  )
}
```

This avoids stuffing all Memory into context (wasting tokens), only loading Memory relevant to the current task.

---

## 14.8 Nested Memory: Dynamic Loading

Claude Code supports dynamic loading of nested Memory (`loadedNestedMemoryPaths`):

```typescript
// QueryEngine tracks loaded Memory paths
private loadedNestedMemoryPaths = new Set<string>()

// When Claude accesses a new directory, check for relevant Memory
// If found, dynamically inject into context
```

This allows the Memory system to dynamically adjust context based on Claude's working location.

---

## 14.9 Team Memory Sync

Claude Code supports team Memory sync (`src/services/teamMemorySync/`):

```
Team member A's Memory → Sync to team shared Memory
Team member B's Claude Code → Read team shared Memory
```

This allows teams to share project conventions, best practices, and common problem solutions without everyone manually maintaining CLAUDE.md.

---

## 14.10 CLAUDE.md vs Memory: How to Choose

| Scenario | Recommended Approach |
|------|---------|
| Project tech stack description | CLAUDE.md |
| Coding standards | CLAUDE.md |
| Common commands | CLAUDE.md |
| Personal work preferences | Memory (user type) |
| Project decision records | Memory (project type) |
| Claude behavior feedback | Memory (feedback type) |
| External documentation references | CLAUDE.md (@ syntax) |
| Temporary context | Directly state in conversation |

---

## 14.11 Memory System Design Principles

Claude Code's Memory system follows several design principles:

**Don't save derivable information**: Code structure, file paths, git history — these can be obtained by reading the codebase, no need to save to Memory.

**Save non-obvious information**: Team conventions, historical decisions, personal preferences — these cannot be derived from code, worth saving.

**Memory can become outdated**: Save timestamps, periodically check if Memory is still valid.

**Memory is not a log**: Don't save "what was done", save "why it was done this way".

---

## 14.12 Summary

Claude Code's memory system has two layers:

- **CLAUDE.md**: Explicit, manually maintained project memory, suitable for stable project information
- **Memory system**: Automatic, dynamic personal/team memory, suitable for preferences and decision records

Combined, they allow Claude to quickly get up to speed in each session without repeatedly explaining background.

---

*Next chapter: [Context Compression (Auto-Compact)](./15-compact_en.md)*
