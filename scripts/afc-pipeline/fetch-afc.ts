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
 * Parse un fichier TXT AFC au format fixe (Recordart 06)
 * Documentation: AFC "Aufbau der Tarife" — positions 1-indexées, converties en substring JS (0-indexé)
 *
 * Positions confirmées (0-indexé JS):
 *   [0,2)   Recordart    — '06' pour les lignes de barème
 *   [4,6)   Canton       — ex: 'VS'
 *   [6,16)  codeBarème   — ex: 'A0N', 'B1N'
 *   [16,24) Date         — 'AAAAMMJJ' (ignoré)
 *   [24,33) RevenuCents  — revenu mensuel brut en centimes → ÷100 = CHF
 *   [33,42) PasCents     — pas de progression en centimes → ÷100 = CHF
 *   [43,45) Enfants      — nombre d'enfants (2 chiffres)
 *   [45,54) MontantCents — impôt minimum en centimes → ÷100 = CHF
 *   [54,59) Taux5        — taux sur 5 chiffres implicite 2 déc. → ÷10000 = décimal
 *                           ex: '01150' → 0.1150
 */
function parseTarifFile(content: string): AfcTarifRow[] {
  const rows: AfcTarifRow[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Une ligne Recordart 06 fait au moins 59 caractères
    if (line.length < 59) continue;
    if (line.substring(0, 2) !== '06') continue;

    const row = parseAfcRow(line);
    if (row) rows.push(row);
  }
  return rows;
}

interface AfcTarifRow {
  canton:       string;   // ex: 'VS', 'VD', 'GE', 'NE'
  codeBareme:   string;   // ex: 'A0N', 'B1N', 'C2N'
  revenu:       number;   // revenu mensuel brut minimum (CHF)
  pas:          number;   // pas de progression (CHF)
  enfants:      number;   // nombre d'enfants
  impotMinimum: number;   // montant d'impôt minimum (CHF)
  taux:         number;   // taux marginal décimal (ex: 0.1150)
}

function parseAfcRow(line: string): AfcTarifRow | null {
  try {
    const canton       = line.substring(4,  6).trim();
    const codeBareme   = line.substring(6,  16).trim();
    const revenuCents  = parseInt(line.substring(24, 33), 10);
    const pasCents     = parseInt(line.substring(33, 42), 10);
    const enfants      = parseInt(line.substring(43, 45), 10);
    const montantCents = parseInt(line.substring(45, 54), 10);
    const taux5        = parseInt(line.substring(54, 59), 10);

    if (!canton || !codeBareme)                    return null;
    if (isNaN(revenuCents) || isNaN(taux5))        return null;

    return {
      canton,
      codeBareme,
      revenu:       revenuCents  / 100,
      pas:          isNaN(pasCents)     ? 0 : pasCents  / 100,
      enfants:      isNaN(enfants)      ? 0 : enfants,
      impotMinimum: isNaN(montantCents) ? 0 : montantCents / 100,
      taux:         taux5 / 10000,
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

  // Construction du JSON de sortie — format compact (résumé taux seulement)
  // Pour chaque (canton, codeBareme): tableau trié de { revenu, taux }, taux > 0 uniquement
  const compactCantons: Record<string, Record<string, { revenu: number; taux: number }[]>> = {};

  for (const [canton, data] of Object.entries(cantonData)) {
    const byBareme: Record<string, { revenu: number; taux: number }[]> = {};

    for (const rows of Object.values(data.tarifs)) {
      for (const row of rows) {
        if (row.taux <= 0) continue; // ignorer les lignes sans impôt
        if (!byBareme[row.codeBareme]) byBareme[row.codeBareme] = [];
        byBareme[row.codeBareme].push({ revenu: row.revenu, taux: row.taux });
      }
    }

    // Dédupliquer sur revenu + trier + ne garder que les points de changement de taux
    // (la table est une fonction en escalier — les runs identiques sont redondants)
    for (const code of Object.keys(byBareme)) {
      const deduped = new Map<number, number>();
      for (const pt of byBareme[code]) deduped.set(pt.revenu, pt.taux);
      const sorted = Array.from(deduped.entries())
        .sort(([a], [b]) => a - b);

      // Ne garder que les breakpoints où le taux change
      const breakpoints: { revenu: number; taux: number }[] = [];
      let prevTaux = -1;
      for (const [revenu, taux] of sorted) {
        if (taux !== prevTaux) {
          breakpoints.push({ revenu, taux });
          prevTaux = taux;
        }
      }
      byBareme[code] = breakpoints;
    }

    compactCantons[canton] = byBareme;

    const totalPoints = Object.values(byBareme).reduce((s, a) => s + a.length, 0);
    const baremeCodes = Object.keys(byBareme).sort();
    console.log(`  [compact] ${canton}: ${baremeCodes.length} barèmes, ${totalPoints} points (taux>0)`);
  }

  const output = {
    year:       YEAR,
    lastUpdate: new Date().toISOString().split('T')[0],
    source:     'AFC — estv2.admin.ch',
    federal:    FEDERAL,
    cantons:    compactCantons,
    errors,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output), 'utf8');
  console.log(`\n✅ Généré: ${OUT_FILE}`);
  console.log(`   Cantons OK: ${Object.keys(cantonData).join(', ')}`);
  if (errors.length) console.warn(`   Erreurs: ${errors.join('; ')}`);

  // ── Échantillon de validation ─────────────────────────────────────────────
  console.log('\n── Échantillon parsé (5 premières lignes par canton) ──────────────────');
  for (const [canton, data] of Object.entries(cantonData)) {
    const allRows: AfcTarifRow[] = Object.values(data.tarifs).flat();
    const sample = allRows.slice(0, 5);
    console.log(`\n[${canton}] ${allRows.length} lignes totales`);
    for (const r of sample) {
      console.log(
        `  barème=${r.codeBareme.padEnd(10)} enf=${r.enfants}` +
        `  revenu=${String(r.revenu).padStart(8)} CHF` +
        `  taux=${(r.taux * 100).toFixed(4).padStart(8)} %` +
        `  impôtMin=${String(r.impotMinimum).padStart(8)} CHF`
      );
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
