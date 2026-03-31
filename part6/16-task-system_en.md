# Chapter 16: Task System Design

> Background tasks are the key to Agent evolving from "synchronous assistant" to "asynchronous collaborator".

---

## 16.1 Why We Need a Task System

Early AI assistants were completely synchronous: user asks, AI answers, user waits.

But real engineering work isn't like this:
- Building a large project may take 10 minutes
- Running a complete test suite may take 30 minutes
- Data processing tasks may take hours

If Claude blocks users from doing anything while executing these tasks, the experience is poor.

The task system solves this problem: **allow Claude to execute long-running tasks in the background while continuing to respond to other user requests**.

---

## 16.2 Task Types

`src/Task.ts` defines 7 task types:

```typescript
type TaskType =
  | 'local_bash'          // Local shell command (most common)
  | 'local_agent'         // Local sub-agent (independent Claude instance)
  | 'remote_agent'        // Remote agent (runs on CCR)
  | 'in_process_teammate' // In-process collaborative agent (shared memory)
  | 'local_workflow'      // Local workflow (multi-step task)
  | 'monitor_mcp'         // MCP monitoring task
  | 'dream'               // Auto dream mode (experimental)
```

Each type has different execution environments and capabilities:

| Type | Execution Location | Isolation Level | Communication Method |
|------|---------|---------|---------|
| local_bash | Local process | Low | stdout/stderr |
| local_agent | Local subprocess | Medium | File + message |
| remote_agent | Remote server | High | HTTP API |
| in_process_teammate | Same process | None | Shared memory |

---

## 16.3 Task State Machine

Each task has a clear state machine:

```
pending → running → completed
                 ↘ failed
                 ↘ killed
```

```typescript
type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'killed'

// Terminal state check
function isTerminalTaskStatus(status: TaskStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'killed'
}
```

Terminal states are irreversible: once a task is completed, failed, or killed, it cannot transition to other states. This design prevents state machine chaos.

---

## 16.4 Task ID Design

Task ID design is interesting:

```typescript
// Task ID prefixes
const TASK_ID_PREFIXES = {
  local_bash: 'b',
  local_agent: 'a',
  remote_agent: 'r',
  in_process_teammate: 't',
  local_workflow: 'w',
  monitor_mcp: 'm',
  dream: 'd',
}

// Generate task ID: prefix + 8 random characters
// Example: b3k9x2mf (local bash task)
//          a7p1n4qz (local agent task)
function generateTaskId(type: TaskType): string {
  const prefix = TASK_ID_PREFIXES[type]
  const bytes = randomBytes(8)
  // Use base-36 (numbers + lowercase letters)
  // 36^8 ≈ 2.8 trillion combinations, enough to prevent brute force
  return prefix + encode(bytes, TASK_ID_ALPHABET)
}
```

The prefix makes task type immediately visible, random suffix ensures uniqueness. Comments explicitly state security considerations: **prevent brute force symlink attacks**.

---

## 16.5 Task Output Persistence

Each task's output is written to disk:

```typescript
type TaskStateBase = {
  id: string
  type: TaskType
  status: TaskStatus
  description: string
  outputFile: string    // Output file path
  outputOffset: number  // Read offset (for incremental reading)
  startTime: number
  endTime?: number
  notified: boolean     // Whether completion notification sent
}
```

Benefits of output files:
- **Persistence**: Task output isn't lost if process restarts
- **Incremental reading**: `TaskOutputTool` can read from `outputOffset`, avoiding duplicate reads
- **Large output support**: Not limited by memory, can handle GB-level output

---

## 16.6 Task Lifecycle Management

```typescript
// Create task
const taskId = await TaskCreateTool.execute({
  command: 'npm run build',
  description: 'Build production version'
}, context)
// Returns: { taskId: 'b3k9x2mf' }

// Check status
const status = await TaskGetTool.execute({ taskId }, context)
// Returns: { status: 'running', outputOffset: 1024 }

// Read output (incremental)
const output = await TaskOutputTool.execute({
  taskId,
  block: false  // Non-blocking, return current output immediately
}, context)

// Wait for completion (blocking)
const result = await TaskOutputTool.execute({
  taskId,
  block: true,  // Blocking, wait for task completion
  timeout: 300000  // 5 minute timeout
}, context)

// Stop task
await TaskStopTool.execute({ taskId }, context)
```

---

## 16.7 Coordinating Tasks with Main Conversation

While tasks run in background, main conversation can continue. Claude can:

1. Start multiple background tasks
2. Continue handling other user requests
3. Periodically check task status
4. Report results when tasks complete

```
User: Run frontend and backend tests simultaneously

Claude: Okay, I'll run both test suites in parallel.

  → TaskCreateTool: npm run test:frontend (Task ID: b1a2b3c4)
  → TaskCreateTool: npm run test:backend (Task ID: b5d6e7f8)

  Both tests are running in background. Let me check progress...

  → TaskGetTool: b1a2b3c4 → running (30 seconds elapsed)
  → TaskGetTool: b5d6e7f8 → running (30 seconds elapsed)

  [2 minutes later]

  → TaskGetTool: b1a2b3c4 → completed ✓
  → TaskGetTool: b5d6e7f8 → failed ✗

  Frontend tests passed! Backend tests failed, let me check the error...
  → TaskOutputTool: b5d6e7f8 → [error output]
```

---

## 16.8 Task Cleanup Mechanism

Tasks need resource cleanup after completion:

```typescript
type TaskHandle = {
  taskId: string
  cleanup?: () => void  // Cleanup function (close process, release resources, etc.)
}
```

The `cleanup` function is called when task terminates, ensuring:
- Subprocesses are properly terminated
- Temporary files are deleted
- Network connections are closed

---

## 16.9 Summary

The task system allows Claude Code to evolve from synchronous assistant to asynchronous collaborator:

- **7 task types**: Covers from simple shell commands to complex multi-agent collaboration
- **Clear state machine**: pending → running → terminal
- **Persistent output**: Task output written to disk, supports incremental reading
- **Parallel execution**: Multiple tasks can run simultaneously
- **Lifecycle management**: Complete toolset for create, monitor, read, stop

---

*Next chapter: [Multi-Agent Architecture](./17-multi-agent_en.md)*
