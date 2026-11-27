import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const forcePostgres = args.includes("--postgres");
const forceSqlite = args.includes("--sqlite");

const dbUrl = process.env.DATABASE_URL ?? "";
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const isCi = Boolean(process.env.CI);
const isPostgresUrl = /^postgres(ql)?:\/\//i.test(dbUrl);

const usePostgres =
  !forceSqlite && (forcePostgres || isVercel || isPostgresUrl || process.env.PRISMA_SCHEMA_TARGET === "postgres");

const targetProvider = usePostgres ? "postgresql" : "sqlite";
const schemaPath = usePostgres ? "prisma/schema.postgres.prisma" : "prisma/schema.prisma";
const prismaCli = path.resolve("node_modules/prisma/build/index.js");
const generatedSchemaPath = path.resolve("node_modules/.prisma/client/schema.prisma");

if (!existsSync(prismaCli)) {
  console.log(`[prisma-generate] Prisma CLI absent (${prismaCli}), étape ignorée.`);
  process.exit(0);
}

// En dev local non forcé, éviter d'écraser le moteur DLL si le client correspond déjà.
if (!forcePostgres && !forceSqlite && !isVercel && !isCi && existsSync(generatedSchemaPath)) {
  const current = readFileSync(generatedSchemaPath, "utf8");
  if (new RegExp(`provider\\s*=\\s*"${targetProvider}"`).test(current)) {
    console.log(`[prisma-generate] Client Prisma déjà aligné (${targetProvider}).`);
    process.exit(0);
  }
}

console.log(`[prisma-generate] Génération client Prisma (${targetProvider}) depuis ${schemaPath}`);
execFileSync(process.execPath, [prismaCli, "generate", "--schema", schemaPath], {
  stdio: "inherit",
});
