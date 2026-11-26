import { describe, expect, test } from "bun:test";
import { deterministicHumanize } from "../scripts/humanize-article";
import { checkAeoAndGuardrails } from "../scripts/verify-all-skills";

describe("Blog automation guards", () => {
  test("deterministicHumanize removes em-dashes and converts FR decimals outside code", () => {
    const input = [
      "Le serveur répond en 12.5 ms — un record en novembre 2026.",
      "```bash",
      "curl -s https://example.com --max-time 12.5 # keep — intact",
      "```",
      "Disponibilité mesurée : 99.98 % sur 30 jours.",
    ].join("\n");

    const output = deterministicHumanize(input);
    expect(output).toContain("12,5 ms, un record");
    expect(output).toContain("99,98 %");
    expect(output).toContain("--max-time 12.5 # keep — intact");
  });

  test("checkAeoAndGuardrails flags missing Comment FAQ and leaked internal terms", () => {
    const bad = [
      "# Guide test",
      "Trop court.",
      "## Questions fréquentes",
      "### Pourquoi choisir un VPS ?",
      "Parce que c'est rapide.",
      "Ce guide applique le SEO et le GEO.",
    ].join("\n\n");

    const res = checkAeoAndGuardrails(bad);
    expect(res.aeoOk).toBe(false);
    expect(res.aeoIssues.length).toBeGreaterThan(0);
    expect(res.guardrailIssues.length).toBeGreaterThan(0);
  });
});
