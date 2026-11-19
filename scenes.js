// Jeden řádek: scenes.
// Each scene: { id, notes, steps, world, background, backdrop, exitDuration,
//               verifyWait, render(), onStep(root, step, prev) }
// See CLAUDE.md for the lifecycle. Slide plan + facts: docs/brief.md.
// Speaker notes (`notes`) are Czech; presentation.md mirrors them.
//
// Reveal per step without CSS: data-from="N" (visible from step N),
// optional data-to="M" (hidden after step M). See syncReveals() in runtime.js.

// ---------------------------------------------------------------- helpers

// Deterministic pseudo-random so diff art renders identically every time.
function seeded(seed) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

// Abstract diff: coloured bars instead of real code (we don't show invented
// code). kind: add / del / ctx. gapAt inserts the dashed "missing line" slot.
function diffBars(n, seed = 7, gapAt = -1) {
  const rnd = seeded(seed);
  let out = "";
  for (let i = 0; i < n; i++) {
    if (i === gapAt) out += `<div class="dl dl-gap"></div>`;
    const r = rnd();
    const kind = r < 0.6 ? "add" : r < 0.78 ? "del" : "ctx";
    const indent = Math.floor(rnd() * 4);
    const w = 18 + Math.floor(rnd() * 55);
    out += `<div class="dl dl-${kind}" style="--i:${indent};--w:${w}%"></div>`;
  }
  return out;
}

// Bug walks during the CSS move, then stands still.
function walkThenIdle(root, ms = 1600) {
  root.querySelectorAll(".bug").forEach((b) => {
    if (b.closest(".no-walk")) return;
    b.dataset.pose = "walk";
  });
  clearTimeout(root._idleTimer);
  root._idleTimer = setTimeout(() => {
    root.querySelectorAll(".bug").forEach((b) => {
      if (b.isConnected && !b.closest(".no-walk")) b.dataset.pose = "idle";
    });
  }, ms);
}

// Pub-tab tally marks ("čárky na účtu"): groups of 4 strokes + a cross
// stroke, slightly wobbly like a pen. The last stroke (class tally-new) is the
// author's own attempt, drawn in on its step via stroke-dashoffset.
function tallySvg(count) {
  const rnd = seeded(42);
  const j = (n) => (rnd() - 0.5) * n;
  const line = (x1, y1, x2, y2, cls = "") =>
    `<line class="${cls}" pathLength="1" x1="${(x1 + j(3)).toFixed(1)}" y1="${(y1 + j(3)).toFixed(1)}" x2="${(x2 + j(3)).toFixed(1)}" y2="${(y2 + j(3)).toFixed(1)}"/>`;
  let out = "";
  let n = 0;
  const pos = (k) => {
    const group = Math.floor(k / 5);
    const row = Math.floor(group / 2);
    const gx = 24 + (group % 2) * 130;
    return { group, gx, y: 20 + row * 82, inGroup: k % 5 };
  };
  for (; n < count; n++) {
    const p = pos(n);
    if (p.inGroup < 4) {
      const x = p.gx + p.inGroup * 20;
      out += line(x, p.y, x, p.y + 56);
    } else {
      out += line(p.gx - 10, p.y + 48, p.gx + 72, p.y + 8);
    }
  }
  const p = pos(n);
  const x = p.gx + p.inGroup * 20;
  out += line(x, p.y, x, p.y + 56, "tally-new");
  const rows = Math.floor(Math.floor(count / 5) / 2) + 1;
  return `<svg class="tally" viewBox="0 0 300 ${rows * 82 + 4}" aria-hidden="true">${out}</svg>`;
}

// Small "for juniors" sticker: one picture instead of a definition.
const junior = (pic, text, from = 0, extra = "") => `
  <div class="junior ${extra}" data-from="${from}">
    <div class="junior-tag">pro juniory</div>
    <div class="junior-pic">${pic}</div>
    <div class="junior-text">${text}</div>
  </div>`;

// Slack notification like in the bdd deck (Slack mark on the left), in the
// deck's ink-border card style. The date sits right in the card, prominent.
const INCIDENT_MSG = "Řešíme incident, pojď nám pomoct.";
const notif = ({ when = "Pátek 13.&nbsp;8. 16:00", text = INCIDENT_MSG, extra = "", attrs = "" } = {}) => `
  <div class="notif ${extra}" ${attrs}>
    <div class="notif-ico"><img src="img/slack-mark.svg" alt="Slack"></div>
    <div class="notif-body">
      <div class="notif-when">${when}</div>
      <div class="notif-text">${text}</div>
    </div>
  </div>`;

// DEV ONLY: quiet links on the title slide that jump straight to the
// incident and to the game part (runtime handles [data-goto]). Set to false before the talk.
const DEV_JUMP = true;

// ---------------------------------------------------------------- game part
// The game levels are choreographed with one-shot keyframes keyed on step
// flags: the root gets .s1 … .sN while step >= N. Unlike [data-step="N"], a
// flag stays on for later steps, so a splat stays on the ground and a bug
// that crossed stays on the other side. ← removes the flag (instant rewind).
function markSteps(root, step, n) {
  for (let k = 1; k < n; k++) root.classList.toggle(`s${k}`, step >= k);
}

// Timed side effects (pose changes) for the current step. Any new step
// cancels the previous step's pending ones.
function choreo(root, events) {
  (root._choreo || []).forEach(clearTimeout);
  root._choreo = events.map(([ms, fn]) => setTimeout(() => root.isConnected && fn(), ms));
}
// Pose of every bug inside `sel` ("idle" | "walk" | "jump").
function pose(root, sel, p) {
  root.querySelectorAll(`${sel} .bug, ${sel}.bug`).forEach((b) => (b.dataset.pose = p));
}
// Pose script: [[ms, sel, pose], …] → choreo.
const poses = (root, list) => choreo(root, list.map(([ms, sel, p]) => [ms, () => pose(root, sel, p)]));

// Ground strip with holes ([[from, to], …] in stage px). Holes are plain
// gaps (no pit fill); solid pieces keep the brick pattern aligned to the
// stage and get an ink edge next to a hole.
function ground(holes = []) {
  const pieces = [];
  let x = 0;
  holes.forEach(([a, b]) => {
    pieces.push([x, a]);
    x = b;
  });
  pieces.push([x, 1600]);
  return pieces
    .filter(([a, b]) => b > a)
    .map(
      ([a, b]) =>
        `<div class="pixel-ground${a > 0 ? " edge-l" : ""}${b < 1600 ? " edge-r" : ""}" style="left:${a}px;right:auto;width:${b - a}px;background-position:${-a}px 0"></div>`
    )
    .join("");
}

// Level shell: HUD (LEVEL n + name), optional bullet points
// ([[fromStep, html], …], same look as "Co je na tom špatně?"), the level's
// own art, ground (with holes; o.ground === false drops it).
//   o.before(root, step, prev) runs before the step flags change (to read
//   the live position of a looping animation), o.onStep after.
const levelScene = (o) => ({
  id: o.id,
  world: "game",
  steps: o.steps,
  verifyWait: o.verifyWait,
  notes: o.notes,
  render: () => `
    <div class="scene level ${o.className || ""}">
      ${o.ground === false ? "" : ground(o.holes)}
      <div class="lvl-hud">
        <span class="lvl-chip">LEVEL ${o.n}</span>
        <span class="lvl-name">${o.name}</span>
      </div>
      ${o.points ? `<ul class="plain-list lvl-points">${o.points.map(([from, t]) => `<li data-from="${from}">${t}</li>`).join("")}</ul>` : ""}
      ${o.art()}
    </div>`,
  onStep: (root, step, prev) => {
    if (o.before) o.before(root, step, prev);
    markSteps(root, step, o.steps);
    if (o.onStep) o.onStep(root, step, prev);
  },
});

// Signpost on the ground: board on a post, `x` = post centre.
const sign = (text, x, extra = "") =>
  `<div class="sign ${extra}" style="left:${x}px"><div class="sign-board">${text}</div></div>`;

