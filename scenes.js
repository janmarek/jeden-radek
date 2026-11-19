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

// 10 s countdown in .cd-num (teaser, find-bug). Resets when inactive.
function runCountdown(root, active) {
  clearInterval(root._cd);
  const num = root.querySelector(".cd-num");
  if (!num) return;
  let t = 10;
  num.textContent = String(t);
  if (!active) return;
  root._cd = setInterval(() => {
    if (!num.isConnected) return clearInterval(root._cd);
    t = Math.max(0, t - 1);
    num.textContent = String(t);
    if (t === 0) clearInterval(root._cd);
  }, 1000);
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

// DEV ONLY: quiet link on the title slide that jumps straight to the
// incident (runtime handles [data-goto]). Set to false before the talk.
const DEV_JUMP = true;

// Level template for the game part (slides 15–21).
//   step 0: level card + bug at x0, obstacle visible, fact line
//   step 1: bug moves to x1 (meets the obstacle)
//   step 2: bug at x2 (got through) + "why" line
// Anything calling bug() must be a function (o.extra), because level() runs
// while scenes.js loads, before runtime.js defines bug().
const level = (o) => ({
  id: o.id,
  world: "game",
  steps: o.steps || 3,
  verifyWait: [1200, 2000, 2000, 2000],
  notes: o.notes,
  render: () => `
    <div class="scene level ${o.className || ""}"
         style="--x0:${o.x[0]}px;--x1:${o.x[1]}px;--x2:${o.x[2]}px">
      <div class="lvl-hud">
        <span class="lvl-chip">LEVEL ${o.n}</span>
        <span class="lvl-name">${o.name}</span>
      </div>
      <div class="lvl-desc">${o.desc}</div>
      <div class="lvl-stage">${o.obstacle}</div>
      <div class="lvl-bug">${bug({ size: 144, pose: "idle", className: o.bugClass || "" })}</div>
      ${typeof o.extra === "function" ? o.extra() : o.extra || ""}
      <div class="lvl-why" data-from="2">${o.why}</div>
      <div class="pixel-ground"></div>
    </div>`,
  onStep: (root, step, prev) => {
    if (prev !== -1 && prev !== step) walkThenIdle(root);
    if (o.onStep) o.onStep(root, step, prev);
  },
});

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
        ${DEV_JUMP ? `<span class="dev-jump" data-goto="mostly">incident →</span>` : ""}
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
  // step 0: bug turn/walk/turn → TV pops in (off, black) → screen
  // fades up from black → title
  // step 1: "…tohle se opravdu stalo."
  // step 2: Věřte nevěřte fades out, Mews appears in the TV ·
  // step 3: "software pro hotely"
  {
    id: "true-story",
    world: "game",
    steps: 4,
    verifyWait: [5600, 1200, 1000, 1000],
    notes:
      "Bug přijde domů a pustí si televizi: Věřte nevěřte. (→) …tohle se opravdu stalo. (→) Pracoval jsem v Mews, (→) firma dělá software pro hotely.",
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
  // step 0: modern screen (majority) · 1: older screen appears ·
  // 2: "Backend rendered pages" label stamped over the old one
  {
    id: "mews-pms",
    world: "game",
    steps: 3,
    notes:
      "Mews PMS je hlavní produkt. Firma existuje 14 let. Většina obrazovek je v Reactu nad REST API. Ale jsou tam i starší části: ty renderuje backend pomocí Razor šablon. Říkali jsme jim backend rendered pages.",
    render: () => `
      <div class="scene slide pms">
        <h1 class="headline">Mews PMS</h1>
        <p class="lede">Hlavní produkt. Firma existuje <b>14 let</b>.</p>
        <div class="screens">
          <figure class="screen-new">
            <div class="mock mock-new">
              <div class="mk-head"><span></span><button class="mn-danger">${icon("trash-2", { size: 20, stroke: 2.5 })} Smazat vybrané</button></div>
              ${Array.from({ length: 5 }, (_, i) => `<div class="mk-row"><i class="mn-check${i === 1 || i === 2 ? " on" : ""}"></i><span class="mk-text"></span><span class="mn-edit">${icon("pencil", { size: 30, stroke: 2.75 })}</span></div>`).join("")}
            </div>
            <figcaption><b>Většina</b> · React + REST API</figcaption>
          </figure>
          <figure class="screen-old" data-from="1">
            <div class="mock mock-old">
              <div class="mk-head"><span></span></div>
              ${[180, 120, 220, 150, 200].map((w) => `<div class="mk-row"><span class="mk-text" style="width:${w}px"></span><a class="mo-edit">Upravit</a><a class="mo-edit">Smazat</a></div>`).join("")}
            </div>
            <figcaption><b>Starší části</b> · Razor, HTML z backendu</figcaption>
            <div class="brp-label" data-from="2">Backend rendered pages</div>
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
      "Co je na tom špatně? Jiná technologie, takže stránky vypadají jinak než zbytek aplikace a špatně se rozvíjejí. A pak přijde dilema: potřebuju na takové stránce doplnit něco malého. Doplním to po staru, nebo přepíšu celou stránku?",
    render: () => `
      <div class="scene slide wrong">
        <div class="kicker">Backend rendered pages</div>
        <h1 class="headline">Co je na tom špatně?</h1>
        <ul class="plain-list">
          <li>Jiná technologie</li>
          <li data-from="1">Vypadají jinak než zbytek aplikace</li>
          <li data-from="2">Špatně se rozvíjejí</li>
        </ul>
        <div class="dilemma-line" data-from="3">
          Potřebuju doplnit něco malého:<br><b>po staru</b>, nebo <b>přepsat celou stránku</b>?
        </div>
      </div>
    `,
  },

  // ============================================================ Proč se s tím něco neudělá
  {
    id: "named-problem",
    world: "game",
    steps: 5,
    verifyWait: [900, 900, 900, 1200, 1600],
    notes:
      "Proč se s tím něco neudělá? Ve firmě to byl problém pojmenovaný už několik let. Jenže postaru bylo napsaných nižší stovky stránek. A co zákazníkovi přinese přepis? Oproti novým funkcím nic moc. Přesto se o to pokoušelo mnoho lidí a byl to jeden z cílů firmy v oblasti technických vylepšení. Tak jsem se rozhodl, že to zkusím taky. (Počet čárek je ilustrační.)",
    render: () => `
      <div class="scene slide named">
        <h1 class="headline">Proč se s tím něco neudělá?</h1>
        <ul class="plain-list named-list">
          <li>Ve firmě to byl problém pojmenovaný už několik let.</li>
          <li data-from="1">Postaru bylo napsaných <b>nižší stovky</b> stránek.</li>
          <li data-from="2">Co zákazníkovi přinese přepis? Oproti novým funkcím nic moc.</li>
          <li data-from="3">Přesto se o to pokoušelo mnoho lidí. Jeden z cílů firmy v technických vylepšeních.<span class="li-tally">${tallySvg(7)}</span></li>
          <li data-from="4" class="named-me">Rozhodl jsem se, že to zkusím taky.</li>
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
      "Vyrobil jsem refaktorovacího agenta. Nebylo to těžké: navázal jsem na práci ostatních lidí, kteří napsali dobrou dokumentaci a některé věci částečně automatizovali. Jejich práce taky poskytla příklady, jak se to má dělat. K tomu jsem dodal svou představu, jak má agent postupovat: analýza kódu, specifikace, API, frontendové komponenty, propojit API a frontend, a samozřejmě code review a opravit chyby.",
    render: () => `
      <div class="scene slide agentscene">
        <h1 class="headline">Vyrobil jsem refaktorovacího agenta</h1>
        <div class="ag-fig">${agent({ size: 336 })}</div>
        <div class="ag-a" data-from="1" data-to="4">
          <div class="ag-lead">Nebylo to těžké.</div>
          <ul class="plain-list ag-list">
            <li data-from="2">Navázal jsem na práci ostatních lidí,</li>
            <li data-from="3">kteří napsali dobrou dokumentaci a některé věci částečně automatizovali.</li>
            <li data-from="4">Jejich práce taky poskytla příklady, jak se to má dělat.</li>
          </ul>
        </div>
        <div class="ag-b" data-from="5">
          <div class="ag-lead">K tomu jsem dodal svou představu, jak má agent postupovat:</div>
          <ol class="ag-steps">
            ${[
              "analýza kódu",
              "napsání specifikace",
              "napsat API",
              "napsat frontendové komponenty",
              "propojit API a frontend",
              "samozřejmě udělat code review a opravit chyby",
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
      "A fungovalo to. (→) Agent vytvořil dobrý základ v produkční kvalitě. (→) Lepší UX, (→) vzhled konzistentní se zbytkem aplikace, (→) dalo se to dál vylepšovat (→) a přibyly nové funkce: inline edit a bulk delete.",
    render: () => `
      <div class="scene slide worked">
        <h1 class="headline">Fungovalo to.</h1>
        <p class="lede" data-from="1">Agent vytvořil <b>dobrý základ v produkční kvalitě</b>.</p>
        <div class="tiles">
          <div class="tile t-yellow" data-from="2"><div class="tile-ico">${icon("smile", { size: 64 })}</div>Lepší UX</div>
          <div class="tile t-cyan" data-from="3"><div class="tile-ico">${icon("layout-grid", { size: 64 })}</div>Konzistentní vzhled</div>
          <div class="tile t-lavender" data-from="4"><div class="tile-ico">${icon("trending-up", { size: 64 })}</div>Dá se dál vylepšovat</div>
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
      "Astrid: Nefunguje mi synchronizace do našeho systému. (→) Padá to, hotelové pokoje se objevují ve více kategoriích. (→) Janse: Potvrzuji, v databázi vidím 140 duplicit. (→) Hector: To bude naše nová stránka, vypnu to.",
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
            ${msg("Astrid", "A", "coral", "Nefunguje mi synchronizace do našeho systému.", 0)}
            ${msg("Astrid", "A", "coral", "Padá to, hotelové pokoje se objevují ve více kategoriích.", 1, true)}
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
      "Co se děje? (→) Máš přístup do produkční aplikace? (→) K logům a metrikám? (→) Umíš zjistit, co je v produkční databázi? (→) Máme dost informací? (→) Víš, jak pracovat se systémem na správu incidentů? (→) Jak jsem na tom byl já: produkce ano, logy ano, produkční databáze ne, informace ne, incidenty ano. (→) Příprava je důležitá. Ale když něco nebude optimální, příště to zvládneš líp.",
    render: () => {
      const items = [
        ["Máš přístup do produkční aplikace?", true],
        ["Máš přístup k logům a metrikám?", true],
        ["Umíš zjistit, co je v produkční databázi?", false],
        ["Máme dost informací?", false],
        ["Víš, jak pracovat se systémem na správu incidentů?", true],
      ];
      return `
      <div class="scene slide panic">
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
          Příprava je důležitá. Ale když něco nebude optimální, <b>příště to zvládneš líp.</b>
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
      "Jak reagovat na incident? (→) Feature flag: vypnout. Pro juniory: flag je vypínač funkce, kód zůstane nasazený. (→) Chladná hlava: když nevím, co se děje, první krok je zjistit, co se děje. (→) Informovat. A to je těžké.",
    render: () => `
      <div class="scene slide react">
        <h1 class="headline">Jak reagovat na incident</h1>
        <div class="tiles tiles-3">
          <div class="tile t-cyan" data-from="1"><div class="tile-ico">${icon("toggle-right", { size: 64 })}</div>Feature flag<small>Vypínač funkce. Kód zůstane nasazený, funkce jde vypnout.</small></div>
          <div class="tile t-lavender" data-from="2"><div class="tile-ico">${icon("snowflake", { size: 64 })}</div>Chladná hlava<small>Když nevím, co se děje, první krok je zjistit, co se děje.</small></div>
          <div class="tile t-yellow" data-from="3"><div class="tile-ico">${icon("megaphone", { size: 64 })}</div>Informovat<small>A to je těžké.</small></div>
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
        const x1 = f.x + f.w / 2, y1 = fr.y + fr.h + 10;
        const x2 = t.x + t.w / 2, y2 = t.y - 12;
        const my = (y1 + y2) / 2;
        path.setAttribute("d", `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`);
      };
      link(".dbt-rooms", "id", "room_id", ".lk-room");
      link(".dbt-cats", "id", "room_category_id", ".lk-cat");
    },
  },

  // ============================================================ Oprava kódu
  // 0 top of roomService.ts · 1 scrolls to updateRoom() · 2 the missing line
  // slides in · 3 green "Opraveno" stamp · 4 "Opraveno?"
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
      // The rest of the file is abstract bars (like the old teaser diff);
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
        <h1 class="headline">Oprava kódu</h1>
        <div class="fb-win">
          <div class="diff-head"><span class="diff-title">roomService.ts</span></div>
          <div class="fb-body"><div class="fb-scroll" style="--scroll:${-target * 38}px">${body}</div></div>
        </div>
        <div class="fb-stamp" data-from="3">${icon("circle-check", { size: 56, stroke: 3 })}<span class="swap"><span data-to="3">Opraveno</span><span data-from="4">Opraveno?</span></span></div>
      </div>`;
    },
  },

  // ============================================================ Napravení škod
  {
    id: "damage",
    world: "serious",
    steps: 4,
    notes:
      "Napravení škod. Oprava kódu nestačila: (→) v databázi byl pořád nepořádek. (→) Co přesně se musí smazat a jak to zjistit? (→) A jakým způsobem to vyčistit?",
    render: () => `
      <div class="scene slide damage">
        <div class="kicker">Incident</div>
        <h1 class="headline">Napravení škod</h1>
        <ul class="dm-list">
          <li data-from="1"><span class="dm-ico t-coral">${icon("database", { size: 46 })}</span><span>V databázi byl pořád nepořádek.</span></li>
          <li data-from="2"><span class="dm-ico t-lavender">${icon("search-x", { size: 46 })}</span><span>Co přesně se musí smazat a jak to zjistit?</span></li>
          <li data-from="3"><span class="dm-ico t-yellow">${icon("eraser", { size: 46 })}</span><span>Jakým způsobem to vyčistit?</span></li>
        </ul>
      </div>
    `,
  },

  // ============================================================ Anketa: jak to vyčistit
  // 0 three options (audience votes) · 1–3 pros/cons per option ·
  // 4 the job is what I did, the others fade
  {
    id: "cleanup-poll",
    world: "serious",
    steps: 5,
    notes:
      "Anketa: jak byste to vyčistili? A) naklikat v UI, B) poslat SQL přímo do databáze, C) napsat uklízecí job. Hlasujte rukama. (→) UI: možná by stačilo stávající UI. Jenže nejde to, není v něm vidět ani chyba, ani která kategorie je správná. (→) SQL: není potřeba nic vyrábět, oprava hned. Ale je to velmi nebezpečné a stejně jsem na to neměl práva. (→) Job: pomalé, musím napsat kód a čekat na deploy. Ale rychleji bych to bezpečně stejně nezvládl. Je bezpečný, ukáže rozsah problému a nechá mě rozhodnout. (→) Takže job.",
    render: () => {
      const pro = (t, from) => `<li class="pl-pro" data-from="${from}"><span class="pl-sign">${icon("plus", { size: 22, stroke: 3.5 })}</span><span>${t}</span></li>`;
      const con = (t, from) => `<li class="pl-con" data-from="${from}"><span class="pl-sign">${icon("minus", { size: 22, stroke: 3.5 })}</span><span>${t}</span></li>`;
      const card = (letter, ico, title, items, cls = "") => `
        <div class="pl-card ${cls}">
          <div class="pl-head"><span class="pl-letter">${letter}</span>${icon(ico, { size: 40 })}</div>
          <div class="pl-title">${title}</div>
          <ul class="pl-list">${items}</ul>
        </div>`;
      return `
      <div class="scene slide poll">
        <h1 class="headline">Jak to vyčistit?</h1>
        <div class="pl-cards">
          ${card("A", "mouse-pointer-click", "Naklikat to v UI",
            pro("Možná by stačilo stávající UI.", 1) +
            con("Nejde to: není vidět ani chyba, ani která kategorie je správná.", 1))}
          ${card("B", "terminal", "Poslat SQL přímo do databáze",
            pro("Není potřeba nic vyrábět, oprava hned.", 2) +
            con("Velmi nebezpečné.", 2) +
            con("Stejně nemám práva.", 2))}
          ${card("C", "play", "Napsat uklízecí job",
            con("Pomalé: napsat kód, čekat na deploy. Rychleji bych to bezpečně stejně nezvládl.", 3) +
            pro("Bezpečné.", 3) +
            pro("Ukáže rozsah problému a nechá mě rozhodnout.", 3), "pl-pick")}
        </div>
      </div>`;
    },
  },

  // ============================================================ Jednorázový job (UI)
  // 0 Investigate… with {"hotelIds"} · 1 Run job → JSON with the duplicate
  // assignments (same or different category id? which one is older?) ·
  // 2 Delete… with {"assignmentIds"}, a human picked them
  // Ids are 6-char hex, shortened like git commit hashes.
  {
    id: "job",
    world: "serious",
    steps: 3,
    verifyWait: [900, 1400, 1100],
    notes:
      "Byly to dva joby s jednoduchým UI. První, InvestigateDuplicateRoomCategoryAssignments, dostal JSON se seznamem hotelů. (→) Run job a vyplivl JSON s duplicitními vazbami i s dalšími daty: jsou to stejné kategorie, nebo jiné? Která vazba je starší? (→) Podle toho jsem vybral, co smazat, a dal to druhému jobu, DeleteDuplicateRoomCategoryAssignments. Co smazat, rozhoduje člověk.",
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
      </div>`;
    },
  },

  // ============================================================ Co se stalo (key visual, after the job showed the data)
  {
    id: "what-happened",
    world: "serious",
    steps: 5,
    notes:
      "Klíčový obrázek. Pokoj má kategorii; vztah je v propojovací tabulce, jeden řádek. Změním kategorii v UI. Mělo se stát: starý řádek smazat, nový vložit. Stalo se: nový přibyl, starý zůstal. A UI ukazuje ten nejstarší, takže to vypadá, že se nic nezměnilo.",
    render: () => `
      <div class="scene slide what">
        <div class="kicker">Co se stalo</div>
        <h1 class="headline">Jeden řádek kódu chyběl…</h1>
        <div class="what-left">
          <div class="erd"><span class="erd-box">Pokoj A</span><span class="erd-link"></span><span class="erd-box">Kategorie</span></div>
          <div class="erd-label">propojovací tabulka</div>
          <table class="jt">
            <thead><tr><th>pokoj</th><th>kategorie</th></tr></thead>
            <tbody>
              <tr class="jt-old"><td>A</td><td>X</td></tr>
              <tr class="jt-new" data-from="3"><td>A</td><td>Y</td></tr>
            </tbody>
          </table>
        </div>
        <div class="what-right">
          <div class="ui-card">
            <div class="ui-title">Pokoj A</div>
            <div class="ui-field">Kategorie:
              <span class="swap">
                <b data-to="0">X</b><b class="pick" data-from="1" data-to="3">Y</b><b data-from="4">X</b>
              </span>
            </div>
            <button class="ui-save" data-from="1" data-to="3">Uložit</button>
            <div class="ui-note" data-from="4">UI bere nejstarší řádek</div>
          </div>
        </div>
        <div class="what-caption">
          <span data-from="1" data-to="1">Změním kategorii na Y a uložím.</span>
          <span data-from="2" data-to="2">Mělo se stát: starý řádek smazat, nový vložit.</span>
          <span data-from="3" data-to="3">Stalo se: nový řádek přibyl, <b>starý zůstal</b>.</span>
          <span data-from="4">…a v databázi z něj vznikly dva. Navenek se nic nezměnilo.</span>
        </div>
      </div>
    `,
  },

  // ============================================================ Rozcvička (po incidentu)
  {
    id: "teaser",
    world: "game",
    steps: 2,
    verifyWait: [900, 4000],
    notes:
      "Rozcvička. Tady je pull request, asi 800 řádků. Máte 10 sekund, najděte chybu. Klidně hádejte nahlas. (→ spustí odpočet)",
    render: () => `
      <div class="scene slide teaser">
        <div class="kicker">Rozcvička</div>
        <h1 class="headline">Najdi chybu.</h1>
        <div class="countdown" data-from="1"><span class="cd-num">10</span><span class="cd-unit">s</span></div>
        <div class="diff-win">
          <div class="diff-head">
            <span class="diff-title">Pull request</span>
            <span class="diff-stat"><b class="add">+ ~800</b> řádků změn</span>
          </div>
          <div class="diff-body"><div class="diff-scroll">${diffBars(220, 11)}</div></div>
        </div>
      </div>
    `,
    onStep: (root, step) => runCountdown(root, step === 1),
  },

  // ============================================================ Odhalení
  {
    id: "reveal",
    world: "game",
    steps: 2,
    notes:
      "Nikdo ji nenašel. A nemohl: chyba není v řádku, který tam je. Chyběl jeden řádek, ten, který měl starou vazbu pokoj–kategorie načíst a smazat.",
    render: () => `
      <div class="scene slide reveal">
        <div class="kicker">Odhalení</div>
        <h1 class="headline">Nikdo ji nenašel.</h1>
        <p class="lede" data-from="1">Protože tam není. <b>Chyběl jeden řádek.</b></p>
        <div class="zoom">
          <div class="zoom-gutter">${Array.from({ length: 8 }, () => "<span></span>").join("")}</div>
          <div class="zoom-lines">${diffBars(7, 3, 4)}</div>
          <div class="zoom-tag" data-from="1">tady</div>
        </div>
      </div>
    `,
  },

  // ============================================================ Přepnutí do hry
  {
    id: "switch-to-game",
    world: "game",
    steps: 2,
    verifyWait: [1400, 1200],
    notes:
      "Jak se tam ten řádek vůbec dostal? Pojďme si to zahrát. Hlavní hrdina celou dobu nebyl tým ani agent. Byl to bug. [Vyprávění bugu v 1. osobě je návrh.]",
    render: () => `
      <div class="scene slide switchgame">
        <h1 class="headline center">Jak se tam ten řádek dostal?</h1>
        <div class="hero" data-from="1">
          <div class="bubble">Ahoj. Jsem jeden chybějící řádek.<br><b>Můj cíl: produkce.</b></div>
          ${bug({ size: 216, pose: "idle" })}
        </div>
        <div class="pixel-ground ground-rise"></div>
      </div>
    `,
  },

  // ============================================================ Levels
  level({
    id: "level-1",
    n: 1,
    name: "Spawn",
    desc: "Agent vygeneroval ~800 řádků. Starý kód dělal něco skrytě a v zadání to nebylo.",
    x: [300, 760, 1150],
    bugClass: "bug--stealth",
    obstacle: `<div class="o-diff">${diffBars(26, 5)}</div>`,
    why: "Schopnost: stealth. V diffu mě nikdo nevidí.",
    notes:
      "Level 1, spawn. Agent vygeneruje asi 800 řádků. Starý kód měl skryté chování, načítal stávající data, a nikdo to agentovi neřekl. Bug v diffu není vidět, protože tam chybí.",
  }),
  level({
    id: "level-2",
    n: 2,
    name: "Automatické brány",
    desc: "Formátování, lint, spouštění testů, nastavení v Claude.",
    x: [120, 560, 1260],
    obstacle: `<div class="o-gates">${["formát", "lint", "testy", "nastavení"]
      .map((g) => `<div class="gate"><div class="gate-top">${g}</div><div class="gate-ok" data-from="2">✓</div></div>`)
      .join("")}</div>`,
    why: "Brány hlídají, jak kód vypadá. Ne co v něm chybí.",
    notes:
      "Level 2: automatické brány. Formátování, lint, spouštění testů, nastavení v Claude. Brány, kterými agent bez kontroly neprojde. Jenže všechny kontrolují formu. Chybějící chování žádná nevidí.",
  }),
  level({
    id: "level-3",
    n: 3,
    name: "Testy a Playwright",
    desc: "Testy psal agent ve stejném kontextu jako kód.",
    x: [120, 420, 1240],
    obstacle: `
      <div class="o-shot">
        <div class="shot-head">screenshot</div>
        <div class="shot-body">Pokoj A<br>Kategorie: <b>X</b></div>
        <div class="shot-pass" data-from="1">PASSED ✓</div>
      </div>`,
    why: "Stejný kontext = stejná slepá místa. A screenshot vypadal správně: UI ukazovalo nejstarší řádek.",
    notes:
      "Level 3: testy a Playwright. Testy psané agentem jsou levné, ale pokrývají jen známé problémy. Test ze stejného kontextu má stejná slepá místa jako kód. A screenshot vypadal správně, protože UI ukazovalo nejstarší řádek.",
  }),
  level({
    id: "level-4",
    n: 4,
    name: "PR a review",
    desc: "Velké PR, doména cizího týmu, nikoho tam neznám.",
    x: [120, 380, 1180],
    className: "lvl-jump",
    obstacle: `
      <div class="o-wall">${diffBars(30, 9)}</div>
      <div class="o-boss"><div class="boss-eyes"><i></i><i></i></div><div class="boss-label">reviewer</div></div>`,
    why: "~800 řádků se rozumně reviewovat nedá. Deset menších PR místo dvou bych ale nezvládl.",
    notes:
      "Level 4: PR a review. PR mělo asi 800 řádků, většinu psalo AI. Review z cizího týmu, kde jsem nikoho neznal. Velké PR jsem potřeboval, deset menších místo dvou bych nezvládl. Jenže velké PR se rozumně reviewovat nedá. [Návrh: ironie, pipeline agenta měla vlastní code review, ale ve stejném kontextu.]",
  }),
  level({
    id: "level-5",
    n: 5,
    name: "Databáze",
    desc: "Každé uložení přidalo nový řádek. Databáze to přijala.",
    x: [120, 380, 380],
    className: "lvl-db",
    obstacle: `
      <div class="o-db"><div class="db-top"></div><div class="db-body">pokoj · kategorie</div></div>
      <div class="o-lock" data-from="2"><div class="lock-shackle"></div><div class="lock-body">?</div></div>`,
    // Function: bug() lives in runtime.js, which loads after this file.
    extra: () => `
      <div class="lvl-clones no-walk" data-from="2">
        ${bug({ size: 108, className: "bug--clone" })}
        ${bug({ size: 108, className: "bug--clone" })}
        ${bug({ size: 108, className: "bug--clone" })}
      </div>
      ${junior(`<div class="lock-mini"></div>`, "Unique constraint = zámek: dvojice pokoj–kategorie smí být v tabulce jen jednou.", 2, "db-junior")}`,
    why: "Bez zámku se bug klonuje. <span class='todo'>[ověřit: existoval unique constraint?]</span>",
    notes:
      "Level 5: databáze. Žádný zámek, takže se bug klonuje: každé uložení = nový řádek. Pro juniory: unique constraint je zámek, který duplicitu odmítne. [Otevřená otázka: existoval v DB unique constraint?]",
  }),
  level({
    id: "level-6",
    n: 6,
    name: "Feature flag",
    desc: "Flag byl nejdřív vypnutý.",
    x: [120, 660, 1220],
    className: "lvl-cave",
    obstacle: `
      <div class="o-cave"><div class="cave-sign">FLAG: <span class="swap"><span class="off" data-to="1">VYP</span><span class="on" data-from="2">ZAP</span></span></div></div>
      <div class="zzz" data-from="1" data-to="1">z<span>z</span><span>z</span></div>`,
    why: "Bug asi měsíc spal. Po zapnutí nic nespadlo hned. Zapnutá verze byla málo otestovaná.",
    notes:
      "Level 6: feature flag. Flag byl vypnutý, takže bug spal, asi měsíc po mergi. Když se flag zapnul, nic nespadlo. Zapnutou verzi jsme testovali málo.",
  }),
  level({
    id: "level-7",
    n: 7,
    name: "Pozdní projev",
    desc: "Nic nespadlo. Problém vznikal až při synchronizaci.",
    x: [120, 700, 1180],
    className: "lvl-sync",
    obstacle: `
      <div class="o-pipe"></div>
      <div class="o-world"><div class="world-label">druhý systém</div><div class="world-infect" data-from="2"></div></div>`,
    why: "Bug nakazil jiný svět. Daleko od místa, kde vznikl.",
    notes:
      "Level 7: pozdní projev. Nic nespadlo hned. Problém vznikal až při synchronizaci s druhým systémem. [Název druhého systému a jak se selhání poznalo: zatím neznámé, nevymýšlet.]",
  }),

  // ============================================================ Boss fight
  {
    id: "boss",
    world: "game",
    steps: 2,
    notes: "A boss fight? Ten už jste viděli. Byl to páteční odpoledne.",
    render: () => `
      <div class="scene slide boss">
        <div class="lvl-chip big">BOSS FIGHT</div>
        <h1 class="headline center">Ten už jste viděli.</h1>
        ${notif({ extra: "boss-callback", attrs: 'data-from="1"' })}
        <div class="boss-bug">${bug({ size: 144, pose: "idle" })}</div>
        <div class="pixel-ground"></div>
      </div>
    `,
  },

  // ============================================================ Patch notes
  {
    id: "patch-notes",
    world: "game",
    steps: 2,
    verifyWait: [1800, 1800],
    notes:
      "Patch notes. Agent nedostal výpověď, dostal patch. Nejdřív databáze a testy, pak agent, pak proces. [Obsah je návrh z brainstormu, vybrat.]",
    render: () => `
      <div class="scene slide patch">
        <div class="kicker">Patch notes</div>
        <h1 class="headline">Agent nedostal výpověď. Dostal patch.</h1>
        <div class="changelog">
          <ul class="stagger-fill cl-a">
            <li class="stagger-item"><span class="ver">v1.1</span>Unique constraint na vazbě pokoj–kategorie: databáze duplicitu odmítne.</li>
            <li class="stagger-item"><span class="ver">v1.2</span>Testy na změnu a mazání, ne jen vytvoření. „Ulož dvakrát.“</li>
            <li class="stagger-item"><span class="ver">v1.3</span>Agent nejdřív sepíše skryté chování starého kódu, pak implementuje.</li>
            <li class="stagger-item"><span class="ver">v1.4</span>Porovnávací test staré vs. nové verze, včetně stavu databáze.</li>
          </ul>
          <ul class="stagger-fill cl-b">
            <li class="stagger-item"><span class="ver">v1.5</span>Testy a review dělá agent s jiným kontextem: „Co tu chybí?“</li>
            <li class="stagger-item"><span class="ver">v1.6</span>Menší PR, kontext vlastníkům domény předem.</li>
            <li class="stagger-item"><span class="ver">v1.7</span>Flag nejdřív zapnutý na stagingu, pak na produkci.</li>
            <li class="stagger-item"><span class="ver">v1.8</span>Kontrola konzistence dat mezi systémy + alert na rostoucí nesoulad.</li>
          </ul>
        </div>
      </div>
    `,
  },

  // ============================================================ Pointa
  {
    id: "punchline",
    world: "game",
    steps: 4,
    notes:
      "Agent není hloupý, je doslovný. Udělal přesně to, co jsem mu řekl. Řádek, který chybí, neuvidí člověk ani agent, takže ho musí zastavit systém. Závěr: [vybrat jednu ze tří vět; na slajdu je zatím ‚hra na easy‘]. Díky!",
    render: () => `
      <div class="scene slide punch">
        <h1 class="headline center">Agent není hloupý.<br><span class="hl">Je doslovný.</span></h1>
        <p class="lede center" data-from="1" data-to="2">Udělal přesně to, co jsem mu řekl.<br>O skrytém chování starého kódu mu nikdo neřekl.</p>
        <p class="lede center strong" data-from="2" data-to="2">Řádek, který chybí, neuvidí člověk ani agent.<br>Musí ho zastavit systém.</p>
        <div class="finale" data-from="3">
          <div class="finale-line">Bug nevyhrál, protože byl chytrý.<br>Vyhrál, protože hra byla na <b>easy</b>.</div>
          <div class="finale-thanks">Díky!</div>
        </div>
        <div class="punch-bug" data-from="3">${bug({ size: 108, pose: "idle", facing: "left" })}</div>
        <div class="pixel-ground"></div>
      </div>
    `,
  },

  // ============================================================ DEV
  {
    id: "bug-sheet",
    notes: "DEV ONLY: character sheet hrdiny, před talkem smazat.",
    world: "game",
    render: () => `
      <div class="scene bug-sheet">
        <h2>HRDINA: BUG</h2>
        <div class="sheet-big">
          <figure>${bug({ size: 288, pose: "idle" })}<figcaption>idle (288 px)</figcaption></figure>
          <div class="sheet-note">
            Krunýř = <b>řádky kódu</b>, odsazené jako blok.<br>
            Třetí řádek <b>chybí</b>.<br>
            Paleta přes CSS proměnné <b>--bug-*</b>.
          </div>
        </div>
        <div class="sheet-row">
          <figure>${bug({ size: 108, pose: "walk" })}<figcaption>walk</figcaption></figure>
          <figure>${bug({ size: 108, pose: "jump" })}<figcaption>jump</figcaption></figure>
          <figure>${bug({ size: 108, pose: "idle", facing: "left" })}<figcaption>vlevo</figcaption></figure>
          <figure>${bug({ size: 108, pose: "idle", className: "bug--stealth" })}<figcaption>stealth</figcaption></figure>
          <figure>
            <div class="sheet-clones">
              ${bug({ size: 72, pose: "idle" })}
              ${bug({ size: 72, pose: "idle", className: "bug--clone" })}
              ${bug({ size: 72, pose: "idle", className: "bug--clone" })}
            </div>
            <figcaption>klony</figcaption>
          </figure>
        </div>
      </div>
    `,
  },
];
