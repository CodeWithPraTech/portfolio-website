import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const siteRoot = fileURLToPath(new URL(".", import.meta.url));
const preferredPort = Number(process.env.NSE_DASHBOARD_PORT) || 4184;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const base = url.pathname.startsWith("/data/") ? root : siteRoot;
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(base, requestedPath));

  if (!filePath.startsWith(base)) {
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
    console.log(`NSE dashboard running at http://localhost:${port}`);
  });
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store, max-age=0"
  });
  response.end(body);
}
