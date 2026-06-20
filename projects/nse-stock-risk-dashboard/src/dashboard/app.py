"""Minimal full-stack dashboard server for the NSE project.

Run from the project root:
python src/dashboard/app.py
"""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import urllib.parse


PROJECT_ROOT = Path(__file__).resolve().parents[2]
SITE_ROOT = PROJECT_ROOT / "site"
DATA_ROOT = PROJECT_ROOT / "data"
PORT = 4184


class DashboardHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean_path = urllib.parse.urlparse(path).path
        if clean_path.startswith("/api/"):
            return str(PROJECT_ROOT)
        if clean_path.startswith("/data/"):
            return str(PROJECT_ROOT / clean_path.lstrip("/"))
        if clean_path == "/":
            return str(SITE_ROOT / "index.html")
        return str(SITE_ROOT / clean_path.lstrip("/"))

    def do_GET(self):
        if self.path.startswith("/api/health"):
            self.send_json({
                "status": "ok",
                "project": "nse-stock-risk-dashboard",
                "data_root": str(DATA_ROOT),
            })
            return
        super().do_GET()

    def send_json(self, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    server = ThreadingHTTPServer(("localhost", PORT), DashboardHandler)
    print(f"NSE dashboard running at http://localhost:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
