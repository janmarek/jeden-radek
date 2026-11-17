// Jeden řádek: scenes.
// Each scene: { id, notes, steps, world, background, backdrop, exitDuration,
//               render(), onStep(root, step, prev) }
// See CLAUDE.md for the lifecycle. Slide plan + facts: docs/brief.md.

const scenes = [
  {
    id: "title",
    notes: "Titulka: retro úvodní obrazovka, bug přijde zleva. Anotace zazní ústně.",
    world: "game",
    verifyWait: 3200,
    render: () => `
      <div class="scene title">
        <div class="title-logo">JEDEN ŘÁDEK</div>
        <div class="title-press">STISKNI →</div>
        <div class="title-bug">${bug({ size: 144, pose: "walk" })}</div>
        <div class="pixel-ground"></div>
      </div>
    `,
    // Walk in, then stop: switch the sprite to idle once the 2.4s
    // left-transition has played. Going back re-mounts in walk pose.
    onStep: (root, step) => {
      const b = root.querySelector(".bug");
      if (!b) return;
      b.dataset.pose = "walk";
      clearTimeout(root._idleTimer);
      root._idleTimer = setTimeout(() => {
        if (b.isConnected) b.dataset.pose = "idle";
      }, 2400);
    },
  },

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
