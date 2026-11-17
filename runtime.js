// Jeden řádek: runtime.
// Reusable rendering helpers + scene navigation. Scene content lives in
// scenes.js (loaded first). Helpers (bug, appWindow) are only called when a
// scene's render() runs, so the load order (scenes.js → runtime.js) is fine.
//
// Navigation:  ← / ↑ = back     → / ↓ / Space = forward

const STAGE_W = 1600;
const STAGE_H = 900;

// ---------------------- bug(): the hero sprite ----------------------
//
// Original pixel-art beetle, side view, facing right. Drawn from the
// character grids below, so poses are easy to edit by hand. Each grid row
// must be exactly BUG_W characters.
//
// Easter egg: the shell stripes are "lines of code" (indented like a code
// block, rows 6/8/12). Line 3 (row 10) is missing. That is the whole talk in one sprite.
//
// Palette keys → CSS custom properties (override per instance via
// `style="--bug-shell: …"` or a modifier class, see styles.css):
//   K outline   --bug-ink
//   k limbs     --bug-limb (legs + antennae; separate so they can differ from the outline on dark backgrounds)
//   G shell     --bug-shell
//   g stripe    --bug-shell-dark
//   L highlight --bug-shell-light
//   W eye white --bug-eye
//   P pupil     --bug-ink
//   R headband  --bug-band
//   . transparent

const BUG_W = 26;
const BUG_H = 18;

const BUG_BODY = [
  "................kk....kk..",
  ".................k...k....",
  "..................k.k.....",
  "..............RR..kk......",
  ".......KKKKKKK..RRKKKKK...",
  ".....KKLLLGGGGGK.KRRRRRK..",
  "....KLLLggggGGGGKKGGWWWGK.",
  "...KLLGGGGGGGGGGGKGGWPPGK.",
  "...KLGGGGggggggGGKGGWPPGK.",
  "..KLGGGGGGGGGGGGGKGGGGGGK.",
  "..KGGGGGGGGGGGGGGKGGGKKGK.",
  "..KGGGGGGGGGGGGGGKKKKKKK..",
  "..KGGGGgggGGGGGGGK........",
  "...KGGGGGGGGGGGGGK........",
  "....KKKKKKKKKKKKK.........",
];

// Legs: 3 rows appended under the body. Two walk frames + tucked (jump).
const BUG_LEGS = {
  a: [
    ".....k....k....k..........",
    "....k.....k.....k.........",
    "...kk.....kk....kk........",
  ],
  b: [
    "......k...k....k..........",
    ".....k..k......k..........",
    ".....kkkk......kk.........",
  ],
  tuck: [
    ".....kk...kk...kk.........",
    "..........................",
    "..........................",
  ],
};

const BUG_FILL = {
  K: "var(--bug-ink)",
  k: "var(--bug-limb)",
  P: "var(--bug-ink)",
  G: "var(--bug-shell)",
  g: "var(--bug-shell-dark)",
  L: "var(--bug-shell-light)",
  W: "var(--bug-eye)",
  R: "var(--bug-band)",
};

// Grid → <rect>s, merging horizontal runs of the same colour.
function pixelRects(rows, yOffset = 0, fill = BUG_FILL, classes = {}) {
  let out = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (fill[ch]) {
        const cls = classes[ch] ? ` class="${classes[ch]}"` : "";
        out += `<rect${cls} x="${x}" y="${y + yOffset}" width="${end - x}" height="1" fill="${fill[ch]}"/>`;
      }
      x = end;
    }
  });
  return out;
}

