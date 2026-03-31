# Chapter 21: Plugin System

> The plugin system embodies Claude Code's openness — allowing third-party developers to extend core capabilities.

---

## 21.1 Plugin System Design Goals

Claude Code's plugin system (`src/plugins/`, `src/services/plugins/`) has several design goals:

1. **Extensibility**: Allow third parties to add new features without modifying core code
2. **Isolation**: Plugin errors don't affect core system
3. **Security**: Plugin permissions are restricted
4. **Discoverability**: Users can easily find and install plugins

---

## 21.2 Plugin Types

Claude Code supports two plugin types:

**Built-in plugins** (`src/plugins/builtinPlugins.ts`):
Official plugins distributed with Claude Code, have full system permissions.

**Third-party plugins** (via Marketplace):
External plugins installed by users, with restricted permissions requiring explicit user authorization.

---

## 21.3 Plugin Hook System

Plugins integrate with Claude Code through the Hook system:

```typescript
// src/types/plugin.ts
type PluginHookMatcher = {
  event: HookEvent          // Trigger timing
  matcher?: string          // Match condition (optional)
  handler: PluginHandler    // Handler function
}

type HookEvent =
  | 'PreToolUse'            // Before tool call
  | 'PostToolUse'           // After tool call
  | 'UserPromptSubmit'      // When user submits message
  | 'Stop'                  // When conversation ends
  | 'Notification'          // When sending notification
```

Plugins can inject custom logic at these key moments:

```typescript
// Example: plugin that logs all tool calls
const auditPlugin: Plugin = {
  name: 'audit-logger',
  hooks: [
    {
      event: 'PostToolUse',
      handler: async ({ toolName, input, result }) => {
        await appendToAuditLog({
          timestamp: Date.now(),
          tool: toolName,
          input,
          success: !result.is_error,
        })
      }
    }
  ]
}
```

---

## 21.4 Plugin Configuration

Plugins are configured through `settings.json`:

```json
{
  "plugins": {
    "audit-logger": {
      "enabled": true,
      "logFile": "~/.claude/audit.log"
    },
    "custom-formatter": {
      "enabled": true,
      "style": "compact"
    }
  }
}
```

---

## 21.5 Plugin Security Model

Plugin security model is based on **principle of least privilege**:

```typescript
type PluginPermissions = {
  canReadFiles: boolean      // Can read files
  canWriteFiles: boolean     // Can write files
  canExecuteCommands: boolean // Can execute commands
  canAccessNetwork: boolean  // Can access network
  canModifySettings: boolean // Can modify settings
}
```

Users must explicitly authorize each permission when installing plugins.

---

## 21.6 Built-in Plugin Examples

Claude Code has several important built-in plugins:

**AutoUpdater** (`src/components/AutoUpdater.tsx`):
Automatically check and install Claude Code updates.

**PromptSuggestion** (`src/services/PromptSuggestion/`):
Provide prompt suggestions based on current context.

**SessionMemory** (`src/services/SessionMemory/`):
Manage session memory persistence.

**AgentSummary** (`src/services/AgentSummary/`):
Generate summary reports of agent execution.

---

## 21.7 Plugin vs MCP vs Skills

Comparison of three extension mechanisms:

| Dimension | Plugins | MCP | Skills |
|------|------|-----|--------|
| Implementation language | TypeScript | Any language | Markdown |
| Integration depth | Deep (Hook system) | Medium (tools/resources) | Shallow (prompt templates) |
| Development difficulty | High | Medium | Low |
| Use cases | Core feature extension | External service integration | Workflow encapsulation |
| Permission requirements | High | Medium | Low |

---

## 21.8 Summary

Claude Code's plugin system provides deep extension capabilities:

- **Hook system**: Inject custom logic at key moments
- **Permission model**: Principle of least privilege, explicit user authorization
- **Two types**: Built-in plugins (official) + third-party plugins (user-installed)

Three extension mechanisms (plugins, MCP, Skills) cover the complete spectrum from deep integration to lightweight encapsulation.

---

*Next chapter: [Layered Permission Model Design](../part8/22-permission-model_en.md)*
