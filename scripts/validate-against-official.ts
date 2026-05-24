/**
 * validate-against-official.ts
 *
 * Valide les calculs Helvetax en les comparant au calculateur swisstaxcalculator
 * (projet open-source qui reproduit le calculateur officiel de l'AFC).
 *
 * Modes :
 *   Auto (défaut) : interroge l'API REST, compare et affiche les écarts.
 *   Manuel        : affiche le tableau vide à remplir manuellement (flag --manual).
 *
 * Usage :
 *   npx vite-node scripts/validate-against-official.ts           # mode auto
 *   npx vite-node scripts/validate-against-official.ts --manual  # mode manuel
 *   SWISSTAX_API_URL=http://localhost:3000 npx vite-node scripts/validate-against-official.ts
 *
 * ⚠️  Note méthodologique importante :
 *   - Helvetax calcule l'IS (impôt À LA SOURCE) via les barèmes AFC officiels
 *     appliqués directement au revenu brut mensuel. C'est le régime applicable
 *     aux titulaires de permis B salariés.
 *   - swisstaxcalculator calcule l'IMPÔT ORDINAIRE (TOU) : il déduit les frais
 *     professionnels et autres déductions avant d'appliquer le barème.
 *   - Un écart de 5–20% entre les deux est NORMAL et ne signifie pas d'erreur.
 *     Seul un écart > 30% ou une inversion de tendance (canton A > B alors
 *     qu'attendu l'inverse) mérite investigation.
 *
 * API utilisée : https://github.com/devbrains-com/swisstaxcalculator
 *   Instance publique : https://swisstaxcalculator.vercel.app/api/taxes
 *   Instance locale   : http://localhost:3000/api/taxes
 *     → git clone https://github.com/devbrains-com/swisstaxcalculator
 *     → yarn install && yarn importdata 2026 --download && yarn dev
 */

import { getMarginalRate } from '../src/utils/taxBrackets';
import { calculateWealthTax } from '../src/utils/wealthTax';
import type { Canton } from '../src/utils/cantonConfig';
import type { CoupleIncomeType } from '../src/utils/afcTariffs';

// ── Configuration ─────────────────────────────────────────────────────────────

const MANUAL_MODE = process.argv.includes('--manual');
const API_BASE    = process.env.SWISSTAX_API_URL ?? 'https://swisstaxcalculator.vercel.app';
const API_URL     = `${API_BASE}/api/taxes`;
const API_TIMEOUT = 12_000; // ms

/** Codes OFS (BfsID) des chefs-lieux de référence par canton. */
const COMMUNE_IDS: Record<Canton, number> = {
  VS: 6266,  // Sion
  VD: 5586,  // Lausanne
  GE: 6621,  // Genève
  NE: 6458,  // Neuchâtel
};

/** IDs canton dans swisstaxcalculator (1–26). */
const CANTON_IDS: Record<Canton, number> = {
  VS: 24,
  VD: 23,
  GE:  8,
  NE: 13,
};

// ── Types locaux ──────────────────────────────────────────────────────────────

interface TestCase {
  id:            string;
  canton:        Canton;
  situation:     'single' | 'couple';
  coupleIncome?: CoupleIncomeType; // 'single'=barème C (défaut), 'dual'=barème B
  children:      number;
  grossIncome:   number;           // revenu brut annuel CHF (total ménage)
  fortune:       number;           // fortune nette CHF
  description:   string;
}

interface HelvetaxResult {
  ifdTaxChf:          number;
  cantonalTaxChf:     number;
  totalIncomeTaxChf:  number;
  marginalRate:       number;
  effectiveRate:      number;
  wealthTaxChf:       number;
  grandTotalChf:      number;
}