// bug({ size, pose, facing, className, style })
//   size      rendered height in px (default 108 = 6px per pixel)
//   pose      "idle" | "walk" | "jump"; written to data-pose
//   facing    "right" (default) | "left"
//   className extra classes on the root, e.g. "bug--stealth", "bug--clone"
//   style     extra inline style (e.g. palette overrides)
//
// All leg frames are always rendered; data-pose picks which are visible
// (see styles.css). So a scene can switch pose without re-rendering:
//   root.querySelector(".bug").dataset.pose = "idle";
// The root is a <div class="bug"> so scenes can position/transition it
// without touching the SVG. Pixel size is size / BUG_H; pick a size that
// is a multiple of 18 for crisp pixels (72, 108, 144, 216, 288…).
const bug = (opts = {}) => {
  const size = opts.size || 108;
  const pose = opts.pose || "idle";
  const facing = opts.facing === "left" ? " bug--left" : "";
  const extra = opts.className ? ` ${opts.className}` : "";
  const legsY = BUG_BODY.length;
  return `
    <div class="bug${facing}${extra}" data-pose="${pose}"
         style="width:${(size * BUG_W) / BUG_H}px;height:${size}px;${opts.style || ""}">
      <svg viewBox="0 0 ${BUG_W} ${BUG_H}" shape-rendering="crispEdges"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="bug-body">${pixelRects(BUG_BODY)}</g>
        <g class="bug-legs bug-legs-a">${pixelRects(BUG_LEGS.a, legsY)}</g>
        <g class="bug-legs bug-legs-b">${pixelRects(BUG_LEGS.b, legsY)}</g>
        <g class="bug-legs bug-legs-tuck">${pixelRects(BUG_LEGS.tuck, legsY)}</g>
      </svg>
    </div>
  `;
};

// ---------------------- agent(): the refactoring agent ----------------------
//
// Original pixel-art secret agent, front view: slicked hair, black shades
// with a glint, earpiece wire, dark suit, white shirt, coral tie. A generic
// trope, not any specific film character. Every row must be AGENT_W chars.
//   K ink · H hair · F skin · G shades · W glint (.ag-glint) · E earpiece ·
//   S suit · T shirt · R tie
const AGENT_W = 20;
const AGENT_H = 28;
const AGENT_ROWS = [
  "......KKKKKKK.......",
  ".....KHHHHHHHK......",
  "....KHHHHHHHHHK.....",
  "....KHHHHHHHHHK.....",
  "....KFFFFFFFFFK.....",
  "...KKGGGGKGGGGKK....",
  "....KGWGGKGWGGK.....",
  "....KFFFFFFFFFKE....",
  "....KFFFKKKFFFKE....",
  ".....KFFFFFFFK.E....",
  "......KKFFFKK..E....",
  "...KSSSTTRRTTSSSK...",
  "..KSSSSSTRRTSSSSSK..",
  "..KSSSSSSRRSSSSSSK..",
  "..KSSSSSSRRSSSSSSK..",
  ".KSKSSSSSRRSSSSSKSK.",
  ".KSKSSSSSSSSSSSSKSK.",
  ".KSKSSSSSSSSSSSSKSK.",
  ".KFKSSSSSSSSSSSSKFK.",
  ".KKKKKKKKKKKKKKKKKK.",
  "...KSSSSSKSSSSSK....",
  "...KSSSSSKSSSSSK....",
  "...KSSSSSKSSSSSK....",
  "...KSSSSSKSSSSSK....",
  "...KSSSSKKKSSSSK....",
  "...KSSSSK.KSSSSK....",
  "..KKKKKKK.KKKKKKK...",
  "..KKKKKKK.KKKKKKK...",
];
const AGENT_FILL = {
  K: "var(--agent-ink)",
  H: "var(--agent-hair)",
  F: "var(--agent-skin)",
  G: "var(--agent-shades)",
  W: "var(--agent-glint)",
  E: "var(--agent-wire)",
  S: "var(--agent-suit)",
  T: "var(--agent-shirt)",
  R: "var(--agent-tie)",
};

// agent({ size, className, style }): size = height in px (multiples of 28).
const agent = (opts = {}) => {
  const size = opts.size || 308;
  const extra = opts.className ? ` ${opts.className}` : "";
  return `
    <div class="agent${extra}" style="width:${(size * AGENT_W) / AGENT_H}px;height:${size}px;${opts.style || ""}">
      <svg viewBox="0 0 ${AGENT_W} ${AGENT_H}" shape-rendering="crispEdges"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        ${pixelRects(AGENT_ROWS, 0, AGENT_FILL, { W: "ag-glint" })}
      </svg>
    </div>
  `;
};

