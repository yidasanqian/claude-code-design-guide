# Chapter 24: Performance Optimization

> Performance is not optimized, it's designed.

---

## 24.1 Claude Code's Performance Challenges

Claude Code faces unique performance challenges:

**Startup latency**: Users expect CLI tools to start quickly. But Claude Code needs to load many modules, initialize state, connect to MCP servers.

**API latency**: Each API call has network latency. For multi-turn tool calls, latency accumulates.

**Large file handling**: Codebases may have many files, search and reading need to be efficient.

**Streaming rendering**: Terminal UI needs to smoothly render streaming output without noticeable stuttering.

**Memory usage**: Long conversation message history can be large, need to control memory usage.

---

## 24.2 Startup Performance Optimization

Claude Code has dedicated startup performance analysis tools (`src/utils/startupProfiler.ts`):

```typescript
// Checkpoint at key startup steps
profileCheckpoint('imports_loaded')
profileCheckpoint('config_read')
profileCheckpoint('mcp_connected')
profileCheckpoint('repl_ready')

// Output startup time analysis
// imports_loaded: 120ms
// config_read: 45ms
// mcp_connected: 230ms
// repl_ready: 395ms (total)
```

**Fast path optimization**: For simple commands (`--version`, `--help`), skip full initialization:

```typescript
// Fast path in main.tsx
if (args.includes('--version')) {
  console.log(VERSION)
  process.exit(0)  // Don't initialize anything
}
```

**Prefetch optimization**: Prefetch needed resources in parallel at startup:

```typescript
// Parallel prefetch, don't block main flow
Promise.all([
  prefetchApiKeyFromApiKeyHelperIfSafe(),  // Prefetch API Key
  preconnectToAPI(),                        // Pre-establish API connection
  prefetchGitStatus(),                      // Prefetch git status
])
```

---

## 24.3 API Call Optimization

**Prompt Caching**:
Stable parts of system prompt are cached by API, subsequent requests don't need to retransmit:

```typescript
// Stable parts (cacheable) placed first
const systemPrompt = [
  coreInstructions,    // Almost never changes → high cache hit rate
  toolDefinitions,     // Doesn't change when toolset stable → high cache hit rate
  claudeMdContent,     // Doesn't change when file unchanged → medium cache hit rate
  gitStatus,           // May differ each time → not cached
]
```

Prompt caching can reduce over 90% of input token costs while lowering latency.

**Streaming processing**:
Use streaming API, users don't need to wait for complete response:

```typescript
// Streaming API call
const stream = await anthropic.messages.stream({
  model: 'claude-sonnet-4-6',
  messages,
  stream: true,  // Enable streaming
})

// Start processing response immediately
for await (const chunk of stream) {
  yield chunk  // Output to user in real-time
}
```

**Parallel tool execution**:
Multiple tool calls execute in parallel, not serially:

```typescript
// Execute all tool calls in parallel
const results = await Promise.all(
  toolCalls.map(call => executeTool(call, context))
)
```

---

## 24.4 Filesystem Optimization

**File read caching** (`src/utils/fileStateCache.ts`):
Same file only read once in a conversation, subsequent uses cache:

```typescript
type FileStateCache = Map<string, {
  content: string
  mtime: number      // File modification time
  readTime: number   // Read time
}>

// Check cache when reading file
async function readFileWithCache(path: string, cache: FileStateCache) {
  const cached = cache.get(path)
  const mtime = await getFileMtime(path)

  if (cached && cached.mtime === mtime) {
    return cached.content  // Cache hit
  }

  const content = await readFile(path)
  cache.set(path, { content, mtime, readTime: Date.now() })
  return content
}
```

**ripgrep integration**:
GrepTool uses ripgrep (not Node.js fs module) for file search, 10-100x faster.

**glob optimization**:
GlobTool results sorted by modification time, most relevant files first, reducing subsequent reads.

---

## 24.5 Memory Optimization

**Message truncation**:
Tool results can be large (like reading a large file), automatically truncated when exceeding limit:

```typescript
// Tool result size limit
const MAX_TOOL_RESULT_TOKENS = 25000

function truncateToolResult(result: string, maxTokens: number): string {
  const tokens = estimateTokens(result)
  if (tokens <= maxTokens) return result

  // Truncate and add note
  const truncated = result.substring(0, estimateChars(maxTokens))
  return truncated + '\n\n[Content truncated, original size exceeds limit]'
}
```

**Auto-compact**:
When message history exceeds token limit, automatically compress (see Chapter 15).

**Circular buffer** (`src/utils/CircularBuffer.ts`):
Used to store limited number of history records, automatically discards oldest entries.

---

## 24.6 Rendering Performance

Claude Code uses Ink (React for CLI) to render UI. React's virtual DOM mechanism ensures efficient incremental updates:

```tsx
// Only changed parts re-render
function MessageList({ messages }) {
  return messages.map(msg => (
    <Message key={msg.uuid} message={msg} />
  ))
}
```

**React Compiler optimization**:
React Compiler traces visible in source code:

```typescript
// src/state/AppState.tsx
import { c as _c } from "react/compiler-runtime";

export function AppStateProvider(t0) {
  const $ = _c(13)  // React Compiler generated cache
  // ...
}
```

React Compiler automatically adds memoization, reducing unnecessary re-renders.

---

## 24.7 Bun Runtime Performance Advantages

Claude Code uses Bun as runtime, not Node.js:

| Dimension | Node.js | Bun |
|------|---------|-----|
| Startup time | ~100ms | ~10ms |
| Module loading | Slow (CommonJS) | Fast (native ESM) |
| TypeScript | Requires compilation | Native support |
| Package management | npm (slow) | bun (10-25x faster) |
| Built-in tools | Few | Many (testing, bundling, etc.) |

Bun's startup speed advantage is especially important for CLI tools — users expect CLI tools to start almost instantly.

---

## 24.8 Feature Flags and Dead Code Elimination

Claude Code uses `bun:bundle`'s `feature()` function for compile-time dead code elimination:

```typescript
// Only include voice-related code when VOICE_MODE enabled
const VoiceProvider = feature('VOICE_MODE')
  ? require('../context/voice.js').VoiceProvider
  : ({ children }) => children  // Empty implementation

// At build time, code for disabled features is completely removed
// Reduces bundle size, improves loading speed
```

This allows Claude Code to build different bundles for different scenarios (standard, enterprise, lightweight), each bundle only containing necessary code.

---

## 24.9 Performance Monitoring

Claude Code has built-in performance monitoring:

```typescript
// API call latency tracking
pushApiMetricsEntry?.(ttftMs)  // TTFT: Time To First Token

// Tool execution time tracking
const toolStart = Date.now()
const result = await tool.execute(input, context)
const toolDuration = Date.now() - toolStart

// Per-turn statistics
turnToolDurationMs += toolDuration
turnToolCount++
```

These metrics help identify performance bottlenecks: is it high API latency? Or slow tool execution?

---

## 24.10 Summary

Claude Code's performance optimization is systematic:

- **Startup optimization**: Fast path + parallel prefetch + startup profiling
- **API optimization**: Prompt caching + streaming processing + parallel tool execution
- **Filesystem optimization**: Read caching + ripgrep + smart sorting
- **Memory optimization**: Result truncation + auto-compact + circular buffer
- **Rendering optimization**: React Compiler + incremental updates
- **Runtime optimization**: Bun's native performance advantages
- **Build optimization**: Feature flags + dead code elimination

Performance optimization permeates the entire system design, not an afterthought patch.

---

*Next chapter: [Claude Code Design Principles](../part9/25-design-principles_en.md)*
