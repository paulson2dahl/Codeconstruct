#!/usr/bin/env python3
"""
web_search.py — Web search in TrueForge sandbox.

Runs in TrueForge sandbox (Code Mode) with web access enabled.
"""
import json
import sys
import os
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, List, Any
import re


def search_web(query: str, max_results: int = 10, safe_search: bool = True, recency_days: int = None, site: str = None) -> Dict[str, Any]:
    """
    Search the web using DuckDuckGo HTML (no API key required).
    For production, replace with a proper search API.
    """
    # Build search URL
    base_url = "https://html.duckduckgo.com/html/"
    params = {"q": query}

    if site:
        params["q"] += f" site:{site}"

    if recency_days:
        params["q"] += f" after:{recency_days}days"

    url = base_url + "?" + urllib.parse.urlencode(params)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            html = response.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return {"error": f"Search request failed: {str(e)}", "results": []}

    # Parse results
    results = parse_duckduckgo_results(html, max_results)

    return {
        "query": query,
        "results": results,
        "result_count": len(results)
    }


def parse_duckduckgo_results(html: str, max_results: int) -> List[Dict[str, Any]]:
    """Parse DuckDuckGo HTML results."""
    results = []

    # Pattern for result links
    link_pattern = r'<a class="result__snippet" href="([^"]+)">([^<]+)</a>'
    snippet_pattern = r'<a class="result__snippet" href="[^"]+">[^<]+</a>[^<]*<span class="result__snippet">([^<]+)</span>'
    url_pattern = r'<a class="result__url" href="([^"]+)">([^<]+)</a>'

    # More robust parsing using regex for the result blocks
    result_blocks = re.findall(
        r'<div class="result[^>]*>.*?<a class="result__url" href="([^"]*)"[^>]*>([^<]*)</a>.*?<h2 class="result__title"><a class="result__snippet" href="([^"]*)"[^>]*>([^<]*)</a></h2>.*?<a class="result__snippet" href="[^"]*"[^>]*>([^<]*)</a>',
        html,
        re.DOTALL
    )

    for i, (url, domain, link, title, snippet) in enumerate(result_blocks[:max_results]):
        results.append({
            "title": title.strip() if title else "No title",
            "url": link.strip() if link else url.strip(),
            "domain": domain.strip() if domain else "",
            "snippet": snippet.strip() if snippet else "No snippet available",
            "rank": i + 1
        })

    # Fallback parsing if above doesn't work
    if not results:
        # Try simpler patterns
        title_matches = re.findall(r'<h2 class="result__title"><a class="result__snippet" href="([^"]+)"[^>]*>([^<]+)</a></h2>', html)
        snippet_matches = re.findall(r'class="result__snippet"[^>]*>([^<]+)</a>', html)

        for i, (link, title) in enumerate(title_matches[:max_results]):
            snippet = snippet_matches[i] if i < len(snippet_matches) else ""
            results.append({
                "title": title.strip(),
                "url": link.strip(),
                "snippet": snippet.strip(),
                "rank": i + 1
            })

    return results


def fetch_url(url: str, extract_text: bool = True, max_length: int = 10000) -> Dict[str, Any]:
    """Fetch and extract content from a URL."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            content_type = response.headers.get("Content-Type", "")
            html = response.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return {"error": f"Fetch failed: {str(e)}", "url": url}

    if not extract_text:
        return {
            "url": url,
            "content": html[:max_length],
            "content_type": content_type
        }

    # Extract text from HTML
    text = extract_text_from_html(html)

    return {
        "url": url,
        "title": extract_title(html),
        "text": text[:max_length],
        "content_type": content_type,
        "truncated": len(text) > max_length
    }


def extract_text_from_html(html: str) -> str:
    """Extract readable text from HTML."""
    # Remove scripts and styles
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Remove HTML comments
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)

    # Get text from common content tags
    text_parts = []

    # Title
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    if title_match:
        text_parts.append(title_match.group(1).strip())

    # Headings
    for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
        matches = re.findall(f'<{tag}[^>]*>([^<]+)</{tag}>', html, re.IGNORECASE)
        text_parts.extend([m.strip() for m in matches])

    # Paragraphs
    matches = re.findall(r'<p[^>]*>([^<]+)</p>', html, re.IGNORECASE)
    text_parts.extend([m.strip() for m in matches])

    # List items
    matches = re.findall(r'<li[^>]*>([^<]+)</li>', html, re.IGNORECASE)
    text_parts.extend([m.strip() for m in matches])

    # Links with text
    matches = re.findall(r'<a[^>]*>([^<]+)</a>', html, re.IGNORECASE)
    text_parts.extend([m.strip() for m in matches if len(m.strip()) > 3])

    # Clean up
    text = " ".join(text_parts)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'&[a-z]+;', ' ', text)  # HTML entities
    text = text.strip()

    return text


def extract_title(html: str) -> str:
    """Extract page title from HTML."""
    match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    # Try h1
    match = re.search(r'<h1[^>]*>([^<]+)</h1>', html, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return "No title found"


def search_news(query: str, max_results: int = 10, recency_days: int = 7) -> Dict[str, Any]:
    """Search for news articles."""
    news_query = f"{query} news"
    return search_web(news_query, max_results, recency_days=recency_days)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: web_search.py '<json_request>'"}))
        sys.exit(1)

    try:
        request = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON request"}))
        sys.exit(1)

    action = request.get("action")
    query = request.get("query")
    max_results = request.get("max_results", 10)
    safe_search = request.get("safe_search", True)
    recency_days = request.get("recency_days")
    site = request.get("site")
    url = request.get("url")
    extract_text = request.get("extract_text", True)
    max_length = request.get("max_length", 10000)

    if action == "search":
        result = search_web(query, max_results, safe_search, recency_days, site)
    elif action == "fetch":
        result = fetch_url(url, extract_text, max_length)
    elif action == "search_news":
        result = search_news(query, max_results, recency_days)
    else:
        result = {"error": f"Unknown action: {action}"}

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()