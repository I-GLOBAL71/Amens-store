// Exécution des vrais scripts Python des skills enregistrés dans /skills.
// Le pipeline ne simule rien : chaque skill est exécuté via son script réel.

import { execFileSync, spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

let cachedPythonBin: string | null = null;

/** Résout l'exécutable Python disponible (Linux/macOS: python3, Windows: python). */
export function resolvePythonBin(): string {
  if (process.env.AMENS_PYTHON_BIN) return process.env.AMENS_PYTHON_BIN;
  if (cachedPythonBin) return cachedPythonBin;
  const candidates = process.platform === "win32" ? ["python", "python3"] : ["python3", "python"];
  for (const bin of candidates) {
    try {
      execFileSync(bin, ["-c", "import sys; sys.exit(0)"], {
        stdio: "ignore",
        timeout: 5000,
      });
      cachedPythonBin = bin;
      return bin;
    } catch {
      // candidat indisponible ou alias Windows Store vide
    }
  }
  cachedPythonBin = candidates[0];
  return cachedPythonBin;
}

export const PROJECT_ROOT = process.cwd();
export const SKILLS_DIR = path.join(PROJECT_ROOT, "skills");
export const TMP_DIR = path.join(PROJECT_ROOT, ".pipeline-tmp");

export const SCRIPTS = {
  blueoceanSuggest: path.join(SKILLS_DIR, "blueocean-keywords", "scripts", "suggest.py"),
  blueoceanPrioriser: path.join(SKILLS_DIR, "blueocean-keywords", "scripts", "prioriser.py"),
  seoAudit: path.join(SKILLS_DIR, "seo-ultra", "scripts", "audit_meta.py"),
  geoScore: path.join(SKILLS_DIR, "geo-citations-ia", "scripts", "score_citabilite.py"),
  humanStyle: path.join(SKILLS_DIR, "humanisation-100", "scripts", "analyse_style.py"),
  tracesUnicode: path.join(SKILLS_DIR, "suppression-traces-ia", "scripts", "nettoyer_unicode.py"),
  tracesMeta: path.join(SKILLS_DIR, "suppression-traces-ia", "scripts", "nettoyer_metadonnees.py"),
  verification: path.join(SKILLS_DIR, "verification-contenu", "scripts", "check_contenu.py"),
  squelette: path.join(SKILLS_DIR, "pipeline-amens", "scripts", "nouvel_article.py"),
} as const;

export const SKILL_DOCS = {
  "blueocean-keywords": path.join(SKILLS_DIR, "blueocean-keywords", "SKILL.md"),
  "pipeline-amens": path.join(SKILLS_DIR, "pipeline-amens", "SKILL.md"),
  "seo-ultra": path.join(SKILLS_DIR, "seo-ultra", "SKILL.md"),
  "geo-citations-ia": path.join(SKILLS_DIR, "geo-citations-ia", "SKILL.md"),
  "humanisation-100": path.join(SKILLS_DIR, "humanisation-100", "SKILL.md"),
  "suppression-traces-ia": path.join(SKILLS_DIR, "suppression-traces-ia", "SKILL.md"),
  "verification-contenu": path.join(SKILLS_DIR, "verification-contenu", "SKILL.md"),
} as const;

export interface PyResult {
  code: number;
  stdout: string;
  stderr: string;
}

export async function runPy(
  script: string,
  args: string[],
  timeoutMs = 30000
): Promise<PyResult> {
  return new Promise((resolve) => {
    const proc = spawn(resolvePythonBin(), [script, ...args], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => proc.kill("SIGKILL"), timeoutMs);
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString("utf-8")));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString("utf-8")));
    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, stdout, stderr });
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: String(err) });
    });
  });
}

export async function ensureTmpDir(): Promise<string> {
  await fs.mkdir(TMP_DIR, { recursive: true });
  return TMP_DIR;
}

export async function writeTmp(name: string, content: string): Promise<string> {
  await ensureTmpDir();
  const p = path.join(TMP_DIR, name);
  await fs.writeFile(p, content, "utf-8");
  return p;
}

export async function readTmp(name: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(TMP_DIR, name), "utf-8");
  } catch {
    return null;
  }
}

export async function cleanupTmp(pattern: string): Promise<void> {
  try {
    const files = await fs.readdir(TMP_DIR);
    await Promise.all(
      files
        .filter((f) => f.includes(pattern))
        .map((f) => fs.unlink(path.join(TMP_DIR, f)).catch(() => {}))
    );
  } catch {
    // dossier absent : rien à nettoyer
  }
}
