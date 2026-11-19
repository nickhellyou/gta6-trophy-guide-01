// Leonida Trophy Guide — hands the guide in. Copies app/ and screenshots/
// from this repository to the output directory and writes dossier.json
// with the kit's buildDossier, so the handed-in bytes are exactly the ones
// the scorer rebuilds. Runs twice with the same bytes: the copy is a plain
// recursive copy and buildDossier is deterministic over the files alone.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Start from an empty output directory so a stale file can never survive
// from an earlier run and make the two runs differ.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const folder of ["app", "screenshots"]) {
  cpSync(join(repoRoot, folder), join(outDir, folder), { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, "dossier.json"), dossier);
