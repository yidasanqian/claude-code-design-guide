# Claude Code v2.1.88 Complete Engineering Architecture Documentation

**English | [中文](./README.md)**

> Based on reverse engineering analysis of 1884 TypeScript source files
> Analysis Date: 2026-03-31 | Build: 2026-03-30T21:59:52Z

## Document Structure

This documentation is organized into 46 specialized directories, each containing complete analysis of a subsystem:

```
architecture/
├── README_EN.md                  ← This file (directory and navigation)
├── 01-系统总览/                   ← Source structure, layered architecture, module relationships
├── 02-启动与初始化/               ← main.tsx → init → REPL complete chain
├── 03-查询引擎/                   ← query.ts + QueryEngine.ts core loop
├── 04-API客户端/                  ← Multi-backend, streaming, retry, error classification
├── 05-工具系统/                   ← 40+ tool registration, orchestration, streaming execution
├── 06-权限与安全/                 ← 6 modes, classifier, sandbox, path validation
├── 07-上下文管理/                 ← Three-layer compression, token budget, cache control
├── 08-MCP集成/                    ← Configuration, transport, authentication, lazy loading
├── 09-Hooks系统/                  ← 13 event hooks + 70+ React Hooks
├── 10-Skills系统/                 ← 17 built-in skills, skill discovery, fork execution
├── 11-多智能体/                   ← Agent/Teammate/Remote/Dream
├── 12-UI渲染/                     ← Ink engine, component tree, design system
├── 13-配置体系/                   ← 5-level priority, hot reload, MDM
├── 14-状态管理/                   ← Bootstrap singleton + Zustand Store
├── 15-命令体系/                   ← 87+ Slash commands complete list
├── 16-记忆系统/                   ← memdir, auto-extraction, team memory
├── 17-错误恢复/                   ← 5-layer recovery, retention strategy, degradation
├── 18-遥测分析/                   ← OTel, Datadog, GrowthBook, Perfetto
├── 19-反馈与调查/                 ← Survey state machine, transcript sharing, probability gating
├── 20-服务层/                     ← 13 background services complete analysis
├── 21-插件系统/                   ← Discovery, installation, marketplace, policy
├── 22-OAuth与认证/                ← PKCE, keychain, token refresh
├── 23-LSP集成/                    ← JSON-RPC, multi-instance, extension routing
├── 24-沙箱系统/                   ← Configuration, execution, violation detection
├── 25-Git与GitHub/                ← Filesystem parsing, gitignore, gh CLI
├── 26-会话管理/                   ← History, recovery, export, sharing
├── 27-键绑定与输入/               ← 50+ actions, chords, context matching
├── 28-Vim模式/                    ← Complete state machine, motion/operator/textobj
├── 29-语音系统/                   ← Gating, authentication, integration
├── 30-远程会话/                   ← CCR WebSocket, permission bridging
├── 31-Bridge协议/                 ← 33 files, REST+WS, reliable transport
├── 32-Buddy系统/                  ← Companion pet, PRNG, sprite rendering
├── 33-协调器模式/                 ← Multi-Worker orchestration, task notification
├── 34-Swarm系统/                  ← tmux/iTerm2/in-process backend, permission sync
├── 35-Computer-Use/               ← macOS Enigo/Swift, locks, ESC hotkey
├── 36-DeepLink/                   ← Protocol registration, terminal launch, URL parsing
├── 37-Teleport/                   ← CCR session API, Git Bundle, environment
├── 38-输出样式/                   ← Markdown front matter, style loading
├── 39-原生模块/                   ← Color difference, file indexing, Yoga layout
├── 40-迁移系统/                   ← 11 configuration migrations
├── 41-文件持久化/                 ← BYOC file upload, mtime scanning
├── 42-代价追踪/                   ← Model usage, session cost, formatting
├── 43-Shell工具链/                ← Bash AST, PowerShell parsing, specs
├── 44-Screens组件/                ← REPL, Doctor, Resume
├── 45-类型系统/                   ← Message, permission, command, hook types
├── 46-完整数据流图/               ← End-to-end flow, call graph, sequence diagram
```

## Recommended Reading Order

1. **Quick Overview**: 01-System Overview → 46-Complete Data Flow
2. **Core Loop**: 02-Startup & Initialization → 03-Query Engine → 04-API Client → 05-Tool System
3. **Security Model**: 06-Permission & Security → 24-Sandbox System → 34-Swarm System (permission sync)
4. **Context Strategy**: 07-Context Management → 16-Memory System → 20-Service Layer (5 background extraction services)
5. **Extensibility**: 08-MCP Integration → 10-Skills System → 21-Plugin System → 09-Hooks System
6. **User Experience**: 12-UI Rendering → 27-Keybindings & Input → 19-Feedback & Survey → 42-Cost Tracking
7. **Multi-Agent**: 11-Multi-Agent → 33-Coordinator Mode → 34-Swarm System → 37-Teleport
8. **Remote Capabilities**: 30-Remote Session → 31-Bridge Protocol → 36-DeepLink → 41-File Persistence

## Scale Statistics

| Dimension | Count |
|-----------|-------|
| TypeScript source files | 1,884 |
| Top-level directories | 35 |
| Service modules | 13 |
| Built-in tools | 40+ |
| React Hooks | 70+ |
| Slash commands | 87+ |
| Built-in skills | 17 |
| Event hook types | 13 |
| Permission modes | 6 |
| API backends | 4 (Anthropic/Bedrock/Vertex/Foundry) |
| MCP transport protocols | 4 (stdio/SSE/HTTP/WebSocket) |
| Analytics events | 50+ |
| Configuration migrations | 11 |
| Bundled total lines | 16,667 lines / 13MB |
