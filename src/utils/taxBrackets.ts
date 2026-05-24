/**
 * taxBrackets.ts — Moteur fiscal officiel 2026
 *
 * Sources:
 *  - IFD (fédéral)  : ESTV — barèmes A/B valables dès 01.01.2026
 *  - IS cantonaux   : AFC — fiscalData2026.json (barèmes officiels VS/VD/GE/NE)
 *                    Taux effectif TOTAL (IFD + cantonal + communal chef-lieu)
 *                    appliqué directement au revenu mensuel brut.
 *
 * Usage:
 *   getMarginalRate(annualGrossIncome, canton, situation)
 *   → taux marginal combiné (IFD + cantonal + communal), impôt total CHF, etc.
 */

import type { Canton } from './cantonConfig';
import { getIsRate, getBaremeCode } from './afcTariffs';
import type { CoupleIncomeType } from './afcTariffs';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TaxBreakdown {
  marginalRate:    number;  // taux marginal combiné (0–1), différence finie sur 1 000 CHF
  ifdRate:         number;  // part IFD marginale (sur le CHF suivant)
  cantonalRate:    number;  // part cantonale marginale (communal inclus)
  totalTaxChf:     number;  // impôt IS total en CHF (IFD + cantonal + communal)
  ifdTaxChf:       number;  // part IFD en CHF
  cantonalTaxChf:  number;  // part cantonale+communale en CHF
  effectiveRate:   number;  // taux effectif = totalTaxChf / revenuBrut annuel
  isOfficial:      boolean; // toujours true (données AFC officielles)
}

interface Bracket {
  from: number;
  rate: number; // taux MARGINAL sur l'excédent de ce palier
}

// ── IFD 2026 — barème A (célibataires) ───────────────────────────────────────
// Source: ESTV — circulaire 2026, barème A personnes seules
// Utilisé uniquement pour isoler la part IFD dans le total IS.
const IFD_A: Bracket[] = [
  { from: 0,        rate: 0.0000 },
  { from: 14_500,   rate: 0.0077 },
  { from: 31_600,   rate: 0.0088 },
  { from: 41_400,   rate: 0.0264 },
  { from: 55_200,   rate: 0.0297 },
  { from: 72_500,   rate: 0.0594 },
  { from: 78_100,   rate: 0.0660 },
  { from: 103_600,  rate: 0.0880 },
  { from: 134_600,  rate: 0.1100 },
  { from: 175_000,  rate: 0.1150 },
];

// ── IFD 2026 — barème B (couples mariés) ─────────────────────────────────────
// Source: ESTV — circulaire 2026, barème B couples
const IFD_B: Bracket[] = [
  { from: 0,        rate: 0.0000 },
  { from: 28_300,   rate: 0.0100 },
  { from: 50_900,   rate: 0.0200 },
  { from: 58_400,   rate: 0.0300 },
  { from: 75_300,   rate: 0.0400 },
  { from: 90_300,   rate: 0.0500 },
  { from: 103_400,  rate: 0.0600 },
  { from: 114_700,  rate: 0.0700 },
  { from: 124_200,  rate: 0.0800 },
  { from: 131_700,  rate: 0.0900 },
  { from: 137_300,  rate: 0.1000 },
  { from: 141_200,  rate: 0.1100 },
  { from: 143_100,  rate: 0.1150 },
];

// ── Constantes conservées pour compatibilité API ──────────────────────────────

/**
 * Coefficients communaux de référence par canton.
 * Note: Ces valeurs sont intégrées dans les taux AFC (fiscalData2026.json)
 * et ne sont plus utilisées dans le calcul. Conservées pour compatibilité.
 */
