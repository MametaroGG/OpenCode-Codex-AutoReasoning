import { rm } from "node:fs/promises";

// Remove only explicitly obsolete compiler outputs, never directories or source files.
for (const name of ["antigravity.js", "antigravity.d.ts"]) {
  await rm(new URL(`../dist/${name}`, import.meta.url), { force: true });
}
