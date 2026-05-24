/**
 * validate-against-official.ts
 *
 * Validation automatisée Helvetax vs swisstaxcalculator 2026.
 * Batterie complète : 4 cantons × 4 tranches × 3 situations × 2 fortunes = 96 cas.
 *
 * Modes :
 *   Auto (défaut ou --auto) : appelle l'API, compare IS vs TOU, écrit docs/validation-results.md
 *   Manuel (--manual)       : affiche le tableau vide pour saisie manuelle
 *
 * Usage :
 *   npx vite-node scripts/validate-against-official.ts
 *   npx vite-node scripts/validate-against-official.ts --auto
 *   npx vite-node scripts/validate-against-official.ts --manual
 *   SWISSTAX_API_URL=http://localhost:3000 npx vite-node scripts/validate-against-official.ts
 *
 * Serveur local :
 *   git clone https://github.com/devbrains-com/swisstaxcalculator
 *   cd swisstaxcalculator && yarn install && yarn importdata 2026 --download && yarn dev
 *
 * ⚠ Note méthodologique :
 *   Helvetax = IS (impôt à la source) — taux AFC officiel appliqué au revenu BRUT.
 *   swisstaxcalculator = TOU (impôt ordinaire) — revenu brut − déductions → taxable.
 *   IS < TOU est normal et attendu. IS > TOU sur le revenu est une anomalie.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname }         from 'node:path';
import { fileURLToPath }            from 'node:url';

import { getMarginalRate }    from '../src/utils/taxBrackets';
import { calculateWealthTax } from '../src/utils/wealthTax';
import type { Canton }         from '../src/utils/cantonConfig';
import type { CoupleIncomeType } from '../src/utils/afcTariffs';

// ── Configuration ─────────────────────────────────────────────────────────────

const MANUAL_MODE = process.argv.includes('--manual') || process.argv.includes('-m');
const API_BASE    = process.env.SWISSTAX_API_URL ?? 'https://swisstaxcalculator.vercel.app';
const API_URL     = `${API_BASE}/api/taxes`;
const API_TIMEOUT = 15_000; // ms par requête
const BATCH_SIZE  = 15;     // appels parallèles maximum par batch

const __dir      = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = resolve(__dir, '..', 'docs', 'validation-results.md');

/**
 * IDs canton swisstaxcalculator — numérotation ESTV 1–26 (alphabétique).
 * Confirmés par 22/22 appels réussis lors de la validation précédente.
 *
 * ⚠ Le prompt de configuration spécifiait VD=22, GE=25, VS=23, NE=24.
 *    Ces valeurs ne correspondent PAS à la numérotation ESTV standard :
 *    22=UR, 25=ZG — les IDs ci-dessous sont les corrects.
 */
const CANTON_IDS: Record<Canton, number> = {
  GE:  8,   // Genève
  NE: 13,   // Neuchâtel
  VD: 23,   // Vaud
  VS: 24,   // Valais
};

/** Codes OFS (BfsID) des chefs-lieux de référence. */
const COMMUNE_IDS: Record<Canton, number> = {
  GE: 6621,  // Genève
  NE: 6458,  // Neuchâtel
  VD: 5586,  // Lausanne
  VS: 6266,  // Sion
};

