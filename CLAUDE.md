# CLAUDE.md

Presentation **Jeden řádek** (Czech, 20 min) for the ReactGirls meetup,
19. 11. 2026 at 18:00, Prague. Audience: many juniors.
Static HTML/CSS/JS, no build step, **no slides framework** (Slidev, reveal.js,
frontend-slides etc. were considered and rejected). Useful features get built into
our own runtime instead (candidates: presenter view with notes, code diffs via
`shiki-magic-move`).

Run: open `index.html` in a browser, or `python3 -m http.server`.

## Source of truth

- `docs/brief.md` holds the story, facts, slide plan, ideas and rules. Read it before
  touching any slide. It is a brainstorm output: Jan is still shaping the story, so
  his newer instructions win over the brief.
- Never invent numbers, names, company/product names or technical details that are
  not in the brief's "Fakta" section. Use a placeholder and add the question to
  "Otevřené otázky" instead. Mews (Jan's former employer, hotel software) may be
  named as part of the story, but no Mews logo, colours or other branding.
- Items marked *(návrh)* need Jan's confirmation before they go into the deck.
- `presentation.md` is the scene spec: scene ids, step lists, speaker notes. Step
  numbers there must match the `data-step` values in CSS.

## Lineage

The runtime is a port of the previous talk at `~/Documents/dev/bdd`. Its
`CLAUDE.md` has the long-form guidance that still applies here: the merged-scene
pattern, authoring step-driven animation, coordinate math, common pitfalls. Read
it when building a non-trivial scene. Differences from bdd: no Pac-Man/ghost
helpers, the hero is `bug()`; the "XP wallpaper" is now a generic `backdrop`;
scenes have a `world`; verify waits live on the scene (`verifyWait`).

## Navigation contract

- `→` `↓` `Space` `PageDown` next step/scene; `←` `↑` `PageUp` back; `Home` / `End`.
- **Keyboard only.** No click-to-advance, no URL hash sync. Don't add them back.
- Scene render is wrapped in try/catch with a visible fallback. Never bypass it.
- **DEV only exception:** the faint "incident →" link on the title (`data-goto`,
  gated by `DEV_JUMP` in scenes.js) jumps to the `mostly` scene (just before the
  Slack notification that opens the incident) for rehearsing
  later parts. Set `DEV_JUMP = false` before the talk.

## Architecture

- `index.html`: shell only (`#backdrop`, `#stage`, `#hud`). Build inside scenes.
- `runtime.js`: helpers (`bug()`, `appWindow()`) + mount/navigation. Rarely changes.
- `scenes.js`: the `scenes` array. This is where slides are edited.
- `styles.css`: tokens, reusable blocks, then per-scene sections.
- Stage is **1600 × 900**, scaled uniformly. Author in stage pixels.
  `#stage` is absolutely centred and `fit()` sets `translate(-50%,-50%) scale()`.
  Don't make it a grid/flex item again: in a window narrower than 1600 px the
  auto track grows to 1600 and the scaled deck ends up shifted right.

### Scene shape

```js
{
  id: "kebab-id",
  notes: "speaker note / intent",   // runtime ignores (for now)
  steps: 3,                         // default 1
  world: "game",                    // "game" | "serious" (incident part); body[data-world] hook.
                                    // Both use the cream look: Jan rejected the black incident background.
  background: "var(--night-2)",     // optional #app tint, fades between scenes
  backdrop: "art/cave.svg",         // optional full-screen image, crossfaded
  exitDuration: 500,                // optional exit animation via .is-exiting
  verifyWait: 2800,                 // optional ms per step (or array) for verify.mjs
  render: () => `<div class="scene my-scene">…</div>`,
  onStep: (root, step, prev) => {}, // optional
}
```

Root must have `class="scene"` (it is `position:absolute; inset:0`; never override
with `position: relative`, the scene collapses to a black screen). `data-step` is
set on the next animation frame after mount, so bare rules = "before" state and
`[data-step="0"]` = entrance target. Use `transition` for anything that must
rewind on `←`; `@keyframes` only for one-shot or looping effects.

**Step reveals without CSS:** put `data-from="N"` (visible from step N) and
optionally `data-to="M"` (hidden after step M) on any element; the runtime
toggles `.is-on`. Uses the standalone `translate` property, so the element's own
`transform` (e.g. centring) still works. Use `.swap` to stack alternatives in one
spot (a value that changes per step).

Slides use `.scene.slide` + `.kicker` / `.headline` / `.lede`; the game levels use
the `level()` template in scenes.js (bug moves `--x0 → --x1 → --x2` over 3 steps).
Anything calling `bug()` at definition time must be wrapped in a function, since
scenes.js loads before runtime.js.

`presentation.md`'s scene table is generated from scene `notes`: edit notes in
scenes.js, then `npm run notes`.

A continuous visual sequence is **one scene with N steps**, not N scenes (a new
scene swaps the DOM, so nothing can animate across the cut).

## The hero: `bug()`

Original pixel-art beetle (side view, faces right), drawn from character grids
in `runtime.js` (`BUG_BODY`, `BUG_LEGS`). Every row must be exactly `BUG_W` (26)
chars. Easter egg: shell stripes are indented "lines of code" and line 3 is
missing; keep that when editing the sprite.

```js
bug({ size: 144, pose: "walk", facing: "left", className: "bug--stealth" })
```

- `size`: height in px; use multiples of 18 (72, 108, 144, 216, 288) for crisp pixels.
- `pose` → `data-pose`: `idle` (slow bob), `walk` (2-frame legs), `jump` (tucked).
  All frames are always rendered, so switch pose live:
  `root.querySelector(".bug").dataset.pose = "idle"` (see the title scene).
- Modifiers: `.bug--left`, `.bug--stealth` (flickering near-invisible),
  `.bug--clone` (duller palette, for the database level).
- Palette: `--bug-ink --bug-limb --bug-shell --bug-shell-dark --bug-shell-light
  --bug-eye --bug-band`; override per instance via `style`. Default: cyan shell,
  coral headband, ink outline. Clones are lavender.
- Style is loosely inspired by classic platformers (Prehistorik, Prince of Persia,
  Mario) but must stay original: no existing characters, tiles or icons.

## The agent: `agent()`

Second original pixel sprite: a slim secret agent (front view, slicked hair,
glasses as two separate dark lenses with a bridge and a periodic glint, dark
suit, coral tie). No earpiece wire (read as "something behind his back"); the
lenses must not merge into a band. Generic trope, not a film character. Grid
`AGENT_ROWS` in `runtime.js`, 16 × 28; use sizes in multiples of 28. Palette tokens `--agent-*`. It jumps in from the left on the
agent scene (`ag-jump-in`). Jan explicitly did not want a robot.

Icons: `icon("pencil", { size, stroke })` inlines a Lucide icon (ISC) with a
thick default stroke (2.75) so it reads on a projector. Never use thin unicode
glyphs (✎ ☑) as icons. To add one: download
`unpkg.com/lucide-static@0.460.0/icons/<name>.svg` into `icons/`, then
`npm run icons` (regenerates `icons.js`, loaded before scenes.js).

Other building blocks (same as bdd): `appWindow()` with themes `chat | terminal |
editor | browser`, `.window-enter-*` / `.window-exit-*`, `.typewriter` + `.cursor`,
`.stagger-fill > .stagger-item`, `.pixel-ground`.

## Look: palette and font

- Palette is the meetup's scheme (ReactGirls card): `--cream` background, accents
  `--coral --cyan --lavender --yellow`, `--ink` for text and outlines. Use the
  tokens, never hard-coded hex. Mews branding is gone for good (Jan left Mews).
  Only logo allowed: the Slack mark (`img/slack-mark.svg`, from bdd) in the
  `notif()` card, at Jan's request. Keep non-Lucide images in `img/`, not
  `icons/` (the icon build inlines everything there as stroke icons).
- Font: **Poppins** 400–800, bundled in `fonts/` (OFL) so the deck works offline.
- No pixel fonts: Press Start 2P was tried and looked blurry, because a bitmap-style
  font only stays crisp at exact multiples of its grid, and the stage is scaled by a
  non-integer factor to fit the window. Pixel art stays in the sprites, where each
  sprite pixel is large enough that edge smoothing doesn't show.

## Verification

`node verify.mjs [id-filter]` walks the deck with real key presses and saves
`verify-shots/NN-id-stepN.png` (gitignored). Read the PNGs back to check. Use it for
risky changes (new sprite art, merged scenes, big CSS rewrites) or when Jan asks;
Jan checks routine edits in the browser himself. Playwright is pinned to 1.60.0 to
reuse the browser already cached on this machine.

## Iteration loop with Jan

1. Treat each message as a bundle of concrete asks; handle each.
2. Prefer extending an existing scene's steps over adding scenes.
3. Update `presentation.md` (and `docs/brief.md` open questions if facts are missing).
4. Commit once per iteration: `iter N: <summary>`, body says what and why.
5. Tell Jan what changed and what to look at; leave a question open.
6. When a bug's root cause wasn't obvious, add it to this file.

## Pitfalls

- A flex container with `gap` turns every bare text run and inline element
  into its own flex item, so `Text <b>bold</b>.` gets gaps around the `<b>`.
  Wrap the text in one `<span>` (see `.dm-list` on the damage slide).
