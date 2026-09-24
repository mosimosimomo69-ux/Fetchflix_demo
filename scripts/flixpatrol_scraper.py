"""
FlixPatrol Top 10 scraper — runs as a background task, saves results to JSON.
Cloudflare blocks most attempts, so this is best-effort with a cache fallback.

Usage:
    python scripts/flixpatrol_scraper.py

Schedule via Windows Task Scheduler or cron to run every 6-12 hours.
Output: public/data/netflix-top10.json
"""

import json
import os
import time
from datetime import datetime
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
OUTPUT_FILE = OUTPUT_DIR / "netflix-top10.json"
CACHE_MAX_AGE_HOURS = 12


def try_playwright():
    """Attempt to scrape FlixPatrol using Playwright."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return None

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"],
            )
            ctx = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1920, "height": 1080},
            )
            page = ctx.new_page()
            page.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )
            page.goto(
                "https://flixpatrol.com/top10/netflix/",
                wait_until="domcontentloaded",
                timeout=45000,
            )
            # Wait for CF challenge
            for _ in range(20):
                time.sleep(1)
                if "just a moment" not in page.title().lower():
                    break

            title = page.title()
            if "just a moment" in title.lower():
                browser.close()
                return None

            html = page.content()
            browser.close()
            return parse_flixpatrol_html(html)
    except Exception as e:
        print(f"[flixpatrol] Playwright failed: {e}")
        return None


def try_curl_cffi():
    """Attempt with curl_cffi Chrome impersonation."""
    try:
        from curl_cffi import requests as cffi_requests
    except ImportError:
        return None

    for imp in ["chrome120", "chrome124"]:
        try:
            s = cffi_requests.Session(impersonate=imp)
            r = s.get("https://flixpatrol.com/top10/netflix/", timeout=20)
            if r.status_code == 200 and "just a moment" not in r.text.lower():
                return parse_flixpatrol_html(r.text)
        except Exception:
            pass
    return None


def parse_flixpatrol_html(html: str) -> list[dict]:
    """Parse the FlixPatrol HTML into structured data."""
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    results = []

    # FlixPatrol uses tables for rankings
    tables = soup.select("table")
    category = "TV Shows"
    for table in tables:
        rows = table.select("tr")
        for row in rows:
            cols = row.select("td")
            if len(cols) >= 2:
                rank_text = cols[0].get_text(strip=True)
                title_text = cols[1].get_text(strip=True)
                if rank_text.isdigit():
                    results.append({
                        "rank": int(rank_text),
                        "title": title_text,
                        "category": category,
                        "source": "flixpatrol",
                    })

    return results


def load_cache() -> dict | None:
    """Load cached data if it exists and is fresh."""
    if not OUTPUT_FILE.exists():
        return None
    try:
        data = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
        cached_at = datetime.fromisoformat(data.get("fetched_at", "2000-01-01"))
        age_hours = (datetime.now() - cached_at).total_seconds() / 3600
        if age_hours < CACHE_MAX_AGE_HOURS:
            return data
    except Exception:
        pass
    return None


def save_results(results: list[dict]):
    """Save scraped results to JSON."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    data = {
        "fetched_at": datetime.now().isoformat(),
        "count": len(results),
        "items": results,
    }
    OUTPUT_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"[flixpatrol] Saved {len(results)} items to {OUTPUT_FILE}")


def main():
    # Check cache first
    cached = load_cache()
    if cached:
        print(f"[flixpatrol] Cache is fresh ({cached['count']} items, fetched {cached['fetched_at']})")
        return

    print("[flixpatrol] Attempting scrape...")

    # Try Playwright first
    results = try_playwright()
    if results:
        save_results(results)
        return

    # Try curl_cffi
    results = try_curl_cffi()
    if results:
        save_results(results)
        return

    # All failed — keep old cache if available
    old = load_cache()
    if old:
        # Force re-check by clearing the age
        print(f"[flixpatrol] All methods failed. Keeping stale cache ({old['count']} items)")
    else:
        print("[flixpatrol] All methods failed. No data available.")


if __name__ == "__main__":
    main()
