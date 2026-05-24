/**
 * validate-against-official.ts
 *
 * Calcule les impôts (revenu IS + fortune) pour un ensemble de cas types
 * et affiche les résultats à comparer avec les calculateurs officiels.
 *
 * Usage :
 *   npx vite-node scripts/validate-against-official.ts
 *
 * Sources officielles :
 *   VS / NE : https://swisstaxcalculator.estv.admin.ch  (2026 disponible)
 *   VD      : https://www.vd.ch/themes/etat-droit-finances/impots/impots-pour-les-individus/calculer-mes-impots
 *   GE      : https://www.ge.ch/calculer-mes-impots
 *
 * Notes méthodologiques :
 *   - Barème A  : personne seule (célibataire, divorcé, veuf)
 *   - Barème B  : couple 2 revenus — revenu saisi = TOTAL ménage (splitting implicite)
 *   - Barème C  : couple 1 seul revenu — revenu saisi = revenu du ménage
 *   - Le taux IS est effectif TOTAL (IFD + cantonal + communal chef-lieu)
 *   - Revenu imposable estimé à 80 % du brut pour la part IFD (déductions forfaitaires)
 *   - La part IFD / cantonale est ventilée à titre indicatif via les barèmes ESTV
 */

import { getMarginalRate } from '../src/utils/taxBrackets';
import { calculateWealthTax } from '../src/utils/wealthTax';
import type { Canton } from '../src/utils/cantonConfig';
import type { CoupleIncomeType } from '../src/utils/afcTariffs';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TestCase {
  id:             string;
  canton:         Canton;
  situation:      'single' | 'couple';
  coupleIncome?:  CoupleIncomeType;  // 'single' = barème C (défaut), 'dual' = barème B
  children:       number;
  grossIncome:    number;            // revenu brut annuel CHF (total ménage pour barème B/C)
  fortune:        number;            // fortune nette CHF (0 si pas de fortune à tester)
  description:    string;
}

interface Result {
  id:                  string;
  canton:              Canton;
  description:         string;
  bareme:              string;
  grossIncome:         number;
  fortune:             number;
  ifdTaxChf:           number;
  cantonalTaxChf:      number;
  totalIncomeTaxChf:   number;
  marginalRate:        number;
  effectiveRate:       number;
  wealthTaxChf:        number;
  wealthTaxableWealth: number;
  wealthExoneration:   number;
  wealthIsCapped:      boolean;
  grandTotalChf:       number;
}

// ── Cas types ─────────────────────────────────────────────────────────────────

