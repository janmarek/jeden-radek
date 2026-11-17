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
      </div>
    `,
    onStep: (root, step, prev) => {
      if (prev === -1) walkThenIdle(root, 2400);
    },
  },

  // ============================================================ Věřte nevěřte
  // The bug comes "home" and a big 90s black TV pops in above it; on its screen the mood
  // of the "Věřte nevěřte" TV show (Beyond Belief): dark, fog, spotlight,
  // glowing serif, plus CRT grain, scanlines and flicker. Original CSS only.
  // step 0: bug walks in → TV pops in → screen turns on → title resolves
  // step 1: "…tohle se opravdu stalo."
  // step 2: Mews (outside the TV) · step 3: "software pro hotely"
  {
    id: "true-story",
    world: "game",
    steps: 4,
    verifyWait: [5200, 1200, 1000, 1000],
    notes:
      "Bug přijde domů a pustí si televizi: Věřte nevěřte. (→) …tohle se opravdu stalo. (→) Pracoval jsem v Mews, (→) firma dělá software pro hotely.",
    render: () => `
      <div class="scene truestory">
        <div class="ts-bug">${bug({ size: 144, pose: "walk" })}</div>
        <div class="tv">
          <div class="tv-body">
            <div class="tv-screen">
              <div class="tv-on">
                <div class="bb-spot"></div>
                <div class="bb-fog bb-fog-1"></div>
                <div class="bb-fog bb-fog-2"></div>
                <div class="bb-glitch">
                  <h1 class="bb-title">Věřte nevěřte</h1>
                  <p class="bb-sub" data-from="1">…tohle se opravdu stalo.</p>
                </div>
                <div class="tv-grain"></div>
                <div class="tv-static"></div>
                <div class="tv-roll"></div>
                <div class="tv-flash"></div>
              </div>
              <div class="tv-scan"></div>
              <div class="tv-glass"></div>
            </div>
            <div class="tv-bottom">
              <span class="tv-grill"></span>
              <span class="tv-btns"><i></i><i></i><i></i></span>
              <span class="tv-led"></span>
            </div>
          </div>
        </div>
        <div class="ts-mews" data-from="2">Mews</div>
        <div class="ts-what" data-from="3">software pro hotely</div>
        <div class="pixel-ground"></div>
      </div>
    `,
    onStep: (root, step, prev) => {
      if (prev === -1) walkThenIdle(root, 1900);
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

  // ============================================================ …většinou…
  {
    id: "mostly",
    world: "game",
    steps: 2,
    notes:
      "A fungovalo to. Nové obrazovky byly konzistentní se zbytkem aplikace, lepší pro uživatele, a šlo přidat inline edit a bulk delete. UX se dalo iterovat. ...většinou... (pauza, nechat dojít)",
    render: () => `
      <div class="scene slide mostly">
        <h1 class="headline">Fungovalo to.</h1>
        <p class="lede">Lepší pro uživatele. UX se dalo iterovat.</p>
        <div class="tiles">
          <div class="tile t-cyan"><div class="tile-ico">${icon("layout-grid", { size: 64 })}</div>Konzistentní se zbytkem aplikace</div>
          <div class="tile t-yellow"><div class="tile-ico">${icon("smile", { size: 64 })}</div>Lepší UX</div>
          <div class="tile t-lavender"><div class="tile-ico">${icon("pencil", { size: 64 })}</div>Inline edit</div>
          <div class="tile t-coral"><div class="tile-ico">${icon("square-check-big", { size: 64 })}</div>Bulk delete</div>
        </div>
        <div class="mostly-big" data-from="1">…většinou…</div>
      </div>
    `,
  },

  // ============================================================ Páteční odpoledne (serious)
  {
    id: "friday",
    world: "serious",
    background: "var(--ink)",
    steps: 2,
    verifyWait: [1200, 1200],
    notes:
      "Pátek odpoledne. Přijde zpráva od kolegů: duplikují se řádky. [Znění zprávy je zástupné, doplnit skutečné.]",
    render: () => `
      <div class="scene slide friday">
        <div class="kicker">Incident</div>
        <h1 class="headline">Pátek, odpoledne</h1>
        ${appWindow({
          theme: "chat",
          header: `<span># tým</span>`,
          width: 900,
          height: 440,
          className: "friday-win",
          body: `
            <div class="chat-day">pátek</div>
            <div class="chat-msg" data-from="1">
              <div class="chat-avatar">K</div>
              <div>
                <div class="chat-name">Kolega</div>
                <div class="chat-text">Hele, duplikují se nám řádky. Můžeš se mrknout?</div>
              </div>
            </div>`,
        })}
      </div>
    `,
  },

  // ============================================================ Co se stalo (serious, key visual)
  {
    id: "what-happened",
    world: "serious",
    background: "var(--ink)",
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

  // ============================================================ Krok 1: flag
  {
    id: "stop-bleeding",
    world: "serious",
    background: "var(--ink)",
    steps: 3,
    notes:
      "Krok 1: zastavit krvácení. Vypnul jsem feature flag. Pro juniory: flag je vypínač funkce. A pak: víkend se neřešilo.",
    render: () => `
      <div class="scene slide flag">
        <div class="kicker">Krok 1</div>
        <h1 class="headline">Zastavit krvácení</h1>
        <div class="switch"><div class="switch-knob"></div><span class="switch-on">ZAP</span><span class="switch-off">VYP</span></div>
        <div class="switch-label">nové UI</div>
        <p class="lede flag-weekend" data-from="2">Víkend se neřešilo.</p>
        ${junior(
          `<div class="mini-switch"></div>`,
          "Feature flag = vypínač funkce. Kód zůstane nasazený, funkce jde vypnout.",
          0,
          "flag-junior"
        )}
      </div>
    `,
  },

  // ============================================================ Krok 2: bojová sada
  {
    id: "access",
    world: "serious",
    background: "var(--ink)",
    steps: 2,
    notes:
      "Krok 2: bojová sada. Přístupy si ověř předem: produkce, observability, databáze. Kolega přístup do produkční databáze měl, já ne. Tenhle slajd si klidně vyfoťte.",
    render: () => `
      <div class="scene slide access">
        <div class="kicker">Krok 2 · vyfoť si</div>
        <h1 class="headline">Přístupy si ověř předem</h1>
        <ul class="checklist">
          <li><i></i>Produkce</li>
          <li><i></i>Observability: logy, metriky</li>
          <li><i></i>Databáze</li>
        </ul>
        <div class="access-me" data-from="1">
          <div><span class="ok">✓</span> Kolega přístup do produkční databáze měl.</div>
          <div><span class="no">✗</span> Já ne.</div>
        </div>
      </div>
    `,
  },

  // ============================================================ Krok 3: zjistit, pak opravit
  {
    id: "investigate",
    world: "serious",
    background: "var(--ink)",
    steps: 3,
    notes:
      "Krok 3: nejdřív zjistit, pak opravit. UI skutečný stav neukazovalo. Napsal jsem jednorázový job: vypíše, co v databázi opravdu je, a umí smazat vybrané řádky. Co smazat, rozhoduje člověk. Deploy trvá, ale rychleji to stejně nezvládnu.",
    render: () => `
      <div class="scene slide investigate">
        <div class="kicker">Krok 3</div>
        <h1 class="headline">Nejdřív zjistit, pak opravit</h1>
        ${appWindow({
          variant: "frame",
          theme: "terminal",
          title: "jednorázový job",
          width: 820,
          height: 380,
          className: "job-win",
          body: `
            <div class="term">
              <div class="t-dim">1 · výpis skutečného stavu</div>
              <div data-from="1">pokoj A → X <span class="t-dim">(nejstarší)</span></div>
              <div data-from="1">pokoj A → Y</div>
              <div data-from="1" class="t-dim">[…]</div>
              <div class="t-dim t-gap" data-from="1">2 · smazat vybrané (rozhoduje člověk)</div>
              <div data-from="1"><span class="t-box">[x]</span> pokoj A → …</div>
            </div>`,
        })}
        <blockquote class="quote" data-from="2">Deploy trvá.<br>Rychleji to stejně nezvládnu.</blockquote>
      </div>
    `,
  },

  // ============================================================ Krok 4: nevím
  {
    id: "dont-know",
    world: "serious",
    background: "var(--ink)",
    steps: 3,
    notes:
      "Krok 4: komunikace. Nejtěžší věta incidentu je ‚nevím‘. Pomáhá vzorová věta: co nevím, co zjišťuju a kdy dám vědět. [Vzorová věta je návrh, potvrdit znění.]",
    render: () => `
      <div class="scene slide dontknow">
        <div class="kicker">Krok 4</div>
        <h1 class="headline huge">„Nevím.“</h1>
        <p class="lede" data-from="1">Nejtěžší věta celého incidentu.</p>
        <div class="template" data-from="2">
          <span>Zatím nevím.</span>
          <span>Zjišťuju <b>X</b>.</span>
          <span>Další update v <b>15:00</b>.</span>
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
    onStep: (root, step) => {
      clearInterval(root._cd);
      const num = root.querySelector(".cd-num");
      if (!num) return;
      let t = 10;
      num.textContent = String(t);
      if (step !== 1) return;
      root._cd = setInterval(() => {
        if (!num.isConnected) return clearInterval(root._cd);
        t = Math.max(0, t - 1);
        num.textContent = String(t);
        if (t === 0) clearInterval(root._cd);
      }, 1000);
    },
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
        <div class="boss-callback" data-from="1">
          <div class="chat-day">pátek odpoledne</div>
          <div class="chat-msg is-on"><div class="chat-avatar">K</div><div class="chat-text">Hele, duplikují se nám řádky…</div></div>
        </div>
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
