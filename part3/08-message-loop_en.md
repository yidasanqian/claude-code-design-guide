# Chapter 8: Message Loop and Streaming

> Streaming is not just a user experience optimization, it's a fundamental design pattern of the entire system.

---

## 8.1 Why Streaming is So Important

In AI systems, streaming has two layers of meaning:

**User Experience Layer**: Users don't need to wait for the complete response; they can see Claude's output in real-time. For long tasks, this means users immediately know what Claude is doing, rather than staring at a blank screen.

**System Architecture Layer**: Streaming turns the entire system into a **data flow pipeline**. Messages flow from the API, through parsing, tool execution, result backfilling, and back to the API, forming a continuous data stream.

Claude Code is designed for streaming from bottom to top.

---

## 8.2 Message Type System

Before diving into streaming, let's understand Claude Code's message type system:

```typescript
// src/types/message.ts (simplified)
type Message =
  | UserMessage          // User input
  | AssistantMessage     // Claude's response
  | SystemMessage        // System messages (tool results, errors, etc.)
  | AttachmentMessage    // Attachments (images, files)
  | ToolUseSummaryMessage // Tool usage summary
  | TombstoneMessage     // Placeholder for deleted messages

type AssistantMessage = {
  type: 'assistant'
  uuid: string
  message: {
    content: ContentBlock[]  // Can contain multiple types of blocks
  }
  apiError?: string
}

type ContentBlock =
  | TextBlock           // Plain text
  | ThinkingBlock       // Thinking block (extended thinking mode)
  | RedactedThinkingBlock // Redacted thinking block
  | ToolUseBlock        // Tool call request
```

This type system design is important: **A single AssistantMessage can contain multiple types of content blocks**. Claude can output text, thinking, and multiple tool calls in a single response.

---

## 8.3 Parsing Streaming Responses

The Claude API returns Server-Sent Events (SSE) streams. Streaming parsing architecture:

![Streaming Response Parsing Flow — Text blocks output in real-time, tool call blocks accumulated then executed](../diagrams/query-engine-flow-en.svg)

The streaming parsing in `query.ts` roughly looks like this:

```typescript
// Simplified streaming parsing logic
async function* parseStream(apiStream) {
  let currentTextBlock = ''
  let currentThinkingBlock = ''
  const toolUseBlocks = new Map()

  for await (const event of apiStream) {
    switch (event.type) {
      case 'content_block_start':
        if (event.content_block.type === 'text') {
          // Start text block
        } else if (event.content_block.type === 'thinking') {
          // Start thinking block
        } else if (event.content_block.type === 'tool_use') {
          // Start tool call block
          toolUseBlocks.set(event.index, {
            id: event.content_block.id,
            name: event.content_block.name,
            input: ''
          })
        }
        break

      case 'content_block_delta':
        if (event.delta.type === 'text_delta') {
          currentTextBlock += event.delta.text
          // Immediately yield to UI for display
          yield { type: 'text_delta', text: event.delta.text }
        } else if (event.delta.type === 'thinking_delta') {
          currentThinkingBlock += event.delta.thinking
          // Thinking block not yielded to UI
        } else if (event.delta.type === 'input_json_delta') {
          // Tool call parameters are streaming JSON
          toolUseBlocks.get(event.index).input += event.delta.partial_json
        }
        break

      case 'content_block_stop':
        // Block ended, process complete block
        break

      case 'message_stop':
        // Message ended, yield complete tool call list
        yield { type: 'tool_calls', calls: [...toolUseBlocks.values()] }
        break
    }
  }
}
```

Key point: **Text blocks are yielded in real-time, tool call blocks are processed after completion**. This is because tool calls need complete JSON parameters to execute.

---

## 8.4 StreamingToolExecutor: Streaming Tool Execution

`src/services/tools/StreamingToolExecutor.ts` is the core of tool execution:

```typescript
class StreamingToolExecutor {
  async* execute(toolCalls: ToolUseBlock[], context: ToolUseContext) {
    // Execute all tool calls in parallel
    const executions = toolCalls.map(call =>
      this.executeSingle(call, context)
    )

    // Stream yield each tool's execution process
    for (const execution of executions) {
      for await (const event of execution) {
        yield event
      }
    }
  }

  async* executeSingle(call: ToolUseBlock, context: ToolUseContext) {
    // yield tool start event
    yield { type: 'tool_start', toolName: call.name, toolUseId: call.id }

    try {
      const tool = findToolByName(call.name, context.options.tools)
      const result = await tool.execute(call.input, context)

      // yield tool result
      yield { type: 'tool_result', toolUseId: call.id, result }
    } catch (error) {
      // yield tool error
      yield { type: 'tool_error', toolUseId: call.id, error }
    }
  }
}
```

