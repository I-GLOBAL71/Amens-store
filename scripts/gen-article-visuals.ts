/**
 * CLI : `bun run scripts/gen-article-visuals.ts [--force]`
 *
 * Génère des couvertures éditoriales WebP 1200×630 légères (~25-60 Ko) pour chaque
 * article d'amens.store, les enregistre dans `public/img/blog/<flat-slug>.webp`
 * et les téléverse sur Vercel Blob (`BLOB_READ_WRITE_TOKEN`) tout en mettant à
 * jour `public/img/blog/manifest.json`.
 *
 * Aucun terme stratégique interne (SEO/GEO/AIO…) dans les visuels (GUARDRAILS §7).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { db } from "../src/lib/db";
import { angleById } from "../src/lib/pipeline/types";

const W = 1200;
const H = 630;
const OUTPUT_DIR = path.join(process.cwd(), "public", "img", "blog");

interface ManifestEntry {
  slug: string;
  fileSlug: string;
  localPath: string;
  blobUrl?: string;
  bytes: number;
}

const PALETTES: Record<number, { c1: string; c2: string; accent: string; soft: string; motif: string }> = {
  1: { c1: "#064e3b", c2: "#047857", accent: "#10b981", soft: "#a7f3d0", motif: "nodes" },
  2: { c1: "#78350f", c2: "#b45309", accent: "#f59e0b", soft: "#fde68a", motif: "rocket" },
  3: { c1: "#7c2d12", c2: "#c2410c", accent: "#fb923c", soft: "#fed7aa", motif: "wave" },
  4: { c1: "#134e4a", c2: "#0f766e", accent: "#14b8a6", soft: "#99f6e4", motif: "bars" },
  5: { c1: "#881337", c2: "#be123c", accent: "#f43f5e", soft: "#fecdd3", motif: "transfer" },
  6: { c1: "#7f1d1d", c2: "#b91c1c", accent: "#ef4444", soft: "#fecaca", motif: "tag" },
  7: { c1: "#164e63", c2: "#0e7490", accent: "#06b6d4", soft: "#a5f3fc", motif: "shield" },
  8: { c1: "#713f12", c2: "#a16207", accent: "#eab308", soft: "#fef08a", motif: "pulse" },
  9: { c1: "#4c1d95", c2: "#6d28d9", accent: "#8b5cf6", soft: "#ddd6fe", motif: "campus" },
  10: { c1: "#1e293b", c2: "#334155", accent: "#38bdf8", soft: "#bae6fd", motif: "grid" },
};

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapLines(text: string, maxChars = 30, maxLines = 3): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= maxChars) {
      cur = (cur + " " + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.length > lines.join(" ").split(/\s+/).length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[,\s]+$/, "") + "…";
  }
  return lines;
}

function renderMotif(motif: string, accent: string, soft: string): string {
  const cx = 960;
  const cy = 315;
  switch (motif) {
    case "nodes":
      return `
        <circle cx="${cx}" cy="${cy}" r="140" fill="none" stroke="${accent}" stroke-width="2" stroke-opacity="0.35"/>
        <circle cx="${cx}" cy="${cy}" r="88" fill="none" stroke="${soft}" stroke-width="2" stroke-opacity="0.5"/>
        <line x1="${cx - 95}" y1="${cy - 45}" x2="${cx}" y2="${cy}" stroke="${soft}" stroke-width="3" stroke-opacity="0.7"/>
        <line x1="${cx + 90}" y1="${cy - 55}" x2="${cx}" y2="${cy}" stroke="${soft}" stroke-width="3" stroke-opacity="0.7"/>
        <line x1="${cx}" y1="${cy}" x2="${cx + 55}" y2="${cy + 90}" stroke="${soft}" stroke-width="3" stroke-opacity="0.7"/>
        <circle cx="${cx}" cy="${cy}" r="24" fill="${accent}"/>
        <circle cx="${cx - 95}" cy="${cy - 45}" r="16" fill="${soft}"/>
        <circle cx="${cx + 90}" cy="${cy - 55}" r="16" fill="${soft}"/>
        <circle cx="${cx + 55}" cy="${cy + 90}" r="16" fill="${soft}"/>
      `;
    case "bars":
      return `
        <rect x="${cx - 110}" y="${cy + 30}" width="42" height="80" rx="8" fill="${soft}" fill-opacity="0.55"/>
        <rect x="${cx - 50}" y="${cy - 20}" width="42" height="130" rx="8" fill="${soft}" fill-opacity="0.75"/>
        <rect x="${cx + 10}" y="${cy - 75}" width="42" height="185" rx="8" fill="${accent}"/>
        <rect x="${cx + 70}" y="${cy - 120}" width="42" height="230" rx="8" fill="${soft}"/>
      `;
    case "shield":
    case "campus":
      return `
        <path d="M${cx} ${cy - 135} L${cx + 115} ${cy - 85} L${cx + 115} ${cy + 15} C${cx + 115} ${cy + 95} ${cx} ${cy + 145} ${cx} ${cy + 145} C${cx} ${cy + 145} ${cx - 115} ${cy + 95} ${cx - 115} ${cy + 15} L${cx - 115} ${cy - 85} Z"
              fill="${accent}" fill-opacity="0.22" stroke="${soft}" stroke-width="3"/>
        <polyline points="${cx - 40},${cy + 5} ${cx - 10},${cy + 35} ${cx + 48},${cy - 30}" fill="none" stroke="${soft}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    case "pulse":
      return `
        <circle cx="${cx}" cy="${cy}" r="130" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-width="2"/>
        <polyline points="${cx - 125},${cy + 10} ${cx - 65},${cy + 10} ${cx - 35},${cy - 75} ${cx + 5},${cy + 85} ${cx + 45},${cy - 35} ${cx + 75},${cy + 10} ${cx + 125},${cy + 10}"
                  fill="none" stroke="${soft}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    case "wave":
      return `
        <circle cx="${cx}" cy="${cy}" r="135" fill="none" stroke="${soft}" stroke-width="2" stroke-opacity="0.35"/>
        <circle cx="${cx}" cy="${cy}" r="92" fill="none" stroke="${accent}" stroke-width="3" stroke-opacity="0.7"/>
        <circle cx="${cx}" cy="${cy}" r="48" fill="${accent}" fill-opacity="0.9"/>
        <rect x="${cx - 65}" y="${cy + 75}" width="130" height="44" rx="22" fill="${soft}" fill-opacity="0.95"/>
      `;
    default:
      return `
        <rect x="${cx - 120}" y="${cy - 105}" width="240" height="175" rx="18" fill="${accent}" fill-opacity="0.2" stroke="${soft}" stroke-width="2.5"/>
        <line x1="${cx - 120}" y1="${cy - 55}" x2="${cx + 120}" y2="${cy - 55}" stroke="${soft}" stroke-width="2" stroke-opacity="0.5"/>
        <circle cx="${cx - 90}" cy="${cy - 80}" r="6" fill="${soft}"/>
        <circle cx="${cx - 68}" cy="${cy - 80}" r="6" fill="${accent}"/>
        <rect x="${cx - 88}" y="${cy - 22}" width="145" height="14" rx="7" fill="${soft}" fill-opacity="0.85"/>
        <rect x="${cx - 88}" y="${cy + 12}" width="176" height="14" rx="7" fill="${accent}" fill-opacity="0.85"/>
        <rect x="${cx - 88}" y="${cy + 46}" width="110" height="14" rx="7" fill="${soft}" fill-opacity="0.6"/>
      `;
  }
}

function buildSvg(article: {
  title: string;
  silo: string;
  angle: number;
  costEstimate: string;
  timeEstimate: string;
}): string {
  const pal = PALETTES[article.angle] ?? PALETTES[1];
  const angle = angleById(article.angle);
  const categoryLabel = angle ? angle.nom.split("(")[0].trim() : `/${article.silo}/`;
  const lines = wrapLines(article.title, 30, 3);
  const startY = lines.length === 3 ? 250 : 275;
  const titleSvg = lines
    .map(
      (line, idx) =>
        `<text x="72" y="${startY + idx * 64}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="800" fill="#ffffff" letter-spacing="-0.5">${esc(line)}</text>`
    )
    .join("\n");

  const badgeParts = [article.costEstimate, article.timeEstimate, "Données Labo datées"].filter(Boolean);
  const footerText = badgeParts.join("  ·  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="55%" stop-color="${pal.c1}"/>
      <stop offset="100%" stop-color="${pal.c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="48%" r="48%">
      <stop offset="0%" stop-color="${pal.accent}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${pal.c1}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="28" fill="#0b1120" fill-opacity="0.45" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1.5"/>

  <rect x="72" y="76" width="210" height="40" rx="20" fill="${pal.accent}" fill-opacity="0.22" stroke="${pal.soft}" stroke-opacity="0.45" stroke-width="1.5"/>
  <text x="177" y="102" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="18" font-weight="700" fill="${pal.soft}">amens.store</text>
  <text x="302" y="102" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="18" font-weight="600" fill="#cbd5e1">${esc(categoryLabel)}</text>

  ${titleSvg}

  <rect x="72" y="502" width="660" height="48" rx="14" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.14"/>
  <circle cx="96" cy="526" r="6" fill="${pal.accent}"/>
  <text x="114" y="532" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="19" font-weight="600" fill="#e2e8f0">${esc(footerText)}</text>

  ${renderMotif(pal.motif, pal.accent, pal.soft)}
</svg>`;
}

async function uploadToVercelBlob(pathname: string, buf: Buffer, token: string): Promise<string> {
  // Note: store_SGfE68TDnHKfunSg est configuré en accès « private » côté Vercel.
  // On essaie d'abord « private » (ou « public » via @vercel/blob si configuré ainsi),
  // puis les assets restent servis publiquement via /img/blog/ ou le proxy /api/media/blog/.
  const endpoint = `https://vercel.com/api/blob/?pathname=${encodeURIComponent(pathname)}`;
  for (const access of ["private", "public"] as const) {
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "x-api-version": "13",
        "x-vercel-blob-access": access,
        "x-content-type": "image/webp",
        "x-add-random-suffix": "0",
        "x-allow-overwrite": "1",
        "x-content-length": String(buf.byteLength),
      },
      body: new Uint8Array(buf),
    });
    if (res.ok) {
      const json = (await res.json()) as { url: string };
      return json.url;
    }
    const text = await res.text();
    if (access === "private" && text.includes("Cannot use private access on a public store")) {
      continue;
    }
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  throw new Error("Échec upload Vercel Blob");
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
  let prev: Record<string, ManifestEntry> = {};
  if (existsSync(manifestPath)) {
    try {
      prev = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, ManifestEntry>;
    } catch {
      prev = {};
    }
  }

  const slugIdx = process.argv.indexOf("--slug");
  const targetSlug = slugIdx !== -1 ? process.argv[slugIdx + 1] : undefined;
  const imgIdx = process.argv.indexOf("--image");
  const customImagePath = imgIdx !== -1 ? process.argv[imgIdx + 1] : undefined;

  const articles = await db.article.findMany({
    where: targetSlug ? { slug: targetSlug } : { status: "published" },
    orderBy: [{ angle: "asc" }],
    select: { slug: true, silo: true, angle: true, title: true, costEstimate: true, timeEstimate: true },
  });

  const force = process.argv.includes("--force");
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim() || "";
  console.log(token ? "✓ BLOB_READ_WRITE_TOKEN détecté : upload Vercel Blob activé." : "ℹ BLOB_READ_WRITE_TOKEN absent : écriture locale uniquement.");

  const manifest: Record<string, ManifestEntry> = targetSlug ? { ...prev } : {};
  let totalBytes = 0;

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const fileSlug = a.slug.replaceAll("/", "-");
    const fileName = `${fileSlug}.webp`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    const sourceBuf =
      customImagePath && existsSync(customImagePath)
        ? readFileSync(customImagePath)
        : Buffer.from(buildSvg(a));

    const webpBuf = await sharp(sourceBuf, customImagePath ? undefined : { density: 144 })
      .resize({ width: W, height: H, fit: "cover" })
      .webp({ quality: 82, effort: 5 })
      .toBuffer();

    const oldEntry = prev[a.slug];
    const changed = !existsSync(filePath) || !oldEntry || oldEntry.bytes !== webpBuf.length;
    writeFileSync(filePath, new Uint8Array(webpBuf));
    totalBytes += webpBuf.length;

    let blobUrl = oldEntry?.blobUrl;
    if (token && (force || !blobUrl || changed)) {
      try {
        blobUrl = await uploadToVercelBlob(`blog/${fileName}`, webpBuf, token);
      } catch (err) {
        console.warn(`  ⚠ Upload Blob échoué pour ${a.slug}: ${(err as Error).message}`);
      }
    }

    manifest[a.slug] = {
      slug: a.slug,
      fileSlug,
      localPath: `/img/blog/${fileName}`,
      ...(blobUrl ? { blobUrl } : {}),
      bytes: webpBuf.length,
    };
    const kb = (webpBuf.length / 1024).toFixed(1);
    console.log(`[${i + 1}/${articles.length}] ✓ ${a.slug} → ${kb} Ko ${blobUrl ? `(${blobUrl})` : "(local)"}`);
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`\n✓ ${articles.length} visuels WebP (total ${(totalBytes / 1024).toFixed(1)} Ko) générés · manifest.json à jour.`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
