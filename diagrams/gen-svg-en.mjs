import { writeFileSync } from "fs";

// ── SVG builder ──────────────────────────────────────────────────────────────
function createSVG(width, height) {
  const els = [];

  // Proper vertical arrow (fixed direction)
  function arrowDown(x, y1, y2, opts = {}) {
    const stroke = opts.stroke ?? "#3b82f6";
    const sw = opts.strokeWidth ?? 2.5;
    const dash = opts.dashed ? `stroke-dasharray="6,4"` : "";
    // tiny horizontal wobble for hand-drawn feel, NO vertical wobble
    const cx = x + (Math.random() * 4 - 2);
    const cy = (y1 + y2) / 2;
    els.push(
      `<path d="M${x},${y1} Q${cx},${cy} ${x},${y2}"
       fill="none" stroke="${stroke}" stroke-width="${sw}" ${dash}
       marker-end="url(#arr-${stroke.replace("#","")})" />`
    );
  }

  // Diagonal arrow (for MCP fan-out etc.)
  function arrowDiag(x1, y1, x2, y2, opts = {}) {
    const stroke = opts.stroke ?? "#3b82f6";
    const sw = opts.strokeWidth ?? 2;
    const dash = opts.dashed ? `stroke-dasharray="6,4"` : "";
    els.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
       stroke="${stroke}" stroke-width="${sw}" ${dash}
       marker-end="url(#arr-${stroke.replace("#","")})" />`
    );
  }

  function rect(x, y, w, h, opts = {}) {
    const rx = opts.radius ?? 10;
    const fill = opts.fill ?? "none";
    const stroke = opts.stroke ?? "#1e1e1e";
    const sw = opts.strokeWidth ?? 2;
    const dash = opts.dashed ? `stroke-dasharray="7,4"` : "";
    els.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"
       fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${dash}/>`
    );
  }

  function text(x, y, content, opts = {}) {
    const color = opts.color ?? "#374151";
    const size = opts.size ?? 15;
    const anchor = opts.anchor ?? "middle";
    const weight = opts.weight ?? "normal";
    const lines = String(content).split("\n");
    const lh = size * 1.5;
    const startY = y - ((lines.length - 1) * lh) / 2;
    lines.forEach((line, i) => {
      els.push(
        `<text x="${x}" y="${startY + i * lh}"
         font-family="'Segoe UI',system-ui,sans-serif"
         font-size="${size}" font-weight="${weight}"
         fill="${color}" text-anchor="${anchor}"
         dominant-baseline="middle">${line}</text>`
      );
    });
  }

  // Collect all unique arrow colors for marker defs
  const markerColors = new Set(["3b82f6","059669","f59e0b","dc2626","9333ea","1e40af","374151","94a3b8"]);

  return {
    rect, text, arrowDown, arrowDiag,
    line(x1, y1, x2, y2, opts = {}) {
      const stroke = opts.stroke ?? "#94a3b8";
      const sw = opts.strokeWidth ?? 1.5;
      const dash = opts.dashed ? `stroke-dasharray="4,4"` : "";
      els.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" ${dash}/>`);
    },
    // shortcut: centred label between two y positions
    stepLabel(x, y, w, h, title, sub, opts = {}) {
      rect(x, y, w, h, opts);
      if (sub) {
        text(x + w/2, y + h/2 - 11, title, { color: opts.titleColor ?? opts.stroke ?? "#374151", size: opts.titleSize ?? 17, weight: "600" });
        text(x + w/2, y + h/2 + 14, sub, { color: "#374151", size: opts.subSize ?? 13 });
      } else {
        text(x + w/2, y + h/2, title, { color: opts.titleColor ?? opts.stroke ?? "#374151", size: opts.titleSize ?? 17, weight: "600" });
      }
    },
    save(path) {
      const markers = [...markerColors].map(c =>
        `<marker id="arr-${c}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0,10 3.5,0 7" fill="#${c}"/>
        </marker>`
      ).join("\n    ");

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    ${markers}
  </defs>
  <rect width="${width}" height="${height}" fill="white"/>
  ${els.join("\n  ")}
</svg>`;
      writeFileSync(path, svg);
      console.log(`✓ ${path.split("/").pop()}`);
    }
  };
}

const OUT = "/Users/liugang/study/ai/CC/claudecode/book/diagrams/";

// ── 1. Query Engine Flow ───────────────────────────────────────────────────────
{
  const g = createSVG(740, 770);
  const W = 520, X = 110, CX = 370;

  g.text(CX, 34, "Query Engine Execution Flow", { color: "#1e40af", size: 22, weight: "bold" });

  const steps = [
    { y: 60,  h: 60,  bg: "#a5d8ff", stroke: "#1e40af", title: "submitMessage( userInput )",         sub: "" },
    { y: 165, h: 75,  bg: "#fff3bf", stroke: "#92400e", title: "① Preprocess User Input",                   sub: "Parse slash commands · Handle attachments · Inject memory" },
    { y: 285, h: 75,  bg: "#c3fae8", stroke: "#065f46", title: "② Build Message List",                     sub: "History messages · New user message · System context" },
    { y: 405, h: 120, bg: "#dbe4ff", stroke: "#3730a3", title: "③ Call query() Core Loop",            sub: "Build system prompt → Call Claude API (streaming)\nParse response → Execute tool calls → Loop until complete", dashed: true },
    { y: 575, h: 75,  bg: "#d0bfff", stroke: "#6b21a8", title: "④ Post-processing",                          sub: "Log tokens · Save session · Trigger hooks · Check compaction" },
    { y: 695, h: 60,  bg: "#b2f2bb", stroke: "#14532d", title: "⑤ Yield results to caller (streaming)",       sub: "" },
  ];

  steps.forEach((s, i) => {
    g.rect(X, s.y, W, s.h, { fill: s.bg, stroke: s.stroke, strokeWidth: 2.5, dashed: s.dashed });
    if (s.sub) {
      const subLines = s.sub.split("\n");
      g.text(CX, s.y + s.h/2 - (subLines.length > 1 ? 18 : 11), s.title, { color: s.stroke, size: 17, weight: "600" });
      subLines.forEach((line, li) => {
        g.text(CX, s.y + s.h/2 + (subLines.length > 1 ? li * 18 : 0) + 14, line, { color: "#374151", size: 13 });
      });
    } else {
      g.text(CX, s.y + s.h/2, s.title, { color: s.stroke, size: 17, weight: "600" });
    }
    if (i < steps.length - 1) {
      const y1 = s.y + s.h + 2;
      const y2 = steps[i+1].y - 2;
      g.arrowDown(CX, y1, y2, { stroke: "#3b82f6" });
    }
  });

  g.save(OUT + "query-engine-flow-en.svg");
}

// ── 2. Tool System Hierarchy ──────────────────────────────────────────────────
{
  const g = createSVG(900, 570);
  g.text(450, 34, "Tool System Three-Layer Architecture", { color: "#1e40af", size: 22, weight: "bold" });

  // Layer 3
  g.rect(50, 62, 800, 115, { fill: "#dbe4ff", stroke: "#3730a3", dashed: true, radius: 12 });
  g.text(135, 79, "Layer 3: High-Level Operations (Tools calling tools)", { color: "#3730a3", size: 14, anchor: "start" });
  g.rect(90, 92, 270, 70, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8, strokeWidth: 2 });
  g.text(225, 127, "AgentTool\nLaunch sub-agents (isolated toolset)", { color: "#1e40af", size: 15 });
  g.rect(540, 92, 260, 70, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8, strokeWidth: 2 });
  g.text(670, 127, "SkillTool\nExecute predefined tool chains", { color: "#1e40af", size: 15 });

  g.arrowDown(450, 178, 220, { stroke: "#f59e0b" });
  g.text(510, 200, "Claude orchestrates", { color: "#f59e0b", size: 13 });

  // Layer 2
  g.rect(50, 225, 800, 115, { fill: "#d3f9d8", stroke: "#065f46", dashed: true, radius: 12 });
  g.text(130, 242, "Layer 2: Composite Operations (Claude orchestrates atomic ops)", { color: "#065f46", size: 14, anchor: "start" });
  g.rect(70, 258, 350, 68, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(245, 292, "Find all TODOs and organize\n= GlobTool + FileReadTool + GrepTool", { color: "#374151", size: 13 });
  g.rect(480, 258, 350, 68, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(655, 292, "Refactor function name\n= GrepTool + FileEditTool×N + BashTool", { color: "#374151", size: 13 });

  g.arrowDown(450, 342, 388, { stroke: "#f59e0b" });
  g.text(510, 365, "Atomic composition", { color: "#f59e0b", size: 13 });

  // Layer 1
  g.rect(50, 392, 800, 128, { fill: "#e5dbff", stroke: "#6b21a8", dashed: true, radius: 12 });
  g.text(115, 409, "Layer 1: Atomic Operations (indivisible)", { color: "#6b21a8", size: 14, anchor: "start" });
  const atoms = [
    { x: 68,  label: "FileReadTool\nRead a file" },
    { x: 258, label: "FileEditTool\nEdit content" },
    { x: 448, label: "GrepTool\nSearch pattern" },
    { x: 638, label: "BashTool\nRun command" },
  ];
  atoms.forEach(a => {
    g.rect(a.x, 428, 170, 70, { fill: "#d0bfff", stroke: "#9333ea", radius: 8, strokeWidth: 2 });
    g.text(a.x + 85, 463, a.label, { color: "#374151", size: 14 });
  });

  g.save(OUT + "tool-system-hierarchy-en.svg");
}

// ── 3. Permission Model Layers ────────────────────────────────────────────────
{
  const g = createSVG(900, 650);
  g.text(450, 34, "Five-Layer Permission Architecture", { color: "#1e40af", size: 22, weight: "bold" });

  const layers = [
    { y: 62,  w: 820, x: 40,  bg: "#a5d8ff", stroke: "#1e40af", title: "Layer 1: Session Mode",     desc: "default / acceptEdits / bypassPermissions / plan  —  Sets overall permission baseline" },
    { y: 170, w: 740, x: 80,  bg: "#b2f2bb", stroke: "#059669", title: "Layer 2: Tool Whitelist / Blacklist",          desc: "allowedTools: [FileReadTool...]   deniedTools: [BashTool...]  —  Determines which tools are available" },
    { y: 278, w: 660, x: 120, bg: "#d0bfff", stroke: "#9333ea", title: "Layer 3: Tool-Level Permissions",                   desc: "FileReadTool → auto-allow    FileEditTool → ask    BashTool → ask" },
    { y: 386, w: 580, x: 160, bg: "#ffd8a8", stroke: "#d97706", title: "Layer 4: Operation-Level Permissions",                   desc: "\"ls\" → low risk    \"rm -rf\" → high risk requires confirmation  —  Different ops within same tool" },
    { y: 494, w: 500, x: 200, bg: "#ffc9c9", stroke: "#dc2626", title: "Layer 5: Path / Command-Level Permissions",            desc: "allowedWritePaths   deniedWritePaths   allowedBashCommands  —  Finest granularity" },
  ];

  layers.forEach((l, i) => {
    g.rect(l.x, l.y, l.w, 88, { fill: l.bg, stroke: l.stroke, strokeWidth: 2.5, radius: 10 });
    g.text(450, l.y + 28, l.title, { color: l.stroke, size: 17, weight: "600" });
    g.text(450, l.y + 60, l.desc, { color: "#374151", size: 13 });
    if (i < layers.length - 1) {
      g.arrowDown(450, l.y + 90, l.y + 103, { stroke: "#3b82f6" });
    }
  });

  g.text(450, 614, "Security is default, convenience is optional, control is in user's hands", { color: "#6b7280", size: 15 });
  g.save(OUT + "permission-model-layers-en.svg");
}

// ── 4. MCP Architecture ───────────────────────────────────────────────────────
{
  const g = createSVG(1000, 490);
  g.text(500, 34, "MCP Architecture: The Internet of AI Tools", { color: "#1e40af", size: 22, weight: "bold" });

  g.rect(230, 62, 540, 145, { fill: "#dbe4ff", stroke: "#1e40af", radius: 12, strokeWidth: 2 });
  g.text(500, 82, "Claude Code (MCP Client)", { color: "#1e40af", size: 17, weight: "600" });
  g.rect(268, 97, 464, 80, { fill: "#a5d8ff", stroke: "#3b82f6", radius: 8, strokeWidth: 2 });
  g.text(500, 137, "MCP Client Layer  src/services/mcp/\nConnection mgmt · Tool registration · Resource access · Auth handling", { color: "#1e40af", size: 14 });

  g.text(500, 228, "MCP Protocol (JSON-RPC over stdio / HTTP)", { color: "#6b7280", size: 13 });

  const servers = [
    { x: 40,  name: "Database MCP Server" },
    { x: 275, name: "GitHub MCP Server" },
    { x: 510, name: "Slack MCP Server" },
    { x: 745, name: "Custom MCP Server" },
  ];
  const srcY = 210, dstY = 275;
  servers.forEach(s => {
    const cx = s.x + 175/2;
    g.arrowDiag(500, srcY, cx, dstY, { stroke: "#3b82f6", dashed: true });
    g.rect(s.x, 280, 175, 130, { fill: "#c3fae8", stroke: "#059669", radius: 10, strokeWidth: 2 });
    g.text(cx, 322, s.name, { color: "#065f46", size: 14, weight: "600" });
    g.text(cx, 368, "Tools · Resources\nPrompts", { color: "#374151", size: 13 });
  });

  g.text(500, 446, "MCP is to AI tools what HTTP is to web pages — open protocol for tool interoperability", { color: "#6b7280", size: 14 });
  g.save(OUT + "mcp-architecture-en.svg");
}

// ── 5. Multi-Agent Modes ──────────────────────────────────────────────────────
{
  const g = createSVG(900, 560);
  g.text(450, 34, "Multi-Agent Architecture: Three Modes", { color: "#1e40af", size: 22, weight: "bold" });

  const modes = [
    { x: 30,  color: "#3730a3", bg: "#dbe4ff", title: "Mode 1: Sub-Agent",       parent: "Parent Agent",              child: "Sub-Agent (isolated context)", note: "Blocks for result",      childBg: "#d0bfff", childStroke: "#9333ea" },
    { x: 320, color: "#065f46", bg: "#d3f9d8", title: "Mode 2: Background Agent",     parent: "Parent Agent (continues)",   child: "Sub-Agent (runs in background)",   note: "Notifies parent when done",  childBg: "#b2f2bb", childStroke: "#059669" },
    { x: 610, color: "#92400e", bg: "#fff3bf", title: "Mode 3: Worktree Isolation", parent: "Parent Agent (main branch)", child: "Sub-Agent (isolated worktree)", note: "Isolated branch, optional merge", childBg: "#ffd8a8", childStroke: "#d97706" },
  ];

  modes.forEach(m => {
    g.rect(m.x, 62, 255, 215, { fill: m.bg, stroke: m.color, dashed: true, radius: 12 });
    g.text(m.x + 127, 82, m.title, { color: m.color, size: 15, weight: "600" });
    g.rect(m.x + 18, 98, 220, 52, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8 });
    g.text(m.x + 128, 124, m.parent, { color: "#1e40af", size: 14 });
    g.arrowDown(m.x + 128, 151, 178, { stroke: m.color });
    g.rect(m.x + 18, 183, 220, 52, { fill: m.childBg, stroke: m.childStroke, radius: 8 });
    g.text(m.x + 128, 209, m.child, { color: m.color, size: 13 });
    g.text(m.x + 128, 252, m.note, { color: "#6b7280", size: 13 });
  });

  // Context isolation section
  g.rect(40, 305, 820, 215, { fill: "#f8fafc", stroke: "#94a3b8", radius: 12 });
  g.text(450, 330, "Sub-Agent Context Isolation", { color: "#1e40af", size: 17, weight: "600" });

  g.rect(58, 350, 360, 150, { fill: "#a5d8ff", stroke: "#3b82f6", radius: 8, strokeWidth: 2 });
  g.text(238, 373, "Parent Agent messages[]", { color: "#1e40af", size: 14, weight: "600" });
  g.text(238, 415, "user: Build login + tests\nassistant: Planning approach...\ntool_result: project structure\nsummary: 3 tests written ✓", { color: "#374151", size: 13 });

  g.rect(482, 350, 360, 150, { fill: "#f1f5f9", stroke: "#94a3b8", radius: 8, strokeWidth: 2 });
  g.text(662, 373, "Sub-Agent messages[] (fresh)", { color: "#6b7280", size: 14, weight: "600" });
  g.text(662, 415, "task: Write unit tests for auth\ntool_use: read auth.ts\ntool_use: write test.ts\n→ context discarded after", { color: "#94a3b8", size: 13 });

  g.text(450, 515, "Parent agent only receives summary, doesn't inherit sub-agent's context bloat", { color: "#059669", size: 14 });
  g.save(OUT + "multi-agent-modes-en.svg");
}

// ── 6. State Management (Two-Layer State) ────────────────────────────────────────────
{
  const g = createSVG(800, 500);
  g.text(400, 34, "Two-Layer State Architecture", { color: "#1e40af", size: 22, weight: "bold" });

  // Bootstrap State
  g.rect(60, 62, 680, 155, { fill: "#dbe4ff", stroke: "#1e40af", radius: 12, strokeWidth: 2.5 });
  g.text(400, 84, "Bootstrap State (Global Singleton)  src/bootstrap/state.ts", { color: "#1e40af", size: 16, weight: "600" });
  g.rect(90, 102, 620, 100, { fill: "#a5d8ff", stroke: "#3b82f6", radius: 8, strokeWidth: 2 });
  g.text(400, 140, "sessionId · projectRoot · cwd · totalCostUSD · modelUsage", { color: "#374151", size: 14 });
  g.text(400, 163, "OpenTelemetry providers · Registered hooks", { color: "#374151", size: 14 });
  g.text(650, 108, "Process-level · Cross-session", { color: "#3730a3", size: 12 });

  g.arrowDown(400, 218, 268, { stroke: "#3b82f6" });
  g.text(470, 244, "Read by AppState", { color: "#6b7280", size: 13 });

  // AppState
  g.rect(60, 272, 680, 155, { fill: "#d3f9d8", stroke: "#059669", radius: 12, strokeWidth: 2.5 });
  g.text(400, 294, "AppState (React State Tree)  src/state/AppStateStore.ts", { color: "#065f46", size: 16, weight: "600" });
  g.rect(90, 312, 620, 100, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(400, 350, "messages[] · toolExecutionState · tasks · permissionDialogs", { color: "#374151", size: 14 });
  g.text(400, 373, "fileHistory · UI state (permission dialogs, progress, etc.)", { color: "#374151", size: 14 });
  g.text(648, 318, "Session-level · Reactive updates", { color: "#065f46", size: 12 });

  g.arrowDown(400, 428, 460, { stroke: "#059669" });
  g.text(400, 480, "UI Rendering (Ink / React)", { color: "#6b7280", size: 14 });

  g.save(OUT + "state-management-en.svg");
}

// ── 7. System Prompt Construction ────────────────────────────────────────────
{
  const g = createSVG(740, 600);
  g.text(370, 34, "System Prompt Construction Flow", { color: "#1e40af", size: 22, weight: "bold" });

  const steps = [
    { bg: "#a5d8ff", stroke: "#1e40af", title: "1. Core Instructions (Fixed)",     desc: "Role definition · Behavior rules · Safety guidelines" },
    { bg: "#b2f2bb", stroke: "#059669", title: "2. Tool Definitions (Dynamic)",     desc: "Based on available tools: name / description / schema" },
    { bg: "#fff3bf", stroke: "#92400e", title: "3. User Context (CLAUDE.md)",  desc: "Project description · Code standards · Workflow" },
    { bg: "#c3fae8", stroke: "#065f46", title: "4. System Context (Dynamic)",       desc: "Git status · Current directory · Environment info" },
    { bg: "#d0bfff", stroke: "#6b21a8", title: "5. Custom System Prompt (Optional)",   desc: "User-provided via --system-prompt flag" },
  ];

  let y = 62;
  const H = 76, GAP = 16, W = 560, X = 90;
  steps.forEach((s, i) => {
    g.rect(X, y, W, H, { fill: s.bg, stroke: s.stroke, strokeWidth: 2.5 });
    g.text(370, y + H/2 - 11, s.title, { color: s.stroke, size: 16, weight: "600" });
    g.text(370, y + H/2 + 14, s.desc, { color: "#374151", size: 13 });
    if (i < steps.length - 1) {
      g.arrowDown(370, y + H + 2, y + H + GAP - 2, { stroke: "#3b82f6" });
    }
    y += H + GAP;
  });

  // Result
  g.arrowDown(370, y, y + 28, { stroke: "#3b82f6" });
  y += 32;
  g.rect(150, y, 440, 60, { fill: "#ffc9c9", stroke: "#dc2626", strokeWidth: 2.5, radius: 10 });
  g.text(370, y + 30, "Complete System Prompt → Send to Claude API", { color: "#dc2626", size: 16, weight: "600" });

  g.save(OUT + "system-prompt-construction-en.svg");
}

// ── 8. Auto-Compact Flow ──────────────────────────────────────────────────────
{
  const g = createSVG(840, 520);
  g.text(420, 34, "Auto-Compact Compression Flow", { color: "#1e40af", size: 22, weight: "bold" });

  // Full history
  g.rect(40, 62, 380, 140, { fill: "#ffc9c9", stroke: "#dc2626", radius: 10, strokeWidth: 2 });
  g.text(230, 82, "Original Message List (255K tokens)", { color: "#dc2626", size: 14, weight: "600" });
  g.text(230, 118, "System prompt + 50 conversation turns +\nLarge tool call results", { color: "#374151", size: 13 });
  g.text(230, 165, "▲ Exceeds 85% threshold, triggers compaction", { color: "#dc2626", size: 13 });

  g.arrowDown(230, 204, 244, { stroke: "#d97706" });

  // Split
  g.rect(40, 248, 170, 80, { fill: "#ffd8a8", stroke: "#d97706", radius: 8, strokeWidth: 2 });
  g.text(125, 288, "To be compressed\n(200K tokens)", { color: "#92400e", size: 13 });
  g.rect(250, 248, 170, 80, { fill: "#c3fae8", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(335, 288, "Keep recent\n(last 10 messages)", { color: "#065f46", size: 13 });

  g.arrowDown(125, 330, 370, { stroke: "#d97706" });

  g.rect(40, 374, 170, 60, { fill: "#d0bfff", stroke: "#9333ea", radius: 8, strokeWidth: 2 });
  g.text(125, 404, "Claude generates summary\n(10K tokens)", { color: "#6b21a8", size: 13 });

  // Merge arrow
  g.arrowDiag(125, 436, 340, 460, { stroke: "#3b82f6" });
  g.arrowDiag(335, 330, 380, 460, { stroke: "#3b82f6" });

  // Result
  g.rect(280, 460, 340, 46, { fill: "#b2f2bb", stroke: "#059669", strokeWidth: 2.5, radius: 10 });
  g.text(450, 483, "Compressed Message List (60K tokens) ✓", { color: "#065f46", size: 14, weight: "600" });

  // Token threshold note
  g.rect(470, 62, 340, 120, { fill: "#f8fafc", stroke: "#94a3b8", radius: 10, strokeWidth: 1.5 });
  g.text(640, 90, "Trigger Thresholds", { color: "#374151", size: 15, weight: "600" });
  g.text(640, 122, "85% → Show warning", { color: "#d97706", size: 14 });
  g.text(640, 148, "95% → Force compaction", { color: "#dc2626", size: 14 });

  g.save(OUT + "auto-compact-flow-en.svg");
}

// ── 9. Coordinator Pattern ────────────────────────────────────────────────────
{
  const g = createSVG(860, 480);
  g.text(430, 34, "Coordinator Pattern", { color: "#1e40af", size: 22, weight: "bold" });

  // Coordinator
  g.rect(280, 62, 300, 70, { fill: "#a5d8ff", stroke: "#1e40af", radius: 10, strokeWidth: 2.5 });
  g.text(430, 97, "Coordinator Agent\nAnalyze · Decompose · Delegate · Aggregate", { color: "#1e40af", size: 15 });

  // Fan out arrows
  const agents = [
    { x: 40,  label: "Explore Agent\nRead-only, code exploration",     bg: "#c3fae8", stroke: "#059669" },
    { x: 235, label: "Plan Agent\nGenerate plan only",            bg: "#fff3bf", stroke: "#92400e" },
    { x: 430, label: "general-purpose\nWrite permissions",      bg: "#d0bfff", stroke: "#9333ea" },
    { x: 625, label: "general-purpose\nParallel / sequential",  bg: "#d0bfff", stroke: "#9333ea" },
  ];
  agents.forEach(a => {
    const cx = a.x + 160/2;
    g.arrowDiag(430, 133, cx, 198, { stroke: "#3b82f6" });
    g.rect(a.x, 202, 160, 80, { fill: a.bg, stroke: a.stroke, radius: 8, strokeWidth: 2 });
    g.text(cx, 242, a.label, { color: a.stroke, size: 13 });
  });

  // Return arrows
  agents.forEach(a => {
    const cx = a.x + 160/2;
    g.arrowDiag(cx, 284, 430, 348, { stroke: "#059669" });
  });

  // Summary return
  g.rect(280, 352, 300, 60, { fill: "#b2f2bb", stroke: "#059669", radius: 10, strokeWidth: 2 });
  g.text(430, 382, "Aggregate results → Return to main agent", { color: "#065f46", size: 15, weight: "600" });

  // Benefits
  g.rect(40, 432, 780, 38, { fill: "#f8fafc", stroke: "#94a3b8", radius: 8 });
  g.text(430, 451, "Benefits: Task parallelism · Context isolation · Specialized division · Break single-agent context limits", { color: "#374151", size: 13 });

  g.save(OUT + "coordinator-pattern-en.svg");
}

// ── 10. Context Engineering Overview ─────────────────────────────────────────
{
  const g = createSVG(860, 460);
  g.text(430, 34, "Context Engineering: Context Composition", { color: "#1e40af", size: 22, weight: "bold" });

  // System prompt box
  g.rect(40, 62, 370, 200, { fill: "#dbe4ff", stroke: "#1e40af", radius: 12, strokeWidth: 2 });
  g.text(225, 84, "System Prompt", { color: "#1e40af", size: 15, weight: "600" });
  const spItems = [
    { y: 112, label: "Core instructions", bg: "#a5d8ff", s: "#1e40af" },
    { y: 148, label: "Tool definitions (43 tools)", bg: "#a5d8ff", s: "#1e40af" },
    { y: 184, label: "User context (CLAUDE.md)", bg: "#c3fae8", s: "#059669" },
    { y: 220, label: "System context (git status)", bg: "#c3fae8", s: "#059669" },
  ];
  spItems.forEach(item => {
    g.rect(58, item.y, 334, 28, { fill: item.bg, stroke: item.s, radius: 6, strokeWidth: 1.5 });
    g.text(225, item.y + 14, item.label, { color: item.s, size: 13 });
  });

  // Messages box
  g.rect(450, 62, 370, 200, { fill: "#d3f9d8", stroke: "#059669", radius: 12, strokeWidth: 2 });
  g.text(635, 84, "Conversation History (Messages)", { color: "#065f46", size: 15, weight: "600" });
  const msgItems = [
    { y: 112, label: "User messages", bg: "#b2f2bb", s: "#059669" },
    { y: 148, label: "Assistant responses (with tool calls)", bg: "#b2f2bb", s: "#059669" },
    { y: 184, label: "Tool execution results", bg: "#b2f2bb", s: "#059669" },
    { y: 220, label: "Memory attachments", bg: "#c3fae8", s: "#065f46" },
  ];
  msgItems.forEach(item => {
    g.rect(468, item.y, 334, 28, { fill: item.bg, stroke: item.s, radius: 6, strokeWidth: 1.5 });
    g.text(635, item.y + 14, item.label, { color: item.s, size: 13 });
  });

  // Token budget bar
  g.rect(40, 285, 780, 60, { fill: "#f8fafc", stroke: "#94a3b8", radius: 10 });
  g.text(430, 305, "Token Budget Allocation (200K context window)", { color: "#374151", size: 14, weight: "600" });
  // mini bar segments
  const segs = [
    { w: 90,  x: 55,  fill: "#a5d8ff", label: "System\n5K" },
    { w: 200, x: 148, fill: "#b2f2bb", label: "Conversation\n~150K" },
    { w: 120, x: 352, fill: "#ffd8a8", label: "Tool results\n~40K" },
    { w: 80,  x: 476, fill: "#d0bfff", label: "Output\n~40K" },
    { w: 270, x: 560, fill: "#f1f5f9", label: "Remaining\nbuffer" },
  ];
  segs.forEach(s => {
    g.rect(s.x, 316, s.w, 20, { fill: s.fill, stroke: "#94a3b8", radius: 3, strokeWidth: 1 });
    g.text(s.x + s.w/2, 327, s.label.split("\n")[0], { color: "#374151", size: 10 });
  });

  g.text(430, 380, "Context Engineering core: Fit the most relevant information in limited window", { color: "#374151", size: 14 });

  // Auto-compact note
  g.rect(40, 400, 780, 46, { fill: "#fff3bf", stroke: "#d97706", radius: 8, strokeWidth: 1.5 });
  g.text(430, 423, "Exceeds 85% → Trigger Auto-Compact: Replace early messages with summary, preserve key context", { color: "#92400e", size: 13 });

  g.save(OUT + "context-engineering-en.svg");
}

// ── 11. Agent Loop ────────────────────────────────────────────────────────────
{
  const g = createSVG(740, 560);
  const CX = 370, W = 500, X = 120;
  g.text(CX, 34, "Claude Code Agent Loop", { color: "#1e40af", size: 22, weight: "bold" });

  // User input
  g.rect(X, 60, W, 58, { fill: "#a5d8ff", stroke: "#1e40af", radius: 10, strokeWidth: 2.5 });
  g.text(CX, 89, "User Input", { color: "#1e40af", size: 18, weight: "600" });
  g.arrowDown(CX, 119, 149, { stroke: "#3b82f6" });

  // Build message list
  g.rect(X, 153, W, 58, { fill: "#fff3bf", stroke: "#92400e", radius: 10, strokeWidth: 2 });
  g.text(CX, 182, "Build Message List (with history)", { color: "#92400e", size: 16, weight: "600" });
  g.arrowDown(CX, 212, 242, { stroke: "#3b82f6" });

  // Call Claude API
  g.rect(X, 246, W, 58, { fill: "#c3fae8", stroke: "#059669", radius: 10, strokeWidth: 2 });
  g.text(CX, 275, "Call Claude API (streaming)", { color: "#059669", size: 16, weight: "600" });
  g.arrowDown(CX, 305, 335, { stroke: "#3b82f6" });

  // Parse response
  g.rect(X, 339, W, 84, { fill: "#dbe4ff", stroke: "#3730a3", radius: 10, strokeWidth: 2 });
  g.text(CX, 364, "Parse Response", { color: "#3730a3", size: 16, weight: "600" });
  g.text(CX, 388, "Text blocks → stream display  ·  Thinking blocks → internal  ·  Tool calls → execute", { color: "#374151", size: 12 });
  g.arrowDown(CX, 424, 454, { stroke: "#3b82f6" });

  // Tool results → messages
  g.rect(X, 458, W, 55, { fill: "#d0bfff", stroke: "#9333ea", radius: 10, strokeWidth: 2 });
  g.text(CX, 485, "Tool results appended to message list", { color: "#6b21a8", size: 15, weight: "600" });

  // Loop back arrow (right side)
  g.arrowDiag(CX + W/2 + 2, 486, CX + W/2 + 60, 420, { stroke: "#dc2626" });
  g.arrowDiag(CX + W/2 + 60, 420, CX + W/2 + 60, 275, { stroke: "#dc2626" });
  g.arrowDiag(CX + W/2 + 60, 275, CX + W/2 + 2, 275, { stroke: "#dc2626" });
  g.text(CX + W/2 + 80, 350, "Continue?", { color: "#dc2626", size: 13, anchor: "start" });

  // End note
  g.text(X + 20, 533, "← No tool calls / Turn limit reached → Return final result", { color: "#6b7280", size: 13, anchor: "start" });

  g.save(OUT + "agent-loop-en.svg");
}

// ── 12. Permission Decision Tree ──────────────────────────────────────────────
{
  const g = createSVG(840, 500);
  g.text(420, 34, "Permission Check Decision Tree", { color: "#1e40af", size: 22, weight: "bold" });

  // Entry
  g.rect(295, 62, 250, 52, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8, strokeWidth: 2.5 });
  g.text(420, 88, "canUseTool( toolName, input )", { color: "#1e40af", size: 14, weight: "600" });
  g.arrowDown(420, 115, 148, { stroke: "#3b82f6" });

  // Decision 1: bypassPermissions
  g.rect(245, 152, 350, 48, { fill: "#fff3bf", stroke: "#d97706", radius: 8, strokeWidth: 2 });
  g.text(420, 176, "bypassPermissions mode?", { color: "#92400e", size: 14 });
  // Yes → allow
  g.arrowDiag(595, 176, 690, 176, { stroke: "#059669" });
  g.rect(695, 152, 80, 48, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(735, 176, "allow", { color: "#059669", size: 14, weight: "600" });
  g.text(640, 162, "Yes", { color: "#059669", size: 13 });
  // No → down
  g.arrowDown(420, 200, 238, { stroke: "#3b82f6" });
  g.text(438, 218, "No", { color: "#6b7280", size: 13 });

  // Decision 2: whitelist
  g.rect(245, 242, 350, 48, { fill: "#dbe4ff", stroke: "#3730a3", radius: 8, strokeWidth: 2 });
  g.text(420, 266, "Tool in whitelist?", { color: "#3730a3", size: 14 });
  g.arrowDiag(595, 266, 690, 266, { stroke: "#059669" });
  g.rect(695, 242, 80, 48, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(735, 266, "allow", { color: "#059669", size: 14, weight: "600" });
  g.text(640, 252, "Yes", { color: "#059669", size: 13 });
  g.arrowDown(420, 290, 328, { stroke: "#3b82f6" });
  g.text(438, 308, "No", { color: "#6b7280", size: 13 });

  // Decision 3: blacklist
  g.rect(245, 332, 350, 48, { fill: "#ffc9c9", stroke: "#dc2626", radius: 8, strokeWidth: 2 });
  g.text(420, 356, "Tool in blacklist?", { color: "#dc2626", size: 14 });
  g.arrowDiag(595, 356, 690, 356, { stroke: "#dc2626" });
  g.rect(695, 332, 80, 48, { fill: "#ffc9c9", stroke: "#dc2626", radius: 8, strokeWidth: 2 });
  g.text(735, 356, "deny", { color: "#dc2626", size: 14, weight: "600" });
  g.text(640, 342, "Yes", { color: "#dc2626", size: 13 });
  g.arrowDown(420, 380, 418, { stroke: "#3b82f6" });
  g.text(438, 398, "No", { color: "#6b7280", size: 13 });

  // Decision 4: ask user
  g.rect(245, 422, 350, 48, { fill: "#e5dbff", stroke: "#9333ea", radius: 8, strokeWidth: 2 });
  g.text(420, 446, "Default: Ask user", { color: "#6b21a8", size: 14, weight: "600" });

  // Footnote
  g.text(420, 490, "BashTool analyzes command safety  ·  FileEditTool checks path permissions", { color: "#6b7280", size: 12 });

  g.save(OUT + "permission-decision-tree-en.svg");
}

// ── 13. Query Loop (query() execution loop) ───────────────────────────────────
{
  const g = createSVG(800, 580);
  const CX = 400, W = 460, X = 170;
  g.text(CX, 34, "query() Execution Loop", { color: "#1e40af", size: 22, weight: "bold" });

  // Turn counter
  g.rect(X, 62, W, 52, { fill: "#fff3bf", stroke: "#d97706", radius: 8, strokeWidth: 2 });
  g.text(CX, 88, "turnCount++  ·  Check turn limit", { color: "#92400e", size: 15, weight: "600" });
  g.arrowDown(CX, 115, 148, { stroke: "#3b82f6" });

  // Call API
  g.rect(X, 152, W, 80, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8, strokeWidth: 2 });
  g.text(CX, 177, "Call Claude API (streaming)", { color: "#1e40af", size: 15, weight: "600" });
  g.text(CX, 200, "messages  ·  systemPrompt  ·  tools", { color: "#374151", size: 13 });
  g.arrowDown(CX, 233, 268, { stroke: "#3b82f6" });

  // Parse response
  g.rect(X, 272, W, 80, { fill: "#c3fae8", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(CX, 295, "Parse Streaming Response", { color: "#065f46", size: 15, weight: "600" });
  g.text(CX, 318, "text → yield to user  ·  thinking → internal  ·  tool_use → collect", { color: "#374151", size: 12 });
  g.arrowDown(CX, 353, 388, { stroke: "#3b82f6" });

  // Tool calls?
  g.rect(X, 392, W, 48, { fill: "#dbe4ff", stroke: "#3730a3", radius: 8, strokeWidth: 2 });
  g.text(CX, 416, "Has tool calls?", { color: "#3730a3", size: 15, weight: "600" });
  // No → end
  g.arrowDiag(CX + W/2, 416, CX + W/2 + 80, 416, { stroke: "#dc2626" });
  g.text(CX + W/2 + 50, 406, "No→End", { color: "#dc2626", size: 12 });
  // Yes → down
  g.arrowDown(CX, 440, 480, { stroke: "#3b82f6" });
  g.text(CX + 12, 460, "Yes", { color: "#059669", size: 13 });

  // Run tools
  g.rect(X, 484, W, 52, { fill: "#d0bfff", stroke: "#9333ea", radius: 8, strokeWidth: 2 });
  g.text(CX, 510, "Execute tool calls in parallel  ·  Append results to messages", { color: "#6b21a8", size: 14, weight: "600" });

  // Loop back arrow
  g.arrowDiag(X - 2, 510, X - 60, 510, { stroke: "#d97706" });
  g.arrowDiag(X - 60, 510, X - 60, 88, { stroke: "#d97706" });
  g.arrowDiag(X - 60, 88, X, 88, { stroke: "#d97706" });
  g.text(X - 90, 300, "Loop", { color: "#d97706", size: 13, anchor: "middle" });

  // Token budget note
  g.rect(X, 550, W, 22, { fill: "#f8fafc", stroke: "#94a3b8", radius: 5, strokeWidth: 1 });
  g.text(CX, 561, "Token budget exceeded → End loop", { color: "#6b7280", size: 12 });

  g.save(OUT + "query-loop-en.svg");
}

// ── 14. MCP Auth Flow ────────────────────────────────────────────────────────
{
  const g = createSVG(780, 480);
  g.text(390, 34, "MCP Authentication Flow", { color: "#1e40af", size: 22, weight: "bold" });

  // Column headers
  g.text(200, 68, "Claude Code", { color: "#1e40af", size: 16, weight: "600" });
  g.text(580, 68, "MCP Server", { color: "#059669", size: 16, weight: "600" });

  // Vertical lifelines
  g.line(200, 82, 200, 450, { dashed: true });
  g.line(580, 82, 580, 450, { dashed: true });

  // Step 1: call tool →
  g.rect(60, 95, 270, 42, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8, strokeWidth: 2 });
  g.text(195, 116, "① Call tool", { color: "#1e40af", size: 14, weight: "600" });
  g.arrowDiag(332, 116, 540, 116, { stroke: "#1e40af" });

  // Step 2: -32042 error ←
  g.rect(450, 155, 270, 50, { fill: "#ffc9c9", stroke: "#dc2626", radius: 8, strokeWidth: 2 });
  g.text(585, 175, "② Return -32042 error (auth required)", { color: "#dc2626", size: 13, weight: "600" });
  g.arrowDiag(448, 180, 270, 180, { stroke: "#dc2626" });

  // Step 3: show URL to user
  g.rect(60, 220, 270, 42, { fill: "#fff3bf", stroke: "#d97706", radius: 8, strokeWidth: 2 });
  g.text(195, 241, "③ Show auth_url to user", { color: "#92400e", size: 13, weight: "600" });

  // Step 4: user completes OAuth in browser
  g.rect(60, 280, 270, 50, { fill: "#d0bfff", stroke: "#9333ea", radius: 8, strokeWidth: 2 });
  g.text(195, 300, "④ User completes OAuth in browser", { color: "#6b21a8", size: 13, weight: "600" });
  g.text(195, 318, "Save token locally", { color: "#6b21a8", size: 12 });

  // Step 5: retry with token →
  g.rect(60, 348, 270, 42, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(195, 369, "⑤ Retry tool call (with token)", { color: "#065f46", size: 13, weight: "600" });
  g.arrowDiag(332, 369, 540, 369, { stroke: "#059669" });

  // Step 6: result ←
  g.rect(450, 408, 270, 40, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(585, 428, "⑥ Return result ✓", { color: "#065f46", size: 14, weight: "600" });
  g.arrowDiag(448, 428, 332, 428, { stroke: "#059669" });

  g.save(OUT + "mcp-auth-flow-en.svg");
}

// ── 15. Claude Code Core Architecture ────────────────────────────────────────
{
  const g = createSVG(1000, 720);
  g.text(500, 34, "Claude Code Core Architecture", { color: "#1e40af", size: 24, weight: "bold" });

  // User layer
  g.rect(350, 62, 300, 60, { fill: "#a5d8ff", stroke: "#1e40af", radius: 10, strokeWidth: 2.5 });
  g.text(500, 92, "User Layer\nCLI / Desktop / Web", { color: "#1e40af", size: 15, weight: "600" });

  g.arrowDown(500, 123, 158, { stroke: "#3b82f6" });

  // QueryEngine
  g.rect(300, 162, 400, 70, { fill: "#dbe4ff", stroke: "#3730a3", radius: 10, strokeWidth: 2.5 });
  g.text(500, 197, "QueryEngine (Core Engine)\nMessage loop · Agent execution · Streaming response", { color: "#3730a3", size: 14, weight: "600" });

  // Three main branches
  const y1 = 233, y2 = 288;
  g.arrowDiag(350, y1, 150, y2, { stroke: "#059669" });
  g.arrowDown(500, y1, y2, { stroke: "#d97706" });
  g.arrowDiag(650, y1, 850, y2, { stroke: "#9333ea" });

  // Left: Tool System
  g.rect(40, 292, 220, 180, { fill: "#d3f9d8", stroke: "#059669", radius: 10, strokeWidth: 2 });
  g.text(150, 318, "Tool System", { color: "#065f46", size: 16, weight: "600" });
  const tools = ["FileReadTool", "FileEditTool", "BashTool", "GrepTool", "AgentTool"];
  tools.forEach((tool, i) => {
    g.rect(58, 340 + i * 26, 184, 22, { fill: "#b2f2bb", stroke: "#059669", radius: 5, strokeWidth: 1.5 });
    g.text(150, 351 + i * 26, tool, { color: "#374151", size: 12 });
  });

  // Middle: Permission System
  g.rect(290, 292, 420, 180, { fill: "#fff3bf", stroke: "#d97706", radius: 10, strokeWidth: 2 });
  g.text(500, 318, "Permission System (Five-Layer Architecture)", { color: "#92400e", size: 16, weight: "600" });
  const perms = [
    "① Session mode (default/acceptEdits/bypass)",
    "② Tool whitelist/blacklist",
    "③ Tool-level permissions (read/edit/bash)",
    "④ Operation-level permissions (ls vs rm -rf)",
    "⑤ Path/command-level permissions"
  ];
  perms.forEach((perm, i) => {
    g.text(500, 345 + i * 24, perm, { color: "#374151", size: 11 });
  });

  // Right: MCP Client
  g.rect(740, 292, 220, 180, { fill: "#e5dbff", stroke: "#9333ea", radius: 10, strokeWidth: 2 });
  g.text(850, 318, "MCP Client", { color: "#6b21a8", size: 16, weight: "600" });
  const mcps = ["GitHub MCP", "Slack MCP", "Database MCP", "Custom MCP"];
  mcps.forEach((mcp, i) => {
    g.rect(758, 340 + i * 32, 184, 26, { fill: "#d0bfff", stroke: "#9333ea", radius: 5, strokeWidth: 1.5 });
    g.text(850, 353 + i * 32, mcp, { color: "#374151", size: 12 });
  });

  // Bottom: State & Context
  const y3 = 473, y4 = 518;
  g.arrowDown(200, y3, y4, { stroke: "#3b82f6" });
  g.arrowDown(500, y3, y4, { stroke: "#3b82f6" });
  g.arrowDown(800, y3, y4, { stroke: "#3b82f6" });

  // State Management
  g.rect(40, 522, 440, 160, { fill: "#c3fae8", stroke: "#059669", radius: 10, strokeWidth: 2 });
  g.text(260, 548, "State Management", { color: "#065f46", size: 16, weight: "600" });
  g.rect(58, 568, 200, 50, { fill: "#b2f2bb", stroke: "#059669", radius: 6, strokeWidth: 1.5 });
  g.text(158, 593, "Bootstrap State\nGlobal singleton · Process-level", { color: "#374151", size: 12 });
  g.rect(270, 568, 192, 50, { fill: "#b2f2bb", stroke: "#059669", radius: 6, strokeWidth: 1.5 });
  g.text(366, 593, "AppState\nSession-level · Reactive", { color: "#374151", size: 12 });
  g.text(260, 645, "messages[] · tasks · permissions · fileHistory", { color: "#374151", size: 11 });

  // Context Engineering
  g.rect(520, 522, 440, 160, { fill: "#ffd8a8", stroke: "#d97706", radius: 10, strokeWidth: 2 });
  g.text(740, 548, "Context Engineering", { color: "#92400e", size: 16, weight: "600" });
  const contexts = [
    "System prompt construction (tool defs + core instructions)",
    "Memory system (user/feedback/project)",
    "CLAUDE.md (project context)",
    "Auto-Compact (context compression)"
  ];
  contexts.forEach((ctx, i) => {
    g.rect(538, 572 + i * 26, 404, 22, { fill: "#ffc9c9", stroke: "#dc2626", radius: 5, strokeWidth: 1.5 });
    g.text(740, 583 + i * 26, ctx, { color: "#374151", size: 11 });
  });

  g.save(OUT + "claude-code-architecture-en.svg");
}

console.log("\n✓ All 15 English SVG diagrams generated successfully!");

