/**
 * wealthTax.ts — Calcul de l'impôt sur la fortune 2026
 *
 * Sources : lois fiscales cantonales 2026
 *   VS  : Loi fiscale du Valais (LF-VS), art. 56–62
 *   VD  : Loi sur les impôts cantonaux directs (LICD-VD), art. 50–52
 *   GE  : Loi sur l'imposition des personnes physiques (LIPP-GE), art. 56–60
 *   NE  : Loi sur les contributions directes (LCdir-NE)
 *
 * Architecture :
 *   - Les tranches sont définies EN TERMES DE FORTUNE IMPOSABLE (après abattement).
 *     Le premier palier commence à 0 avec un taux positif.
 *   - L'abattement (exonérationFortune) est soustrait AVANT l'application des tranches.
 *   - Cela permet d'utiliser les mêmes tranches pour célibataire et couple, le seul
 *     différentiel étant le montant de l'abattement (tiré de cantonConfig).
 *   - Le coefficient communal est appliqué au total cantonal (via cantonConfig).
 *   - VD : plafond total (canton + communal) à 10‰ de la fortune nette.
 *   - GE : barème all-in (canton + Genève-Ville), communalCoeff = 1.00.
 *
 * Note: Les données AFC dans fiscalData2026.json ne contiennent que les
 * barèmes IS (impôt à la source sur le revenu). Les taux fortune sont
 * codifiés directement ici à partir des lois cantonales officielles.
 */

import type { Canton } from './cantonConfig';
import { getCantonConfig } from './cantonConfig';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Résultat du calcul de l'impôt sur la fortune. */
export interface WealthTaxResult {
  /** Fortune imposable après déduction de l'abattement (CHF). */
  taxableWealth:          number;
  /** Impôt cantonal de base avant application du coefficient communal (CHF). */
  taxAmountCantonal:      number;
  /**
   * Impôt total canton + commune (CHF).
   * = taxAmountCantonal × fortuneCommunalCoeff, plafonné si applicable.
   */
  taxAmountTotal:         number;
  /** Taux effectif en ‰ sur la fortune nette brute (avant abattement). */
  effectiveRatePermille:  number;
  /**
   * Taux marginal (‰) du palier courant, appliqué à la fortune IMPOSABLE
   * (après abattement). Ne tient pas compte du coefficient communal.
   */
  marginalRatePermille:   number;
  /** Montant de l'abattement personnel appliqué (CHF). */
  exoneration:            number;
  /** Vrai si le plafond VD 10‰ a été appliqué. */
  isCapped:               boolean;
  /** Code barème utilisé (ex: 'VS-single-2026'). */
  bareme:                 string;
}

// ── Tranches marginales par canton ────────────────────────────────────────────

interface WealthBracket {
  /**
   * Seuil bas de la tranche (CHF), exprimé en FORTUNE IMPOSABLE
   * (= fortune nette − abattement personnel).
   * Le premier palier est toujours from = 0.
   */
  from: number;
  /** Taux marginal (‰) sur l'excédent de ce palier. */
  rate: number;
}

/**
 * Barèmes cantonaux de base 2026 — taux en ‰ (pour mille), MARGINAUX.
 *
 * Les seuils sont en FORTUNE IMPOSABLE (après abattement).
 * Exemples de correspondance fortune nette → fortune imposable :
 *   VS single  : fortune imposable = fortune nette − 25 000 CHF
 *   VD single  : fortune imposable = fortune nette − 59 400 CHF
 *   GE single  : fortune imposable = fortune nette − 25 000 CHF
 *   NE single  : fortune imposable = fortune nette − 50 000 CHF
 *
 * VS  : LF-VS art. 56 — coefficient Sion 1.30 appliqué séparément
 * VD  : LICD-VD art. 50 — taux max 3.39‰, coefficient Lausanne 1.795
 * GE  : LIPP-GE art. 56 — barème TOTAL (canton + Genève-Ville), coeff 1.00
 * NE  : LCdir-NE — taux modérés, coefficient Neuchâtel-Ville 1.80
 */