---

## 8.5 Message Normalization: normalizeMessagesForAPI

Before each API call, the message list needs normalization. `normalizeMessagesForAPI()` handles various cases:

```typescript
function normalizeMessagesForAPI(messages: Message[]): APIMessage[] {
  return messages
    // Filter out message types that don't need to be sent to API
    .filter(msg => !isSyntheticMessage(msg))
    // Merge adjacent messages of same type (API requires user/assistant alternation)
    .reduce(mergeAdjacentMessages, [])
    // Handle special rules for thinking blocks
    .map(handleThinkingBlocks)
    // Truncate overly large tool results
    .map(truncateLargeToolResults)
}
```

This function handles many edge cases:
- API requires messages to alternate between user/assistant, can't have two consecutive user messages
- Thinking blocks have strict position rules
- Tool results can be very large (e.g., reading a large file), need truncation

---

## 8.6 Message Queue Management

Claude Code has a message queue system (`src/utils/messageQueueManager.ts`) that handles concurrent input:

```typescript
// Users may input new messages while Claude is still executing
// Message queue ensures these messages are processed by priority

const queue = {
  // High priority: slash commands (like /stop)
  // Normal priority: user messages
  // Low priority: background task messages
}
```

This solves a practical problem: users may want to interrupt or modify instructions while Claude is executing long tasks, and the message queue ensures these operations can respond promptly.

---

## 8.7 UI Rendering of Streaming Output

Claude Code uses Ink (React for CLI) to render UI. Streaming text rendering works like this:

```tsx
// Simplified message rendering component
function StreamingMessage({ message }) {
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    // Subscribe to streaming events
    const unsubscribe = subscribeToStream(message.id, (delta) => {
      setDisplayText(prev => prev + delta)
    })
    return unsubscribe
  }, [message.id])

  return <Text>{displayText}</Text>
}
```

Ink's rendering is incremental: each `setDisplayText` only updates the changed parts, not re-rendering the entire interface. This ensures smooth streaming output.

---

## 8.8 UI Feedback for Tool Calls

During tool execution, the UI displays real-time progress:

```
> Help me find all unused variables

Claude: I'll analyze unused variables in the project.

⠸ GlobTool: Searching **/*.ts...
✓ GlobTool: Found 47 files

⠸ FileReadTool: Reading src/main.ts...
✓ FileReadTool: Complete

⠸ FileReadTool: Reading src/utils.ts...
✓ FileReadTool: Complete

Analysis complete, found the following unused variables:
...
```

This real-time feedback lets users know what Claude is doing and decide whether to interrupt at any time.

---

## 8.9 Backpressure Handling

When tool execution is faster than UI rendering, a backpressure mechanism is needed to prevent memory overflow:

```typescript
// Claude Code uses natural backpressure of async generators
async function* query(params) {
  // Generator only continues when consumer awaits
  // This naturally provides backpressure
  for await (const event of apiStream) {
    yield event  // Waits for consumer to process before continuing
  }
}
```

Backpressure in async generators is "free": if the consumer doesn't `await` the next value, the producer won't continue executing.

---

## 8.10 Error Boundaries in Streaming

Error handling in streaming is more complex than synchronous code:

```typescript
async function* safeQuery(params) {
  try {
    yield* query(params)
  } catch (error) {
    if (error instanceof AbortError) {
      // User actively interrupted, exit normally
      yield { type: 'interrupted' }
    } else if (isRetryableError(error)) {
      // Retryable error, auto retry
      yield* safeQuery(params)
    } else {
      // Unrecoverable error, yield error message
      yield { type: 'error', error: error.message }
    }
  }
}
```

---

## 8.11 Summary

Claude Code's message loop and streaming design:

- **End-to-end streaming**: From API response to UI rendering, fully streaming
- **Type-safe message system**: Clear message type hierarchy
- **Parallel tool execution**: Multiple tool calls processed in parallel
- **Message normalization**: Handles various API constraints
- **Message queue**: Handles concurrent input
- **Natural backpressure**: Async generators naturally provide backpressure
- **Layered error handling**: Interruption, retry, and errors each have corresponding handling

This streaming architecture is the foundation for Claude Code's smooth handling of long tasks.

---

*Next chapter: [Tool System Design Philosophy](../part4/09-tool-design.md)*

