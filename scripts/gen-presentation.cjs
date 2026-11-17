// Regenerates the scene table in presentation.md from scenes.js `notes`.
// Run: npm run notes
const vm = require("vm");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const ctx = { bug: () => "", appWindow: () => "" };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "scenes.js"), "utf8") + ";this.scenes=scenes;", ctx);
const rows = ctx.scenes
  .map((s, i) => `| ${i + 1} | \`${s.id}\` | ${s.world || "game"} | ${Math.max(1, s.steps || 1)} | ${(s.notes || "").replace(/\|/g, "\\|")} |`)
  .join("\n");
const file = path.join(root, "presentation.md");
const md = fs.readFileSync(file, "utf8");
const marker = "|---|----|------|-------|----------|\n";
const i = md.indexOf(marker);
if (i < 0) throw new Error("table header not found in presentation.md");
fs.writeFileSync(file, md.slice(0, i + marker.length) + rows + "\n");
console.log(`presentation.md: ${ctx.scenes.length} scenes`);
