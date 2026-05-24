/**
 * AFC Data Pipeline — Helvetax
 * Télécharge les ZIPs de barèmes impôt à la source 2026 depuis estv2.admin.ch,
 * parse les fichiers TXT et génère src/data/fiscalData2026.json
 *
 * Usage: npx ts-node scripts/afc-pipeline/fetch-afc.ts
 * Deps:  npm install -D ts-node adm-zip node-fetch@2
 */

import * as fs   from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import AdmZip    from 'adm-zip';
import fetch     from 'node-fetch';

// ESM compat — remplace __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Config ────────────────────────────────────────────────────────────────────

const YEAR = 2026;

const ZIP_URLS: Record<string, string> = {
  VS: `https://www.estv2.admin.ch/qst/${YEAR}/loehne/tar26vs.zip`,
  VD: `https://www.estv2.admin.ch/qst/${YEAR}/loehne/tar26vd.zip`,
  GE: `https://www.estv2.admin.ch/qst/${YEAR}/loehne/tar26ge.zip`,
  NE: `https://www.estv2.admin.ch/qst/${YEAR}/loehne/tar26ne.zip`,
};

const OUT_DIR   = path.resolve(__dirname, '../../src/data');
const CACHE_DIR = path.resolve(__dirname, '.cache');
const OUT_FILE  = path.join(OUT_DIR, 'fiscalData2026.json');

// Données fédérales confirmées (audit 2026-05-21)
const FEDERAL = {
  pillar3a:            7258,   // CHF — plafond versement salarié 2026
  pillar3aIndependent: 36288,  // CHF — 20% revenu AVS, max
  socialSecurityRate:  0.064,  // 6.4% = AVS 5.3% + AC 1.1% (LPP séparée)
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadZip(canton: string, url: string): Promise<Buffer> {
  const cacheFile = path.join(CACHE_DIR, `tar26${canton.toLowerCase()}.zip`);
  if (fs.existsSync(cacheFile)) {
    console.log(`  [cache] ${canton}`);
    return fs.readFileSync(cacheFile);
  }
  console.log(`  [fetch] ${canton} — ${url}`);
  const res = await fetch(url, { timeout: 30000 });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${canton}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, buf);
  return buf;
}

/**
 * Parse un fichier TXT AFC (format fixe, séparateur point-virgule ou espace)
 * Retourne un tableau de lignes de barème : { revenu, taux, montant }
 *
 * Format AFC documenté: https://www.estv.admin.ch/dam/estv/fr/dokumente/quellensteuer/tarife/tarifaufbau.pdf
 * Structure typique:
 *   KANTON;TARIF;PERIODE;VON_BRUTTO;BIS_BRUTTO;STEUER_BETRAG;STEUER_SATZ
 */
function parseTarifFile(content: string): AfcTarifRow[] {
  const rows: AfcTarifRow[] = [];
  const lines = content.split('\n').filter(l => l.trim());

  for (const line of lines) {
    // Skip headers / metadata
    if (line.startsWith('#') || line.startsWith('*') || !/^\d/.test(line.trim())) continue;

    // Essaie séparateur ';' d'abord, puis whitespace
    const parts = line.includes(';')
      ? line.split(';').map(s => s.trim())
      : line.trim().split(/\s+/);

    if (parts.length < 4) continue;

    const row = parseAfcRow(parts);
    if (row) rows.push(row);
  }
  return rows;
}

interface AfcTarifRow {
  tarif:       string;   // ex: 'A0', 'B1', 'C2'...
  fromBrut:    number;   // revenu brut annuel de (CHF)
  toBrut:      number;   // revenu brut annuel jusqu'à (CHF)
  taxAmount:   number;   // montant impôt (CHF)
  taxRate:     number;   // taux en % (0-100)
}

function parseAfcRow(parts: string[]): AfcTarifRow | null {
  try {
    // Position flexible selon canton — on cherche les colonnes numériques
    const nums = parts.map(p => parseFloat(p.replace(/'/g, '').replace(',', '.'))).filter(n => !isNaN(n));
    if (nums.length < 3) return null;
    return {
      tarif:     parts[0] ?? '',
      fromBrut:  nums[0] ?? 0,
      toBrut:    nums[1] ?? 0,
      taxAmount: nums[2] ?? 0,
      taxRate:   nums[3] ?? 0,
    };
  } catch {
    return null;
  }
}

async function processCantonZip(canton: string, buf: Buffer): Promise<CantonTarifs> {
  const zip   = new AdmZip(buf);
  const files = zip.getEntries();
  const tarifs: Record<string, AfcTarifRow[]> = {};

  console.log(`  [parse] ${canton} — ${files.length} fichier(s) dans le ZIP`);

  for (const entry of files) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.toLowerCase();

    // Fichiers TXT ou CSV de barèmes
    if (!name.endsWith('.txt') && !name.endsWith('.csv') && !name.endsWith('.dat')) continue;

    const content = entry.getData().toString('latin1'); // AFC utilise latin1
    const rows    = parseTarifFile(content);
    if (rows.length > 0) {
      tarifs[entry.entryName] = rows;
      console.log(`    ${entry.entryName}: ${rows.length} lignes`);
    }
  }

  return { canton, tarifs, fileCount: files.length };
}

interface CantonTarifs {
  canton:    string;
  tarifs:    Record<string, AfcTarifRow[]>;
  fileCount: number;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nHelvetax AFC Pipeline — ${YEAR}`);
  console.log('='.repeat(40));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const cantonData: Record<string, CantonTarifs> = {};
  const errors: string[] = [];

  for (const [canton, url] of Object.entries(ZIP_URLS)) {
    try {
      console.log(`\n[${canton}]`);
      const buf    = await downloadZip(canton, url);
      const result = await processCantonZip(canton, buf);
      cantonData[canton] = result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] ${canton}: ${msg}`);
      errors.push(`${canton}: ${msg}`);
    }
  }

  // Construction du JSON de sortie
  const output = {
    year:       YEAR,
    lastUpdate: new Date().toISOString().split('T')[0],
    source:     'AFC — estv2.admin.ch',
    federal:    FEDERAL,
    cantons:    Object.fromEntries(
      Object.entries(cantonData).map(([canton, data]) => [
        canton,
        {
          filesParsed: data.fileCount,
          tarifsFiles: Object.keys(data.tarifs),
          // Résumé par fichier: nb de lignes parsées
          rowCounts: Object.fromEntries(
            Object.entries(data.tarifs).map(([file, rows]) => [file, rows.length])
          ),
          // Données brutes complètes (pour intégration future dans l'UI)
          tarifs: data.tarifs,
        }
      ])
    ),
    errors,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n✅ Généré: ${OUT_FILE}`);
  console.log(`   Cantons OK: ${Object.keys(cantonData).join(', ')}`);
  if (errors.length) console.warn(`   Erreurs: ${errors.join('; ')}`);
}

main().catch(err => { console.error(err); process.exit(1); });
