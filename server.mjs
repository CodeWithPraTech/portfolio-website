import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLearningPlaylistPayload } from "./lib/notion-learning-sync.js";

const root = fileURLToPath(new URL(".", import.meta.url));
await loadEnvFile();
const preferredPort = Number(process.env.PORT) || 4173;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (url.pathname === "/api/notion/learning-playlists") {
    await handleNotionSync(response);
    return;
  }

  if (url.pathname === "/api/openai/account-usage") {
    await handleOpenAiUsage(response);
    return;
  }

  await serveStatic(url.pathname, response);
});

startServer(preferredPort);

function startServer(port) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      startServer(port + 1);
      return;
    }
    throw error;
  });

  server.listen(port, () => {
    server.removeAllListeners("error");
    process.env.PORT = String(port);
  console.log(`Portfolio OS running at http://localhost:${port}`);
  console.log("Live Notion sync requires NOTION_API_KEY in this terminal environment.");
  });
}

async function handleNotionSync(response) {
  try {
    const token = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
    const payload = await buildLearningPlaylistPayload(token);
    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Unable to sync Notion roadmap",
      learningPlaylists: []
    });
  }
}

async function handleOpenAiUsage(response) {
  const key = process.env.OPENAI_ADMIN_KEY || process.env.OPENAI_API_KEY;
  const configuredLimit = Number(process.env.OPENAI_DAILY_TOKEN_LIMIT || 0);
  if (!key || key.includes("__REDACTED")) {
    sendJson(response, 503, {
      connected: false,
      error: "OPENAI_ADMIN_KEY is not configured. Add an OpenAI Admin API key to .env for organization usage.",
      provider: "OpenAI API",
      plan: "Pro"
    });
    return;
  }

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const startTime = Math.floor(start.getTime() / 1000);
  const endTime = Math.floor(now.getTime() / 1000);

  try {
    const [usagePayload, costsPayload] = await Promise.all([
      fetchOpenAiAdminJson("https://api.openai.com/v1/organization/usage/completions", {
        start_time: startTime,
        end_time: endTime,
        bucket_width: "1d",
        limit: 1
      }, key),
      fetchOpenAiAdminJson("https://api.openai.com/v1/organization/costs", {
        start_time: startTime,
        end_time: endTime,
        bucket_width: "1d",
        limit: 1
      }, key)
    ]);

    const tokenTotals = summarizeOpenAiTokens(usagePayload);
    const cost = summarizeOpenAiCosts(costsPayload);
    const remaining = configuredLimit > 0 ? Math.max(0, configuredLimit - tokenTotals.totalTokens) : null;
    const percentUsed = configuredLimit > 0 ? Math.min(100, Math.round((tokenTotals.totalTokens / configuredLimit) * 100)) : null;

    sendJson(response, 200, {
      connected: true,
      provider: "OpenAI API",
      plan: "API usage",
      liveUsageConnected: true,
      dailyLimit: configuredLimit || null,
      usedToday: tokenTotals.totalTokens,
      inputTokens: tokenTotals.inputTokens,
      outputTokens: tokenTotals.outputTokens,
      requests: tokenTotals.requests,
      remaining,
      percentUsed,
      cost,
      resetTime: "Local midnight",
      lastUpdated: new Date().toISOString(),
      note: configuredLimit > 0
        ? "Usage and remaining are calculated from the configured OPENAI_DAILY_TOKEN_LIMIT."
        : "OpenAI usage API returned tokens/costs. Add OPENAI_DAILY_TOKEN_LIMIT to calculate remaining and percent."
    });
  } catch (error) {
    const permissionMessage = error.statusCode === 403
      ? "The configured OpenAI key is valid for model calls but does not have organization usage-read permission."
      : error.message || "Unable to fetch OpenAI usage";
    sendJson(response, error.statusCode || 500, {
      connected: false,
      provider: "OpenAI API",
      plan: "Pro",
      error: permissionMessage,
      note: "OpenAI organization usage requires an Admin API key with usage read permission. ChatGPT Pro message limits are not exposed by this API."
    });
  }
}

async function fetchOpenAiAdminJson(endpoint, params, key) {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, String(value)));
  const result = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    }
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) {
    const error = new Error(payload.error?.message || `OpenAI usage request failed with HTTP ${result.status}`);
    error.statusCode = result.status;
    throw error;
  }
  return payload;
}

function summarizeOpenAiTokens(payload) {
  const totals = {
    inputTokens: 0,
    outputTokens: 0,
    requests: 0,
    totalTokens: 0
  };
  for (const bucket of payload.data || []) {
    for (const result of bucket.results || []) {
      totals.inputTokens += Number(result.input_tokens || 0) + Number(result.input_audio_tokens || 0);
      totals.outputTokens += Number(result.output_tokens || 0) + Number(result.output_audio_tokens || 0);
      totals.requests += Number(result.num_model_requests || 0);
    }
  }
  totals.totalTokens = totals.inputTokens + totals.outputTokens;
  return totals;
}

function summarizeOpenAiCosts(payload) {
  let value = 0;
  let currency = "usd";
  for (const bucket of payload.data || []) {
    for (const result of bucket.results || []) {
      value += Number(result.amount?.value || 0);
      currency = result.amount?.currency || currency;
    }
  }
  return { value, currency };
}

async function serveStatic(pathname, response) {
  const requestedPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = normalize(join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store, max-age=0"
    });
    response.end(content);
  } catch {
    sendText(response, 404, "Not found");
  }
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0"
  });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store, max-age=0"
  });
  response.end(body);
}

async function loadEnvFile() {
  try {
    const content = await readFile(join(root, ".env"), "utf8");
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
      const [key, ...valueParts] = trimmed.split("=");
      if (process.env[key]) return;
      process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
    });
  } catch {
    // .env is optional.
  }
}
