import { describe, expect, it } from "bun:test";
import { normalizePgPoolUrl, resolveDatabaseUrl } from "../src/lib/db";
import { GET as getPrograms } from "../src/app/api/programs/route";

describe("Résolution DB & pooler Neon (src/lib/db.ts)", () => {
  it("conserve une URL SQLite locale sans modification", () => {
    const url = resolveDatabaseUrl({
      NODE_ENV: "development",
      DATABASE_URL: "file:../db/custom.db",
      NEON_DATABASE_URL: "postgresql://u:p@ep-test-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    });
    expect(url).toBe("file:../db/custom.db");
  });

  it("bascule sur POSTGRES_PRISMA_URL / NEON_DATABASE_URL sur Vercel si DATABASE_URL est absent ou SQLite", () => {
    const url = resolveDatabaseUrl({
      NODE_ENV: "production",
      VERCEL: "1",
      DATABASE_URL: "file:../db/custom.db",
      NEON_DATABASE_URL: "postgresql://u:p@ep-test-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    });
    expect(url).toBeDefined();
    expect(url).toContain("postgresql://");
    expect(url).toContain("pgbouncer=true");
    expect(url).toContain("pool_timeout=25");
    expect(url).toContain("connect_timeout=25");
  });

  it("n'écrase pas pgbouncer ni pool_timeout s'ils sont déjà présents", () => {
    const raw =
      "postgresql://u:p@ep-test-pooler.eu-central-1.aws.neon.tech/neondb?pgbouncer=true&pool_timeout=40&connect_timeout=20";
    const normalized = normalizePgPoolUrl(raw);
    expect(normalized).toContain("pgbouncer=true");
    expect(normalized).toContain("pool_timeout=40");
    expect(normalized).toContain("connect_timeout=20");
  });
});

describe("API GET /api/programs", () => {
  it("renvoie les programmes actifs avec trackingUrl", async () => {
    const res = await getPrograms(new Request("http://localhost:3000/api/programs"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { programs: { slug: string; trackingUrl: string }[] };
    expect(Array.isArray(body.programs)).toBe(true);
    expect(body.programs.length).toBeGreaterThan(0);
    expect(body.programs[0].trackingUrl).toContain("utm_source=amens");
  });

  it("filtre correctement par context=vps_ia et geo=africa", async () => {
    const resVps = await getPrograms(new Request("http://localhost:3000/api/programs?context=vps_ia"));
    expect(resVps.status).toBe(200);
    const vpsBody = (await resVps.json()) as { programs: { context: string }[] };
    expect(vpsBody.programs.length).toBeGreaterThan(0);
    expect(vpsBody.programs.every((p) => p.context === "vps_ia")).toBe(true);

    const resAfrica = await getPrograms(new Request("http://localhost:3000/api/programs?geo=africa"));
    expect(resAfrica.status).toBe(200);
    const africaBody = (await resAfrica.json()) as { programs: { geoTarget: string }[] };
    expect(africaBody.programs.length).toBeGreaterThan(0);
    expect(africaBody.programs.every((p) => p.geoTarget === "africa" || p.geoTarget === "global")).toBe(true);
  });

  it("renvoie 404 sur slug inconnu et 400 sur angle invalide", async () => {
    const res404 = await getPrograms(new Request("http://localhost:3000/api/programs?slug=inconnu-xyz"));
    expect(res404.status).toBe(404);

    const res400 = await getPrograms(new Request("http://localhost:3000/api/programs?angle=abc"));
    expect(res400.status).toBe(400);
  });
});
