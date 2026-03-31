# Chapter 10: Overview of 43 Built-in Tools

> The design of the tool set reflects the system's judgment on "what AI can do".

---

## 10.1 Tool Classification Overview

Claude Code has 43 built-in tools, divided into 8 major categories:

| Category | Tool Count | Core Responsibility |
|----------|------------|---------------------|
| File Operations | 5 | Read/write files, search content and paths |
| Shell Execution | 3 | Execute system commands |
| Code Intelligence | 2 | LSP integration, Notebook editing |
| Task Management | 6 | Complete lifecycle of background tasks |
| Multi-Agent Collaboration | 4 | Sub-agents, teams, message passing |
| Plan Mode | 4 | Enter/exit plan and Worktree |
| MCP Integration | 4 | MCP protocol tools and resources |
| Extensions & Others | 15 | Skills, scheduled tasks, Web, configuration, etc. |

---

## 10.2 File Operation Tools

### FileReadTool
**Responsibility**: Read file content

```typescript
// Input
{
  file_path: string      // File path
  offset?: number        // Starting line (for segmented reading of large files)
  limit?: number         // Number of lines to read
}

// Output: File content (with line numbers)
```

**Design highlight**: Supports segmented reading (`offset` + `limit`) to avoid token overflow from reading large files at once. Claude can read the first 100 lines, then read more as needed.

---

### FileEditTool
**Responsibility**: Precise string replacement

```typescript
// Input
{
  file_path: string      // File path
  old_string: string     // Content to replace (must be unique)
  new_string: string     // Replacement content
}
```

**Design highlight**: Requires `old_string` to exist uniquely in the file. This constraint seems strict but is actually a safety measure—preventing Claude from accidentally modifying the wrong location. If `old_string` is not unique, the tool will error, and Claude needs to provide more context for precise location.

---

### FileWriteTool
**Responsibility**: Create or completely overwrite files

```typescript
// Input
{
  file_path: string      // File path
  content: string        // File content
}
```

**Difference from FileEditTool**: `FileWriteTool` overwrites the entire file, `FileEditTool` only modifies specific content. Use `FileWriteTool` for new files, prefer `FileEditTool` for modifying existing files (safer, more precise).

---

### GlobTool
**Responsibility**: Search file paths by pattern

```typescript
// Input
{
  pattern: string        // glob pattern, e.g., "**/*.ts"
  path?: string          // Search root directory
}

// Output: List of matching file paths (sorted by modification time)
```

**Design highlight**: Results sorted by modification time, most recently modified files first. This is useful for Claude—usually the most recently modified files are most relevant.

---

### GrepTool
**Responsibility**: Search file content

```typescript
// Input
{
  pattern: string        // Regular expression
  path?: string          // Search directory
  glob?: string          // File filter pattern
  output_mode?: 'content' | 'files_with_matches' | 'count'
  context?: number       // Number of lines to show before/after match
}
```

**Design highlight**: Based on ripgrep, extremely fast. Supports three output modes, Claude can choose based on needs: just need to know which files have matches (`files_with_matches`), or need to see specific content (`content`).

---

## 10.3 Shell Execution Tools

### BashTool
**Responsibility**: Execute shell commands

```typescript
// Input
{
  command: string        // Shell command
  timeout?: number       // Timeout (milliseconds)
  description?: string   // Command description (shown to user)
}

// Output: stdout + stderr + exit code
```

**Security design**: BashTool is the most dangerous tool because it can execute arbitrary commands. Claude Code has special security handling for BashTool:
- Requires user confirmation by default
- Has command safety analysis (detects dangerous commands like `rm -rf`)
- Supports timeout to prevent command hanging
- Restricted in sandbox mode

---

### PowerShellTool
**Responsibility**: Execute PowerShell commands (Windows)

Similar to BashTool, but for Windows environments.

---

### REPLTool
**Responsibility**: Interactive REPL execution

```typescript
// Input
{
  code: string           // Code to execute
  language?: string      // Language (python, node, etc.)
}
```

**Difference from BashTool**: REPLTool maintains a persistent REPL session, variables persist across multiple calls. Suitable for scenarios requiring multi-step calculations.

---

## 10.4 Code Intelligence Tools

### LSPTool
**Responsibility**: Language Server Protocol integration

```typescript
// Supported operations
type LSPOperation =
  | 'goToDefinition'      // Jump to definition
  | 'findReferences'      // Find references
  | 'hover'               // Hover documentation
  | 'documentSymbol'      // Document symbol list
  | 'workspaceSymbol'     // Workspace symbol search
  | 'goToImplementation'  // Jump to implementation
  | 'prepareCallHierarchy'// Call hierarchy
  | 'incomingCalls'       // Incoming calls
  | 'outgoingCalls'       // Outgoing calls
```

**Design highlight**: LSP integration enables Claude to do real code understanding, not just text search. "Find all places calling `getUserById`" using `findReferences` is more accurate than `GrepTool` (handles renaming, aliases, etc.).

---

### NotebookEditTool
**Responsibility**: Edit Jupyter Notebooks

```typescript
// Input
{
  notebook_path: string  // Notebook path
  cell_number?: number   // Target cell (0-indexed)
  new_source: string     // New cell content
  edit_mode?: 'replace' | 'insert' | 'delete'
  cell_type?: 'code' | 'markdown'
}
```

---

## 10.5 Task Management Tools

