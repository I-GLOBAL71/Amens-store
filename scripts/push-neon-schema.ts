/**
 * CLI : `bun run db:push:pg` — applique le schéma Postgres (Prisma) à la base Neon.
 * Utilise NEON_DATABASE_URL sans écraser DATABASE_URL locale (SQLite) ni régénérer
 * le client SQLite local (`--skip-generate`).
 */
const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith("--url="))?.split("=").slice(1).join("=");
const envUrl = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
const dbUrlIsPostgres = process.env.DATABASE_URL?.startsWith("postgres");
const TARGET_URL = urlArg || envUrl || (dbUrlIsPostgres ? process.env.DATABASE_URL : undefined);

if (!TARGET_URL || !/^postgres(ql)?:\/\//.test(TARGET_URL)) {
  console.error("✗ URL Neon requise : passez NEON_DATABASE_URL ou --url=\"postgresql://…\".");
  process.exit(1);
}

console.log(`\n🗄️  Application du schéma Postgres (schema.postgres.prisma) à Neon`);
console.log(`   Cible : ${TARGET_URL.replace(/:\/\/[^@]*@/, "://***@")}\n`);

const MAX_ATTEMPTS = 3;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  const push = Bun.spawnSync(
    ["bunx", "prisma", "db", "push", "--skip-generate", "--schema", "prisma/schema.postgres.prisma"],
    { env: { ...process.env, DATABASE_URL: TARGET_URL }, stdout: "pipe", stderr: "pipe" }
  );
  const output = `${push.stdout.toString()}\n${push.stderr.toString()}`.trim();
  if (push.exitCode === 0) {
    if (output) console.log(output);
    process.exit(0);
  }
  if (attempt < MAX_ATTEMPTS && output.includes("P1001")) {
    console.log(`   ⏳ Compute Neon en réveil (P1001) — nouvelle tentative ${attempt + 1}/${MAX_ATTEMPTS} dans 5 s…`);
    await Bun.sleep(5000);
    continue;
  }
  console.error(output || `✗ prisma db push a échoué (code ${push.exitCode})`);
  process.exit(push.exitCode ?? 1);
}
