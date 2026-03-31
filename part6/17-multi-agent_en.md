# Chapter 17: Multi-Agent Architecture

> One Claude can do many things, multiple Claudes can do even more.

---

## 17.1 Why Multi-Agent is Needed

A single Agent has several inherent limitations:

**Context limitation**: An Agent's context window is limited. For extremely large tasks (analyzing entire codebase, processing many files), a single Agent cannot complete them in one context.

**Parallelism limitation**: A single Agent is serial, can only do one thing at a time. For parallelizable tasks (analyzing multiple modules simultaneously, running multiple tests), a single Agent is inefficient.

**Specialization limitation**: Different tasks require different expertise and toolsets. A general-purpose Agent is not as good as a combination of specialized Agents.

Multi-agent architecture solves these three problems.

---

## 17.2 Claude Code's Three Agent Modes

![Multi-Agent Architecture: Three Modes](../diagrams/multi-agent-modes-en.svg)

### Mode 1: Sub-Agent (AgentTool)

Parent agent starts an independent sub-agent with its own context and toolset:

```typescript
// Parent agent calls AgentTool
await AgentTool.execute({
  description: 'Analyze src/auth/ module',
  prompt: 'Detailed analysis of authentication module code structure, security, and potential issues',
  subagent_type: 'Explore',  // Agent type specialized for code exploration
  model: 'claude-opus-4-6',  // Can specify different model for sub-agent
}, context)
```

Sub-agent characteristics:
- **Independent context**: Sub-agent has its own message history, doesn't consume parent's context
- **Independent toolset**: Can configure different tools for sub-agent
- **Result reporting**: After sub-agent completes, results return to parent agent

### Mode 2: Background Agent (run_in_background)

Sub-agent runs in background, parent agent doesn't wait for results:

```typescript
await AgentTool.execute({
  description: 'Background security vulnerability analysis',
  prompt: '...',
  run_in_background: true,  // Run in background
}, context)
// Returns immediately, doesn't wait for sub-agent completion
```

### Mode 3: Worktree Isolated Agent

Sub-agent runs in independent Git Worktree, completely isolated:

```typescript
await AgentTool.execute({
  description: 'Experiment with new feature in isolated branch',
  prompt: '...',
  isolation: 'worktree',  // Create independent worktree
}, context)
```

---

## 17.3 Agent Type System

Claude Code defines multiple specialized agent types:

```typescript
// src/tools/AgentTool/loadAgentsDir.ts
type AgentDefinition = {
  name: string
  description: string
  systemPrompt: string
  tools: string[]        // List of tools available to this agent
  model?: string         // Default model
}
```

Built-in agent types:
- **general-purpose**: General agent with complete toolset
- **Explore**: Code exploration only, read-only tools (no write permission)
- **Plan**: Planning only, can only generate plans, cannot execute

Users can also define custom agent types in `.claude/agents/` directory.

---

## 17.4 Team Collaboration Mode

`TeamCreateTool` and `SendMessageTool` implement more complex multi-agent collaboration:

```typescript
// Create an agent team
await TeamCreateTool.execute({
  members: [
    { name: 'architect', role: 'System architect, responsible for design' },
    { name: 'developer', role: 'Developer, responsible for implementation' },
    { name: 'reviewer', role: 'Code reviewer, responsible for quality control' },
  ]
}, context)

// Inter-agent communication
await SendMessageTool.execute({
  to: 'developer',
  message: 'Architecture plan confirmed, please start implementing UserService'
}, context)
```

Team mode is suitable for complex tasks requiring multi-role collaboration:
- Architect designs, developer implements, reviewer checks
- Frontend and backend agents develop in parallel
- Test agent and development agent collaborate

---

## 17.5 Context Sharing Between Agents

Multi-agent systems face a core problem: **how do agents share information?**

Claude Code uses several mechanisms:

**Filesystem sharing**: Simplest way, agents exchange information by reading/writing files.

```
Agent A writes: /tmp/analysis_result.md
Agent B reads: /tmp/analysis_result.md
```

**Message passing**: Direct message passing through `SendMessageTool`.

**Task output**: Parent agent reads sub-agent output through `TaskOutputTool`.

**Shared state**: `in_process_teammate` type agents share the same AppState.

---

## 17.6 Agent Color System

Claude Code has an interesting design: each agent has a color identifier (`src/tools/AgentTool/agentColorManager.ts`):

```typescript
type AgentColorName =
  | 'blue' | 'green' | 'yellow' | 'red'
  | 'cyan' | 'magenta' | 'white'
```

In the UI, different agents' outputs are displayed in different colors, allowing users to immediately distinguish which agent is speaking:

```
[Blue] Main agent: I'll analyze this project...
[Green] Sub-agent (Explore): Found 47 TypeScript files...
[Yellow] Sub-agent (Plan): Recommended refactoring approach is...
```

This is a small detail but important for multi-agent observability.

---

## 17.7 Agent Resource Limits

To prevent agents from running out of control, Claude Code has resource limits:

```typescript
type QueryEngineConfig = {
  maxTurns?: number        // Max turns (prevent infinite loops)
  maxBudgetUsd?: number    // Max cost (prevent unexpected high bills)
  taskBudget?: { total: number }  // Token budget
}
```

Parent agent can set stricter limits for sub-agents:

```typescript
// Sub-agent only allowed 10 turns, max $0.5 cost
await AgentTool.execute({
  prompt: '...',
  maxTurns: 10,
  maxBudgetUsd: 0.5,
}, context)
```

---

## 17.8 Multi-Agent Debugging Challenges

Multi-agent system debugging is much more complex than single agent:

**Problem 1: Which agent has the issue?**
Solution: Each agent has unique ID and color, logs mark agent source.

**Problem 2: Is inter-agent communication correct?**
Solution: `SendMessageTool` calls are recorded in conversation history, can be traced.

**Problem 3: What is sub-agent's context?**
Solution: Sub-agent's complete conversation history is saved in task output file.

**Problem 4: Is agent looping?**
Solution: `maxTurns` limit prevents infinite loops, automatically terminates when exceeded.

---

## 17.9 Multi-Agent Use Cases

Multi-agent is not a silver bullet, it has its use cases:

**Suitable for multi-agent**:
- Task can be clearly decomposed into independent subtasks
- Subtasks can execute in parallel
- Different subtasks require different expertise
- Task exceeds single context window

**Not suitable for multi-agent**:
- Task highly depends on sequential execution
- Complex dependencies between subtasks
- Task is simple, multi-agent coordination overhead exceeds benefits

---

## 17.10 Summary

Claude Code's multi-agent architecture provides three collaboration modes:

- **Sub-agent**: Independent context, reports results to parent agent
- **Background agent**: Asynchronous execution, doesn't block parent agent
- **Team collaboration**: Multi-agent collaboration through message passing

Key designs: color system (observability), resource limits (safety), multiple sharing mechanisms (flexibility).

---

*Next chapter: [Coordinator Pattern](./18-coordinator_en.md)*
