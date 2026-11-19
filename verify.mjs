// Screenshot verification: walk the deck with real arrow presses and
// capture #stage for every scene + step into verify-shots/.
// Run: node verify.mjs                 (all scenes)
//      node verify.mjs level-1         (only scenes whose id contains the arg)
//      node verify.mjs room-edit,job   (comma list: any of them)
//
// Old shots of the scenes being shot are deleted first (all shots when no
// filter), so there's never a need to rm verify-shots by hand. It only
// ever deletes NN-<id>-stepN.png files inside verify-shots/.
//
// Wait per step defaults to 900ms. A scene can declare longer waits:
//   verifyWait: 2800            same wait for every step
//   verifyWait: [2800, 900]     per step
//
// English deck: DECK_LANG=en node verify.mjs  → shots go to verify-shots/en/.
import { chromium } from "playwright";
import { createServer } from "http";
import { readFile, mkdir, readdir, unlink } from "fs/promises";
import { extname, join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 4174;
const filters = (process.argv[2] || "").split(",").map((f) => f.trim()).filter(Boolean);
const wanted = (id) => !filters.length || filters.some((f) => id.includes(f));

const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = join(__dirname, urlPath);
    const buf = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mime[extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end("not found: " + req.url);
  }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[browser-error]", msg.text());
});
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

const DECK_LANG = process.env.DECK_LANG === "en" ? "en" : "cs";
await page.addInitScript((l) => {
  try { localStorage.setItem("jeden-radek-lang", l); } catch (e) {}
}, DECK_LANG);
await page.goto(`http://localhost:${PORT}/`);
await page.waitForFunction(() => document.querySelector(".scene") !== null);
await page.evaluate(() => document.fonts.ready);

const manifest = await page.evaluate(() =>
  // eslint-disable-next-line no-undef
  scenes.map((s) => ({
    id: s.id,
    steps: Math.max(1, s.steps || 1),
    exitDuration: s.exitDuration || 0,
    verifyWait: s.verifyWait ?? null,
  }))
);

const shotDir = join(__dirname, "verify-shots", ...(DECK_LANG === "en" ? ["en"] : []));
await mkdir(shotDir, { recursive: true });

// Drop stale shots of the scenes we're about to shoot (scene numbers shift
// when scenes are added, so match on the id part only).
const SHOT_RE = /^\d+-(.+)-step\d+\.png$/;
let removed = 0;
for (const f of await readdir(shotDir)) {
  const m = f.match(SHOT_RE);
  if (m && wanted(m[1])) {
    await unlink(join(shotDir, f));
    removed++;
  }
}
if (removed) console.log(`  (removed ${removed} old shots)`);

let total = 0;
await page.evaluate(() => mountScene(0, 0));
for (let i = 0; i < manifest.length; i++) {
  const s = manifest[i];
  for (let step = 0; step < s.steps; step++) {
    let wait = Array.isArray(s.verifyWait) ? s.verifyWait[step] ?? 900 : s.verifyWait ?? 900;
    if (step === 0 && i > 0 && manifest[i - 1].exitDuration) {
      wait = Math.max(wait, manifest[i - 1].exitDuration + 900);
    }
    if (wanted(s.id)) {
      await page.waitForTimeout(wait);
      const filename = `${String(i + 1).padStart(2, "0")}-${s.id}-step${step}.png`;
      await page.locator("#stage").screenshot({ path: join(shotDir, filename) });
      total++;
      console.log(`  ${filename}`);
    }
    const isLast = i === manifest.length - 1 && step === s.steps - 1;
    if (!isLast) await page.keyboard.press("ArrowRight");
  }
}

await browser.close();
server.close();
console.log(`done, ${total} screenshots in ${shotDir}`);
