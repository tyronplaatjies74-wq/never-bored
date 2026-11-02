// Never Bored server: HTTP + MCP (Streamable HTTP, stateless JSON). No extra dependencies.
// Claude connector URL:  https://<your-host>/mcp
import http from "http";
import { boredBuster, filterByVibe, localGem, findThingsToDo } from "./tools";

const PORT = Number(process.env.PORT || 3000);
const SERVER_INFO = { name: "never-bored", version: "1.0.0" };
const LATEST = "2025-06-18";
const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];

const noArgs = { type: "object", properties: {}, additionalProperties: false };
const TOOLS = [
  {
    name: "find_things_to_do",
    description: "Finds up to 5 Garden Route and South Africa activities. Filter by town (location), vibe (e.g. adventure, family, chill, foodie, free) and instant (can be done today without booking ahead). Costs are text and may be out of date; confirm with the operator.",
    inputSchema: { type: "object", properties: {
      location: { type: "string", description: "Town name, e.g. 'Plettenberg Bay'." },
      vibe: { type: "string", description: "Vibe tag, e.g. 'adventure'." },
      instant: { type: "boolean", description: "Only activities that need no advance booking." } },
      additionalProperties: false },
  },
  {
    name: "filter_by_vibe",
    description: "Returns up to 5 activities matching a vibe tag such as adventure, family, chill, foodie, free or romantic.",
    inputSchema: { type: "object", properties: { vibe: { type: "string", description: "Vibe tag." } },
      required: ["vibe"], additionalProperties: false },
  },
  {
    name: "local_gem",
    description: "Picks one lesser-known, free or relaxed local activity, optionally in a given town.",
    inputSchema: { type: "object", properties: { town: { type: "string", description: "Town name." } },
      additionalProperties: false },
  },
  {
    name: "bored_buster",
    description: "Picks one random activity that can be done right now without booking ahead, optionally in a given town.",
    inputSchema: { type: "object", properties: { location: { type: "string", description: "Town name." } },
      additionalProperties: false },
  },
].map(t => ({ ...t, annotations: { readOnlyHint: true } }));

function toolResult(payload: any, isError = false) {
  return { content: [{ type: "text", text: JSON.stringify(payload) }], structuredContent: payload, isError };
}

function callTool(name: string, args: any) {
  try {
    switch (name) {
      case "find_things_to_do": return toolResult({ results: findThingsToDo(args || {}) });
      case "filter_by_vibe":
        if (!args || typeof args.vibe !== "string" || !args.vibe) {
          return toolResult({ error: "vibe is required, e.g. 'adventure'." }, true);
        }
        return toolResult({ results: filterByVibe(args) });
      case "local_gem": return toolResult(localGem(args || {}));
      case "bored_buster": return toolResult(boredBuster(args || {}));
    }
  } catch (e: any) {
    return toolResult({ error: `Tool failed: ${e?.message || e}` }, true);
  }
  return null;
}

function rpcError(id: any, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function handle(msg: any): any | null {
  if (!msg || msg.jsonrpc !== "2.0") return rpcError(null, -32600, "Invalid Request");
  if (msg.method === undefined || msg.id === undefined || msg.id === null) return null; // response or notification
  const params = msg.params || {};
  switch (msg.method) {
    case "initialize":
      return { jsonrpc: "2.0", id: msg.id, result: {
        protocolVersion: SUPPORTED.includes(params.protocolVersion) ? params.protocolVersion : LATEST,
        capabilities: { tools: { listChanged: false } }, serverInfo: SERVER_INFO,
        instructions: "Never Bored finds things to do on the Garden Route. Costs are indicative; confirm with the operator before booking." } };
    case "ping": return { jsonrpc: "2.0", id: msg.id, result: {} };
    case "tools/list": return { jsonrpc: "2.0", id: msg.id, result: { tools: TOOLS } };
    case "tools/call": {
      const result = callTool(params.name, params.arguments);
      return result ? { jsonrpc: "2.0", id: msg.id, result } : rpcError(msg.id, -32602, `Unknown tool: ${params.name}`);
    }
    default: return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

function send(res: http.ServerResponse, status: number, body?: any) {
  if (body === undefined) { res.writeHead(status); res.end(); return; }
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (req.method === "GET" && url === "/health") return send(res, 200, { ok: true });
  if (req.method === "GET" && url === "/") {
    return send(res, 200, { name: "Never Bored", mcp: "/mcp", tools: TOOLS.map(t => t.name) });
  }
  if (req.method === "POST" && url === "/mcp") {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > 100_000) { send(res, 413, rpcError(null, -32600, "Request too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      let body: any;
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
      catch { return send(res, 400, rpcError(null, -32700, "Parse error")); }
      if (Array.isArray(body)) {
        const replies = body.map(handle).filter(r => r !== null);
        return replies.length ? send(res, 200, replies) : send(res, 202);
      }
      const reply = handle(body);
      return reply ? send(res, 200, reply) : send(res, 202);
    });
    return;
  }
  send(res, 404, { error: "Not found" });
});

server.listen(PORT, "0.0.0.0", () => console.log(`Never Bored listening on ${PORT}`));
