#!/usr/bin/env python3
"""
process_multimodal.py — Process images, files, and links in sandbox.

Runs in TrueForge sandbox (Code Mode) with file downloads and image uploads enabled.
"""
import json
import sys
import os
import base64
import mimetypes
import hashlib
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime
import urllib.request
import urllib.parse


def process_image(file_path: str, action: str = "analyze") -> Dict[str, Any]:
    """Process an image file."""
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    # Get file info
    stat = os.stat(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)

    result = {
        "file_path": file_path,
        "file_name": os.path.basename(file_path),
        "file_size": stat.st_size,
        "mime_type": mime_type,
        "md5": hashlib.md5(open(file_path, "rb").read()).hexdigest(),
        "processed_at": datetime.now().isoformat()
    }

    if action == "analyze":
        # Basic image analysis (would use PIL/OpenCV in real implementation)
        try:
            from PIL import Image
            img = Image.open(file_path)
            result["dimensions"] = {"width": img.width, "height": img.height}
            result["mode"] = img.mode
            result["format"] = img.format
            result["aspect_ratio"] = round(img.width / img.height, 2)
        except ImportError:
            result["note"] = "PIL not available for detailed analysis"
        except Exception as e:
            result["analysis_error"] = str(e)

    elif action == "ocr":
        # OCR would go here (pytesseract)
        result["ocr_text"] = "OCR not implemented - install pytesseract"
        result["note"] = "Install pytesseract for OCR support"

    elif action == "describe":
        # Image description would use a vision model
        result["description"] = "Image description requires vision model integration"
        result["note"] = "Integrate with vision model (e.g., GPT-4V, Claude Vision)"

    return result


def process_file(file_path: str, action: str = "analyze") -> Dict[str, Any]:
    """Process a generic file."""
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    stat = os.stat(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)

    result = {
        "file_path": file_path,
        "file_name": os.path.basename(file_path),
        "file_size": stat.st_size,
        "mime_type": mime_type,
        "md5": hashlib.md5(open(file_path, "rb").read()).hexdigest(),
        "extension": Path(file_path).suffix.lower(),
        "processed_at": datetime.now().isoformat()
    }

    if action == "analyze":
        if mime_type and mime_type.startswith("text/"):
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read(10000)
                result["preview"] = content[:2000]
                result["line_count"] = content.count("\n") + 1
                result["char_count"] = len(content)
                result["encoding"] = "utf-8"
            except Exception as e:
                result["read_error"] = str(e)

        elif mime_type in ["application/pdf"]:
            result["note"] = "PDF processing requires PyPDF2 or pdfplumber"

        elif mime_type in [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]:
            result["note"] = "Excel processing - use ingest_excel.py"

    elif action == "extract_text":
        if mime_type and mime_type.startswith("text/"):
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    result["text"] = f.read()
            except Exception as e:
                result["error"] = str(e)
        else:
            result["error"] = "Text extraction only supported for text files"

    return result


def download_file(url: str, save_dir: str = "/sandbox/downloads") -> Dict[str, Any]:
    """Download a file from a URL."""
    os.makedirs(save_dir, exist_ok=True)

    try:
        # Parse URL for filename
        parsed = urllib.parse.urlparse(url)
        filename = os.path.basename(parsed.path) or "download"
        if not Path(filename).suffix:
            filename += ".bin"

        # Handle duplicate filenames
        save_path = os.path.join(save_dir, filename)
        counter = 1
        while os.path.exists(save_path):
            name, ext = os.path.splitext(filename)
            save_path = os.path.join(save_dir, f"{name}_{counter}{ext}")
            counter += 1

        # Download
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        req = urllib.request.Request(url, headers=headers)

        with urllib.request.urlopen(req, timeout=60) as response:
            content = response.read()
            with open(save_path, "wb") as f:
                f.write(content)

        return {
            "success": True,
            "url": url,
            "saved_path": save_path,
            "file_size": len(content),
            "content_type": response.headers.get("Content-Type", "")
        }

    except Exception as e:
        return {"success": False, "url": url, "error": str(e)}


def process_link(url: str, action: str = "fetch") -> Dict[str, Any]:
    """Process a web link."""
    result = {
        "url": url,
        "processed_at": datetime.now().isoformat()
    }

    if action == "fetch":
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        req = urllib.request.Request(url, headers=headers)

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                html = response.read().decode("utf-8", errors="ignore")
                result["status_code"] = response.status
                result["content_type"] = response.headers.get("Content-Type", "")
                result["final_url"] = response.geturl()
                result["title"] = extract_title(html)
                result["text_preview"] = extract_text_preview(html, 2000)
        except Exception as e:
            result["error"] = str(e)

    elif action == "metadata":
        # Get headers only
        try:
            req = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(req, timeout=10) as response:
                result["headers"] = dict(response.headers)
                result["status_code"] = response.status
        except Exception as e:
            result["error"] = str(e)

    return result


def extract_title(html: str) -> str:
    import re
    match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    match = re.search(r'<h1[^>]*>([^<]+)</h1>', html, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return "No title found"


def extract_text_preview(html: str, max_length: int) -> str:
    import re
    # Remove scripts and styles
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)

    # Extract text from common tags
    text_parts = []
    for tag in ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th']:
        matches = re.findall(f'<{tag}[^>]*>([^<]+)</{tag}>', html, re.IGNORECASE)
        text_parts.extend([m.strip() for m in matches])

    text = " ".join(text_parts)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'&[a-z]+;', ' ', text)
    return text[:max_length].strip()


def batch_process(files: List[str], action: str = "analyze") -> Dict[str, Any]:
    """Process multiple files."""
    results = []
    for file_path in files:
        ext = Path(file_path).suffix.lower()
        if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"]:
            results.append(process_image(file_path, action))
        else:
            results.append(process_file(file_path, action))

    return {
        "processed_count": len(results),
        "results": results,
        "summary": {
            "images": sum(1 for r in results if r.get("mime_type", "").startswith("image/")),
            "text_files": sum(1 for r in results if r.get("mime_type", "").startswith("text/")),
            "other": sum(1 for r in results if not r.get("mime_type", "").startswith(("image/", "text/")))
        }
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: process_multimodal.py '<json_request>'"}))
        sys.exit(1)

    try:
        request = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON request"}))
        sys.exit(1)

    action = request.get("action")
    file_path = request.get("file_path")
    url = request.get("url")
    files = request.get("files", [])
    sub_action = request.get("sub_action", "analyze")
    save_dir = request.get("save_dir", "/sandbox/downloads")

    if action == "process_image":
        result = process_image(file_path, sub_action)
    elif action == "process_file":
        result = process_file(file_path, sub_action)
    elif action == "download_file":
        result = download_file(url, save_dir)
    elif action == "process_link":
        result = process_link(url, sub_action)
    elif action == "batch_process":
        result = batch_process(files, sub_action)
    else:
        result = {"error": f"Unknown action: {action}"}

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()