// ---------------------- appWindow() ----------------------
//
// Reusable shell for any "app window" (chat, terminal, editor, browser).
// Two flush stacked plates (header + body) with one drop-shadow on the
// wrapper. See CLAUDE.md "Reusable building blocks".
//
// opts:
//   variant   "bold" (default) large coloured header | "frame" mac titlebar
//   theme     "chat" | "terminal" | "editor" | "browser" (or omit)
//   title     frame variant: centred title between traffic lights
//   header    bold variant: header content
//   body      body content (required)
//   modal     optional content rendered after .window-body
//   width     px (default 1100)
//   height    px (default 720)
//   className extra classes on the .window root
const appWindow = (opts = {}) => {
  const variant = opts.variant || "bold";
  const theme = opts.theme ? ` window-theme--${opts.theme}` : "";
  const extra = opts.className ? ` ${opts.className}` : "";
  const w = opts.width || 1100;
  const h = opts.height || 720;
  const headerInner =
    variant === "frame"
      ? `<div class="window-traffic"><span></span><span></span><span></span></div>
         <div class="window-title">${opts.title || ""}</div>`
      : opts.header || "";
  return `
    <div class="window${theme}${extra}" style="width:${w}px;height:${h}px">
      <div class="window-header window-header--${variant}">${headerInner}</div>
      <div class="window-body">${opts.body || ""}</div>
      ${opts.modal || ""}
    </div>
  `;
};

// ---------------------- Runtime ----------------------
//
// Navigation model: (sceneIndex, stepIndex).
// → advances step within scene; at last step, jumps to next scene step 0.
// ← reverse.
//
// The scene root carries `data-step="N"`, set on the next animation frame
// after the HTML is inserted so CSS transitions interpolate from the bare
// "before" state into step 0.

const stage = document.getElementById("stage");
const app = document.getElementById("app");
const backdrop = document.getElementById("backdrop");
const bdLayerA = backdrop && backdrop.querySelector('[data-layer="a"]');
const bdLayerB = backdrop && backdrop.querySelector('[data-layer="b"]');
let bdFront = "a";
let currentBackdrop = null;
const counterEl = document.getElementById("counter");

// Crossfade the full-screen backdrop image (behind #stage). null fades it
// out. Same file as current = no-op (avoids a same-image flicker).
function setBackdrop(file, durationMs = 800) {
  if (!bdLayerA || !bdLayerB) return;
  if (!file) {
    bdLayerA.classList.remove("is-visible");
    bdLayerB.classList.remove("is-visible");
    currentBackdrop = null;
    return;
  }
  if (file === currentBackdrop) return;
  const nextKey = bdFront === "a" ? "b" : "a";
  const nextEl = nextKey === "a" ? bdLayerA : bdLayerB;
  const prevEl = bdFront === "a" ? bdLayerA : bdLayerB;
  nextEl.style.backgroundImage = `url("${file}")`;
  nextEl.style.transitionDuration = `${durationMs}ms`;
  prevEl.style.transitionDuration = `${durationMs}ms`;
  nextEl.classList.add("is-visible");
  prevEl.classList.remove("is-visible");
  bdFront = nextKey;
  currentBackdrop = file;
}
window.setBackdrop = setBackdrop;

let sceneIndex = 0;
let stepIndex = 0;
// True while a scene's exit animation plays (scene.exitDuration). Input is
// ignored during this window so a rapid-fire press can't double-mount.
let isAdvancing = false;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function stepsOf(scene) {
  return Math.max(1, scene.steps || 1);
}

function updateHud(scene) {
  const total = stepsOf(scene);
  const stepSuffix = total > 1 ? ` · step ${stepIndex + 1}/${total}` : "";
  counterEl.textContent = `${sceneIndex + 1} / ${scenes.length} · ${scene.id}${stepSuffix}`;
}

