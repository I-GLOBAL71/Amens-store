import { afterAll, describe, expect, it } from "bun:test";
import { existsSync, readFileSync, unlinkSync } from "fs";
import path from "path";
import { runPy, SCRIPTS, SKILL_DOCS, resolvePythonBin } from "../src/lib/pipeline/py";
import { runPipeline } from "../src/lib/pipeline/runner";
import { checkGabarit } from "../src/lib/pipeline/gabarit";
import { DISCLOSURE } from "../src/lib/pipeline/types";

const AMENS_ROOT = process.cwd();
const B2BPRO_ROOT = path.resolve(AMENS_ROOT, "..", "b2bpro");

afterAll(() => {
  for (const tmp of ["test-squelette.md", "test-dirty.md"]) {
    const p = path.join(AMENS_ROOT, ".pipeline-tmp", tmp);
    if (existsSync(p)) unlinkSync(p);
  }
});

describe("Unification des skills amens.store × b2bpro", () => {
  it("tous les 7 skills et 9 scripts Python enregistrés existent sur disque", () => {
    for (const [slug, docPath] of Object.entries(SKILL_DOCS)) {
      expect(existsSync(docPath), `SKILL.md manquant pour ${slug}`).toBe(true);
      const raw = readFileSync(docPath, "utf-8");
      expect(raw.startsWith("---")).toBe(true);
      expect(raw).toContain(`name: ${slug}`);
    }
    for (const [name, scriptPath] of Object.entries(SCRIPTS)) {
      expect(existsSync(scriptPath), `Script manquant: ${name}`).toBe(true);
    }
    expect(resolvePythonBin().length).toBeGreaterThan(0);
  });

  it("la configuration .agents/skills.json et les règles unifiées sont valides dans les deux projets", () => {
    const amensCfgPath = path.join(AMENS_ROOT, ".agents", "skills.json");
    expect(existsSync(amensCfgPath)).toBe(true);
    const amensCfg = JSON.parse(readFileSync(amensCfgPath, "utf-8")) as {
      entries: { path: string }[];
    };
    expect(amensCfg.entries.map((e) => e.path)).toEqual(["skills", ".agents/skills"]);
    expect(existsSync(path.join(AMENS_ROOT, ".agents", "skills", "redaction-seo-geo-aio", "SKILL.md"))).toBe(true);
    expect(existsSync(path.join(AMENS_ROOT, ".agents", "skills", "agent-browser", "SKILL.md"))).toBe(true);
    expect(existsSync(path.join(AMENS_ROOT, ".agents", "skills", "audit-unifie-qualite", "SKILL.md"))).toBe(true);
    expect(existsSync(path.join(AMENS_ROOT, ".agents", "rules", "blog-mobile-responsiveness.md"))).toBe(true);

    if (existsSync(B2BPRO_ROOT)) {
      const b2bCfgPath = path.join(B2BPRO_ROOT, ".agents", "skills.json");
      expect(existsSync(b2bCfgPath)).toBe(true);
      const b2bCfg = JSON.parse(readFileSync(b2bCfgPath, "utf-8")) as {
        entries: { path: string; exclude?: string[] }[];
      };
      const skillsEntry = b2bCfg.entries.find((e) => e.path === "skills");
      expect(skillsEntry?.exclude).toContain("fullstack-dev");
      expect(skillsEntry?.exclude).toContain("skill-finder-cn");
      expect(existsSync(path.join(B2BPRO_ROOT, ".agents", "skills", "blueocean-keywords", "SKILL.md"))).toBe(true);
      expect(existsSync(path.join(B2BPRO_ROOT, ".agents", "skills", "geo-citations-ia", "SKILL.md"))).toBe(true);
      expect(existsSync(path.join(B2BPRO_ROOT, ".agents", "skills", "humanisation-traces-ia", "SKILL.md"))).toBe(true);
      expect(existsSync(path.join(B2BPRO_ROOT, ".agents", "skills", "audit-unifie-qualite", "SKILL.md"))).toBe(true);
    }
  });

  it("nouvel_article.py génère un squelette §4.2 + SGA™ avec question Comment… et blocs fermés", async () => {
    const outPath = path.join(AMENS_ROOT, ".pipeline-tmp", "test-squelette.md");
    const res = await runPy(SCRIPTS.squelette, [
      "--angle", "1",
      "--requete", "installer n8n vps",
      "--titre", "Installer n8n sur VPS pas cher (guide 2026)",
      "--sortie", outPath,
    ]);
    expect(res.code).toBe(0);
    const md = readFileSync(outPath, "utf-8");
    const gab = checkGabarit(md, 1);
    expect(gab.passed).toBe(true);
    expect(md).toContain("### Comment ");
    expect(md).toContain(DISCLOSURE);
  }, 30000);

  it("analyse_style.py et nettoyer_unicode.py détectent marqueurs IA et traces Unicode", async () => {
    const dirtyPath = path.join(AMENS_ROOT, ".pipeline-tmp", "test-dirty.md");
    const dirtyMd = [
      "# Titre test",
      "",
      "Dans un monde en constante évolution, plongeons au cœur de l'hébergement\u200B web.",
      "",
      "Il convient de noter que ce service s\u0430ns faille reste utile.",
      "",
      "```bash",
      "echo unclosed",
    ].join("\n");
    const { writeFileSync } = await import("fs");
    writeFileSync(dirtyPath, dirtyMd, "utf-8");

    const hum = await runPy(SCRIPTS.humanStyle, [dirtyPath]);
    expect(hum.stdout).toContain("×1");
    expect(hum.stdout).toContain("style IA détectable");

    const tr = await runPy(SCRIPTS.tracesUnicode, [dirtyPath, "--inspecter"]);
    expect(tr.stdout).toContain("caractère(s) suspect(s)");

    const ver = await runPy(SCRIPTS.verification, [dirtyPath, "--monetise"]);
    expect(ver.stdout).toContain("[BLOQUANT]");
    expect(ver.stdout).toContain("Bloc de code markdown non fermé");
    expect(ver.stdout).toContain("Disclosure d'affiliation manquante");
  }, 30000);

  it("le pipeline complet valide un article réel de amens.store avec 0 bloquant", async () => {
    const sample = readFileSync(
      path.join(AMENS_ROOT, "content", "articles", "ia-automatisation-n8n-hostinger.md"),
      "utf-8"
    );
    const result = await runPipeline({
      angle: 1,
      requete: "installer n8n",
      title: "Installer n8n sur un VPS Hostinger en 10 minutes (testé en novembre 2026)",
      content: sample,
    });
    expect(result.canPublish).toBe(true);
    expect(result.blockingIssues).toBe(0);
    expect(result.overallScore).toBeGreaterThanOrEqual(90);
    expect(result.steps.length).toBe(7);
  }, 60000);
});
