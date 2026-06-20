import json
import mimetypes
import os
import uuid
from pathlib import Path
from urllib import request
from urllib.error import HTTPError


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
DOCX_PATH = ROOT / "Statistics_Day_3_Conditional_Probability_Notes.docx"
PAGE_ID = "377fb1cd-3ed7-815e-b50c-de1c6e72e850"
NOTION_VERSION = "2026-03-11"


def load_env():
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def notion_request(method, url, token, body=None, content_type="application/json"):
    headers = {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
    }
    data = None
    if body is not None:
        if content_type == "application/json":
            data = json.dumps(body).encode("utf-8")
        else:
            data = body
        headers["Content-Type"] = content_type
    req = request.Request(url, data=data, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8")
        raise RuntimeError(f"Notion API error {error.code}: {detail}") from error


def multipart_body(field_name, file_path, upload_name=None):
    boundary = f"----notion-upload-{uuid.uuid4().hex}"
    filename = upload_name or file_path.name
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    chunks = [
        f"--{boundary}\r\n".encode("utf-8"),
        f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode("utf-8"),
        f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"),
        file_path.read_bytes(),
        b"\r\n",
        f"--{boundary}--\r\n".encode("utf-8"),
    ]
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def main():
    load_env()
    token = os.environ.get("NOTION_API_KEY") or os.environ.get("NOTION_TOKEN")
    if not token:
        raise SystemExit("Missing NOTION_API_KEY in .env")
    if not DOCX_PATH.exists():
        raise SystemExit(f"Missing file: {DOCX_PATH}")

    upload = notion_request("POST", "https://api.notion.com/v1/file_uploads", token, body={})
    upload_id = upload["id"]
    upload_url = upload["upload_url"]

    body, content_type = multipart_body("file", DOCX_PATH, upload_name=DOCX_PATH.name)
    sent = notion_request("POST", upload_url, token, body=body, content_type=content_type)
    if sent.get("status") != "uploaded":
        raise SystemExit(f"File upload did not finish. Status: {sent.get('status')}")

    page_update = {
        "properties": {
            "Status": {"select": {"name": "Complete"}},
            "Progress": {"number": 100},
            "Notes Upload": {
                "files": [
                    {
                        "type": "file_upload",
                        "file_upload": {"id": upload_id},
                        "name": DOCX_PATH.name,
                    }
                ]
            },
            "Notes": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {
                            "content": (
                                "Day 3 Word notes uploaded. Covers conditional probability, multiplication rule, "
                                "chain rule, independence, conditional independence, law of total probability, "
                                "product funnel and BFSI examples, base-rate traps, denominator traps, model "
                                "evaluation slices, causal reasoning, and research engineer interview extensions."
                            )
                        },
                    }
                ]
            },
        }
    }
    notion_request("PATCH", f"https://api.notion.com/v1/pages/{PAGE_ID}", token, body=page_update)
    print(json.dumps({"uploaded": True, "file": DOCX_PATH.name, "page_id": PAGE_ID, "status": "Complete", "progress": 100}))


if __name__ == "__main__":
    main()