const TEST_CASES: TestCase[] = [

  // ─── Valais (VS) — chef-lieu : Sion, coefficient IS inclus dans tarif AFC ──
  // Valeurs de référence issues de CLAUDE.md pour validation de base

  {
    id: 'VS-01', canton: 'VS', situation: 'single', children: 0,
    grossIncome:  60_000, fortune: 0,
    description: 'VS · Célibataire · 60k · barème A0N',
  },
  {
    id: 'VS-02', canton: 'VS', situation: 'single', children: 0,
    grossIncome:  80_000, fortune: 0,
    description: 'VS · Célibataire · 80k · barème A0N',
  },
  {
    id: 'VS-03', canton: 'VS', situation: 'single', children: 0,
    grossIncome: 100_000, fortune: 0,
    description: 'VS · Célibataire · 100k · barème A0N',
  },
  {
    id: 'VS-04', canton: 'VS', situation: 'single', children: 0,
    grossIncome: 150_000, fortune: 0,
    description: 'VS · Célibataire · 150k · barème A0N',
  },
  {
    id: 'VS-05', canton: 'VS', situation: 'couple', coupleIncome: 'single', children: 0,
    grossIncome: 120_000, fortune: 0,
    description: 'VS · Couple 1 revenu · 120k · barème C0N',
  },
  {
    id: 'VS-06', canton: 'VS', situation: 'couple', coupleIncome: 'dual', children: 0,
    grossIncome: 150_000, fortune: 0,
    description: 'VS · Couple 2 revenus · 150k total · barème B0N',
  },
  {
    id: 'VS-07', canton: 'VS', situation: 'couple', coupleIncome: 'single', children: 2,
    grossIncome: 120_000, fortune: 0,
    description: 'VS · Couple 1 revenu · 2 enfants · 120k · barème C2N',
  },
  {
    id: 'VS-08', canton: 'VS', situation: 'single', children: 0,
    grossIncome:  80_000, fortune: 500_000,
    description: 'VS · Célibataire · 80k + fortune 500k',
  },
  {
    id: 'VS-09', canton: 'VS', situation: 'couple', coupleIncome: 'single', children: 0,
    grossIncome: 150_000, fortune: 1_000_000,
    description: 'VS · Couple 1 revenu · 150k + fortune 1M',
  },

  // ─── Vaud (VD) — chef-lieu : Lausanne, coefficient ~1.345 intégré ─────────

  {
    id: 'VD-01', canton: 'VD', situation: 'single', children: 0,
    grossIncome:  80_000, fortune: 0,
    description: 'VD · Célibataire · 80k · barème A0N',
  },
  {
    id: 'VD-02', canton: 'VD', situation: 'single', children: 0,
    grossIncome: 100_000, fortune: 0,
    description: 'VD · Célibataire · 100k · barème A0N',
  },
  {
    id: 'VD-03', canton: 'VD', situation: 'couple', coupleIncome: 'single', children: 0,
    grossIncome: 150_000, fortune: 0,
    description: 'VD · Couple 1 revenu · 150k · barème C0N',
  },
  {
    id: 'VD-04', canton: 'VD', situation: 'couple', coupleIncome: 'dual', children: 2,
    grossIncome: 150_000, fortune: 300_000,
    description: 'VD · Couple 2 revenus · 2 enfants · 150k + fortune 300k',
  },
  {
    id: 'VD-05', canton: 'VD', situation: 'couple', coupleIncome: 'single', children: 0,
    grossIncome: 150_000, fortune: 1_000_000,
    description: 'VD · Couple 1 revenu · 150k + fortune 1M (plafond 10‰)',
  },

  // ─── Genève (GE) — taux uniforme, communal inclus dans barème ────────────

  {
    id: 'GE-01', canton: 'GE', situation: 'single', children: 0,
    grossIncome:  80_000, fortune: 0,
    description: 'GE · Célibataire · 80k · barème A0N',
  },
  {
    id: 'GE-02', canton: 'GE', situation: 'single', children: 0,
    grossIncome: 120_000, fortune: 0,
    description: 'GE · Célibataire · 120k · barème A0N',
  },
  {
    id: 'GE-03', canton: 'GE', situation: 'couple', coupleIncome: 'dual', children: 0,
    grossIncome: 200_000, fortune: 0,
    description: 'GE · Couple 2 revenus · 200k total · barème B0N',
  },
  {
    id: 'GE-04', canton: 'GE', situation: 'single', children: 0,
    grossIncome: 120_000, fortune: 1_000_000,
    description: 'GE · Célibataire · 120k + fortune 1M',
  },

  // ─── Neuchâtel (NE) — chef-lieu : Neuchâtel, coefficient intégré ──────────

  {
    id: 'NE-01', canton: 'NE', situation: 'single', children: 0,
    grossIncome:  80_000, fortune: 0,
    description: 'NE · Célibataire · 80k · barème A0N',
  },
  {
    id: 'NE-02', canton: 'NE', situation: 'single', children: 0,
    grossIncome: 100_000, fortune: 0,
    description: 'NE · Célibataire · 100k · barème A0N',
  },
  {
    id: 'NE-03', canton: 'NE', situation: 'couple', coupleIncome: 'single', children: 1,
    grossIncome: 120_000, fortune: 200_000,
    description: 'NE · Couple 1 revenu · 1 enfant · 120k + fortune 200k',
  },
  {
    id: 'NE-04', canton: 'NE', situation: 'couple', coupleIncome: 'dual', children: 0,
    grossIncome: 160_000, fortune: 500_000,
    description: 'NE · Couple 2 revenus · 160k total + fortune 500k',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function chf(n: number): string {
  return n.toLocaleString('fr-CH', { maximumFractionDigits: 0 }) + ' CHF';
}

function pct(n: number, decimals = 2): string {
  return (n * 100).toFixed(decimals) + '%';
}

function permille(n: number): string {
  return n.toFixed(2) + '‰';
}

function baremeCode(tc: TestCase): string {
  const prefix = tc.situation === 'couple'
    ? (tc.coupleIncome === 'dual' ? 'B' : 'C')
    : 'A';
  return `${prefix}${tc.children}N`;
}

// ── Calculs ───────────────────────────────────────────────────────────────────

const W = 90;
const SEP = '═'.repeat(W);
const LINE = '─'.repeat(W);

const now = new Date();
const dateStr = now.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
const timeStr = now.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });

console.log('');
console.log(SEP);
console.log('  HELVETAX — Validation vs calculateurs officiels AFC 2026');
console.log(`  Généré le ${dateStr} à ${timeStr}`);
console.log(SEP);

const results: Result[] = [];

