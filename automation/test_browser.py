from pathlib import Path

from playwright.sync_api import expect, sync_playwright


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TEST_PAGE = (PROJECT_ROOT / "tests.html").as_uri()
GAME_PAGE = (PROJECT_ROOT / "index.html").as_uri()


def test_rule_suite_passes():
    """Run the self-contained deterministic rules suite in a real browser."""
    with sync_playwright() as playwright:
        browser = playwright.firefox.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        try:
            page.goto(TEST_PAGE, wait_until="load")
            page.get_by_role("button", name="运行全部测试").click()
            expect(page.locator("#summary")).to_have_text("13/13 项通过。")
            expect(page.locator("#results .fail")).to_have_count(0)
        finally:
            browser.close()


def test_game_opens_and_starts_at_day_one():
    """Smoke-test the player-facing page at the desktop acceptance viewport."""
    with sync_playwright() as playwright:
        browser = playwright.firefox.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        try:
            page.goto(GAME_PAGE, wait_until="load")
            expect(page.get_by_text("莓风群岛", exact=True)).to_be_visible()
            expect(page.locator("#day")).to_have_text("1")
            expect(page.locator("#coins")).to_have_text("3")
            expect(page.get_by_role("button", name="收工")).to_be_enabled()
        finally:
            browser.close()
