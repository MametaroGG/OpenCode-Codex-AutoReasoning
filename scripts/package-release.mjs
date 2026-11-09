import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const npm = process.env.npm_execpath;
if (!npm) throw new Error("Run npm run release:pack");
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
// In a release workflow, reject a tag that does not match the version in package.json.
const tag = process.env.RELEASE_TAG;
if (tag && tag !== `v${pkg.version}`) throw new Error("Release tag does not match package version");
const destination = path.join(root, "release");
await mkdir(destination, { recursive: true });
const packed = JSON.parse(execFileSync(process.execPath,
  [npm, "pack", "--json", "--ignore-scripts", "--pack-destination", destination],
  { cwd: root, encoding: "utf8", timeout: 60_000 }))[0];
if (!packed.files.some(file => file.path === "LICENSE")) throw new Error("Missing license in release package");
if (packed.files.some(file => /(?:^|\/)(?:node_modules|evaluation-results|scripts\/baselines)\//.test(file.path) ||
    /antigravity\.(?:js|d\.ts)$/.test(file.path))) throw new Error("Unexpected release content");
const filename = path.basename(packed.filename);
const digest = createHash("sha256").update(await readFile(path.join(destination, filename))).digest("hex");
await writeFile(path.join(destination, "SHA256SUMS"), `${digest}  ${filename}\n`);
console.log(JSON.stringify({ version: pkg.version, archive: filename, sha256: digest,
  files: packed.files.length, published: false }, null, 2));