for (const tc of TEST_CASES) {
  const income = getMarginalRate(
    tc.grossIncome,
    tc.canton,
    tc.situation,
    undefined,
    tc.children,
    tc.coupleIncome,
  );

  const wealth = tc.fortune > 0
    ? calculateWealthTax(tc.fortune, tc.canton, tc.situation)
    : null;

  const wealthTaxChf = wealth?.taxAmountTotal ?? 0;

  results.push({
    id:                  tc.id,
    canton:              tc.canton,
    description:         tc.description,
    bareme:              baremeCode(tc),
    grossIncome:         tc.grossIncome,
    fortune:             tc.fortune,
    ifdTaxChf:           income.ifdTaxChf,
    cantonalTaxChf:      income.cantonalTaxChf,
    totalIncomeTaxChf:   income.totalTaxChf,
    marginalRate:        income.marginalRate,
    effectiveRate:       income.effectiveRate,
    wealthTaxChf,
    wealthTaxableWealth: wealth?.taxableWealth ?? 0,
    wealthExoneration:   wealth?.exoneration ?? 0,
    wealthIsCapped:      wealth?.isCapped ?? false,
    grandTotalChf:       income.totalTaxChf + wealthTaxChf,
  });

  // Affichage détaillé par cas
  console.log('');
  console.log(LINE);
  console.log(`  [${tc.id}]  ${tc.description}`);
  console.log(LINE);
  console.log(`  Barème AFC  : ${baremeCode(tc)}`);
  console.log(`  Revenu brut : ${chf(tc.grossIncome)}/an  (${chf(Math.round(tc.grossIncome / 12))}/mois)`);
  if (tc.fortune > 0) {
    console.log(`  Fortune     : ${chf(tc.fortune)}`);
  }
  console.log('');
  console.log('  ── Impôt sur le revenu (IS) ──────────────────────────────────');
  console.log(`     IFD (fédéral)            ${chf(income.ifdTaxChf).padStart(14)}`);
  console.log(`     Cantonal + communal       ${chf(income.cantonalTaxChf).padStart(14)}`);
  console.log(`     ───────────────────       ${('─'.repeat(10))}`);
  console.log(`     Total IS                  ${chf(income.totalTaxChf).padStart(14)}`);
  console.log(`     Taux marginal combiné     ${pct(income.marginalRate).padStart(14)}`);
  console.log(`     Taux effectif             ${pct(income.effectiveRate).padStart(14)}`);

  if (wealth && tc.fortune > 0) {
    console.log('');
    console.log('  ── Impôt sur la fortune ──────────────────────────────────────');
    console.log(`     Abattement appliqué       ${chf(wealth.exoneration).padStart(14)}`);
    console.log(`     Fortune imposable         ${chf(wealth.taxableWealth).padStart(14)}`);
    console.log(`     Taux marginal             ${permille(wealth.marginalRatePermille).padStart(14)}`);
    console.log(`     Taux effectif             ${permille(wealth.effectiveRatePermille).padStart(14)}`);
    console.log(`     Total fortune             ${chf(wealth.taxAmountTotal).padStart(14)}`);
    if (wealth.isCapped) {
      console.log(`     ⚠ Plafond 10‰ VD appliqué`);
    }
    console.log('');
    console.log(`  ── TOTAL (IS + Fortune) ──────────────────────────────────────`);
    console.log(`     Total toutes taxes        ${chf(income.totalTaxChf + wealthTaxChf).padStart(14)}`);
  }
}

// ── Tableau récapitulatif ─────────────────────────────────────────────────────

console.log('');
console.log('');
console.log(SEP);
console.log('  TABLEAU RÉCAPITULATIF — Résultats Helvetax');
console.log(SEP);

const H = [
  'ID'.padEnd(7),
  'Situation'.padEnd(48),
  'Brut/an'.padStart(12),
  'Fortune'.padStart(12),
  'IFD CHF'.padStart(10),
  'Cant.CHF'.padStart(10),
  'IS total'.padStart(10),
  'T.Marg'.padStart(8),
  'T.Eff'.padStart(7),
  'Fort.CHF'.padStart(10),
  'TOTAL'.padStart(10),
].join('  ');

console.log(H);
console.log('─'.repeat(H.length));

for (const r of results) {
  const row = [
    r.id.padEnd(7),
    r.description.padEnd(48),
    chf(r.grossIncome).padStart(12),
    (r.fortune > 0 ? chf(r.fortune) : '–').padStart(12),
    chf(r.ifdTaxChf).padStart(10),
    chf(r.cantonalTaxChf).padStart(10),
    chf(r.totalIncomeTaxChf).padStart(10),
    pct(r.marginalRate).padStart(8),
    pct(r.effectiveRate).padStart(7),
    (r.wealthTaxChf > 0 ? chf(r.wealthTaxChf) : '–').padStart(10),
    chf(r.grandTotalChf).padStart(10),
  ].join('  ');
  console.log(row);
}

console.log(SEP);
console.log('');
console.log('  Valeurs de référence CLAUDE.md (VS · Sion · célibataire) :');
console.log('    60k → marginal ~15%,  total ~5 500 CHF');
console.log('    80k → marginal ~19.9%, total ~9 000 CHF');
console.log('   100k → marginal ~26.1%, total ~14 500 CHF');
console.log('   150k → marginal ~28.3%, total ~28 000 CHF');
console.log('');
console.log('  Calculateurs officiels pour validation manuelle :');
console.log('    VS / NE → https://swisstaxcalculator.estv.admin.ch');
console.log('    VD      → https://www.vd.ch/themes/etat-droit-finances/impots/impots-pour-les-individus/calculer-mes-impots');
console.log('    GE      → https://www.ge.ch/calculer-mes-impots');
console.log('');
console.log('  Résultats à reporter dans : docs/validation-results.md');
console.log('');
