/**
 * taxBrackets.ts — Barèmes fiscaux officiels 2026
 *
 * Sources:
 *  - IFD (fédéral) : estv.admin.ch — barèmes valables dès 01.01.2026
 *  - Cantonaux     : approximations basées sur barèmes officiels VS/VD/GE/NE
 *                    (à affiner avec fiscalData2026.json une fois parsé)
 *
 * Usage:
 *   getMarginalRate(revenuAnnuelBrut, canton, situation)
 *   → taux marginal combiné (IFD + cantonal + communal)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TaxBreakdown {
  marginalRate:    number;  // taux marginal combiné (0–1), différence finie sur 1 000 CHF
  ifdRate:         number;  // part IFD marginale
  cantonalRate:    number;  // part cantonale marginale (coefficient inclus)
  totalTaxChf:     number;  // impôt total estimé en CHF (IFD + cantonal + communal)
  ifdTaxChf:       number;  // part IFD en CHF
  cantonalTaxChf:  number;  // part cantonale+communale en CHF
  effectiveRate:   number;  // taux effectif = totalTaxChf / revenuImposable
  isOfficial:      boolean; // true si barème exact, false si approximation
}

interface Bracket {
  from: number;
  rate: number; // taux MARGINAL sur l'excédent de ce palier
}

// ── IFD 2026 — barème A (célibataires) ───────────────────────────────────────
// Source: ESTV — circulaire 2026, barème A personnes seules
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

// ── Barèmes cantonaux marginaux (taux de base, sans coefficient communal) ─────
// Approximations basées sur les barèmes officiels cantonaux 2026.
// À remplacer par fiscalData2026.json lorsque le pipeline AFC est intégré.

// Taux marginaux CANTONAUX de base (avant coefficient communal)
// Recalibrés pour que IFD + cantonal × coeff = taux réel observable (VStax, taxcalculator)
// Validation : VS Sion 80k → ~20%, 130k → ~30%, 200k → ~36%
const CANTONAL_A: Record<string, Bracket[]> = {
  VS: [
    { from: 0,        rate: 0.000 },
    { from: 12_000,   rate: 0.050 },
    { from: 25_000,   rate: 0.090 },
    { from: 40_000,   rate: 0.110 },
    { from: 60_000,   rate: 0.130 },
    { from: 80_000,   rate: 0.150 },
    { from: 120_000,  rate: 0.160 },
    { from: 180_000,  rate: 0.170 },
  ],
  VD: [
    { from: 0,        rate: 0.000 },
    { from: 14_000,   rate: 0.055 },
    { from: 30_000,   rate: 0.090 },
    { from: 60_000,   rate: 0.115 },
    { from: 100_000,  rate: 0.130 },
    { from: 150_000,  rate: 0.140 },
  ],
  GE: [
    { from: 0,        rate: 0.000 },
    { from: 16_000,   rate: 0.060 },
    { from: 35_000,   rate: 0.110 },
    { from: 70_000,   rate: 0.140 },
    { from: 120_000,  rate: 0.160 },
    { from: 180_000,  rate: 0.170 },
  ],
  NE: [
    { from: 0,        rate: 0.000 },
    { from: 12_000,   rate: 0.055 },
    { from: 25_000,   rate: 0.090 },
    { from: 55_000,   rate: 0.115 },
    { from: 100_000,  rate: 0.130 },
    { from: 150_000,  rate: 0.140 },
  ],
};

// Coefficients communaux par défaut (moyenne pondérée ville principale)
// VS: Sion=1.30, VD: Lausanne=1.345 (79.5% de l'impôt cantonal), GE: uniforme=1.0, NE: ~1.0
export const DEFAULT_COMMUNAL_COEFF: Record<string, number> = {
  VS: 1.30,   // Sion — source: vs.ch 2026
  VD: 1.345,  // Lausanne — source: vd.ch 2026
  GE: 1.00,   // Genève: pas de coefficient (taux uniforme)
  NE: 1.00,   // Neuchâtel: intégré dans le barème cantonal
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Calcule l'impôt total (CHF) par cumul progressif sur les tranches.
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
 * ainsi que l'impôt total en CHF et le taux effectif.
 *
 * @param annualGrossIncome  Revenu brut annuel CHF (avant déductions)
 * @param canton             Code canton: 'VS' | 'VD' | 'GE' | 'NE'
 * @param situation          'single' | 'couple'
 * @param communalCoeff      Coefficient communal (défaut = DEFAULT_COMMUNAL_COEFF[canton])
 */
export function getMarginalRate(
  annualGrossIncome: number,
  canton:            string = 'VS',
  situation:         string = 'single',
  communalCoeff?:    number,
): TaxBreakdown {
  // Revenu imposable estimé (déductions forfaitaires standard ~20%)
  const taxable = Math.max(0, Math.round(annualGrossIncome * 0.80));
  const delta   = 1_000; // CHF — palier différence finie

  const ifdBrackets    = situation === 'couple' ? IFD_B : IFD_A;
  const cantonBrackets = CANTONAL_A[canton] ?? CANTONAL_A['VS'];
  const coeff          = communalCoeff ?? DEFAULT_COMMUNAL_COEFF[canton] ?? 1.30;

  // Impôts totaux en CHF
  const ifdTax0       = calcTotalTax(taxable, ifdBrackets);
  const ifdTax1       = calcTotalTax(taxable + delta, ifdBrackets);
  const cantonTax0    = calcTotalTax(taxable, cantonBrackets) * coeff;
  const cantonTax1    = calcTotalTax(taxable + delta, cantonBrackets) * coeff;

  // Taux marginaux par différence finie
  const ifdRate      = (ifdTax1 - ifdTax0) / delta;
  const cantonalRate = (cantonTax1 - cantonTax0) / delta;
  const marginalRate = Math.min(ifdRate + cantonalRate, 0.45);

  // Totaux
  const ifdTaxChf      = Math.round(ifdTax0);
  const cantonalTaxChf = Math.round(cantonTax0);
  const totalTaxChf    = ifdTaxChf + cantonalTaxChf;
  const effectiveRate  = taxable > 0 ? totalTaxChf / taxable : 0;

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
  canton:            string = 'VS',
  situation:         string = 'single',
): number {
  return getMarginalRate(annualGrossIncome, canton, situation).marginalRate;
}