export const DEFAULT_COMMUNAL_COEFF: Record<string, number> = {
  VS: 1.30,   // Sion — source: vs.ch 2026
  VD: 1.345,  // Lausanne — source: vd.ch 2026
  GE: 1.00,   // Genève: uniforme (déjà intégré dans le barème AFC)
  NE: 1.00,   // Neuchâtel: intégré dans le barème cantonal
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Calcule l'impôt total (CHF) par cumul progressif sur les tranches IFD.
 * Chaque `rate` est le taux marginal sur l'excédent de ce palier.
 */
function calcTotalTax(income: number, brackets: Bracket[]): number {
  if (income <= 0) return 0;
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const floor = brackets[i].from;
    const ceil  = i + 1 < brackets.length ? brackets[i + 1].from : Infinity;
    if (income <= floor) break;
    const taxable = Math.min(income, ceil) - floor;
    tax += taxable * brackets[i].rate;
  }
  return tax;
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Retourne le taux marginal combiné (IFD + cantonal + communal) via différence finie,
 * ainsi que l'impôt total IS en CHF et le taux effectif.
 *
 * Le total IS provient des barèmes AFC officiels (fiscalData2026.json).
 * Le taux IFD est calculé séparément via les tranches ESTV sur revenu imposable estimé
 * (80 % du brut) pour permettre la ventilation IFD / cantonal.
 *
 * @param annualGrossIncome  Revenu brut annuel CHF
 * @param canton             'VS' | 'VD' | 'GE' | 'NE'
 * @param situation          'single' | 'couple'
 * @param communalCoeff      Ignoré (communal inclus dans AFC) — conservé pour compatibilité API
 * @param children           Nombre d'enfants à charge (0–9, défaut 0)
 * @param coupleIncomeType   'single' (barème C, défaut) | 'dual' (barème B, 2 revenus)
 */
export function getMarginalRate(
  annualGrossIncome: number,
  canton:            Canton = 'VS',
  situation:         string = 'single',
  communalCoeff?:    number,  // eslint-disable-line @typescript-eslint/no-unused-vars
  children:          number = 0,
  coupleIncomeType?: CoupleIncomeType,
): TaxBreakdown {
  if (annualGrossIncome <= 0) {
    return {
      marginalRate: 0, ifdRate: 0, cantonalRate: 0,
      totalTaxChf: 0, ifdTaxChf: 0, cantonalTaxChf: 0,
      effectiveRate: 0, isOfficial: true,
    };
  }

  const delta    = 1_000;  // CHF/an — palier différence finie
  const sit      = situation === 'couple' ? 'couple' : 'single' as const;
  const bareme   = getBaremeCode(sit, children, canton, coupleIncomeType);

  // ── Total IS via AFC (barème officiel) ──────────────────────────────────────
  const monthly0  = annualGrossIncome / 12;
  const monthly1  = (annualGrossIncome + delta) / 12;
  const isRate0   = getIsRate(monthly0, canton, bareme);
  const isRate1   = getIsRate(monthly1, canton, bareme);

  const totalTax0 = annualGrossIncome * isRate0;
  const totalTax1 = (annualGrossIncome + delta) * isRate1;

  // ── Part IFD via tranches ESTV (pour ventilation informationnelle) ───────────
  // Revenu imposable estimé à 80 % du brut (forfait déductions)
  const taxable     = Math.round(annualGrossIncome * 0.80);
  const taxable1    = Math.round((annualGrossIncome + delta) * 0.80);
  const ifdBrackets = situation === 'couple' ? IFD_B : IFD_A;
  const ifdTax0     = calcTotalTax(taxable,  ifdBrackets);
  const ifdTax1     = calcTotalTax(taxable1, ifdBrackets);

  // ── Taux marginaux via différence finie ─────────────────────────────────────
  // Le barème IS est une fonction en escalier : isRate1 ≥ isRate0 (monotone croissant).
  // La propriété effectiveRate ≤ marginalRate est garantie par la monotonie.
  const marginalRate = Math.min((totalTax1 - totalTax0) / delta, 0.45);
  const ifdRate      = (ifdTax1 - ifdTax0) / delta;
  const cantonalRate = Math.max(0, marginalRate - ifdRate);

  // ── Totaux CHF ───────────────────────────────────────────────────────────────
  const totalTaxChf    = Math.round(totalTax0);
  const ifdTaxChf      = Math.round(ifdTax0);
  const cantonalTaxChf = Math.max(0, totalTaxChf - ifdTaxChf);

  // Taux effectif = impôt / revenu brut annuel (IS appliqué sur le brut)
  const effectiveRate = totalTaxChf / annualGrossIncome;

  return {
    marginalRate,
    ifdRate,
    cantonalRate,
    totalTaxChf,
    ifdTaxChf,
    cantonalTaxChf,
    effectiveRate,
    isOfficial: true,
  };
}

/**
 * Raccourci — retourne juste le taux marginal combiné (nombre).
 */
export function getMarginalRateSimple(
  annualGrossIncome: number,
  canton:            Canton = 'VS',
  situation:         string = 'single',
): number {
  return getMarginalRate(annualGrossIncome, canton, situation).marginalRate;
}
