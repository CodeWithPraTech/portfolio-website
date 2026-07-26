import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const siteRoot = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const preferredPort = Number(process.env.NSE_DASHBOARD_PORT) || 4184;
const pythonPath = process.env.PYTHON || "python";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/api/dashboard-summary") {
    await handleDashboardSummary(url, response);
    return;
  }
  if (url.pathname === "/api/intraday-30m") {
    await handleIntraday(url, response);
    return;
  }
  if (url.pathname === "/api/corporate-actions") {
    await handleCorporateActions(url, response);
    return;
  }

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

async function handleDashboardSummary(url, response) {
  try {
    const requestedLookback = url.searchParams.get("lookback") || "3y";
    const lookback = ["6mo", "1y", "3y"].includes(requestedLookback) ? requestedLookback : "3y";
    const payload = await runEtl(lookback);
    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, 500, {
      status: "error",
      message: error.message || "Refresh failed"
    });
  }
}

async function handleIntraday(url, response) {
  try {
    const symbol = (url.searchParams.get("symbol") || "RELIANCE").toUpperCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 80, 1), 500);
    const payload = await runPythonModule("src.database.query_intraday", ["--symbol", symbol, "--limit", String(limit)]);
    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, 500, {
      status: "error",
      message: error.message || "Intraday query failed"
    });
  }
}

async function handleCorporateActions(url, response) {
  try {
    const symbol = (url.searchParams.get("symbol") || "ALL").toUpperCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);
    const payload = await runPythonModule("src.database.query_corporate_actions", ["--symbol", symbol, "--limit", String(limit)]);
    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, 500, {
      status: "error",
      message: error.message || "Corporate action query failed"
    });
  }
}

function runEtl(lookback) {
  return runPythonModule("src.pipeline.run_etl", ["--lookback", lookback]);
}

function runPythonModule(moduleName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonPath, ["-m", moduleName, ...args], {
      cwd: projectRoot,
      env: { ...process.env, PYTHONPATH: projectRoot },
      shell: false
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `ETL exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`ETL returned invalid JSON: ${stdout || stderr}`));
      }
    });
  });
}

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

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0"
  });
  response.end(JSON.stringify(body));
}
