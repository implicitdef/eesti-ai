---
name: run
description: Launch and drive eesti-ai (Vite dev server) in headless Chromium via Playwright to smoke-test UI changes, including how to bypass the Anthropic API key gate without spending real API calls, and how to avoid disturbing a dev server the user may already have running.
---

# Running eesti-ai

This is a Vite + React SPA (see repo `CLAUDE.md`). To actually see a change
work, launch a headless browser against the Vite dev server and drive it —
don't just read the diff or run `tsc`/`build`.

## Dev server: reuse, don't kill

The user often has `npm run dev` running in their own terminal tab on port
5173. **Never `lsof -ti:5173 | xargs kill` or otherwise stop it** — that
kills their session and they have to manually restart it.

```bash
# Is something already serving on 5173?
if curl -sf http://localhost:5173/eesti-ai/ >/dev/null; then
  echo "reusing existing dev server on 5173"
  DEV_URL="http://localhost:5173/eesti-ai/"
  STARTED_BY_ME=0
else
  npm run dev -- --port 5174 > /tmp/eesti-ai-vite-test.log 2>&1 &
  echo $! > /tmp/eesti-ai-vite-test.pid
  for i in $(seq 1 30); do
    curl -sf http://localhost:5174/eesti-ai/ >/dev/null && break
    sleep 1
  done
  DEV_URL="http://localhost:5174/eesti-ai/"
  STARTED_BY_ME=1
fi
```

If you started your own instance (`STARTED_BY_ME=1`), stop only that
specific PID when done — never a broad port-kill:

```bash
kill "$(cat /tmp/eesti-ai-vite-test.pid)" 2>/dev/null
```

If you reused the existing server, leave it running.

## Bypassing the API-key gate (don't spend real API calls)

`RootLayout` gates the whole app behind an Anthropic API key stored in
`localStorage` under `eesti-ai-api-key` (see `src/RootLayout.tsx`). For a UI
smoke test you almost never need a real key or a real API call — seed
`localStorage` directly instead:

```js
await page.goto(DEV_URL);
await page.evaluate(() => {
  localStorage.setItem("eesti-ai-api-key", "sk-ant-smoke-test-fake-key");
});
await page.reload();
```

To test a specific screen without triggering a real `generateThemeSentence`
API call, also seed that mode's history directly. E.g. for "From theme or
words" (`FromThemeMode.tsx`), the key is `eesti-ai-from-theme-v2-history`,
holding a JSON array of `ThemePracticeItem` (see `src/types.ts`):

```js
await page.evaluate((item) => {
  localStorage.setItem(
    "eesti-ai-from-theme-v2-history",
    JSON.stringify([item]),
  );
}, {
  id: "smoke-test-1",
  theme: "test",
  sentence: "Võib-olla ta tuleb homme, aga ma ei ole kindel.",
  englishTranslation: "Maybe he will come tomorrow, but I'm not sure.",
  attempts: [],
  status: "in_progress",
  revealed: false,
  createdAt: Date.now(),
});
await page.reload();
```

`VideoMode.tsx` similarly persists watch positions under
`eesti-ai-video-positions` (grep the source for the exact shape before
relying on it — it may drift).

## Driving the browser

Playwright is a devDependency (`npm install -D playwright`, Chromium already
installed via `npx playwright install chromium`). There's no `chromium-cli`
in this environment, so drive it with a small script instead of a REPL.
Write it into a scratch dir (not committed), e.g.:

```js
import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));

await page.goto(DEV_URL);
// ...seed localStorage + reload as above...
// ...interact: page.click(...), page.fill(...), page.keyboard.type(...)...
await page.screenshot({ path: "/path/in/scratchpad/out.png" });
console.log("errors:", errors);
await browser.close();
```

Run it with `node script.mjs` from the repo root (Playwright resolves as a
local devDependency, no extra install needed).

### Gotchas specific to this app

- The page has **two `<form>` elements** stacked (the theme-generate form at
  top, the exercise form below) — scope selectors to the one you want, e.g.
  `page.locator('form:has(button:has-text("Check"))')`, rather than a bare
  `form input`.
- Controlled inputs: use `fill`/`type`/`press`, not
  `page.evaluate(el => el.value = ...)` — the latter skips React's
  `onChange` and the UI won't update.
- Base path is `/eesti-ai/` (`vite.config.ts`) — always include it in the
  URL, `http://localhost:5173/` alone will 404 in some setups.
