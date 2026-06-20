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
