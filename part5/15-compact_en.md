# Chapter 15: Context Compression (Auto-Compact)

> Forgetting is part of intelligence. Knowing what to remember and what to forget is the core of context management.

---

## 15.1 The Limitation of Context Windows

Claude's context window is limited. As conversations progress, the message list grows continuously:

```
Conversation start:
[System prompt 5K] + [User message 0.1K] = 5.1K tokens

After 10 rounds:
[System prompt 5K] + [10 rounds × avg 5K] = 55K tokens

After 50 rounds (with many tool calls):
[System prompt 5K] + [50 rounds × avg 5K] = 255K tokens → Exceeds limit!
```

When context approaches the limit, there are two choices:
1. **Truncation**: Delete early messages (simple but loses important information)
2. **Compression**: Replace detailed history with summary (complex but retains key information)

Claude Code chooses compression.

---

## 15.2 Auto-Compact Trigger Mechanism

`src/services/compact/autoCompact.ts` implements the auto-compact trigger logic:

```typescript
export function calculateTokenWarningState(
  messages: Message[],
  maxTokens: number
): TokenWarningState {
  const currentTokens = estimateTokenCount(messages)
  const ratio = currentTokens / maxTokens

  if (ratio > 0.95) {
    return 'critical'   // Must compress immediately
  } else if (ratio > 0.85) {
    return 'warning'    // Compression recommended
  } else {
    return 'normal'
  }
}

export function isAutoCompactEnabled(): boolean {
  // Check user config and environment variables
  return !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_AUTO_COMPACT)
}
```

Warning is shown when token usage exceeds 85%, forced compression when exceeding 95%.

---

## 15.3 Core Compression Algorithm

The core idea of compression: **use Claude itself to summarize conversation history**.

![Auto-Compact Compression Flow](../diagrams/auto-compact-flow-en.svg)

Code implementation:

```typescript
// src/services/compact/compact.ts (simplified)
async function compactConversation(
  messages: Message[],
  systemPrompt: SystemPrompt
): Promise<Message[]> {

  // 1. Find compression boundary (keep recent N messages uncompressed)
  const { toCompress, toKeep } = splitAtCompactBoundary(messages)

  // 2. Use Claude to generate summary
  const summary = await generateSummary(toCompress, systemPrompt)

  // 3. Build compressed message list
  return [
    // Summary as first user message
    createUserMessage({
      content: `[Conversation History Summary]\n${summary}`
    }),
    // Keep recent messages (complete)
    ...toKeep
  ]
}
```

---

## 15.4 Summary Generation Strategy

When generating summaries, Claude Code instructs Claude on what information to retain:

```
Please summarize the following conversation history, retaining:
1. Completed tasks and results
2. Important decisions and reasons
3. Current ongoing task status
4. Key code changes (file names and change summaries)
5. User's important preferences and constraints

No need to retain:
- Detailed tool call outputs (only keep results)
- Detailed process of intermediate steps
- Detailed information of resolved errors
```

This strategy ensures the summary contains "minimum information needed to continue work".

---

## 15.5 Choosing Compression Boundaries

Not all messages can be compressed. Some messages must be kept complete:

```typescript
function splitAtCompactBoundary(messages: Message[]) {
  // Rule 1: Keep recent N messages (default 10)
  // Rule 2: Don't compress in middle of tool calls (tool calls and results must be paired)
  // Rule 3: Don't compress messages containing thinking blocks (thinking blocks have strict position rules)
  // Rule 4: Keep user's recent explicit instructions

  const KEEP_RECENT = 10
  const boundary = findSafeBoundary(messages, KEEP_RECENT)

  return {
    toCompress: messages.slice(0, boundary),
    toKeep: messages.slice(boundary)
  }
}
```

---

## 15.6 Reactive Compact: Responsive Compression

Besides token-based auto-compact, Claude Code has reactive compact (`REACTIVE_COMPACT` feature flag):

```typescript
// When API returns prompt_too_long error, automatically trigger compression
const reactiveCompact = feature('REACTIVE_COMPACT')
  ? require('./services/compact/reactiveCompact.js')
  : null

// In query.ts
if (error.type === 'prompt_too_long') {
  if (reactiveCompact) {
    // Compress and retry
    messages = await reactiveCompact.compact(messages)
    continue  // Retry request
  }
}
```

This is a "defensive" mechanism: even if auto-compact doesn't trigger in time, it can automatically recover when API errors.

---

## 15.7 Snip Compact: Fine-grained Compression

`HISTORY_SNIP` feature flag enables more fine-grained compression strategy:

```typescript
// Instead of compressing entire history, "snip" specific segments
// Example: detailed process of a completed subtask can be snipped, keeping only results
const snipModule = feature('HISTORY_SNIP')
  ? require('./services/compact/snipCompact.js')
  : null
```

Snip Compact advantages:
- Retains more useful context
- Only compresses truly unnecessary parts
- Compressed history is more coherent

---

## 15.8 Context Collapse: Extreme Compression

When context is extremely tight, `CONTEXT_COLLAPSE` feature flag enables extreme compression:

```typescript
const contextCollapse = feature('CONTEXT_COLLAPSE')
  ? require('./services/contextCollapse/index.js')
  : null
```

Context Collapse compresses history more aggressively, sacrificing some context integrity for more working space.

---

## 15.9 Compression UI Feedback

Compression is an important operation, Claude Code gives users clear feedback:

```
⠸ Compressing conversation history...

✓ Conversation compressed
  Original: 127,432 tokens
  After compression: 23,891 tokens
  Saved: 81%

  Summary contains:
  - Completed: Refactored UserService (3 files)
  - Completed: Fixed login bug
  - In progress: Adding user permission system
```

This lets users know what happened and what key information the compression retained.

---

## 15.10 Manual Compression: /compact Command

Users can also manually trigger compression:

```bash
> /compact
```

Manual compression use cases:
- After completing a large task, clean history and start new task
- Context has many tool call results no longer needed
- Want to "reset" context but keep key information

---

## 15.11 Limitations of Compression

Compression is not a panacea, it has several limitations:

**Information loss**: Summaries always lose some details. If subsequent tasks need these details, Claude may need to re-read files.

**Summary quality**: Summary quality depends on Claude's judgment. Sometimes Claude may compress important information or retain unimportant information.

**Compression cost**: Generating summaries requires API calls, with time and cost overhead.

**Irreversible**: Compressed history cannot be recovered (unless backed up).

---

## 15.12 Design Insight: The Art of Forgetting

Auto-Compact reveals a profound design principle: **intelligent systems need to selectively forget**.

Human memory works this way too: we don't remember every detail, but we remember important things. This selective forgetting allows us to process new information without being overwhelmed by old information.

For AI Agent systems, context management is a core engineering problem. Auto-Compact is Claude Code's engineering answer to this problem: **use AI to manage AI's memory**.

---

## 15.13 Summary

Auto-Compact is a key component of Claude Code Context Engineering:

- **Trigger mechanism**: Based on token usage (85% warning, 95% forced)
- **Compression algorithm**: Use Claude to generate summary, replace detailed history
- **Boundary protection**: Don't compress in middle of tool calls, keep recent messages
- **Multiple strategies**: Auto-Compact, Reactive Compact, Snip Compact, Context Collapse
- **User visible**: Compression process and results are transparent to users

---

*Next chapter: [Task System Design](../part6/16-task-system_en.md)*