const WEALTH_BRACKETS: Record<Canton, WealthBracket[]> = {

  // ── Valais (LF-VS art. 56) ───────────────────────────────────────────────
  // Seuils en fortune imposable (= fortune − 25 000 célibataire)
  VS: [
    { from:         0, rate: 2.0 },  // 0–25 000 imposable  → fortune 25 000–50 000
    { from:    25_000, rate: 3.0 },  // 25 000–50 000        → fortune 50 000–75 000
    { from:    50_000, rate: 4.0 },  // 50 000–75 000        → fortune 75 000–100 000
    { from:    75_000, rate: 5.0 },  // 75 000–175 000       → fortune 100 000–200 000
    { from:   175_000, rate: 6.0 },  // 175 000–475 000      → fortune 200 000–500 000
    { from:   475_000, rate: 6.5 },  // 475 000–975 000      → fortune 500 000–1 000 000
    { from:   975_000, rate: 7.0 },  // > 975 000            → fortune > 1 000 000
  ],

  // ── Vaud (LICD-VD art. 50) ──────────────────────────────────────────────
  // Seuils en fortune imposable (= fortune − 59 400 célibataire)
  // Plafond total 10‰ (1 %) de la fortune nette (art. 52 LICD-VD).
  VD: [
    { from:         0, rate: 1.5  },  // 0–40 600            → fortune 59 400–100 000
    { from:    40_600, rate: 2.0  },  // 40 600–140 600       → fortune 100 000–200 000
    { from:   140_600, rate: 2.5  },  // 140 600–440 600      → fortune 200 000–500 000
    { from:   440_600, rate: 3.0  },  // 440 600–940 600      → fortune 500 000–1 000 000
    { from:   940_600, rate: 3.39 },  // > 940 600            → fortune > 1 000 000
  ],

  // ── Genève (LIPP-GE art. 56 — taux TOTAUX canton + Genève-Ville inclus) ─
  // Seuils en fortune imposable (= fortune − 25 000 célibataire)
  GE: [
    { from:         0, rate: 4.5 },  // 0–75 000             → fortune 25 000–100 000
    { from:    75_000, rate: 6.0 },  // 75 000–175 000        → fortune 100 000–200 000
    { from:   175_000, rate: 7.0 },  // 175 000–475 000       → fortune 200 000–500 000
    { from:   475_000, rate: 8.0 },  // 475 000–975 000       → fortune 500 000–1 000 000
    { from:   975_000, rate: 8.5 },  // 975 000–1 975 000     → fortune 1 000 000–2 000 000
    { from: 1_975_000, rate: 9.0 },  // > 1 975 000           → fortune > 2 000 000
  ],

  // ── Neuchâtel (LCdir-NE) ────────────────────────────────────────────────
  // Seuils en fortune imposable (= fortune − 50 000 célibataire)
  NE: [
    { from:         0, rate: 1.0 },  // 0–50 000             → fortune 50 000–100 000
    { from:    50_000, rate: 1.5 },  // 50 000–150 000        → fortune 100 000–200 000
    { from:   150_000, rate: 2.0 },  // 150 000–450 000       → fortune 200 000–500 000
    { from:   450_000, rate: 2.5 },  // 450 000–950 000       → fortune 500 000–1 000 000
    { from:   950_000, rate: 3.0 },  // > 950 000             → fortune > 1 000 000
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Calcule l'impôt cantonal de base (CHF) sur la FORTUNE IMPOSABLE
 * en appliquant un barème progressif (taux marginaux en ‰ sur l'excédent).
 *
 * @param taxableWealth  Fortune imposable en CHF (après déduction de l'abattement)
 * @param brackets       Tranches marginales du canton (seuils en fortune imposable)
 * @returns              Impôt cantonal de base en CHF (non arrondi)
 */
function calcWealthTaxBase(taxableWealth: number, brackets: WealthBracket[]): number {
  if (taxableWealth <= 0) return 0;
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const floor = brackets[i].from;
    const ceil  = i + 1 < brackets.length ? brackets[i + 1].from : Infinity;
    if (taxableWealth <= floor) break;
    const slice = Math.min(taxableWealth, ceil) - floor;
    tax += slice * (brackets[i].rate / 1000);  // ‰ → coefficient
  }
  return tax;
}

/**
 * Retourne le taux marginal cantonal (‰) applicable à la fortune imposable donnée.
 * Retourne 0 si la fortune imposable est nulle ou négative.
 */
function getMarginalRatePermille(taxableWealth: number, brackets: WealthBracket[]): number {
  if (taxableWealth <= 0) return 0;
  let marginal = brackets[0]?.rate ?? 0;
  for (let i = 1; i < brackets.length; i++) {
    if (taxableWealth > brackets[i].from) {
      marginal = brackets[i].rate;
    } else {
      break;
    }
  }
  return marginal;
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Calcule l'impôt cantonal et communal sur la fortune pour 2026.
 *
 * @param fortune    Fortune nette en CHF (avant abattement personnel)
 * @param canton     Code canton : 'VS' | 'VD' | 'GE' | 'NE'
 * @param situation  Situation civile — détermine le montant de l'abattement
 *                   ('single' = défaut ; 'couple' = double abattement)
 * @returns          WealthTaxResult avec montants CHF et taux effectif ‰
 */
export function calculateWealthTax(
  fortune:   number,
  canton:    Canton,
  situation: 'single' | 'couple' = 'single',
): WealthTaxResult {
  const cc       = getCantonConfig(canton);
  const brackets = WEALTH_BRACKETS[canton];
  const bareme   = `${canton}-${situation}-2026`;

  // Abattement selon situation civile
  const exoneration   = situation === 'couple'
    ? cc.fortuneExonerationCouple
    : cc.fortuneExoneration;

  // Fortune imposable (après abattement) — entrée des tranches
  const taxableWealth = Math.max(0, Math.round(fortune - exoneration));

  // Fortune nulle ou entièrement couverte par l'abattement → exonéré
  if (fortune <= 0 || taxableWealth <= 0) {
    return {
      taxableWealth:         0,
      taxAmountCantonal:     0,
      taxAmountTotal:        0,
      effectiveRatePermille: 0,
      marginalRatePermille:  0,
      exoneration,
      isCapped:              false,
      bareme,
    };
  }

  // ── Impôt cantonal de base ───────────────────────────────────────────────
  // Les tranches sont en fortune imposable (= fortune nette − abattement)
  const taxAmountCantonalRaw = calcWealthTaxBase(taxableWealth, brackets);

  // ── Coefficient communal ─────────────────────────────────────────────────
  const taxWithCommunal = taxAmountCantonalRaw * cc.fortuneCommunalCoeff;

  // ── Plafonnement (VD : 10‰ de la fortune nette) ─────────────────────────
  const capAmount = cc.fortuneCapPermille > 0
    ? fortune * (cc.fortuneCapPermille / 1000)
    : Infinity;
  const isCapped      = taxWithCommunal > capAmount;
  const taxAmountTotal = Math.round(isCapped ? capAmount : taxWithCommunal);

  // ── Taux effectif (‰ sur fortune nette brute) ────────────────────────────
  const effectiveRatePermille = fortune > 0
    ? Math.round((taxAmountTotal / fortune) * 10_000) / 10   // arrondi à 0.1‰
    : 0;

  // ── Taux marginal cantonal (‰) du palier courant ─────────────────────────
  const marginalRatePermille = getMarginalRatePermille(taxableWealth, brackets);

  return {
    taxableWealth,
    taxAmountCantonal:   Math.round(taxAmountCantonalRaw),
    taxAmountTotal,
    effectiveRatePermille,
    marginalRatePermille,
    exoneration,
    isCapped,
    bareme,
  };
}
