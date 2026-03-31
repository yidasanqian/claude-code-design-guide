# Chapter 1: Introduction

> Claude Code is not just a code generation tool, but a complete Agent Runtime System.

---

## 1.1 What is Claude Code?

Claude Code is an AI-powered command-line development tool released by Anthropic. But calling it a "tool" is an understatement—it's actually a **production-grade Agent Runtime System**.

Unlike traditional code generation tools (like GitHub Copilot), Claude Code can:

- **Understand complex tasks**: Not just code completion, but understanding your intent and breaking down tasks
- **Autonomous execution**: Automatically call tools, read files, run commands, and iterate until task completion
- **Context awareness**: Understand project structure, code style, and historical context
- **Interactive collaboration**: Ask questions when encountering ambiguity, not blindly execute

In short, Claude Code is an **AI Agent that can write code, debug, refactor, and even understand your project architecture**.

---

## 1.2 Why Analyze Claude Code?

Because it represents the **current best practices for Agent system design**.

When we talk about "Agent systems," we're not talking about simple chatbots, but systems that can:

1. **Autonomous planning**: Break down complex tasks into executable steps
2. **Tool invocation**: Call external tools and APIs to accomplish tasks
3. **State management**: Maintain context and state across long interaction flows
4. **Error recovery**: Handle exceptions and retry when encountering failures
5. **Permission control**: Ensure safe execution of operations

Claude Code excels in all these areas. By analyzing its source code, we can learn:

- How to design a flexible and extensible **Tool System**
- How to implement efficient **Context Management** mechanisms
- How to build a robust **Permission Model**
- How to handle **State Transitions** in complex interaction flows
- How to integrate external services through **MCP (Model Context Protocol)**

---

## 1.3 Core Architecture Overview

Claude Code's architecture can be divided into several key layers:

![Claude Code Architecture](../diagrams/claude-code-architecture-en.svg)

### 1.3.1 Query Engine

The Query Engine is the brain of Claude Code, responsible for:
- Parsing user input
- Planning execution paths
- Coordinating tool calls
- Managing conversation flow

### 1.3.2 Tool System

The Tool System provides Claude with the ability to interact with the external world:
- File operations (Read, Write, Edit)
- Command execution (Bash)
- Code search (Glob, Grep)
- Web access (WebFetch, WebSearch)
- And more...

### 1.3.3 Permission Model

The Permission Model ensures safe execution:
- Tool call approval
- Dangerous operation warnings
- User confirmation mechanisms
- Permission level configuration

### 1.3.4 Context Management

Context Management handles the challenge of limited context windows:
- Automatic context compression
- Smart file loading
- Conversation history management
- Memory system

### 1.3.5 MCP Integration

MCP (Model Context Protocol) allows Claude Code to connect to external services:
- Database access
- API integration
- Custom tool extensions
- Third-party service connections

---

## 1.4 Design Philosophy

Claude Code's design embodies several important principles:

### 1.4.1 Unix Philosophy

- **Do one thing well**: Each tool has a single, clear responsibility
- **Composability**: Tools can be combined to accomplish complex tasks
- **Text streams**: Use text as the universal interface

### 1.4.2 Human-in-the-Loop

- **Transparency**: All operations are visible to users
- **Controllability**: Users can interrupt or modify execution at any time
- **Safety**: Dangerous operations require explicit confirmation

### 1.4.3 Context-Aware

- **Project understanding**: Automatically read CLAUDE.md and project structure
- **Code style awareness**: Learn and follow existing code patterns
- **Historical memory**: Remember previous conversations and decisions

---

## 1.5 Source Code Structure

The Claude Code source code (released March 2026) is organized as follows:

```
src/
├── agent/           # Agent core logic
│   ├── query-engine/    # Query engine implementation
│   ├── tools/           # Tool system
│   └── state/           # State management
├── mcp/             # MCP client implementation
├── context/         # Context management
├── permissions/     # Permission model
├── cli/             # Command-line interface
└── utils/           # Utility functions
```

Key modules:

- **query-engine**: Implements the core Agent loop, handling user input, tool calls, and response generation
- **tools**: Defines all available tools and their execution logic
- **permissions**: Implements the permission checking and approval mechanism
- **mcp**: MCP client for connecting to external services
- **context**: Context compression, file loading, and memory management

---

## 1.6 Who Should Read This Book?

This book is suitable for:

| Reader Type | What You'll Gain |
|------------|------------------|
| **Beginners** | Understand Agent system concepts, learn how to use Claude Code effectively |
| **Advanced Developers** | Master Agent system design patterns, learn to build similar systems |
| **Agent System Designers** | Learn production-grade architecture, permission models, and context engineering |

---

## 1.7 How to Use This Book

This book is divided into 9 parts:

1. **Getting Started** (Chapters 1-2): Quickly understand Claude Code
2. **Core Architecture** (Chapters 3-7): Deep dive into Query Engine, Tool System, Permission Model
3. **Context Engineering** (Chapters 8-10): Learn context management strategies
4. **State Management** (Chapters 11-13): Master state transitions and persistence
5. **MCP Integration** (Chapters 14-16): Understand MCP protocol and integration
6. **Advanced Features** (Chapters 17-19): Explore multi-agent, memory, scheduling
7. **Performance Optimization** (Chapters 20-21): Learn performance tuning techniques
8. **Best Practices** (Chapters 22-24): Master development workflows and deployment
9. **Ecosystem and Future** (Chapters 25-26): Understand ecosystem and trends

**Reading Suggestions**:

- **Beginners**: Read sequentially from Chapter 1, complete hands-on exercises
- **Experienced Developers**: Start from Chapter 3, focus on architecture and implementation
- **Specific Problem Solvers**: Jump to relevant chapters based on table of contents

---

## 1.8 Summary

Claude Code is not just a tool, but a complete Agent Runtime System. By analyzing its source code, we can learn:

- How to design production-grade Agent systems
- How to implement flexible tool systems and permission models
- How to handle context management challenges
- How to integrate external services through MCP

Next, let's start with a quick hands-on guide to experience Claude Code's capabilities.

---

*Next Chapter: [Quick Start](02-quickstart_en.md)*