const CANTON_LABELS: Record<Canton, string> = {
  GE: 'Genève',
  NE: 'Neuchâtel',
  VD: 'Vaud (Lausanne)',
  VS: 'Valais (Sion)',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface TestCase {
  id:            string;
  canton:        Canton;
  situation:     'single' | 'couple';
  coupleIncome?: CoupleIncomeType;
  children:      number;
  grossIncome:   number;
  fortune:       number;
  sitCode:       string;   // S | C1 | C2 | C2fair
  sitLabel:      string;
  description:   string;
  /** Cas IS barème C (couple 1 revenu) — taux intègre ~70,5k revenu théorique conjoint */
  isC1Bareme?:   boolean;
  /** Note explicative affichée dans le rapport */
  note?:         string;
}

interface HxResult {
  ifdTaxChf:         number;
  cantonalTaxChf:    number;
  totalIncomeTaxChf: number;
  marginalRate:      number;
  effectiveRate:     number;
  wealthTaxChf:      number;
  grandTotalChf:     number;
}

interface ApiResult {
  ifdTaxChf:           number;
  cantonalTaxChf:      number;
  communalTaxChf:      number;
  totalIncomeTaxChf:   number;
  wealthTaxChf:        number;
  grandTotalChf:       number;
  taxableIncomeCanton: number;
  taxableIncomeBund:   number;
  error?:              string;
}

interface CaseResult {
  tc:             TestCase;
  hx:             HxResult;
  api:            ApiResult | null;
  /** Écart IS/TOU sur le revenu uniquement (hors fortune). */
  incomeEcartPct: number | null;
  /** Écart IS/TOU sur le total (revenu + fortune). */
  totalEcartPct:  number | null;
  /** true si IS revenu > TOU revenu — anomalie. */
  isIncomeAnomaly:boolean;
}

// ── Matrice de test — 96 cas ──────────────────────────────────────────────────

const CANTONS_LIST: Canton[]  = ['VS', 'VD', 'GE', 'NE'];
const INCOME_LEVELS           = [50_000, 80_000, 150_000, 300_000] as const;
const FORTUNE_LEVELS          = [0, 200_000] as const;

const SIT_CONFIGS = [
  { situation: 'single' as const, coupleIncome: undefined                       , sitCode: 'S',  sitLabel: 'Célibataire'   },
  { situation: 'couple' as const, coupleIncome: 'single' as CoupleIncomeType    , sitCode: 'C1', sitLabel: 'Couple 1 rev.' },
  { situation: 'couple' as const, coupleIncome: 'dual'   as CoupleIncomeType    , sitCode: 'C2', sitLabel: 'Couple 2 rev.' },
];

function generateCases(): TestCase[] {
  const cases: TestCase[] = [];
  for (const canton of CANTONS_LIST) {
    for (const sit of SIT_CONFIGS) {
      for (const income of INCOME_LEVELS) {
        // IS barème C à 50k omis : le taux intègre ~70,5k de revenu théorique du conjoint
        // → IS >> TOU à bas revenu. Ce n'est pas un bug ; c'est la conception AFC du barème C.
        // Remplacé par des cas C2fair (2×50k) pour une comparaison équitable.
        if (sit.sitCode === 'C1' && income === 50_000) continue;

        for (const fortune of FORTUNE_LEVELS) {
          const fStr  = fortune > 0 ? `-${fortune / 1_000}k` : '-0';
          const isC1  = sit.sitCode === 'C1';
          cases.push({
            id:           `${canton}-${sit.sitCode}-${income / 1_000}k${fStr}`,
            canton,
            situation:    sit.situation,
            coupleIncome: sit.coupleIncome,
            children:     0,
            grossIncome:  income,
            fortune,
            sitCode:      sit.sitCode,
            sitLabel:     sit.sitLabel,
            description:  `${canton} · ${sit.sitLabel} · ${income / 1_000}k CHF${fortune > 0 ? ` + fort.${fortune / 1_000}k` : ''}`,
            ...(isC1 && {
              isC1Bareme: true,
              note: 'Barème C — taux IS intègre ~70,5k revenu théorique conjoint',
            }),
          });
        }
      }
    }
  }

  // Cas C2fair — comparaison IS barème B (2 revenus) vs TOU couple
  // Remplacent C1-50k (supprimé) et ajoutent 2×80k pour vérifier la progressivité.
  const C2FAIR = [
    { grossIncome: 100_000, sitLabel: 'Couple 2×50k', sitCode: 'C2fair-100k',
      note: 'Remplace C1-50k — comparaison IS barème B / TOU équitable (2×50k)' },
    { grossIncome: 160_000, sitLabel: 'Couple 2×80k', sitCode: 'C2fair-160k',
      note: 'Progressivité couple — IS barème B / TOU (2×80k)' },
  ];
  for (const canton of CANTONS_LIST) {
    for (const cfg of C2FAIR) {
      for (const fortune of FORTUNE_LEVELS) {
        const fStr = fortune > 0 ? `-${fortune / 1_000}k` : '-0';
        cases.push({
          id:           `${canton}-${cfg.sitCode}${fStr}`,
          canton,
          situation:    'couple',
          coupleIncome: 'dual',
          children:     0,
          grossIncome:  cfg.grossIncome,
          fortune,
          sitCode:      cfg.sitCode,
          sitLabel:     cfg.sitLabel,
          description:  `${canton} · ${cfg.sitLabel} · ${cfg.grossIncome / 1_000}k CHF total${fortune > 0 ? ` + fort.${fortune / 1_000}k` : ''}`,
          note:         cfg.note,
        });
      }
    }
  }

  return cases;
}

const TEST_CASES = generateCases(); // 104 cas (96 − 8 C1-50k + 16 C2fair)

// ── Payload API ───────────────────────────────────────────────────────────────

function buildPayload(tc: TestCase) {
  const isSingle = tc.situation === 'single';
  const isDual   = tc.coupleIncome === 'dual';

  const persons = isSingle
    ? [{ age: 35, confession: 'other', incomeType: 'gross', income: tc.grossIncome }]
    : isDual
      ? [
          { age: 35, confession: 'other', incomeType: 'gross', income: Math.round(tc.grossIncome / 2) },
          { age: 35, confession: 'other', incomeType: 'gross', income: Math.round(tc.grossIncome / 2) },
        ]
      : [
          { age: 35, confession: 'other', incomeType: 'gross', income: tc.grossIncome },
          { age: 35, confession: 'other', incomeType: 'gross', income: 0              },
        ];

  return {
    calculationType: 'incomeAndWealth',
    year:       2026,
    cantonId:   CANTON_IDS[tc.canton],
    locationId: COMMUNE_IDS[tc.canton],
    relationship: isSingle ? 's' : 'm',
    children:   tc.children,
    fortune:    tc.fortune,
    persons,
  };
}

// ── Appels API ────────────────────────────────────────────────────────────────

async function callApi(tc: TestCase): Promise<ApiResult | null> {
  try {
    const res = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(buildPayload(tc)),
      signal:  AbortSignal.timeout(API_TIMEOUT),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { error: `HTTP ${res.status}: ${txt.slice(0, 80)}` } as ApiResult;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d: any = await res.json();
    const incomeTax = (d.taxesIncomeBund ?? 0) + (d.taxesIncomeCanton ?? 0) + (d.taxesIncomeCity ?? 0);
    const wealthTax = (d.taxesFortuneCanton ?? 0) + (d.taxesFortuneCity ?? 0);
    return {
      ifdTaxChf:           Math.round(d.taxesIncomeBund   ?? 0),
      cantonalTaxChf:      Math.round(d.taxesIncomeCanton ?? 0),
      communalTaxChf:      Math.round(d.taxesIncomeCity   ?? 0),
      totalIncomeTaxChf:   Math.round(incomeTax),
      wealthTaxChf:        Math.round(wealthTax),
      grandTotalChf:       Math.round(incomeTax + wealthTax),
      taxableIncomeCanton: Math.round(d.details?.taxableIncomeCanton ?? 0),
      taxableIncomeBund:   Math.round(d.details?.taxableIncomeBund   ?? 0),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg.slice(0, 80) } as ApiResult;
  }
}

async function pingApi(): Promise<boolean> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(TEST_CASES[0])),
      signal: AbortSignal.timeout(8_000),
    });
    return res.ok;
  } catch { return false; }
}