interface OfficialResult {
  ifdTaxChf:          number;  // taxesIncomeBund
  cantonalTaxChf:     number;  // taxesIncomeCanton
  communalTaxChf:     number;  // taxesIncomeCity
  totalIncomeTaxChf:  number;  // bund + canton + city (hors église)
  wealthTaxCanton:    number;  // taxesFortuneCanton
  wealthTaxCity:      number;  // taxesFortuneCity
  wealthTaxChf:       number;  // fortune canton + city
  grandTotalChf:      number;  // tous impôts hors église
  taxableIncomeBund:  number;
  taxableIncomeCanton:number;
  error?:             string;
}

// ── Payload API ───────────────────────────────────────────────────────────────

interface ApiPerson {
  age:         number;
  confession:  'other';
  incomeType:  'gross';
  income:      number;
}

interface ApiPayload {
  calculationType: 'incomeAndWealth';
  relationship:    's' | 'm';
  locationId:      number;
  cantonId:        number;
  year:            number;
  children:        number;
  fortune:         number;
  persons:         ApiPerson[];
}

function buildPayload(tc: TestCase): ApiPayload {
  const isSingle = tc.situation === 'single';
  const isDual   = tc.coupleIncome === 'dual';

  let persons: ApiPerson[];
  if (isSingle) {
    persons = [{ age: 35, confession: 'other', incomeType: 'gross', income: tc.grossIncome }];
  } else if (isDual) {
    // Barème B — 2 revenus : split 50/50 (hypothèse parité, déclarable séparément)
    const half = Math.round(tc.grossIncome / 2);
    persons = [
      { age: 35, confession: 'other', incomeType: 'gross', income: half },
      { age: 35, confession: 'other', incomeType: 'gross', income: half },
    ];
  } else {
    // Barème C — 1 revenu : 2 personnes, conjoint avec revenu 0
    persons = [
      { age: 35, confession: 'other', incomeType: 'gross', income: tc.grossIncome },
      { age: 35, confession: 'other', incomeType: 'gross', income: 0 },
    ];
  }

  return {
    calculationType: 'incomeAndWealth',
    relationship:    isSingle ? 's' : 'm',
    locationId:      COMMUNE_IDS[tc.canton],
    cantonId:        CANTON_IDS[tc.canton],
    year:            2026,
    children:        tc.children,
    fortune:         tc.fortune,
    persons,
  };
}

async function callApi(tc: TestCase): Promise<OfficialResult | null> {
  const payload = buildPayload(tc);
  try {
    const res = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(API_TIMEOUT),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { error: `HTTP ${res.status}: ${txt.slice(0, 120)}` } as OfficialResult;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d: any = await res.json();
    const incomeTax =
      (d.taxesIncomeBund   ?? 0) +
      (d.taxesIncomeCanton ?? 0) +
      (d.taxesIncomeCity   ?? 0);
    const wealthTax =
      (d.taxesFortuneCanton ?? 0) +
      (d.taxesFortuneCity   ?? 0);
    return {
      ifdTaxChf:           Math.round(d.taxesIncomeBund   ?? 0),
      cantonalTaxChf:      Math.round(d.taxesIncomeCanton ?? 0),
      communalTaxChf:      Math.round(d.taxesIncomeCity   ?? 0),
      totalIncomeTaxChf:   Math.round(incomeTax),
      wealthTaxCanton:     Math.round(d.taxesFortuneCanton ?? 0),
      wealthTaxCity:       Math.round(d.taxesFortuneCity   ?? 0),
      wealthTaxChf:        Math.round(wealthTax),
      grandTotalChf:       Math.round(incomeTax + wealthTax),
      taxableIncomeBund:   Math.round(d.details?.taxableIncomeBund   ?? 0),
      taxableIncomeCanton: Math.round(d.details?.taxableIncomeCanton ?? 0),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg.slice(0, 120) } as OfficialResult;
  }
}

// ── Test ping de l'API ────────────────────────────────────────────────────────