// Generic step reveals: any element with data-from="N" gets .is-on while
// step >= N (and step <= data-to, if given). Lets slides reveal content
// per step without per-scene CSS. Styling lives in styles.css.
function syncReveals(root, step) {
  if (!root) return;
  root.querySelectorAll("[data-from], [data-to]").forEach((el) => {
    const from = el.dataset.from != null ? Number(el.dataset.from) : 0;
    const to = el.dataset.to != null ? Number(el.dataset.to) : Infinity;
    el.classList.toggle("is-on", step >= from && step <= to);
  });
}

function mountScene(i, step = 0) {
  sceneIndex = clamp(i, 0, scenes.length - 1);
  const scene = scenes[sceneIndex];
  stepIndex = clamp(step, 0, stepsOf(scene) - 1);

  // Per-scene tint on #app (transitions in CSS). Empty = CSS default.
  app.style.backgroundColor = scene.background || "";
  // Optional full-screen backdrop image, crossfaded between scenes.
  setBackdrop(scene.backdrop || null);
  // Visual world: "serious" (incident) vs "game" (8-bit). Drives fonts
  // and palette via body[data-world] in styles.css.
  document.body.dataset.world = scene.world || "game";

  let html = "";
  try {
    html = scene.render();
  } catch (err) {
    console.error("Scene render failed:", scene && scene.id, err);
    html = `<div class="scene"><div class="scene-fallback">Scene "${scene && scene.id}" failed to render — press → to continue.</div></div>`;
  }
  stage.innerHTML = html;
  const root = stage.firstElementChild;

  requestAnimationFrame(() => {
    if (!root || !root.isConnected) return;
    root.dataset.step = String(stepIndex);
    syncReveals(root, stepIndex);
    if (typeof scene.onStep === "function") {
      try { scene.onStep(root, stepIndex, -1); } catch (e) { console.error(e); }
    }
  });

  updateHud(scene);
}

function applyStep(step) {
  const scene = scenes[sceneIndex];
  const prev = stepIndex;
  stepIndex = clamp(step, 0, stepsOf(scene) - 1);
  const root = stage.firstElementChild;
  if (root) root.dataset.step = String(stepIndex);
  syncReveals(root, stepIndex);
  if (typeof scene.onStep === "function") {
    try { scene.onStep(root, stepIndex, prev); } catch (e) { console.error(e); }
  }
  updateHud(scene);
}

function next() {
  if (isAdvancing) return;
  const scene = scenes[sceneIndex];
  if (stepIndex < stepsOf(scene) - 1) {
    applyStep(stepIndex + 1);
  } else if (sceneIndex < scenes.length - 1) {
    const exitMs = scene.exitDuration || 0;
    if (exitMs > 0) {
      const root = stage.firstElementChild;
      if (root) root.classList.add("is-exiting");
      isAdvancing = true;
      setTimeout(() => {
        isAdvancing = false;
        mountScene(sceneIndex + 1, 0);
      }, exitMs);
    } else {
      mountScene(sceneIndex + 1, 0);
    }
  }
}

function prev() {
  if (isAdvancing) return;
  if (stepIndex > 0) {
    applyStep(stepIndex - 1);
  } else if (sceneIndex > 0) {
    const target = scenes[sceneIndex - 1];
    mountScene(sceneIndex - 1, stepsOf(target) - 1);
  }
}

// Keyboard only: no click-to-advance, no URL hash sync (see CLAUDE.md).
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  switch (e.key) {
    case "ArrowRight":
    case "ArrowDown":
    case " ":
    case "PageDown":
      e.preventDefault();
      next();
      break;
    case "ArrowLeft":
    case "ArrowUp":
    case "PageUp":
      e.preventDefault();
      prev();
      break;
    case "Home":
      e.preventDefault();
      isAdvancing = false;
      mountScene(0, 0);
      break;
    case "End":
      e.preventDefault();
      isAdvancing = false;
      mountScene(scenes.length - 1, stepsOf(scenes[scenes.length - 1]) - 1);
      break;
  }
});

function fit() {
  const pad = 40;
  const sw = (window.innerWidth - pad) / STAGE_W;
  const sh = (window.innerHeight - pad) / STAGE_H;
  stage.style.transform = `scale(${Math.min(sw, sh)})`;
}
window.addEventListener("resize", fit);
fit();

mountScene(0, 0);