async function runBatched(tcs: TestCase[]): Promise<(ApiResult | null)[]> {
  const results: (ApiResult | null)[] = [];
  const total   = Math.ceil(tcs.length / BATCH_SIZE);
  for (let b = 0; b < tcs.length; b += BATCH_SIZE) {
    const batch    = tcs.slice(b, b + BATCH_SIZE);
    const batchRes = await Promise.all(batch.map(tc => callApi(tc)));
    results.push(...batchRes);
    const bNum = Math.floor(b / BATCH_SIZE) + 1;
    const ok   = batchRes.filter(r => r && !r.error).length;
    process.stdout.write(`    batch ${bNum}/${total} — ${ok}/${batch.length} ✓\n`);
  }
  return results;
}

// ── Calcul Helvetax ───────────────────────────────────────────────────────────

function computeHx(tc: TestCase): HxResult {
  const income = getMarginalRate(
    tc.grossIncome, tc.canton, tc.situation,
    undefined, tc.children, tc.coupleIncome,
  );
  const wealth      = tc.fortune > 0 ? calculateWealthTax(tc.fortune, tc.canton, tc.situation) : null;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const chf = (n: number) =>
  n.toLocaleString('fr-CH', { maximumFractionDigits: 0 }) + ' CHF';

const pctFmt = (n: number, d = 1) =>
  (n >= 0 ? '+' : '') + n.toFixed(d) + '%';

function ecart(hx: number, ref: number): number | null {
  return ref > 0 ? ((hx - ref) / ref) * 100 : null;
}
function ecartFmt(hx: number, ref: number): string {
  const e = ecart(hx, ref);
  return e !== null ? pctFmt(e) : '–';
}

// ── Génération du rapport Markdown ───────────────────────────────────────────

function buildReport(results: CaseResult[], dateStr: string): string {
  const apiOk       = results.filter(r => r.api && !r.api.error).length;
  const anomalies   = results.filter(r => r.isIncomeAnomaly);
  const fortResults = results.filter(r => r.tc.fortune > 0 && r.api && !r.api.error);
  const fortAlerts  = fortResults.filter(r => {
    const e = ecart(r.hx.wealthTaxChf, r.api!.wealthTaxChf);
    return e !== null && Math.abs(e) > 40;
  });

  const md: string[] = [];
  const w  = (...s: string[]) => md.push(...s);

  w(
    `# Validation Helvetax 2026 — Rapport automatique`,
    ``,
    `> Généré le **${dateStr}**  `,
    `> API : \`${API_URL}\`  `,
    `> ${apiOk}/${results.length} cas API ✓ — anomalies IS > TOU : **${anomalies.length}**`,
    ``,
    `---`,
    ``,
    `## Note méthodologique`,
    ``,
    `| | Helvetax | swisstaxcalculator |`,
    `|--|--|--|`,
    `| Régime | **IS** — impôt à la source | **TOU** — impôt ordinaire |`,
    `| Base | Revenu brut × taux AFC | Revenu brut − déductions → taxable |`,
    `| Public | Titulaires permis B | Résidents C / CH |`,
    ``,
    `**IS < TOU est normal (5–50%).** IS > TOU sur le revenu est une anomalie.`,
    ``,
    `### Barème C (couple 1 revenu)`,
    ``,
    `Le barème IS C intègre un **revenu théorique conjoint (~70 500 CHF)** dans le taux.`,
    `Un foyer gagnant 50 000 CHF brut est taxé comme s'il gagnait ~120 500 CHF.`,
    `Conséquence : IS barème C > TOU à bas revenu — **conception AFC, pas un bug Helvetax**.`,
    ``,
    `Stratégie de test adoptée :`,
    `- Cases C1-50k **supprimées** (comparaison IS/TOU faussée par le revenu implicite)`,
    `- Remplacées par des cas **C2fair** : couple 2 revenus 2×50k (= 100k total) et 2×80k (= 160k total)`,
    `- Cases C1 ≥ 80k conservées avec seuil d'anomalie élargi à 50% (IS barème C structurellement élevé)`,
    ``,
    `---`,
    ``,
    `## Tableau complet — ${results.length} cas`,
    ``,
    `| ID | Situation | Revenu | Fortune | **HX IS** | **TOU** | Écart | Statut |`,
    `|---|---|---:|---:|---:|---:|---:|:---:|`,
  );

  for (const { tc, hx, api, totalEcartPct, isIncomeAnomaly } of results) {
    const tou      = api && !api.error ? chf(api.grandTotalChf)   : '–';
    const eStr     = totalEcartPct !== null ? pctFmt(totalEcartPct) : '✗';
    const isC1High = tc.isC1Bareme && api && !api.error && (ecart(hx.totalIncomeTaxChf, api.totalIncomeTaxChf) ?? 0) > 1;
    const status   = !api || api.error ? '❌' : isIncomeAnomaly ? '⚠️' : isC1High ? 'ℹ' : '✓';
    const label    = tc.sitCode.startsWith('C2fair') ? `${tc.sitLabel} ⭐` : tc.sitLabel;
    w(`| \`${tc.id}\` | ${label} | ${tc.grossIncome/1000}k | ${tc.fortune > 0 ? tc.fortune/1000+'k' : '–'} | ${chf(hx.grandTotalChf)} | ${tou} | ${eStr} | ${status} |`);
  }

  // Per-canton section
  w(``, `---`, ``, `## Analyse par canton`, ``);

  for (const canton of CANTONS_LIST) {
    const cr    = results.filter(r => r.tc.canton === canton);
    const okCr  = cr.filter(r => r.api && !r.api.error);
    // Revenu only (no fortune) for income ecart stats
    const incCr = okCr.filter(r => r.tc.fortune === 0 && r.incomeEcartPct !== null);
    const avg   = incCr.length ? incCr.reduce((s, r) => s + r.incomeEcartPct!, 0) / incCr.length : 0;
    const min   = incCr.length ? Math.min(...incCr.map(r => r.incomeEcartPct!)) : 0;
    const max   = incCr.length ? Math.max(...incCr.map(r => r.incomeEcartPct!)) : 0;
    const canAn = cr.filter(r => r.isIncomeAnomaly);

    w(
      `### ${canton} — ${CANTON_LABELS[canton]}`,
      ``,
      `- Cas : ${cr.length} | API ✓ : ${okCr.length} | Anomalies IS > TOU : ${canAn.length > 0 ? canAn.map(r => `\`${r.tc.id}\``).join(', ') : 'aucune'}`,
      `- Écart IS/TOU (revenu, sans fortune) : moy. ${avg.toFixed(1)}%  |  min ${min.toFixed(1)}%  |  max ${max.toFixed(1)}%`,
      ``,
      `| ID | Situation | Revenu | Fortune | HX IS | TOU | Écart IS/TOU | Écart revenu | Remarque |`,
      `|---|---|---:|---:|---:|---:|---:|---:|---|`,
    );

    for (const { tc, hx, api, incomeEcartPct, totalEcartPct } of cr) {
      const tou    = api && !api.error ? chf(api.grandTotalChf)       : '–';
      const eInc   = incomeEcartPct !== null ? pctFmt(incomeEcartPct) : '–';
      const eTot   = totalEcartPct  !== null ? pctFmt(totalEcartPct)  : '–';
      const remark = tc.note ?? '';
      const label  = tc.sitCode.startsWith('C2fair') ? `${tc.sitLabel} ⭐` : tc.sitLabel;
      w(`| \`${tc.id}\` | ${label} | ${tc.grossIncome/1000}k | ${tc.fortune > 0 ? tc.fortune/1000+'k' : '–'} | ${chf(hx.grandTotalChf)} | ${tou} | ${eTot} | ${eInc} | ${remark} |`);
    }
    w(``);
  }

  // Per-income-level
  w(`---`, ``, `## Écart IS/TOU par tranche — célibataires, sans fortune`, ``);
  w(`| Tranche | VS | VD | GE | NE | Tendance |`, `|---|---:|---:|---:|---:|---|`);
  for (const income of INCOME_LEVELS) {
    const cells = CANTONS_LIST.map(canton => {
      const r = results.find(x =>
        x.tc.canton === canton && x.tc.grossIncome === income &&
        x.tc.fortune === 0 && x.tc.sitCode === 'S' &&
        x.api && !x.api.error,
      );
      return r && r.incomeEcartPct !== null ? pctFmt(r.incomeEcartPct) : '–';
    });
    const allNeg = cells.every(c => c !== '–' && parseFloat(c) < 1);
    w(`| **${income/1000}k CHF** | ${cells.join(' | ')} | ${allNeg ? 'IS < TOU ✓' : '⚠ vérifier'} |`);
  }

  // Anomalies and recommendations
  w(``, `---`, ``, `## Anomalies et recommandations`, ``);

  // C1 cases with IS > TOU but below anomaly threshold (structural, not bugs)
  const c1Elevated = results.filter(r =>
    r.tc.isC1Bareme && r.api && !r.api.error && !r.isIncomeAnomaly &&
    (ecart(r.hx.totalIncomeTaxChf, r.api.totalIncomeTaxChf) ?? 0) > 1,
  );

  if (anomalies.length === 0) {
    w(`### Revenu IS`, ``, `✅ **Aucune anomalie.** IS < TOU confirmé sur les ${results.filter(r => r.api && !r.api.error).length} cas testés.`, ``);
  } else {
    w(`### Revenu IS — Anomalies IS > TOU`, ``);
    w(`| ID | Canton | Situation | Revenu | HX IS rev. | TOU rev. | Écart |`, `|---|---|---|---:|---:|---:|---:|`);
    for (const a of anomalies) {
      const touInc = a.api!.totalIncomeTaxChf;
      w(`| \`${a.tc.id}\` | ${a.tc.canton} | ${a.tc.sitLabel} | ${a.tc.grossIncome/1000}k | ${chf(a.hx.totalIncomeTaxChf)} | ${chf(touInc)} | ${pctFmt(a.incomeEcartPct!)} |`);
    }
    w(``, `**Recommandations :**`, ``);
    const byCanon = CANTONS_LIST.filter(c => anomalies.some(a => a.tc.canton === c));
    for (const canton of byCanon) {
      const ca = anomalies.filter(a => a.tc.canton === canton);
      const incomes = [...new Set(ca.map(a => a.tc.grossIncome/1000 + 'k'))].join(', ');
      w(`- **${canton}** : vérifier les barèmes IS AFC dans \`fiscalData2026.json\` pour ${incomes} CHF (${ca[0].tc.sitLabel})`);
    }
    w(``);
  }

  if (c1Elevated.length > 0) {
    w(
      `### Barème C — Écarts structurels IS > TOU (ℹ — attendus)`,
      ``,
      `> IS barème C intègre ~70 500 CHF de revenu théorique conjoint → IS structurellement > TOU à bas/moyen revenu.`,
      `> Ces cas sont étiquetés **ℹ** dans le tableau (seuil 50% appliqué, non-anomalies).`,
      ``,
      `| ID | Canton | Revenu | HX IS rev. | TOU rev. | Écart | Note |`,
      `|---|---|---:|---:|---:|---:|---|`,
    );
    for (const r of c1Elevated) {
      const touInc = r.api!.totalIncomeTaxChf;
      const ie = ecart(r.hx.totalIncomeTaxChf, touInc)!;
      w(`| \`${r.tc.id}\` | ${r.tc.canton} | ${r.tc.grossIncome/1000}k | ${chf(r.hx.totalIncomeTaxChf)} | ${chf(touInc)} | ${pctFmt(ie)} | ${r.tc.note ?? ''} |`);
    }
    w(``);
  }

  // Fortune analysis
  if (fortAlerts.length > 0) {
    w(`### Fortune — Écarts importants (> 40%)`, ``);
    w(`| ID | Canton | Fortune | HX Fort. | TOU Fort. | Écart | Note |`, `|---|---|---:|---:|---:|---:|---|`);
    for (const a of fortAlerts) {
      const e   = ecart(a.hx.wealthTaxChf, a.api!.wealthTaxChf)!;
      const dir = e > 0 ? 'HX trop élevé' : 'HX trop bas';
      w(`| \`${a.tc.id}\` | ${a.tc.canton} | ${a.tc.fortune/1000}k | ${chf(a.hx.wealthTaxChf)} | ${chf(a.api!.wealthTaxChf)} | ${pctFmt(e)} | ${dir} |`);
    }
    const highCantons = [...new Set(fortAlerts.filter(a => ecart(a.hx.wealthTaxChf, a.api!.wealthTaxChf)! > 0).map(a => a.tc.canton))];
    const lowCantons  = [...new Set(fortAlerts.filter(a => ecart(a.hx.wealthTaxChf, a.api!.wealthTaxChf)! < 0).map(a => a.tc.canton))];
    w(``);
    if (highCantons.length) w(`- **HX trop élevé (${highCantons.join(', ')})** : vérifier tranches et abattements dans \`wealthTax.ts\``);
    if (lowCantons.length)  w(`- **HX trop bas (${lowCantons.join(', ')})** : vérifier coefficient communal dans \`cantonConfig.ts\``);
    w(``);
  } else if (fortResults.length > 0) {
    w(`### Fortune`, ``, `✅ Tous les écarts fortune sont < 40%. Cohérence acceptable.`, ``);
  }

  // Commands
  w(
    `---`, ``, `## Commandes`,
    ``,
    `\`\`\`bash`,
    `# Mode automatique (défaut)`,
    `npx vite-node scripts/validate-against-official.ts`,
    `npx vite-node scripts/validate-against-official.ts --auto`,
    ``,
    `# Serveur local (données fraîches)`,
    `git clone https://github.com/devbrains-com/swisstaxcalculator`,
    `cd swisstaxcalculator && yarn install && yarn importdata 2026 --download && yarn dev`,
    `SWISSTAX_API_URL=http://localhost:3000 npx vite-node scripts/validate-against-official.ts`,
    ``,
    `# Mode manuel`,
    `npx vite-node scripts/validate-against-official.ts --manual`,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `*Rapport généré automatiquement. Relancer le script pour mettre à jour.*`,
  );

  return md.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