async function pingApi(): Promise<boolean> {
  try {
    const probe: ApiPayload = {
      calculationType: 'incomeAndWealth',
      relationship: 's', locationId: 6266, cantonId: 24,
      year: 2026, children: 0, fortune: 0,
      persons: [{ age: 35, confession: 'other', incomeType: 'gross', income: 80_000 }],
    };
    const res = await fetch(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(probe), signal: AbortSignal.timeout(8_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Cas types ─────────────────────────────────────────────────────────────────

const TEST_CASES: TestCase[] = [
  // === Valais (VS) — Sion ===
  { id: 'VS-01', canton: 'VS', situation: 'single',  children: 0, grossIncome:  60_000, fortune:         0, description: 'VS · Célibataire · 60k' },
  { id: 'VS-02', canton: 'VS', situation: 'single',  children: 0, grossIncome:  80_000, fortune:         0, description: 'VS · Célibataire · 80k' },
  { id: 'VS-03', canton: 'VS', situation: 'single',  children: 0, grossIncome: 100_000, fortune:         0, description: 'VS · Célibataire · 100k' },
  { id: 'VS-04', canton: 'VS', situation: 'single',  children: 0, grossIncome: 150_000, fortune:         0, description: 'VS · Célibataire · 150k' },
  { id: 'VS-05', canton: 'VS', situation: 'couple',  children: 0, grossIncome: 120_000, fortune:         0, description: 'VS · Couple 1 rev. · 120k', coupleIncome: 'single' },
  { id: 'VS-06', canton: 'VS', situation: 'couple',  children: 0, grossIncome: 150_000, fortune:         0, description: 'VS · Couple 2 rev. · 150k total', coupleIncome: 'dual' },
  { id: 'VS-07', canton: 'VS', situation: 'couple',  children: 2, grossIncome: 120_000, fortune:         0, description: 'VS · Couple 1 rev. · 2 enf. · 120k', coupleIncome: 'single' },
  { id: 'VS-08', canton: 'VS', situation: 'single',  children: 0, grossIncome:  80_000, fortune:   500_000, description: 'VS · Célibataire · 80k + fort. 500k' },
  { id: 'VS-09', canton: 'VS', situation: 'couple',  children: 0, grossIncome: 150_000, fortune: 1_000_000, description: 'VS · Couple 1 rev. · 150k + fort. 1M', coupleIncome: 'single' },
  // === Vaud (VD) — Lausanne ===
  { id: 'VD-01', canton: 'VD', situation: 'single',  children: 0, grossIncome:  80_000, fortune:         0, description: 'VD · Célibataire · 80k' },
  { id: 'VD-02', canton: 'VD', situation: 'single',  children: 0, grossIncome: 100_000, fortune:         0, description: 'VD · Célibataire · 100k' },
  { id: 'VD-03', canton: 'VD', situation: 'couple',  children: 0, grossIncome: 150_000, fortune:         0, description: 'VD · Couple 1 rev. · 150k', coupleIncome: 'single' },
  { id: 'VD-04', canton: 'VD', situation: 'couple',  children: 2, grossIncome: 150_000, fortune:   300_000, description: 'VD · Couple 2 rev. · 2 enf. · 150k + fort. 300k', coupleIncome: 'dual' },
  { id: 'VD-05', canton: 'VD', situation: 'couple',  children: 0, grossIncome: 150_000, fortune: 1_000_000, description: 'VD · Couple 1 rev. · 150k + fort. 1M', coupleIncome: 'single' },
  // === Genève (GE) ===
  { id: 'GE-01', canton: 'GE', situation: 'single',  children: 0, grossIncome:  80_000, fortune:         0, description: 'GE · Célibataire · 80k' },
  { id: 'GE-02', canton: 'GE', situation: 'single',  children: 0, grossIncome: 120_000, fortune:         0, description: 'GE · Célibataire · 120k' },
  { id: 'GE-03', canton: 'GE', situation: 'couple',  children: 0, grossIncome: 200_000, fortune:         0, description: 'GE · Couple 2 rev. · 200k total', coupleIncome: 'dual' },
  { id: 'GE-04', canton: 'GE', situation: 'single',  children: 0, grossIncome: 120_000, fortune: 1_000_000, description: 'GE · Célibataire · 120k + fort. 1M' },
  // === Neuchâtel (NE) — Neuchâtel ===
  { id: 'NE-01', canton: 'NE', situation: 'single',  children: 0, grossIncome:  80_000, fortune:         0, description: 'NE · Célibataire · 80k' },
  { id: 'NE-02', canton: 'NE', situation: 'single',  children: 0, grossIncome: 100_000, fortune:         0, description: 'NE · Célibataire · 100k' },
  { id: 'NE-03', canton: 'NE', situation: 'couple',  children: 1, grossIncome: 120_000, fortune:   200_000, description: 'NE · Couple 1 rev. · 1 enf. · 120k + fort. 200k', coupleIncome: 'single' },
  { id: 'NE-04', canton: 'NE', situation: 'couple',  children: 0, grossIncome: 160_000, fortune:   500_000, description: 'NE · Couple 2 rev. · 160k total + fort. 500k', coupleIncome: 'dual' },
];

// ── Helpers affichage ─────────────────────────────────────────────────────────

function chf(n: number): string {
  return n.toLocaleString('fr-CH', { maximumFractionDigits: 0 }) + ' CHF';
}
function pct(n: number, d = 2): string {
  return (n * 100).toFixed(d) + '%';
}
function ecartPct(helvetax: number, official: number): string {
  if (official === 0) return '–';
  const e = ((helvetax - official) / official) * 100;
  const sign = e >= 0 ? '+' : '';
  return `${sign}${e.toFixed(1)}%`;
}
function baremeCode(tc: TestCase): string {
  const p = tc.situation === 'couple' ? (tc.coupleIncome === 'dual' ? 'B' : 'C') : 'A';
  return `${p}${tc.children}N`;
}

// ── Calcul Helvetax ───────────────────────────────────────────────────────────

function computeHelvetax(tc: TestCase): HelvetaxResult {
  const income = getMarginalRate(
    tc.grossIncome, tc.canton, tc.situation,
    undefined, tc.children, tc.coupleIncome,
  );
  const wealth = tc.fortune > 0
    ? calculateWealthTax(tc.fortune, tc.canton, tc.situation)
    : null;
  const wealthTaxChf = wealth?.taxAmountTotal ?? 0;
  return {
    ifdTaxChf:         income.ifdTaxChf,
    cantonalTaxChf:    income.cantonalTaxChf,
    totalIncomeTaxChf: income.totalTaxChf,
    marginalRate:      income.marginalRate,
    effectiveRate:     income.effectiveRate,
    wealthTaxChf,
    grandTotalChf:     income.totalTaxChf + wealthTaxChf,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const W   = 92;
const SEP = '═'.repeat(W);
const LIN = '─'.repeat(W);

const now = new Date();
const dateStr = now.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
const timeStr = now.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });

console.log('');
console.log(SEP);
console.log('  HELVETAX — Validation vs swisstaxcalculator 2026');
console.log(`  ${dateStr} ${timeStr}   |   API : ${API_URL}`);
if (MANUAL_MODE) {
  console.log('  Mode : MANUEL (--manual)');
} else {
  console.log('  Mode : AUTOMATIQUE (API REST)');
}
console.log(SEP);
console.log('');
console.log('  ⚠  NOTE MÉTHODOLOGIQUE');
console.log('     Helvetax  = IS (impôt À LA SOURCE) — barème AFC appliqué sur revenu brut');
console.log('     Officiel  = IMPÔT ORDINAIRE (TOU) — revenu brut avec déductions standard');
console.log('     Un écart de 5–20% entre IS et TOU est NORMAL.');
console.log('     Seul un écart > 30% ou une inversion inter-cantonale mérite investigation.');
console.log('');

(async () => {

  // ── Mode manuel ─────────────────────────────────────────────────────────────
  if (MANUAL_MODE) {
    console.log(LIN);
    console.log('  RÉSULTATS HELVETAX (IS) — colonnes "Officiel" à remplir manuellement');
    console.log(LIN);
    for (const tc of TEST_CASES) {
      const hx = computeHelvetax(tc);
      console.log(`\n  [${tc.id}] ${tc.description}  (${baremeCode(tc)})`);
      console.log(`    Brut/an      : ${chf(tc.grossIncome)}   Fortune : ${tc.fortune > 0 ? chf(tc.fortune) : '–'}`);
      console.log(`    IS total     : ${chf(hx.totalIncomeTaxChf)}   T.Marg : ${pct(hx.marginalRate)}   T.Eff : ${pct(hx.effectiveRate)}`);
      if (hx.wealthTaxChf > 0) {
        console.log(`    Fortune      : ${chf(hx.wealthTaxChf)}`);
      }
      console.log(`    TOTAL        : ${chf(hx.grandTotalChf)}`);
      console.log(`    → Officiel   : _______ CHF   (saisir sur ${tc.canton === 'VD' ? 'vd.ch' : tc.canton === 'GE' ? 'ge.ch' : 'swisstaxcalculator.estv.admin.ch'})`);
    }
    console.log('');
    return;
  }

  // ── Vérification connectivité ────────────────────────────────────────────────
  console.log(`  Test de connexion → ${API_URL} ...`);
  const apiOk = await pingApi();
  if (!apiOk) {
    console.log('');
    console.log('  ✗ API INJOIGNABLE — basculement en mode manuel.');
    console.log('');
    console.log('  Pour démarrer le serveur local :');
    console.log('    git clone https://github.com/devbrains-com/swisstaxcalculator');
    console.log('    cd swisstaxcalculator && yarn install');
    console.log('    yarn importdata 2026 --download');
    console.log('    yarn dev   # → http://localhost:3000');
    console.log('');
    console.log('  Puis relancer avec :');
    console.log('    SWISSTAX_API_URL=http://localhost:3000 npx vite-node scripts/validate-against-official.ts');
    console.log('');
    console.log('  Ou forcer le mode manuel :');
    console.log('    npx vite-node scripts/validate-against-official.ts --manual');
    process.exit(1);
  }
  console.log('  ✓ API disponible\n');

  // ── Calculs + appels API en parallèle ────────────────────────────────────────
  type CaseResult = { tc: TestCase; hx: HelvetaxResult; official: OfficialResult | null };
  const results: CaseResult[] = [];

  console.log(`  Calcul de ${TEST_CASES.length} cas types...`);
  const apiCalls = TEST_CASES.map(tc => callApi(tc));
  const apiResults = await Promise.all(apiCalls);

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc       = TEST_CASES[i];
    const hx       = computeHelvetax(tc);
    const official = apiResults[i];
    results.push({ tc, hx, official });

    const ok = official && !official.error;
    process.stdout.write(`    [${tc.id}] ${tc.description.padEnd(44)} → ${ok ? '✓' : '✗ ' + (official?.error ?? 'null')}\n`);
  }
  console.log('');

  // ── Détail par cas ─────────────────────────────────────────────────────────
  console.log(SEP);
  console.log('  DÉTAIL PAR CAS TYPE');
  console.log(SEP);

  for (const { tc, hx, official } of results) {
    console.log('');
    console.log(LIN);
    console.log(`  [${tc.id}]  ${tc.description}  —  barème ${baremeCode(tc)}`);
    console.log(LIN);
    console.log(`  Revenu brut : ${chf(tc.grossIncome)}/an${tc.fortune > 0 ? `   Fortune : ${chf(tc.fortune)}` : ''}`);

    if (official?.error) {
      console.log(`  ✗ Erreur API : ${official.error}`);
    } else if (!official) {
      console.log('  ✗ Pas de résultat API');
    } else {
      const eIncome  = ecartPct(hx.totalIncomeTaxChf, official.totalIncomeTaxChf);
      const eWealth  = tc.fortune > 0 ? ecartPct(hx.wealthTaxChf, official.wealthTaxChf) : null;
      const eTotal   = ecartPct(hx.grandTotalChf, official.grandTotalChf);

      console.log('');
      console.log('                            Helvetax (IS)   Officiel (TOU)   Écart IS/TOU');
      console.log(`  IFD (fédéral)         ${chf(hx.ifdTaxChf).padStart(14)}   ${chf(official.ifdTaxChf).padStart(14)}   —`);
      console.log(`  Cantonal              ${chf(hx.cantonalTaxChf).padStart(14)}   ${(chf(official.cantonalTaxChf) + '+' + chf(official.communalTaxChf)).padStart(14)}   —`);
      console.log(`  Total revenu          ${chf(hx.totalIncomeTaxChf).padStart(14)}   ${chf(official.totalIncomeTaxChf).padStart(14)}   ${eIncome.padStart(8)}`);
      if (tc.fortune > 0 && eWealth) {
        console.log(`  Fortune               ${chf(hx.wealthTaxChf).padStart(14)}   ${chf(official.wealthTaxChf).padStart(14)}   ${eWealth.padStart(8)}`);
      }
      console.log(`  TOTAL TOUTES TAXES    ${chf(hx.grandTotalChf).padStart(14)}   ${chf(official.grandTotalChf).padStart(14)}   ${eTotal.padStart(8)}`);
      console.log('');
      console.log(`  T.Eff Helvetax : ${pct(hx.effectiveRate)}`);
      if (official.taxableIncomeCanton > 0) {
        console.log(`  Revenu imposable (TOU) : ${chf(official.taxableIncomeCanton)} (canton)  /  ${chf(official.taxableIncomeBund)} (fédéral)`);
      }
    }
  }

  // ── Tableau de synthèse ─────────────────────────────────────────────────────
  console.log('');
  console.log(SEP);
  console.log('  TABLEAU DE SYNTHÈSE');
  console.log(SEP);
  const H = [
    'ID'.padEnd(7),
    'Description'.padEnd(46),
    'HX IS CHF'.padStart(11),
    'TOU CHF'.padStart(11),
    'Écart'.padStart(8),
    'Alerte'.padStart(8),
  ].join('  ');
  console.log(H);
  console.log('─'.repeat(H.length));

  let alerts = 0;
  for (const { tc, hx, official } of results) {
    const offTotal  = official && !official.error ? official.grandTotalChf : null;
    const ecartStr  = offTotal !== null ? ecartPct(hx.grandTotalChf, offTotal) : 'API ✗';
    const ecartNum  = offTotal !== null ? ((hx.grandTotalChf - offTotal) / offTotal) * 100 : 0;
    const flag      = offTotal !== null && Math.abs(ecartNum) > 30 ? '⚠ >30%' : '';
    if (flag) alerts++;

    console.log([
      tc.id.padEnd(7),
      tc.description.padEnd(46),
      chf(hx.grandTotalChf).padStart(11),
      (offTotal !== null ? chf(offTotal) : '–').padStart(11),
      ecartStr.padStart(8),
      flag.padStart(8),
    ].join('  '));
  }

  console.log(SEP);
  console.log('');
  if (alerts > 0) {
    console.log(`  ⚠  ${alerts} cas avec écart > 30% — vérifier les barèmes ou les déductions.`);
  } else {
    console.log('  ✓  Aucun écart > 30% détecté. Les ordres de grandeur IS vs TOU sont cohérents.');
  }
  console.log('');
  console.log('  Rappel : IS (Helvetax) < TOU (Officiel) est attendu — IS exclut les déductions.');
  console.log('  Résultats complets dans : docs/validation-results.md');
  console.log('');

})();
