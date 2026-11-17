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
  // ============================================================ 1 Titulka
  {
    id: "title",
    world: "game",
    steps: 2,
    verifyWait: [3200, 900],
    notes:
      "Ahoj, jsem Jan. Tohle je příběh o jednom řádku. (krok 2: anotace, přečíst nebo nechat chvíli viset)",
    render: () => `
      <div class="scene title">
        <div class="title-logo">JEDEN ŘÁDEK</div>
        <div class="title-press">STISKNI →</div>
        <div class="title-abstract" data-from="1">
          <p>Někdy stačí jeden špatný řádek, aby nastal produkční problém.</p>
          <p>Jak si zachovat chladnou hlavu při jeho řešení?</p>
          <p>A ještě lépe, jak zabránit tomu hloupému agentovi, který za nás píše kód, aby dělal chyby?</p>
          <div class="title-author">Jan Marek</div>
        </div>
        <div class="title-bug">${bug({ size: 144, pose: "walk" })}</div>
        <div class="pixel-ground"></div>
      </div>
    `,
    onStep: (root, step, prev) => {
      if (prev === -1 && step === 0) walkThenIdle(root, 2400);
    },
  },

  // ============================================================ 2 Teaser
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

  // ============================================================ 3 Odhalení
  {
    id: "reveal",
    world: "game",
    steps: 2,
    notes:
      "Nikdo ji nenašel. A nemohl: chyba není v řádku, který tam je. Chyběl jeden řádek. Co dělal, se dozvíte za chvíli.",
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

  // ============================================================ 4 Svět
  {
    id: "world",
    world: "game",
    steps: 2,
    notes:
      "Svět: staré obrazovky na backendových Razor šablonách. Firma je léta přepisuje, je to hodně práce. Nové jsou v Reactu nad REST API.",
    render: () => `
      <div class="scene slide world">
        <div class="kicker">Svět</div>
        <h1 class="headline">Obrazovky, které se léta přepisují</h1>
        <div class="screens">
          <figure class="screen-old">
            <div class="mock-old">
              <div class="mo-head">Nastavení</div>
              ${Array.from({ length: 5 }, () => `<div class="mo-row"><span></span><span></span><button>Upravit</button></div>`).join("")}
              <div class="mo-foot"><button>Uložit</button></div>
            </div>
            <figcaption><b>Staré</b> · Razor šablony, HTML z backendu</figcaption>
          </figure>
          <div class="screens-arrow" data-from="1">→</div>
          <figure class="screen-new" data-from="1">
            <div class="mock-new">
              <div class="mn-head"><span></span><button class="mn-danger">Smazat vybrané</button></div>
              ${Array.from({ length: 5 }, (_, i) => `<div class="mn-row"><i class="mn-check${i === 1 || i === 2 ? " on" : ""}"></i><span></span><span class="mn-edit">✎</span></div>`).join("")}
            </div>
            <figcaption><b>Nové</b> · React + REST API</figcaption>
          </figure>
        </div>
      </div>
    `,
  },

  // ============================================================ 5 Proč
  {
    id: "why",
    world: "game",
    steps: 2,
    notes:
      "Proč to stojí za to: nové UI je konzistentní se zbytkem aplikace, lepší pro uživatele, a šlo přidat inline edit a bulk delete. Háček: dělal jsem to jako side projekt. Vedení se to líbilo, ale nikdo mi na to nedal čas.",
    render: () => `
      <div class="scene slide why">
        <div class="kicker">Proč to stojí za to</div>
        <h1 class="headline">Lepší pro uživatele</h1>
        <div class="tiles">
          <div class="tile t-cyan"><div class="tile-ico">▦</div>Konzistentní se zbytkem aplikace</div>
          <div class="tile t-yellow"><div class="tile-ico">☺</div>Lepší UX</div>
          <div class="tile t-lavender"><div class="tile-ico">✎</div>Inline edit</div>
          <div class="tile t-coral"><div class="tile-ico">☑</div>Bulk delete</div>
        </div>
        <div class="sticky" data-from="1">
          <b>Side projekt.</b><br>Vedení se to líbilo.<br>Čas na to nikdo nevyhradil.
        </div>
      </div>
    `,
  },

  // ============================================================ 6 Agent
  {
    id: "agent",
    world: "game",
    steps: 2,
    verifyWait: [900, 2800],
    notes:
      "Tak jsem si vyrobil agenta. Dal jsem mu dokumentaci, jak to lidé dělali dřív. Pro juniory: je to jako onboarding nového kolegy. Pak postup v osmi krocích. (Technické detaily jdou zkrátit, když nezbyde čas.)",
    render: () => `
      <div class="scene slide agent">
        <div class="kicker">Agent</div>
        <h1 class="headline">Tak jsem si vyrobil agenta</h1>
        ${junior(
          `<div class="doc-pic"><i></i><i></i><i></i><i></i></div><div class="arrow">=</div><div class="hello-pic">Ahoj, já jsem nový</div>`,
          "Dokumentace pro agenta = onboarding nového kolegy: jak se to tu dělalo dřív.",
          0,
          "agent-junior"
        )}
        <ol class="pipeline" data-from="1">
          ${[
            "analýza kódu",
            "specifikace",
            "napsat API",
            "spustit backend",
            "vygenerovat API klienta",
            "napsat frontend",
            "feature flag",
            "code review",
          ]
            .map((t, i) => `<li class="stagger-item"><b>${i + 1}</b>${t}</li>`)
            .join("")}
        </ol>
      </div>
    `,
  },

  // ============================================================ 7 …většinou…
  {
    id: "mostly",
    world: "game",
    steps: 2,
    notes:
      "A fungovalo to. Obrazovky byly konzistentní, UX šlo iterovat. ...většinou... (pauza, nechat dojít)",
    render: () => `
      <div class="scene slide mostly">
        <div class="kicker">Výsledek</div>
        <h1 class="headline">Fungovalo to.</h1>
        <p class="lede">Konzistentní obrazovky. UX se dalo iterovat.</p>
        <div class="mini-grid">
          ${Array.from({ length: 6 }, () => `<div class="mini"><div class="mini-head"></div><i></i><i></i><i></i><span class="mini-ok">✓</span></div>`).join("")}
        </div>
        <div class="mostly-big" data-from="1">…většinou…</div>
      </div>
    `,
  },

  // ============================================================ 8 Páteční odpoledne (serious)
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

  // ============================================================ 9 Co se stalo (serious, key visual)
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

  // ============================================================ 10 Krok 1: flag
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

  // ============================================================ 11 Krok 2: bojová sada
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

  // ============================================================ 12 Krok 3: zjistit, pak opravit
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

  // ============================================================ 13 Krok 4: nevím
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

  // ============================================================ 14 Přepnutí do hry
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

  // ============================================================ 15–21 Levels
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

  // ============================================================ 22 Boss fight
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

  // ============================================================ 23 Patch notes
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
            <li class="stagger-item"><span class="ver">v1.6</span>Menší PR, kontext vlastníkům domény předem, vyhrazený čas.</li>
            <li class="stagger-item"><span class="ver">v1.7</span>Flag nejdřív zapnutý na stagingu, pak na produkci.</li>
            <li class="stagger-item"><span class="ver">v1.8</span>Kontrola konzistence dat mezi systémy + alert na rostoucí nesoulad.</li>
          </ul>
        </div>
      </div>
    `,
  },

  // ============================================================ 24 Pointa
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