// Pixel mouse pointer (user testing level). K outline, W fill.
const CURSOR_ROWS = [
  "K...........",
  "KK..........",
  "KWK.........",
  "KWWK........",
  "KWWWK.......",
  "KWWWWK......",
  "KWWWWWK.....",
  "KWWWWWWK....",
  "KWWWWWWWK...",
  "KWWWWWWWWK..",
  "KWWWWWKKKKK.",
  "KWWKWWK.....",
  "KWK.KWWK....",
  "KK..KWWK....",
  "K....KWWK...",
  ".....KWWK...",
  "......KK....",
];
const pixelCursor = (px = 5) => `
  <svg class="px-cursor" width="${12 * px}" height="${17 * px}" viewBox="0 0 12 17" shape-rendering="crispEdges" aria-hidden="true">
    ${pixelRects(CURSOR_ROWS, 0, { K: "var(--ink)", W: "var(--paper)" })}
  </svg>`;

// Maze for the "unknown domain" level. # wall, . floor. The bug enters at
// row 1 on the left and leaves at row 6 on the right (checked with a BFS:
// the shortest path never walks left, so the bug never moonwalks).
const MAZE = [
  "#################",
  "....#.....#.....#",
  "#.#.#.###.#.###.#",
  "#...#...#...#...#",
  "#.#####.#####.###",
  "#.#.....#...#...#",
  "#.#.###.#.#.###..",
  "#...#.....#.....#",
  "#################",
];
const MAZE_CELL = 62;
function mazePath() {
  const H = MAZE.length;
  const W = MAZE[0].length;
  const start = [1, 0];
  const end = [6, W - 1];
  const key = ([r, c]) => `${r},${c}`;
  const prev = { [key(start)]: null };
  const queue = [start];
  while (queue.length) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const n = [r + dr, c + dc];
      if (n[0] < 0 || n[0] >= H || n[1] < 0 || n[1] >= W) continue;
      if (MAZE[n[0]][n[1]] === "#" || key(n) in prev) continue;
      prev[key(n)] = [r, c];
      queue.push(n);
    }
  }
  const cells = [];
  for (let p = end; p; p = prev[key(p)]) cells.unshift(p);
  const pt = ([r, c]) => `${c * MAZE_CELL + MAZE_CELL / 2} ${r * MAZE_CELL + MAZE_CELL / 2}`;
  // Start one cell outside on the left, end one cell outside on the right.
  return `M ${pt([1, -1])} ` + cells.map((p) => `L ${pt(p)}`).join(" ") + ` L ${pt([6, W + 1])}`;
}
function mazeSvg() {
  let rects = "";
  MAZE.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === "#") rects += `<rect x="${c}" y="${r}" width="1" height="1"/>`;
    })
  );
  return `<svg class="mz-walls" viewBox="0 0 ${MAZE[0].length} ${MAZE.length}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

// Minesweeper for the "nothing crashed" level. The bug is the player: it
// stands in the middle of the revealed field. Mines hide in the covered
// right part (one already flagged); numbers count them as usual.
const MS_W = 12;
const MS_H = 6;
const MS_CELL = 72;
const MS_MINES = [[1, 8], [3, 8], [4, 7], [2, 10], [4, 10], [0, 11]];
const MS_FLAG = [1, 8];
const msCovered = (r, c) => c >= 8 || (c === 7 && r >= 3);
// Cells the bug opens on step 1 (no mines among them).
const MS_REVEAL = [[3, 7], [5, 7], [5, 8], [5, 9], [4, 9], [3, 9], [5, 10], [5, 11], [4, 11]];
const MS_FLAG_SVG = `
  <svg class="ms-flag" viewBox="0 0 40 48" aria-hidden="true">
    <rect x="19" y="6" width="5" height="34" fill="var(--ink)"/>
    <polygon points="19,5 19,25 4,15" fill="var(--coral)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
    <rect x="8" y="38" width="26" height="6" fill="var(--ink)"/>
  </svg>`;
function minesweeper() {
  const isMine = (r, c) => MS_MINES.some(([mr, mc]) => mr === r && mc === c);
  const opens = (r, c) => MS_REVEAL.some(([rr, rc]) => rr === r && rc === c);
  const count = (r, c) => {
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && isMine(r + dr, c + dc)) n++;
    return n ? `<b class="n${n}">${n}</b>` : "";
  };
  let cells = "";
  for (let r = 0; r < MS_H; r++) {
    for (let c = 0; c < MS_W; c++) {
      if (opens(r, c)) {
        cells += `<div class="ms-cell is-open ms-reveal">${count(r, c)}<div class="ms-cover"></div></div>`;
      } else if (msCovered(r, c)) {
        const flag = r === MS_FLAG[0] && c === MS_FLAG[1] ? MS_FLAG_SVG : "";
        cells += `<div class="ms-cell ms-covered">${flag}</div>`;
      } else {
        cells += `<div class="ms-cell is-open">${count(r, c)}</div>`;
      }
    }
  }
  return `<div class="ms-board" style="--cols:${MS_W};--cell:${MS_CELL}px">${cells}</div>`;
}

// Starburst for the "BUM!" (n spikes), SVG in a 400×400 box.
function starburst(n = 14, rOut = 196, rIn = 120) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? rIn : rOut;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(200 + r * Math.cos(a)).toFixed(1)},${(200 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

// ---------------------------------------------------------------- scenes

const scenes = [
  // ============================================================ Titulka
  {
    id: "title",
    world: "game",
    verifyWait: 3200,
    notes: "Ahoj, jsem Jan. Tohle je příběh o jednom řádku.",
    render: () => `
      <div class="scene title">
        <div class="title-logo">JEDEN ŘÁDEK</div>
        <div class="title-name">Jan Marek</div>
        <div class="title-bug">${bug({ size: 144, pose: "walk" })}</div>
        <div class="pixel-ground"></div>
        ${DEV_JUMP ? `<span class="dev-jump" data-goto="mostly">incident →</span>
        <span class="dev-jump dev-jump-2" data-goto="switch-to-game">hra →</span>` : ""}
      </div>
    `,
    onStep: (root, step, prev) => {
      if (prev === -1) walkThenIdle(root, 2400);
    },
  },

  // ============================================================ Věřte nevěřte
  // The bug (where the title slide left it) turns, walks to the left edge
  // and turns back; a black 90s TV pops in and shows the mood of the
  // "Věřte nevěřte" TV show (Beyond Belief): dark, fog, spotlight, glowing
  // text (Poppins, like the rest of the deck). Original CSS only.
  // step 0: TV pops in right away (bug turns/walks/turns meanwhile) →
  // screen fades up from black → title
  // step 1: "…tohle se opravdu stalo."
  // step 2: Věřte nevěřte fades out, Mews appears in the TV ·
  // step 3: "software pro hotely" · step 4: "> 1000 zaměstnanců, …"
  {
    id: "true-story",
    world: "game",
    steps: 5,
    verifyWait: [3000, 1200, 1000, 1000, 1000],
    notes:
      "Bug přijde domů a pustí si televizi: Věřte nevěřte. (→) …tohle se opravdu stalo. (→) Pracoval jsem v Mews, (→) firma dělá software pro hotely. (→) Přes tisíc zaměstnanců, stovky vývojářů.",
    render: () => `
      <div class="scene truestory">
        <div class="ts-bug">${bug({ size: 144, pose: "idle" })}</div>
        <div class="tv">
          <div class="tv-body">
            <div class="tv-screen">
              <div class="tv-on">
                <div class="bb-spot"></div>
                <div class="bb-fog bb-fog-1"></div>
                <div class="bb-fog bb-fog-2"></div>
                <div class="bb-text" data-to="1">
                  <h1 class="bb-title">Věřte nevěřte</h1>
                  <p class="bb-sub" data-from="1">…tohle se opravdu stalo.</p>
                </div>
                <div class="ts-mews" data-from="2">Mews</div>
                <div class="ts-what" data-from="3">software pro hotely</div>
                <div class="ts-size" data-from="4">&gt;&nbsp;1000 zaměstnanců, stovky vývojářů</div>
              </div>
              <div class="tv-glass"></div>
            </div>
            <div class="tv-bottom">
              <span class="tv-grill"></span>
              <span class="tv-btns"><i></i><i></i><i></i></span>
              <span class="tv-led"></span>
            </div>
          </div>
        </div>
        <div class="pixel-ground"></div>
      </div>
    `,
    // Turn + walk timing must match .ts-bug in styles.css.
    onStep: (root, step, prev) => {
      if (prev !== -1) return;
      const b = root.querySelector(".bug");
      const at = (ms, fn) => setTimeout(() => b.isConnected && fn(), ms);
      at(350, () => b.classList.add("bug--left"));
      at(450, () => (b.dataset.pose = "walk"));
      at(1950, () => (b.dataset.pose = "idle"));
      at(2150, () => b.classList.remove("bug--left"));
    },
  },

  // ============================================================ Mews PMS
  // step 0: headline · 1: modern screen (majority) · 2: older screen ·
  // 3: "Firma existuje 14 let" under the old one · 4: "Backend rendered
  // pages" label stamped over the old one
  {
    id: "mews-pms",
    world: "game",
    steps: 5,
    notes:
      "Mews PMS je hlavní produkt. (→) Většina obrazovek je v Reactu nad REST API. (→) Ale jsou tam i starší části: ty renderuje backend pomocí Razor šablon. (→) Firma existuje 14 let. (→) Říkali jsme jim backend rendered pages.",
    render: () => `
      <div class="scene slide pms">
        <h1 class="headline">Mews PMS</h1>
        <p class="lede">Hlavní produkt.</p>
        <div class="screens">
          <figure class="screen-new" data-from="1">
            <div class="mock mock-new">
              <div class="mk-head"><span></span><button class="mn-danger">${icon("trash-2", { size: 20, stroke: 2.5 })} Smazat vybrané</button></div>
              ${Array.from({ length: 5 }, (_, i) => `<div class="mk-row"><i class="mn-check${i === 1 || i === 2 ? " on" : ""}"></i><span class="mk-text"></span><span class="mn-edit">${icon("pencil", { size: 30, stroke: 2.75 })}</span></div>`).join("")}
            </div>
            <figcaption><b>Většina</b> · React + REST API</figcaption>
          </figure>
          <figure class="screen-old" data-from="2">
            <div class="mock mock-old">
              <div class="mk-head"><span></span></div>
              ${[180, 120, 220, 150, 200].map((w) => `<div class="mk-row"><span class="mk-text" style="width:${w}px"></span><a class="mo-edit">Upravit</a><a class="mo-edit">Smazat</a></div>`).join("")}
            </div>
            <figcaption><b>Starší části</b> · Razor, HTML z backendu</figcaption>
            <div class="pms-age" data-from="3">Firma existuje <b>14 let</b>.</div>
            <div class="brp-label" data-from="4">Backend rendered pages</div>
          </figure>
        </div>
      </div>
    `,
  },

  // ============================================================ Co je na tom špatně (+ dilema)
  {
    id: "whats-wrong",
    world: "game",
    steps: 4,
    notes:
      "Co je na tom špatně? Vypadají trochu jinak než zbytek aplikace. (→) Je to legacy kód, vývojáři do toho neradi sahají. (→) Způsobuje technické problémy. (→) A pak přijde dilema: potřebuju na takové stránce doplnit něco malého. Doplním to postaru, nebo přepíšu celou stránku?",
    render: () => `
      <div class="scene slide wrong">
        <div class="kicker">Backend rendered pages</div>
        <h1 class="headline">Co je na tom špatně?</h1>
        <ul class="plain-list">
          <li>Vypadají trochu jinak než zbytek aplikace</li>
          <li data-from="1">Legacy kód, vývojáři do toho neradi sahají</li>
          <li data-from="2">Způsobuje technické problémy</li>
        </ul>
        <div class="dilemma-line" data-from="3">
          Potřebuju doplnit něco malého:<br><b>postaru</b>, nebo <b>přepsat celou stránku</b>?
        </div>
      </div>
    `,
  },

  // ============================================================ Proč se s tím nic nedělá
  // 0 headline only · 1–5 the points one by one (5 draws the coral tally)
  {
    id: "named-problem",
    world: "game",
    steps: 6,
    verifyWait: [900, 900, 900, 900, 1200, 1600],
    notes:
      "Proč se s tím nic nedělá? (→) Ve firmě to byl problém pojmenovaný už několik let. (→) Jenže postaru bylo napsaných nižší stovky stránek. (→) A co zákazníkovi přinese přepis? Oproti novým funkcím nic moc. (→) Přesto se o to pokoušelo mnoho lidí a byl to jeden z cílů firmy v oblasti technických vylepšení. (→) Tak jsem se rozhodl, že to zkusím taky. (Počet čárek je ilustrační.)",
    render: () => `
      <div class="scene slide named">
        <h1 class="headline">Proč se s tím nic nedělá?</h1>
        <ul class="plain-list named-list">
          <li data-from="1">Problém pojmenovaný několik let.</li>
          <li data-from="2"><b>Nižší stovky</b> stránek.</li>
          <li data-from="3">Co to přinese zákazníkovi?</li>
          <li data-from="4">Přesto to zkoušelo řešit mnoho lidí.<span class="li-tally">${tallySvg(7)}</span></li>
          <li data-from="5" class="named-me">Rozhodl jsem se, že to zkusím taky.</li>
        </ul>
      </div>
    `,
  },

  // ============================================================ Agent
  // One scene so the agent stays on stage while the content swaps:
  // 0 agent jumps in · 1 "Nebylo to těžké" · 2–4 bullets ·
  // 5 swap to "how the agent should work" · 6–11 the six steps one by one
  {
    id: "agent",
    world: "game",
    steps: 12,
    verifyWait: [1400, 900, 900, 900, 900, 1000, 900, 900, 900, 900, 900, 900],
    notes:
      "Vyrobil jsem refaktorovacího agenta. Nebylo to těžké: (→) navázal jsem na práci ostatních. (→) Napsali dobrou dokumentaci a některé věci částečně zautomatizovali. (→) Jejich práci jsem použil jako příklad. (→) K tomu jsem dodal svou představu fungování: (→) zanalyzovat kód, napsat specifikaci, napsat API, napsat frontendové komponenty, propojit API a frontend, udělat code review a opravit chyby.",
    render: () => `
      <div class="scene slide agentscene">
        <h1 class="headline">Vyrobil jsem refaktorovacího agenta</h1>
        <div class="ag-fig">${agent({ size: 336 })}</div>
        <div class="ag-a" data-from="1" data-to="4">
          <div class="ag-lead">Nebylo to těžké.</div>
          <ul class="plain-list ag-list">
            <li data-from="2">Navázal jsem na práci ostatních.</li>
            <li data-from="3">Napsali dobrou dokumentaci a některé věci částečně zautomatizovali.</li>
            <li data-from="4">Jejich práci jsem použil jako příklad.</li>
          </ul>
        </div>
        <div class="ag-b" data-from="5">
          <div class="ag-lead">K tomu jsem dodal svou představu fungování:</div>
          <ol class="ag-steps">
            ${[
              "zanalyzovat kód",
              "napsat specifikaci",
              "napsat API",
              "napsat frontendové komponenty",
              "propojit API a frontend",
              "udělat code review a opravit chyby",
            ]
              .map((t, k) => `<li data-from="${6 + k}"><b>${k + 1}</b>${t}</li>`)
              .join("")}
          </ol>
        </div>
        <div class="pixel-ground"></div>
      </div>
    `,
  },

  // ============================================================ Fungovalo to
  // 0 headline · 1 "dobrý základ" · 2–5 benefit cards pop in one by one
  {
    id: "worked",
    world: "game",
    steps: 6,
    verifyWait: [900, 900, 900, 900, 900, 1200],
    notes:
      "A fungovalo to. (→) Agent vytvořil dobrý základ v produkční kvalitě. (→) Lepší UX, (→) jednotný vzhled se zbytkem aplikace, (→) snadné další vylepšování (→) a přibyly nové funkce: inline edit a bulk delete.",
    render: () => `
      <div class="scene slide worked">
        <h1 class="headline">Fungovalo to.</h1>
        <p class="lede" data-from="1">Agent vytvořil <b>dobrý základ v produkční kvalitě</b>.</p>
        <div class="tiles">
          <div class="tile t-yellow" data-from="2"><div class="tile-ico">${icon("smile", { size: 64 })}</div>Lepší UX</div>
          <div class="tile t-cyan" data-from="3"><div class="tile-ico">${icon("layout-grid", { size: 64 })}</div>Jednotný vzhled</div>
          <div class="tile t-lavender" data-from="4"><div class="tile-ico">${icon("trending-up", { size: 64 })}</div>Snadné další vylepšování</div>
          <div class="tile t-coral" data-from="5"><div class="tile-ico">${icon("pencil", { size: 56 })}${icon("trash-2", { size: 56 })}</div>Nové funkce<small>inline edit, bulk delete</small></div>
        </div>
      </div>
    `,
  },

  // ============================================================ …většinou… + Pátek 16:00
  // 0 "…většinou…" · 1 Slack notification slides in from the right into the
  // top-right corner, over the word (the incident starts here)
  {
    id: "mostly",
    world: "game",
    steps: 2,
    verifyWait: [900, 1400],
    notes:
      "…většinou… (pauza, nechat dojít) (→) Pátek 13. srpna, 16:00. Přijde zpráva na Slacku: Řešíme incident, pojď nám pomoct.",
    render: () => `
      <div class="scene slide mostly">
        <div class="mostly-big">…většinou…</div>
        ${notif({ extra: "ms-notif", attrs: 'data-from="1"' })}
      </div>
    `,
  },

  // ============================================================ Slack: incident thread
  // Slack window in the deck's card style; messages arrive one per step.
  // 0 Astrid (sync) · 1 Astrid (categories) · 2 Janse (140 duplicates) ·
  // 3 Hector (turns it off)
  {
    id: "slack",
    world: "serious",
    steps: 4,
    verifyWait: [1200, 900, 900, 1200],
    notes:
      "Astrid: Nefunguje synchronizace do našeho systému. (→) Padá to, hotelové pokoje mají více kategorií. (→) Janse: Potvrzuji, v databázi vidím 140 duplicit. (→) Hector: To bude naše nová stránka, vypnu to.",
    render: () => {
      const msg = (who, initial, color, text, from, cont = false) => `
        <div class="sl-msg${cont ? " sl-cont" : ""}" data-from="${from}">
          <div class="sl-avatar" style="background:var(--${color})">${cont ? "" : initial}</div>
          <div class="sl-body">
            ${cont ? "" : `<div class="sl-name">${who}</div>`}
            <div class="sl-text">${text}</div>
          </div>
        </div>`;
      return `
      <div class="scene slide slackscene">
        <div class="sl-win">
          <div class="sl-head"><img src="img/slack-mark.svg" alt=""><span>#incident-duplicite-category-assignments</span></div>
          <div class="sl-feed">
            ${msg("Astrid", "A", "coral", "Nefunguje synchronizace do našeho systému.", 0)}
            ${msg("Astrid", "A", "coral", "Padá to, hotelové pokoje mají více kategorií.", 1, true)}
            ${msg("Janse", "J", "cyan", "Potvrzuji, v databázi vidím <b>140 duplicit</b>.", 2)}
            ${msg("Hector", "H", "lavender", "To bude naše nová stránka, vypnu to.", 3)}
          </div>
        </div>
      </div>`;
    },
  },

  // ============================================================ Co se děje? + checklist
  // 0 headline + panic emoji · 1–5 checklist questions one by one ·
  // 6 my own answers (✓ ✓ ✗ ✗ ✓) · 7 takeaway
  {
    id: "panic",
    world: "serious",
    steps: 8,
    verifyWait: [900, 700, 700, 700, 700, 700, 1600, 900],
    notes:
      "Co se děje? (→) Přístup do produkční aplikace. (→) Přístup k logům a metrikám. (→) Přístup do produkční databáze. (→) Dost informací. (→) Znalost systému na správu incidentů. (→) Jak jsem na tom byl já: produkce ano, logy ano, produkční databáze ne, informace ne, incidenty ano. (→) Příprava je důležitá. Ale buď v klidu, příště to zvládneš líp.",
    render: () => {
      const items = [
        ["Přístup do produkční aplikace", true],
        ["Přístup k logům a metrikám", true],
        ["Přístup do produkční databáze", false],
        ["Dost informací", false],
        ["Znalost systému na správu incidentů", true],
      ];
      return `
      <div class="scene slide panic">
        <div class="kicker">Incident</div>
        <h1 class="headline">Co se děje?</h1>
        <div class="pn-emoji" aria-hidden="true">😱</div>
        <ul class="pn-list">
          ${items
            .map(
              ([t, ok], k) => `
            <li data-from="${k + 1}" style="--k:${k}">
              <span class="pn-box ${ok ? "ok" : "no"}">${icon(ok ? "check" : "x", { size: 34, stroke: 3.5 })}</span>${t}
            </li>`
            )
            .join("")}
        </ul>
        <div class="pn-takeaway" data-from="7">
          Příprava je důležitá. Ale buď v klidu, <b>příště to zvládneš líp.</b>
        </div>
      </div>`;
    },
  },

  // ============================================================ Jak reagovat
  // 0 headline · 1–3 cards: feature flag, chladná hlava, informovat
  {
    id: "react",
    world: "serious",
    steps: 4,
    verifyWait: [900, 900, 900, 1200],
    notes:
      "Jak reagovat? (→) Feature flag: vypnout. Pro juniory: flag je vypínač funkce, kód zůstane nasazený. (→) Chladná hlava: když nevím, co se děje, první krok je zjistit, co se děje. (→) Informovat. A to je těžké.",
    render: () => `
      <div class="scene slide react">
        <div class="kicker">Incident</div>
        <h1 class="headline">Jak reagovat</h1>
        <div class="tiles tiles-3">
          <div class="tile t-cyan" data-from="1"><div class="tile-ico">${icon("toggle-right", { size: 64 })}</div>Feature flag</div>
          <div class="tile t-lavender" data-from="2"><div class="tile-ico">${icon("snowflake", { size: 64 })}</div>Chladná hlava</div>
          <div class="tile t-yellow" data-from="3"><div class="tile-ico">${icon("megaphone", { size: 64 })}</div>Informovat</div>
        </div>
      </div>
    `,
  },

  // ============================================================ Co bylo rozbité: editace pokoje
  // 0 room table · 1 Upravit on 101 opens the side panel · 2 category
  // Standard → Deluxe · 3 save: "Uloženo", panel closes · 4 the row still
  // says Standard (highlighted)
  {
    id: "room-edit",
    world: "serious",
    steps: 5,
    verifyWait: [900, 1000, 900, 1000, 900],
    notes:
      "Co bylo rozbité? Obyčejná stránka: seznam pokojů, u každého tlačítko Upravit. (→) Otevře se formulář v bočním panelu: číslo pokoje, patro a hlavně kategorie. (→) Změním kategorii ze Standard na Deluxe (→) a uložím. Uloženo. (→) A kategorie je pořád Standard.",
    render: () => {
      const rooms = [
        ["101", "1", "Standard"],
        ["102", "1", "Standard"],
        ["201", "2", "Deluxe"],
        ["202", "2", "Suite"],
      ];
      return `
      <div class="scene slide roomedit">
        <div class="kicker">Incident</div>
        <h1 class="headline">Co bylo rozbité?</h1>
        <div class="re-win">
          <div class="re-head">Pokoje
            <span class="re-toast" data-from="3">${icon("check", { size: 28, stroke: 3.5 })} Uloženo</span>
          </div>
          <div class="re-row re-th"><span>číslo</span><span>patro</span><span>kategorie</span><span></span></div>
          ${rooms
            .map(
              ([n, f, c], i) => `
            <div class="re-row${i === 0 ? " re-hit" : ""}">
              <span>${n}</span><span>${f}</span><span class="re-cat">${c}</span>
              <span><span class="re-edit">${icon("pencil", { size: 22 })} Upravit</span></span>
            </div>`
            )
            .join("")}
          <div class="re-panel">
            <div class="re-ptitle">Upravit pokoj</div>
            <label class="re-field"><span>Číslo pokoje</span><span class="re-input">101</span></label>
            <label class="re-field"><span>Patro</span><span class="re-input">1</span></label>
            <label class="re-field"><span>Kategorie</span>
              <span class="re-input re-select">
                <span class="swap"><span data-to="1">Standard</span><span data-from="2">Deluxe</span></span>
                ${icon("chevron-down", { size: 30 })}
              </span>
            </label>
            <span class="re-save">Uložit</span>
          </div>
        </div>
      </div>`;
    },
  },

  // ============================================================ Jak to vypadalo v databázi
  // 0 rooms + room_categories · 1 the join table + dotted links to both ·
  // 2 the save from room-edit added a row, the old one stayed
  {
    id: "db-tables",
    world: "serious",
    steps: 3,
    verifyWait: [900, 1000, 1000],
    notes:
      "Jak to vypadalo v databázi. Tabulka pokojů a tabulka kategorií. (→) Mezi nimi propojovací tabulka room_category_assignments: který pokoj má kterou kategorii, kdo a kdy vazbu založil a jestli je smazaná. (→) Uložení přidalo nový řádek, ale ten starý zůstal.",
    render: () => {
      const tbl = (name, cols, rows, cls = "", attrs = "") => `
        <div class="dbt-tbl ${cls}" ${attrs}>
          <div class="dbt-name">${icon("database", { size: 26 })} ${name}</div>
          <div class="dbt-frame">
            <table class="dbt">
              <thead><tr>${cols.map((c) => `<th data-col="${c}">${c}</th>`).join("")}</tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;
      const tr = (cells, attrs = "") => `<tr ${attrs}>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
      const asg = (id, r, c, at) => [id, r, c, "admin", at, "false"];
      return `
      <div class="scene slide dbtables">
        <div class="kicker">Incident</div>
        <h1 class="headline">Jak to vypadalo v databázi</h1>
        ${tbl("rooms", ["id", "number", "floor"], [[1, "101", 1], [2, "102", 1], [3, "201", 2], [4, "202", 2]].map((r) => tr(r)).join(""), "dbt-rooms")}
        ${tbl("room_categories", ["id", "name"], [[1, "Standard"], [2, "Deluxe"], [3, "Suite"]].map((r) => tr(r)).join(""), "dbt-cats")}
        ${tbl(
          "room_category_assignments",
          ["id", "room_id", "room_category_id", "created_by", "created_at", "deleted"],
          tr(asg(1, 1, 1, "2026-07-02 09:14"), 'class="dbt-old"') +
            tr(asg(2, 2, 1, "2026-07-02 09:15")) +
            tr(asg(3, 3, 2, "2026-07-02 09:15")) +
            tr(asg(4, 4, 3, "2026-07-02 09:16")) +
            tr(asg(5, 1, 2, "2026-08-13 15:42"), 'class="dbt-new"'),
          "dbt-main",
          'data-from="1"'
        )}
        <svg class="dbt-links" data-from="1" viewBox="0 0 1600 900" aria-hidden="true">
          <path class="lk-room"/><path class="lk-cat"/>
        </svg>
        <div class="dbt-caption" data-from="2">Uložení přidalo řádek,<br><b>ale starý zůstal.</b></div>
      </div>`;
    },
    // Dotted links rooms.id → room_id and room_categories.id → room_category_id.
    // Measured with offsets (layout px, unaffected by the stage scale and the
    // data-from translate), so the tables can move without touching this.
    onStep: (root) => {
      const pos = (el) => {
        let x = 0, y = 0;
        for (let e = el; e && e !== root; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
        return { x, y, w: el.offsetWidth, h: el.offsetHeight };
      };
      const link = (fromTbl, fromCol, toCol, sel) => {
        const fromTh = root.querySelector(`${fromTbl} th[data-col="${fromCol}"]`);
        const frame = root.querySelector(`${fromTbl} .dbt-frame`);
        const toTh = root.querySelector(`.dbt-main th[data-col="${toCol}"]`);
        const path = root.querySelector(`.dbt-links ${sel}`);
        if (!fromTh || !frame || !toTh || !path) return;
        const f = pos(fromTh), fr = pos(frame), t = pos(toTh);
        const x1 = f.x + f.w / 2, y1 = fr.y + fr.h + 12;
        const x2 = t.x + t.w / 2, y2 = t.y - 14;
        const my = (y1 + y2) / 2;
        path.setAttribute("d", `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`);
      };
      link(".dbt-rooms", "id", "room_id", ".lk-room");
      link(".dbt-cats", "id", "room_category_id", ".lk-cat");
    },
  },

  // ============================================================ Oprava kódu
  // 0 top of roomService.ts · 1 scrolls to updateRoom() · 2 the missing line
  // slides in · 3 green "Opraveno" stamp · 4 it fades to yellow "Opraveno?"
  {
    id: "find-bug",
    world: "serious",
    steps: 5,
    verifyWait: [900, 1300, 1000, 900, 900],
    notes:
      "Oprava kódu. Soubor s logikou pokojů. (→) A tady je funkce updateRoom. Najdete chybu? (→) Chyba není v žádném řádku, který tam je. Chyběl jeden řádek: loadCategories. Bez něj je room.categories prázdné, takže se stará vazba nikdy nesmaže a vždycky se jen přidá nová. (→) Opraveno. (→) …opraveno?",
    render: () => {
      const KW = /("[^"]*")|\b(import|from|export|async|function|return|const|await|if)\b|\b([A-Za-z_]\w*)(?=\()/g;
      const hl = (l) =>
        l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(KW, (m, str, kw, fn) =>
            str ? `<span class="cs">${m}</span>` : kw ? `<span class="ck">${m}</span>` : `<span class="cf">${m}</span>`);
      const MISSING = "  await loadCategories(room);";
      // The rest of the file is abstract bars (same look as the level diffs);
      // only updateRoom() is real code. Blank lines every few rows.
      const bars = (n, seed) => {
        const rnd = seeded(seed);
        return Array.from({ length: n }, (_, i) => {
          if (i % 5 === 4) return "";
          const r = rnd();
          const kind = r < 0.5 ? "add" : r < 0.75 ? "ctx" : "del";
          const indent = i % 5 === 0 ? 0 : 1 + Math.floor(rnd() * 2);
          return { kind, indent, w: 140 + Math.floor(rnd() * 520) };
        });
      };
      const fn = [
        `export async function updateRoom(input: UpdateRoomInput) {`,
        `  const room = await getRoom(input.roomId);`,
        null,
        `  room.number = input.number;`,
        `  room.floor = input.floor;`,
        ``,
        `  if (room.categories.length > 0) {`,
        `    await deleteCategoryAssignment(room.categories[0]);`,
        `  }`,
        `  await createCategoryAssignment(room, input.categoryId);`,
        ``,
        `  await saveRoom(room);`,
        `}`,
      ];
      const before = bars(20, 11);
      const file = [...before, ...fn, "", ...bars(10, 23)];
      const target = before.length;
      let n = 0;
      const body = file
        .map((l) =>
          l === null
            ? `<div class="fb-line fb-missing"><span class="fb-no">+</span><span class="fb-code">${hl(MISSING)}</span><span class="fb-tag">jeden řádek</span></div>`
            : typeof l === "object"
            ? `<div class="fb-line"><span class="fb-no">${++n}</span><span class="fb-code"><span class="fb-bar dl-${l.kind}" style="margin-left:${l.indent * 30}px;width:${l.w}px"></span></span></div>`
            : `<div class="fb-line"><span class="fb-no">${++n}</span><span class="fb-code">${hl(l)}</span></div>`
        )
        .join("");
      return `
      <div class="scene slide findbug">
        <div class="kicker">Incident</div>
        <h1 class="headline">Oprava kódu</h1>
        <div class="fb-win">
          <div class="diff-head"><span class="diff-title">roomService.ts</span></div>
          <div class="fb-body"><div class="fb-scroll" style="--scroll:${-target * 38}px">${body}</div></div>
        </div>
        <div class="stamp fb-stamp" data-from="3"><span class="fb-ico">${icon("circle-check", { size: 56, stroke: 3 })}${icon("circle-help", { size: 56, stroke: 3 })}</span><span>Opraveno<span class="fb-q">?</span></span></div>
      </div>`;
    },
  },

  // ============================================================ Napravení škod
  {
    id: "damage",
    world: "serious",
    steps: 4,
    notes:
      "Napravení škod. Oprava kódu nestačila: (→) v databázi zůstal nepořádek. (→) Co přesně smazat? (→) A jakým způsobem to vyčistit?",
    render: () => `
      <div class="scene slide damage">
        <div class="kicker">Incident</div>
        <h1 class="headline">Napravení škod</h1>
        <ul class="dm-list">
          <li data-from="1"><span class="dm-ico t-coral">${icon("database", { size: 46 })}</span><span>V databázi zůstal nepořádek.</span></li>
          <li data-from="2"><span class="dm-ico t-lavender">${icon("search", { size: 46 })}</span><span>Co přesně smazat?</span></li>
          <li data-from="3"><span class="dm-ico t-yellow">${icon("eraser", { size: 46 })}</span><span>Jakým způsobem to vyčistit?</span></li>
        </ul>
      </div>
    `,
  },

  // ============================================================ Anketa: jak to vyčistit
  // 0 headline · 1–3 the three cards (titles only) one by one, audience
  // votes · 4–6 pros/cons per card · 7 the job is what I did, the others fade
  {
    id: "cleanup-poll",
    world: "serious",
    steps: 8,
    notes:
      "Anketa: jak byste to vyčistili? (→) A) naklikat v UI, (→) B) pustit SQL v databázi, (→) C) uklízecí job. Hlasujte rukama. (→) UI: možná by stačilo stávající UI. Jenže v něm není vidět ani chyba, ani která kategorie je správná. (→) SQL: oprava hned. Ale je to velmi nebezpečné a stejně jsem na to neměl práva. (→) Job: pomalé, musím napsat kód a čekat na deploy. Ale je bezpečný, ukáže rozsah problému a nechá mě rozhodnout. (→) Takže job.",
    render: () => {
      const pro = (t, from) => `<li class="pl-pro" data-from="${from}"><span class="pl-sign">${icon("plus", { size: 22, stroke: 3.5 })}</span><span>${t}</span></li>`;
      const con = (t, from) => `<li class="pl-con" data-from="${from}"><span class="pl-sign">${icon("minus", { size: 22, stroke: 3.5 })}</span><span>${t}</span></li>`;
      const card = (letter, title, items, from, cls = "") => `
        <div class="pl-card ${cls}" data-from="${from}">
          <div class="pl-head"><span class="pl-letter">${letter}</span></div>
          <div class="pl-title">${title}</div>
          <ul class="pl-list">${items}</ul>
        </div>`;
      return `
      <div class="scene slide poll">
        <div class="kicker">Napravení škod</div>
        <h1 class="headline">Jak to vyčistit?</h1>
        <div class="pl-cards">
          ${card("A", "Naklikat to v UI",
            pro("Možná stačí stávající UI.", 4) +
            con("Chyba v UI není vidět.", 4), 1)}
          ${card("B", "Pustit SQL v DB",
            pro("Oprava hned.", 5) +
            con("Velmi nebezpečné.", 5) +
            con("Nemám práva.", 5), 2)}
          ${card("C", "Uklízecí job",
            con("Pomalé: kód a deploy.", 6) +
            pro("Bezpečné.", 6) +
            pro("Ukáže rozsah, rozhodnu já.", 6), 3, "pl-pick")}
        </div>
      </div>`;
    },
  },

  // ============================================================ Jednorázový job (UI)
  // 0 Investigate… with {"hotelIds"} · 1 Run job → JSON with the duplicate
  // assignments (same or different category id? which one is older?) ·
  // 2 Delete… with {"assignmentIds"}, a human picked them · 3 green
  // "Hotovo" stamp. Ids are 6-char hex, shortened like git commit hashes.
  {
    id: "job",
    world: "serious",
    steps: 4,
    verifyWait: [900, 1400, 1100, 900],
    notes:
      "Byly to dva joby s jednoduchým UI. První, InvestigateDuplicateRoomCategoryAssignments, dostal JSON se seznamem hotelů. (→) Run job a vyplivl JSON s duplicitními vazbami i s dalšími daty: jsou to stejné kategorie, nebo jiné? Která vazba je starší? (→) Podle toho jsem vybral, co smazat, a dal to druhému jobu, DeleteDuplicateRoomCategoryAssignments. Co smazat, rozhoduje člověk. (→) Hotovo.",
    render: () => {
      const s = (v) => `<span class="js">"${v}"</span>`;
      const k = (v) => `<span class="jk">"${v}"</span>`;
      const a = (id, cat, at, cls) =>
        `      { ${k("id")}: ${s(id)}, ${k("categoryId")}: <span class="${cls}">${s(cat)}</span>,\n        ${k("createdAt")}: ${s(at)}, ${k("createdBy")}: ${s("admin")} }`;
      const investigateOut = [
        `[`,
        `  { ${k("room")}: ${s("101")}, ${k("assignments")}: [`,
        a("7c1e4a", "a10b3c", "2026-07-02 09:14", "jo-diff") + ",",
        a("e905b2", "c44d7e", "2026-08-13 15:42", "jo-diff") + " ] },",
        `  { ${k("room")}: ${s("202")}, ${k("assignments")}: [`,
        a("2b8a6f", "f3e2a9", "2026-07-02 09:16", "jo-same") + ",",
        a("91fd03", "f3e2a9", "2026-08-27 14:31", "jo-same") + " ] },",
        `  …`,
        `]`,
      ].join("\n");
      const ids = ["91fd03", "4e7a1c", "d2093f"];
      const list = (key) => `{\n  ${k(key)}: [\n${ids.map((i) => `    ${s(i)}`).join(",\n")}\n  ]\n}`;
      return `
      <div class="scene slide job">
        <div class="kicker">Napravení škod</div>
        <h1 class="headline">Jednorázový job</h1>
        <div class="jo-win">
          <div class="jo-head">
            <span class="jo-label">Job</span>
            <span class="jo-name swap">
              <span data-to="1">InvestigateDuplicateRoomCategoryAssignments</span>
              <span data-from="2">DeleteDuplicateRoomCategoryAssignments</span>
            </span>
            ${icon("chevron-down", { size: 30 })}
          </div>
          <div class="jo-body">
            <div class="jo-in">
              <div class="jo-cap">Input</div>
              <div class="jo-box swap">
<pre data-to="1">{
  ${k("hotelIds")}: [
    ${s("8d3f21")},
    ${s("b71c5e")}
  ]
}</pre>
<pre data-from="2">${list("assignmentIds")}</pre>
              </div>
              <span class="jo-run">${icon("play", { size: 24 })} Run job</span>
            </div>
            <div class="jo-out">
              <div class="jo-cap">Output</div>
              <div class="swap">
<pre class="jo-empty" data-to="0">–</pre>
<pre data-from="1" data-to="1">${investigateOut}</pre>
<pre data-from="2">${list("deleted")}</pre>
              </div>
            </div>
          </div>
        </div>
        <div class="jo-human" data-from="2">Co smazat, rozhoduje <b>člověk</b>.</div>
        <div class="stamp jo-done" data-from="3">${icon("circle-check", { size: 56, stroke: 3 })}Hotovo</div>
      </div>`;
    },
  },

  // ============================================================ Přepnutí do hry
  // Headline "Proč se to tedy stalo?". Ground is there from the start.
  // 0 agent jumps in right away · 1 he throws out five bugs (arcs) and the
  // order appears at the same time (tail-less bubble, centre)
  {
    id: "switch-to-game",
    world: "game",
    steps: 2,
    verifyWait: [1400, 2400],
    notes:
      "Proč se to tedy stalo? Pojďme si to zahrát. Přijde agent (→) a vyrobí pět bugů: Běžte a zničte produkci!",
    render: () => `
      <div class="scene intro-game">
        <h1 class="headline ig-title">Proč se to tedy stalo?</h1>
        ${ground()}
        <div class="ig-agent">${agent({ size: 280 })}</div>
        <div class="ig-bugs">${[0, 1, 2, 3, 4]
          .map((i) => `<div class="ig-bug" style="--i:${i}"><div class="ig-arc">${bug({ size: 108, pose: "jump" })}</div></div>`)
          .join("")}</div>
        <div class="bubble ig-bubble" data-from="1">Běžte a zničte produkci!</div>
      </div>
    `,
    onStep: (root, step, prev) => {
      markSteps(root, step, 2);
      if (step < 1) return choreo(root, []), pose(root, ".ig-bugs", "jump");
      if (prev < 1) poses(root, [0, 1, 2, 3, 4].map((i) => [800 + i * 220, `.ig-bug:nth-child(${i + 1})`, "idle"]));
    },
  },

  // ============================================================ Levels
  // L1 static checks = three floating islands (format / lint / types) that
  // drop like crushers. 0 islands loop · 1 bug 1 walks under code format
  // (held up) and lint flattens it into a coral splat · 2 bug 2 walks
  // through all three (the loops restart in sync with it, so every island
  // is up while it passes) · 3 note (hooks), left of the islands
  levelScene({
    id: "level-1",
    n: 1,
    name: "Statické kontroly",
    steps: 4,
    verifyWait: [1200, 2400, 3400, 1000],
    className: "l1",
    notes:
      "Level 1: statické kontroly. Code format, lint, type checking. Fungují jako buchary. (→) Prvního bugu rozmázne lint. (→) Druhý projde, protože kontrolují formu, ne chování. (→) Dají se nastavit třeba v Claude jako post-edit nebo stop hook.",
    art: () => {
      // Bug 2 walks 120 → 1300 px in 3 s; island i (220 px wide) starts its
      // cycle 0.15 s before the bug reaches it, so it stays up for 1.2 s.
      const v = 1180 / 3;
      const xs = [640, 900, 1160];
      const labels = ["code format", "lint", "type checking"];
      const islands = xs
        .map((x, i) => {
          const delay = ((x - 110 - 156 - 120) / v - 0.15).toFixed(2);
          return `<div class="crusher" style="left:${x - 110}px;--idle:${-0.7 * i - 0.3}s;--pass:${delay}s"><div class="crusher-plate">${labels[i]}</div></div>`;
        })
        .join("");
      return `
        <div class="l1-crushers">${islands}</div>
        <svg class="l1-splat" viewBox="0 0 220 24" aria-hidden="true"><ellipse cx="110" cy="15" rx="104" ry="9"/></svg>
        <div class="l1-bug l1-bug1">${bug({ size: 108 })}</div>
        <div class="l1-bug l1-bug2">${bug({ size: 108 })}</div>
        <div class="l1-note" data-from="3">Dají se nastavit třeba v Claude jako <b>post-edit</b> nebo <b>stop hook</b>.</div>`;
    },
    // Islands ease back up from wherever their loop was before a scripted
    // step takes over (--y0, see the L1 CSS).
    before: (root, step, prev) => {
      if (step <= prev || (step !== 1 && step !== 2)) return;
      root.querySelectorAll(".crusher").forEach((c) => {
        c.style.setProperty("--y0", `${new DOMMatrix(getComputedStyle(c).transform).m42}px`);
      });
    },
    onStep: (root, step, prev) => {
      if (step <= prev) return choreo(root, []), pose(root, ".l1-bug", "idle");
      if (step === 1) poses(root, [[300, ".l1-bug1", "walk"], [1700, ".l1-bug1", "idle"]]);
      if (step === 2) poses(root, [[0, ".l1-bug2", "walk"], [3000, ".l1-bug2", "idle"]]);
    },
  }),

  // L2 tests = two gaps (unit / integration).
  // 0 gaps · 1 "dřív silné" · 2 bug jumps the first gap, stops at the
  // second (too wide) · 3 "dnes menší hodnota" + the agent jumps in, builds
  // a floating bridge, the bug walks across and away
  levelScene({
    id: "level-2",
    n: 2,
    name: "Testy",
    steps: 4,
    verifyWait: [1200, 900, 2000, 5000],
    className: "l2",
    holes: [[560, 720], [980, 1300]],
    points: [
      [1, "Dřív velmi silná ochrana."],
      [3, "Dnes menší hodnota, pokud testy píše <b>stejný agent jako kód</b>."],
    ],
    notes:
      "Level 2: testy. Unit testy a integrační testy, dvě díry, které musí bug přeskočit. (→) Dřív to byla velmi silná ochrana. (→) První díru bug přeskočí, druhá je moc široká. (→) Jenže dnes mají testy menší hodnotu, pokud je píše stejný agent jako kód. Agent přijde a bugovi postaví most.",
    art: () => `
      ${sign("unit testy", 470)}
      ${sign("integrační testy", 880)}
      <div class="l2-bridge">${[0, 1, 2, 3].map((i) => `<i style="--i:${i}"></i>`).join("")}</div>
      <div class="l2-agent">${agent({ size: 224 })}</div>
      <div class="l2-bug"><div class="l2-arc">${bug({ size: 108 })}</div></div>`,
    onStep: (root, step, prev) => {
      if (step <= prev) return choreo(root, []), pose(root, ".l2-bug", "idle");
      if (step === 2)
        poses(root, [[0, ".l2-bug", "walk"], [600, ".l2-bug", "jump"], [1300, ".l2-bug", "walk"], [1600, ".l2-bug", "idle"]]);
      if (step === 3) poses(root, [[2000, ".l2-bug", "walk"], [4600, ".l2-bug", "idle"]]);
    },
  }),

  // L3 automated code review = spike traps in the middle; teleport doors
  // (pulsing cyan mist) visible all the time before and after them; the
  // bug beams out in the first door and in at the second.
  // 0 traps + doors · 1–2 points · 3 walk, beam out, beam in, walk on
  levelScene({
    id: "level-3",
    n: 3,
    name: "Automatizované code review",
    steps: 4,
    verifyWait: [1200, 900, 900, 3000],
    className: "l3",
    points: [
      [1, "Agent měl vlastní krok code review."],
      [2, "Řeší především známé chyby."],
    ],
    notes:
      "Level 3: automatizované code review. (→) Agent měl vlastní krok code review. (→) Řeší především známé chyby. (→) Jenže tenhle bug nebyl známý, takže se pastem prostě vyhnul.",
    art: () => {
      const spikes = (n) => {
        let pts = "0,80";
        for (let i = 0; i < n; i++) pts += ` ${i * 36 + 18},6 ${(i + 1) * 36},80`;
        return `<svg class="trap" viewBox="0 0 ${n * 36} 80" width="${n * 36}" height="80" aria-hidden="true"><polygon points="${pts}"/></svg>`;
      };
      return `
        <div class="l3-traps">${spikes(4)}${spikes(4)}${spikes(4)}</div>
        <div class="tp-door" style="left:458px"></div>
        <div class="tp-door" style="left:1238px"></div>
        <div class="beam beam-out"></div>
        <div class="beam beam-in"></div>
        <div class="l3-bug"><div class="l3-tp">${bug({ size: 108 })}</div></div>`;
    },
    onStep: (root, step, prev) => {
      if (step <= prev) return choreo(root, []), pose(root, ".l3-bug", "idle");
      if (step === 3)
        poses(root, [[0, ".l3-bug", "walk"], [780, ".l3-bug", "idle"], [1430, ".l3-bug", "walk"], [2600, ".l3-bug", "idle"]]);
    },
  }),

  // L4 user testing: three bugs walk in, one hides behind a bush, the
  // pointer clicks the other two away and disappears.
  // 0 scene · 1–3 points · 4 action · 5 the problem
  levelScene({
    id: "level-4",
    n: 4,
    name: "Testování uživatelem",
    steps: 6,
    verifyWait: [1200, 900, 900, 900, 4400, 1000],
    className: "l4",
    points: [
      [1, "Proklikej aplikaci. Vypadá ok?"],
      [2, "Lze částečně automatizovat."],
      [3, "Nedeterministické."],
      [5, "<b>Problém:</b> chyba byla vizuálně nenápadná. Při výběru stejné kategorie vypadalo UI správně."],
    ],
    notes:
      "Level 4: testování uživatelem. (→) Proklikej aplikaci. Vypadá ok? (→) Lze částečně automatizovat: agent pustí Playwright, pořídí screenshoty a podívá se na ně. (→) Je to nedeterministické. (→) Dva bugy chytíme, třetí se schová. (→) Problém: chyba byla vizuálně nenápadná, a když jsem vybral stejnou kategorii, UI vypadalo správně.",
    art: () => `
      <div class="l4-bug l4-a">${bug({ size: 108 })}</div>
      <div class="l4-bush"><i></i><i></i><i></i></div>
      <div class="l4-bug l4-b">${bug({ size: 108 })}</div>
      <div class="l4-bug l4-c">${bug({ size: 108 })}</div>
      <div class="poof poof-b"></div>
      <div class="poof poof-c"></div>
      <div class="l4-cursor">${pixelCursor(5)}</div>`,
    onStep: (root, step, prev) => {
      if (step <= prev) return choreo(root, []), pose(root, ".l4-bug", "idle");
      if (step === 4) poses(root, [[0, ".l4-bug", "walk"], [1600, ".l4-bug", "idle"]]);
    },
  }),

  // L5 feature flag: a wide gap, a moving platform labelled FEATURE FLAG.
  // 0 platform shuttles · 1 point · 2 the platform comes to the left edge
  // (from wherever its loop was), the bug steps on, goes half-stealth,
  // rides across and steps off, together with the catch
  levelScene({
    id: "level-5",
    n: 5,
    name: "Feature flag",
    steps: 3,
    verifyWait: [1600, 900, 5200],
    className: "l5",
    holes: [[460, 1180]],
    points: [
      [1, "Funkci jde zapnout a vypnout, kdyby byl problém."],
      [2, "Ale kvůli tomu se na chybu přišlo <b>později</b>."],
    ],
    notes:
      "Level 5: feature flag. (→) Díky flagu jde funkci zapnout a vypnout, kdyby byl problém. (→) Ale právě kvůli tomu se na chybu přišlo později: bug na flag naskočí, trochu se zneviditelní a dostane se na druhou stranu.",
    art: () => `
      <div class="l5-plat"><span>FEATURE FLAG</span></div>
      <div class="l5-bug">${bug({ size: 108 })}</div>`,
    before: (root, step, prev) => {
      if (step === 2 && prev < 2) {
        const plat = root.querySelector(".l5-plat");
        plat.style.setProperty("--p0", getComputedStyle(plat).left);
      }
    },
    onStep: (root, step, prev) => {
      if (step <= prev) return choreo(root, []), pose(root, ".l5-bug", "idle");
      if (step === 2)
        poses(root, [[0, ".l5-bug", "walk"], [1100, ".l5-bug", "idle"], [3700, ".l5-bug", "walk"], [4800, ".l5-bug", "idle"]]);
    },
  }),

  // L6 domain knowledge (the bug's obstacle; I lacked it) = a maze (no ground, coral walls on the cream).
  // 0 maze · 1–2 points · 3 the bug finds its way through (offset-path)
  levelScene({
    id: "level-6",
    n: 6,
    name: "Znalost domény",
    steps: 4,
    verifyWait: [1200, 900, 900, 4600],
    className: "l6",
    ground: false,
    points: [
      [1, "Cizí část aplikace: nevěděl jsem přesně, jak vše funguje."],
      [2, "Vím, kdo mi udělá review?"],
    ],
    notes:
      "Level 6: znalost domény. Tou by se bug zastavil. (→) Jenže já refaktoroval cizí část aplikace a nevěděl jsem přesně, jak všechno funguje. (→) Vím, kdo mi udělá review? Hůř se shání, když nevím ani, který tým to má na starosti. (→) Bug se tu vyzná líp než já.",
    art: () => `
      <div class="l6-maze" style="width:${MAZE[0].length * MAZE_CELL}px;height:${MAZE.length * MAZE_CELL}px">
        ${mazeSvg()}
        <div class="mz-bug" style="offset-path:path('${mazePath()}')">${bug({ size: 54 })}</div>
      </div>`,
    onStep: (root, step, prev) => {
      if (step <= prev) return choreo(root, []), pose(root, ".mz-bug", "idle");
      if (step === 3) poses(root, [[0, ".mz-bug", "walk"], [4200, ".mz-bug", "idle"]]);
    },
  }),

  // L7 code review: a long PR keeps scrolling with two bugs inside it,
  // below the fold at first, so they only show up once it scrolls. No ground.
  // 0 PR · 1–2 points
  levelScene({
    id: "level-7",
    n: 7,
    name: "Code review",
    steps: 3,
    verifyWait: [1600, 900, 1000],
    className: "l7",
    ground: false,
    points: [
      [1, "Posílal jsem velké PR, aby projekt běžel dopředu rychleji."],
      [2, "10 malých PR se ověří snáz než jedno velké."],
    ],
    notes:
      "Level 7: code review. Ve velkém PR se bugy schovají snadno. (→) Posílal jsem velké PR, aby projekt běžel dopředu rychleji. (→) Deset malých PR se ověří snáz než jedno velké.",
    art: () => {
      const half = (seed) => `<div class="l7-half">${diffBars(34, seed)}
        <div class="l7-hidden" style="top:${26 * 19}px;left:520px">${bug({ size: 54, pose: "idle" })}</div>
        <div class="l7-hidden" style="top:${31 * 19}px;left:200px">${bug({ size: 54, pose: "idle", facing: "left" })}</div>
      </div>`;
      return `
        <div class="l7-pr">
          <div class="l7-head"><span>Pull request</span><span class="l7-files">Files changed</span></div>
          <div class="l7-body"><div class="l7-scroll">${half(11)}${half(11)}</div></div>
        </div>`;
    },
  }),

  // L8 crash monitoring (the bug didn't crash, so it never fired) = minesweeper without a frame. The bug is the player
  // standing in the middle of the revealed field; one mine is flagged.
  // No ground. 0 board · 1 the bug hops, a group of cells opens at once ·
  // 2 point
  levelScene({
    id: "level-8",
    n: 8,
    name: "Sledování pádů",
    steps: 3,
    verifyWait: [1200, 1200, 900],
    className: "l8",
    ground: false,
    points: [[2, "Padajícího kódu bychom si všimli hned."]],
    notes:
      "Level 8: sledování pádů. Jenže bug nezpůsoboval crash. Bug tu hraje hledání min: většina pole je odkrytá. (→) Odkryje další políčka a zase nic nevybuchlo. (→) Padajícího kódu bychom si všimli hned.",
    art: () => `
      <div class="l8-board">
        ${minesweeper()}
        <div class="ms-player">${bug({ size: 108, pose: "idle" })}</div>
      </div>`,
  }),

  // ============================================================ Bug vyhrál
  // 0 bug walks up to the production server · 1 BUM: starburst, server
  // alarm, screen shake, the bug cheers
  {
    id: "bug-wins",
    world: "game",
    steps: 2,
    verifyWait: [2200, 1600],
    notes: "Bug došel až na produkci. (→) Bum. Bug vyhrál.",
    render: () => `
      <div class="scene bw">
        ${ground()}
        <div class="bw-shake">
          <svg class="bw-star" viewBox="0 0 400 400" aria-hidden="true">
            <polygon class="bw-star-out" points="${starburst(14, 196, 128)}"/>
            <polygon class="bw-star-in" points="${starburst(14, 150, 96)}"/>
          </svg>
          <div class="bw-boom">BUM!</div>
          <div class="bw-server">
            <div class="bw-label">PRODUKCE</div>
            ${[0, 1, 2, 3].map(() => `<div class="bw-slot"><i></i><i></i><i></i></div>`).join("")}
          </div>
          <div class="bw-bug">${bug({ size: 144 })}</div>
        </div>
        <div class="bw-title" data-from="1">BUG VYHRÁL</div>
      </div>
    `,
    onStep: (root, step, prev) => {
      markSteps(root, step, 2);
      if (step === 0) poses(root, [[0, ".bw-bug", "walk"], [2000, ".bw-bug", "idle"]]);
      if (step === 1) poses(root, [[0, ".bw-bug", "jump"]]);
    },
  },

  // ============================================================ Co tedy s tím
  // 0 question · 1–4 the four points · 5 thanks
  {
    id: "takeaways",
    world: "game",
    steps: 6,
    notes:
      "Co tedy s tím? (→) Možná by nebylo od věci držet se best practices, třeba malých PR. (→) Refaktorovacího agenta jsme vylepšili, aby se přesně tohle příště už nestalo. (→) Nestačí skoro dobře, jeden řádek může všechno pokazit. (→) Jde o to zmenšit pravděpodobnost chyby. Na sto procent úspěšní nikdy nebudeme. (→) Díky!",
    render: () => `
      <div class="scene slide takeaways">
        <h1 class="headline">Co tedy s tím?</h1>
        <ul class="plain-list tk-list">
          <li data-from="1">Možná by nebylo od věci držet se best practices, třeba <b>malých&nbsp;PR</b>.</li>
          <li data-from="2">Refaktorovacího agenta jsme <b>vylepšili</b>, aby se přesně tohle příště už nestalo.</li>
          <li data-from="3">Nestačí <b>skoro dobře</b>, jeden řádek může vše pokazit.</li>
          <li data-from="4">Jde o to <b>zmenšit pravděpodobnost</b> chyby. Na 100&nbsp;% úspěšní nikdy nebudeme.</li>
        </ul>
        <div class="tk-thanks" data-from="5">Díky!</div>
        <div class="tk-agent">${agent({ size: 224 })}</div>
        ${ground()}
      </div>
    `,
  },
];