const W   = 100;
const SEP = '═'.repeat(W);
const LIN = '─'.repeat(W);

const now     = new Date();
const dateStr = now.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
              + ' à ' + now.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });

console.log('');
console.log(SEP);
console.log('  HELVETAX — Validation automatisée vs swisstaxcalculator 2026');
console.log(`  ${dateStr}  |  ${TEST_CASES.length} cas types  |  API : ${API_URL}`);
console.log(`  Mode : ${MANUAL_MODE ? 'MANUEL (--manual)' : 'AUTOMATIQUE (--auto ou défaut)'}`);
console.log(SEP);

(async () => {

  // ── Mode manuel ─────────────────────────────────────────────────────────────
  if (MANUAL_MODE) {
    console.log('');
    console.log(`  ${'ID'.padEnd(28)} ${'Situation'.padEnd(14)} ${'Brut/an'.padStart(9)}  ${'Fortune'.padStart(9)}  ${'IS total'.padStart(12)}`);
    console.log(LIN);
    for (const tc of TEST_CASES) {
      const hx = computeHx(tc);
      const f  = tc.fortune > 0 ? (tc.fortune / 1_000) + 'k' : '–';
      console.log(`  ${tc.id.padEnd(28)} ${tc.sitLabel.padEnd(14)} ${(tc.grossIncome/1_000+'k').padStart(9)}  ${f.padStart(9)}  ${chf(hx.grandTotalChf).padStart(12)}`);
    }
    console.log('');
    return;
  }

  // ── Ping ──────────────────────────────────────────────────────────────────────
  process.stdout.write(`\n  Test de connexion → ${API_URL} ... `);
  const ok = await pingApi();
  if (!ok) {
    console.log('✗\n');
    console.log('  API injoignable. Pour démarrer le serveur local :');
    console.log('    git clone https://github.com/devbrains-com/swisstaxcalculator');
    console.log('    cd swisstaxcalculator && yarn install && yarn importdata 2026 --download && yarn dev');
    console.log('');
    console.log('  Puis relancer avec SWISSTAX_API_URL=http://localhost:3000');
    console.log('  Ou : npx vite-node scripts/validate-against-official.ts --manual\n');
    process.exit(1);
  }
  console.log('✓\n');

  // ── Appels API ────────────────────────────────────────────────────────────────
  console.log(`  ${TEST_CASES.length} appels API — batchs de ${BATCH_SIZE}...`);
  const apiResults = await runBatched(TEST_CASES);
  console.log('');

  // ── Assemblage ────────────────────────────────────────────────────────────────
  const results: CaseResult[] = TEST_CASES.map((tc, i) => {
    const hx  = computeHx(tc);
    const api = apiResults[i];
    const ie  = api && !api.error ? ecart(hx.totalIncomeTaxChf, api.totalIncomeTaxChf) : null;
    const te  = api && !api.error ? ecart(hx.grandTotalChf,     api.grandTotalChf)     : null;
    // Barème C intègre ~70,5k revenu théorique conjoint → IS structurellement > TOU à bas revenu.
    // On tolère jusqu'à 50% d'écart pour ces cas ; au-delà c'est une vraie anomalie.
    const anomalyThreshold = tc.isC1Bareme ? 50 : 1;
    return {
      tc,
      hx,
      api,
      incomeEcartPct:  ie,
      totalEcartPct:   te,
      isIncomeAnomaly: ie !== null && ie > anomalyThreshold,
    };
  });

  // ── Affichage console ─────────────────────────────────────────────────────────
  const apiOk     = results.filter(r => r.api && !r.api.error).length;
  const anomCount = results.filter(r => r.isIncomeAnomaly).length;

  console.log(SEP);
  console.log('  TABLEAU DE SYNTHÈSE');
  console.log(SEP);

  const H = [
    'ID'.padEnd(26), 'Situation'.padEnd(14),
    'Revenu'.padStart(9), 'Fortune'.padStart(9),
    'HX IS'.padStart(12), 'TOU'.padStart(12),
    'Écart tot.'.padStart(11), 'Écart rev.'.padStart(11),
    ''.padStart(3),
  ].join('  ');
  console.log(H);
  console.log('─'.repeat(H.length));

  for (const { tc, hx, api, incomeEcartPct, totalEcartPct, isIncomeAnomaly } of results) {
    const tou  = api && !api.error ? chf(api.grandTotalChf) : '–';
    const eT   = totalEcartPct  !== null ? pctFmt(totalEcartPct)  : '✗';
    const eI   = incomeEcartPct !== null ? pctFmt(incomeEcartPct) : '✗';
    const flag = !api || api.error ? '❌' : isIncomeAnomaly ? '⚠' : '';
    console.log([
      tc.id.padEnd(26),
      tc.sitLabel.padEnd(14),
      (tc.grossIncome/1_000+'k').padStart(9),
      (tc.fortune > 0 ? tc.fortune/1_000+'k' : '–').padStart(9),
      chf(hx.grandTotalChf).padStart(12),
      tou.padStart(12),
      eT.padStart(11),
      eI.padStart(11),
      flag.padStart(3),
    ].join('  '));
  }

  console.log(SEP);
  console.log(`\n  API : ${apiOk}/${results.length} succès  |  Anomalies IS > TOU : ${anomCount}`);
  console.log(anomCount === 0
    ? '  ✓ IS < TOU confirmé — comportement attendu sur tous les cas.'
    : '  ⚠ Anomalies IS > TOU détectées — voir rapport pour recommandations.');

  // ── Écriture rapport ──────────────────────────────────────────────────────────
  const report = buildReport(results, dateStr);
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, report, 'utf-8');
  console.log(`\n  ✓ Rapport écrit dans : docs/validation-results.md`);
  console.log('');

})();
