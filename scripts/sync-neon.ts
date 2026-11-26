/**
 * CLI : `bun run db:sync:neon`
 *
 * Synchronise le contenu éditorial local (`db/custom.db`, SQLite) vers la base
 * Neon PostgreSQL de production (`NEON_DATABASE_URL_UNPOOLED` prioritaire pour
 * éviter les coupures de pooler sur transaction, repli sur `NEON_DATABASE_URL`).
 *
 * Requêtes multi-lignes paramétrées par table : exécution atomique rapide (< 2 s).
 */
import { Database } from "bun:sqlite";
import { SQL } from "bun";

const TARGET_URL =
  process.env.NEON_DATABASE_URL_UNPOOLED ||
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_URL;
const SQLITE_PATH = "db/custom.db";

if (!TARGET_URL || !/^postgres(ql)?:\/\//.test(TARGET_URL)) {
  console.error("✗ NEON_DATABASE_URL ou NEON_DATABASE_URL_UNPOOLED requis.");
  process.exit(1);
}

function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string" && /^\d+$/.test(v)) return new Date(Number(v));
  return new Date(String(v));
}

function toNullableDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;
  return toDate(v);
}

async function batchUpsert(
  tx: SQL,
  table: string,
  cols: string[],
  rows: unknown[][],
  conflictCol?: string,
  updateCols?: string[]
) {
  if (rows.length === 0) return;
  const colList = cols.map((c) => `"${c}"`).join(",");
  const params: unknown[] = [];
  const tuples: string[] = [];
  let idx = 1;
  for (const row of rows) {
    const ph: string[] = [];
    for (const val of row) {
      ph.push(`$${idx++}`);
      params.push(val);
    }
    tuples.push(`(${ph.join(",")})`);
  }
  let sqlStr = `INSERT INTO "${table}" (${colList}) VALUES ${tuples.join(",")}`;
  if (conflictCol && updateCols?.length) {
    const sets = updateCols.map((c) => `"${c}"=EXCLUDED."${c}"`).join(",");
    sqlStr += ` ON CONFLICT ("${conflictCol}") DO UPDATE SET ${sets}`;
  }
  await tx.unsafe(sqlStr, params);
}