Task management tools are the interface to Claude Code's background task system:

| Tool | Responsibility |
|------|----------------|
| `TaskCreateTool` | Create background task (bash command or sub-agent) |
| `TaskGetTool` | Get single task status |
| `TaskListTool` | List all tasks |
| `TaskOutputTool` | Read task output |
| `TaskStopTool` | Stop task |
| `TaskUpdateTool` | Update task description |

**Use case**: Long-running tasks (like builds, tests, data processing) can execute as background tasks, Claude can continue handling other things, periodically checking task status.

---

## 10.6 Multi-Agent Collaboration Tools

### AgentTool
**Responsibility**: Launch sub-agent

```typescript
// Input
{
  description: string    // Sub-agent's task description
  prompt: string         // Sub-agent's initial prompt
  subagent_type?: string // Agent type (general-purpose, Explore, etc.)
  isolation?: 'worktree' // Whether to run in isolated worktree
  model?: string         // Model used by sub-agent
  run_in_background?: boolean // Whether to run in background
}
```

**Design highlight**: Sub-agents have their own independent tool set, context, and execution environment. Parent agent can launch multiple sub-agents in parallel, achieving true parallel processing.

---

### TeamCreateTool / TeamDeleteTool
**Responsibility**: Create/delete collaborative agent teams

Teams are collections of multiple agents that can communicate with each other through `SendMessageTool`.

---

### SendMessageTool
**Responsibility**: Send messages to other agents

Implements asynchronous communication between agents, the foundation of multi-agent collaboration.

---

## 10.7 Plan Mode Tools

### EnterPlanModeTool / ExitPlanModeTool
**Responsibility**: Enter/exit plan mode

In plan mode, Claude can only generate plans, not execute tools. Used for scenarios requiring user review of plans before execution.

```
User: Help me refactor the entire authentication module

Claude (plan mode):
  My plan is:
  1. Analyze existing authentication flow
  2. Design new interface
  3. Gradually migrate

  Approve execution?

User: Approve

Claude (execution mode): Starting execution...
```

---

### EnterWorktreeTool / ExitWorktreeTool
**Responsibility**: Enter/exit Git Worktree

Work in an isolated worktree without affecting the main branch. Suitable for experimental modifications or parallel development.

---

## 10.8 MCP Integration Tools

| Tool | Responsibility |
|------|----------------|
| `MCPTool` | Call tools provided by MCP servers |
| `McpAuthTool` | MCP server authentication |
| `ListMcpResourcesTool` | List MCP resources |
| `ReadMcpResourceTool` | Read MCP resources |

MCP (Model Context Protocol) is an open protocol proposed by Anthropic, allowing external servers to provide tools and resources to Claude. See Chapter 19 for details.

---

## 10.9 Other Important Tools

### WebFetchTool
**Responsibility**: Fetch web page content

```typescript
// Input
{
  url: string            // URL
  prompt: string         // What information to extract from page
}
```

**Design highlight**: Doesn't simply return HTML, but uses AI to process page content and extract information users need.

---

### WebSearchTool
**Responsibility**: Search the internet

```typescript
// Input
{
  query: string          // Search query
  allowed_domains?: string[]  // Only search these domains
  blocked_domains?: string[]  // Exclude these domains
}
```

---

### TodoWriteTool
**Responsibility**: Manage task list

```typescript
// Input
{
  todos: Array<{
    content: string
    status: 'pending' | 'in_progress' | 'completed'
    activeForm: string
  }>
}
```

**Design highlight**: TodoWriteTool is Claude's "working memory". For complex multi-step tasks, Claude uses TodoWriteTool to record progress, ensuring no steps are missed.

---

### AskUserQuestionTool
**Responsibility**: Ask user questions

```typescript
// Input
{
  questions: Array<{
    question: string
    header: string
    options: Array<{ label: string; description: string }>
    multiSelect?: boolean
  }>
}
```

**Design highlight**: Structured question format allows users to answer through options, not just free text. This reduces ambiguity and improves interaction efficiency.

---

### SkillTool
**Responsibility**: Execute predefined Skills

Skills are reusable prompt templates, see Chapter 20 for details.

---

### ScheduleCronTool / RemoteTriggerTool
**Responsibility**: Scheduled tasks and remote triggers

Allows Claude to create scheduled tasks or trigger remote Agent execution.

---

## 10.10 Tool Evolution

Claude Code's tool set is not static. From migration files in the source code (`src/migrations/`), we can see the evolution history of tools:

- Model migration from Opus to Sonnet 4.5, then to Sonnet 4.6
- Multiple refactorings of the permission system
- Continuous addition of new tools

This evolution capability comes from good abstraction of the tool system: adding new tools only requires implementing the `Tool` interface, no need to modify the core system.

---

## 10.11 Summary

43 built-in tools cover the complete workflow of software development:

- **Explore**: GlobTool, GrepTool, LSPTool
- **Understand**: FileReadTool, WebFetchTool
- **Modify**: FileEditTool, FileWriteTool
- **Execute**: BashTool, REPLTool
- **Collaborate**: AgentTool, TeamCreateTool, SendMessageTool
- **Manage**: TaskCreateTool, TodoWriteTool, ScheduleCronTool
- **Extend**: MCPTool, SkillTool

The design principle of this tool set is: **Each tool does one thing, Claude is responsible for orchestration**.

---

*Next chapter: [Tool Permission Model](./11-tool-permission.md)*