async function syncOnce() {
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const pg = new SQL(TARGET_URL);
  try {
    await pg.begin(async (tx) => {
      // 1. Skill
      const skills = sqlite.query("SELECT * FROM Skill").all() as Record<string, unknown>[];
      const skillCols = ["id", "slug", "name", "role", "mission", "description", "version", "ordre", "gate", "active", "skillPath", "scriptPath", "reference", "createdAt", "updatedAt"];
      await batchUpsert(
        tx,
        "Skill",
        skillCols,
        skills.map((r) => [
          r.id, r.slug, r.name, r.role, r.mission, r.description, r.version,
          Number(r.ordre), toBool(r.gate), toBool(r.active), r.skillPath, r.scriptPath, r.reference,
          toDate(r.createdAt), toDate(r.updatedAt),
        ]),
        "slug",
        skillCols.filter((c) => c !== "id" && c !== "slug" && c !== "createdAt")
      );
      console.log(`  ✓ Skill : ${skills.length}`);

      // 2. AffiliateProgram
      const progs = sqlite.query("SELECT * FROM AffiliateProgram").all() as Record<string, unknown>[];
      const progCols = ["id", "slug", "name", "commissionType", "commissionValue", "cookieDays", "payoutThreshold", "affiliateUrl", "geoTarget", "context", "priorityScore", "anglePrincipal", "active"];
      await batchUpsert(
        tx,
        "AffiliateProgram",
        progCols,
        progs.map((r) => [
          r.id, r.slug, r.name, r.commissionType, r.commissionValue, Number(r.cookieDays),
          r.payoutThreshold, r.affiliateUrl, r.geoTarget, r.context, Number(r.priorityScore),
          Number(r.anglePrincipal), toBool(r.active),
        ]),
        "slug",
        progCols.filter((c) => c !== "id" && c !== "slug")
      );
      console.log(`  ✓ AffiliateProgram : ${progs.length}`);

      // 3. Article
      const articles = sqlite.query("SELECT * FROM Article").all() as Record<string, unknown>[];
      const artCols = ["id", "slug", "silo", "angle", "title", "metaTitle", "metaDescription", "excerpt", "content", "faqJson", "primaryProgram", "secondaryProgramsJson", "difficulty", "timeEstimate", "costEstimate", "status", "seoScore", "geoScore", "humanScore", "verificationPassed", "laboDataJson", "author", "views", "publishedAt", "createdAt", "updatedAt"];
      await batchUpsert(
        tx,
        "Article",
        artCols,
        articles.map((r) => [
          r.id, r.slug, r.silo, Number(r.angle), r.title, r.metaTitle, r.metaDescription,
          r.excerpt, r.content, r.faqJson, r.primaryProgram, r.secondaryProgramsJson,
          r.difficulty, r.timeEstimate, r.costEstimate, r.status, Number(r.seoScore),
          Number(r.geoScore), Number(r.humanScore), toBool(r.verificationPassed),
          r.laboDataJson, r.author, Number(r.views), toNullableDate(r.publishedAt),
          toDate(r.createdAt), toDate(r.updatedAt),
        ]),
        "slug",
        artCols.filter((c) => c !== "id" && c !== "slug" && c !== "createdAt" && c !== "views")
      );
      console.log(`  ✓ Article : ${articles.length}`);

      // 4. LaboUptime
      const uptimes = sqlite.query("SELECT * FROM LaboUptime").all() as Record<string, unknown>[];
      await tx`DELETE FROM "LaboUptime"`;
      await batchUpsert(
        tx,
        "LaboUptime",
        ["id", "host", "region", "uptime", "incidents30j", "lastCheckAt"],
        uptimes.map((r) => [r.id, r.host, r.region, Number(r.uptime), Number(r.incidents30j), toDate(r.lastCheckAt)])
      );
      console.log(`  ✓ LaboUptime : ${uptimes.length}`);

      // 5. LaboLatence
      const latences = sqlite.query("SELECT * FROM LaboLatence").all() as Record<string, unknown>[];
      await tx`DELETE FROM "LaboLatence"`;
      await batchUpsert(
        tx,
        "LaboLatence",
        ["id", "host", "region", "latenceMs", "period"],
        latences.map((r) => [r.id, r.host, r.region, Number(r.latenceMs), r.period])
      );
      console.log(`  ✓ LaboLatence : ${latences.length}`);

      // 6. PriceHistory
      const prices = sqlite.query("SELECT * FROM PriceHistory").all() as Record<string, unknown>[];
      await tx`DELETE FROM "PriceHistory"`;
      await batchUpsert(
        tx,
        "PriceHistory",
        ["id", "host", "plan", "prixPromo", "prixRenouvellement", "devise", "captureAt"],
        prices.map((r) => [r.id, r.host, r.plan, Number(r.prixPromo), Number(r.prixRenouvellement), r.devise, toDate(r.captureAt)])
      );
      console.log(`  ✓ PriceHistory : ${prices.length}`);

      // 7. AiCitation
      const citations = sqlite.query("SELECT * FROM AiCitation").all() as Record<string, unknown>[];
      await tx`DELETE FROM "AiCitation"`;
      await batchUpsert(
        tx,
        "AiCitation",
        ["id", "plateforme", "requete", "cite", "checkedAt"],
        citations.map((r) => [r.id, r.plateforme, r.requete, toBool(r.cite), toDate(r.checkedAt)])
      );
      console.log(`  ✓ AiCitation : ${citations.length}`);

      // 8. KeywordResearch
      const kws = sqlite.query("SELECT * FROM KeywordResearch").all() as Record<string, unknown>[];
      await tx`DELETE FROM "KeywordResearch"`;
      await batchUpsert(
        tx,
        "KeywordResearch",
        ["id", "graine", "requete", "angle", "classeVolume", "difficulte", "resistanceAio", "potentiel", "verdict", "source", "createdAt"],
        kws.map((r) => [
          r.id, r.graine, r.requete, Number(r.angle), r.classeVolume, Number(r.difficulte),
          r.resistanceAio, r.potentiel, r.verdict, r.source, toDate(r.createdAt),
        ])
      );
      console.log(`  ✓ KeywordResearch : ${kws.length}`);
    });

    const [{ count: artCount }] = await pg`SELECT COUNT(*)::int AS count FROM "Article" WHERE "status" = 'published'`;
    const [{ count: progCount }] = await pg`SELECT COUNT(*)::int AS count FROM "AffiliateProgram" WHERE "active" = true`;
    const [waRow] = await pg`SELECT "affiliateUrl" FROM "AffiliateProgram" WHERE "slug" = 'pack-whatsapp' LIMIT 1`;
    console.log(`\n✅ Neon PostgreSQL synchronisée : ${artCount} article(s) publié(s) · ${progCount} programme(s) · pack-whatsapp=${waRow?.affiliateUrl}`);
  } finally {
    sqlite.close();
    await pg.close();
  }
}

async function main() {
  console.log("\n🔄 Synchronisation amens.store : SQLite (db/custom.db) → Neon PostgreSQL…");
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await syncOnce();
      return;
    } catch (err) {
      if (attempt < 3) {
        console.warn(`  ⏳ Reconnexion Neon (${attempt}/3) : ${(err as Error).message}`);
        await Bun.sleep(2000);
        continue;
      }
      throw err;
    }
  }
}

main().catch((e) => {
  console.error("✗ Échec sync Neon :", e);
  process.exit(1);
});
