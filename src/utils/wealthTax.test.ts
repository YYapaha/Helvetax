/**
 * wealthTax.test.ts — Tests de l'impôt sur la fortune 2026
 *
 * Barèmes recalibrés mai 2026 via swisstaxcalculator API.
 * Coefficients communaux (chef-lieu) :
 *   VS Sion         : 1.30
 *   VD Lausanne     : 2.334  (= 1 + 1.334 ; communal = 133.4% du cantonal)
 *   GE Genève-Ville : 1.86   (≈ communal 86% du cantonal)
 *   NE Neuchâtel    : 1.889  (= 1 + 0.889 ; communal = 88.9% du cantonal)
 *
 * Exonérations (célibataire / couple) :
 *   VS : 25 000 / 50 000
 *   VD : 50 000 / 50 000
 *   GE : 82 200 / 164 400
 *   NE : 50 000 / 100 000
 *
 * Valeurs de référence (calibration API) :
 *   VS 200k single (exon 25k, 175k imposable) : ~618 CHF
 *   VD 100k single (exon 50k, 50k imposable)  : ~175 CHF
 *   GE 200k single (exon 82.2k, 117.8k imp.)  : ~322 CHF
 *   NE 100k single (exon 50k, 50k imposable)  : ~284 CHF
 */

import { describe, it, expect } from 'vitest';
import { calculateWealthTax } from './wealthTax';

// ── Fortune nulle / invalide ───────────────────────────────────────────────────

describe('calculateWealthTax — fortune nulle ou zéro', () => {
  it('retourne 0 pour fortune = 0', () => {
    const r = calculateWealthTax(0, 'VS', 'single');
    expect(r.taxAmountTotal).toBe(0);
    expect(r.taxAmountCantonal).toBe(0);
    expect(r.effectiveRatePermille).toBe(0);
    expect(r.isCapped).toBe(false);
  });

  it('retourne 0 pour fortune négative', () => {
    const r = calculateWealthTax(-50_000, 'VS', 'single');
    expect(r.taxAmountTotal).toBe(0);
  });

  it('retourne tous les champs attendus', () => {
    const r = calculateWealthTax(100_000, 'VS', 'single');
    expect(r).toHaveProperty('taxableWealth');
    expect(r).toHaveProperty('taxAmountCantonal');
    expect(r).toHaveProperty('taxAmountTotal');
    expect(r).toHaveProperty('effectiveRatePermille');
    expect(r).toHaveProperty('marginalRatePermille');
    expect(r).toHaveProperty('exoneration');
    expect(r).toHaveProperty('isCapped');
    expect(r).toHaveProperty('bareme');
  });
});

// ── Seuils d'exonération ──────────────────────────────────────────────────────

describe('calculateWealthTax — exonération', () => {
  it('VS : fortune ≤ 25 000 → impôt 0 (célibataire)', () => {
    const r = calculateWealthTax(25_000, 'VS', 'single');
    expect(r.taxAmountTotal).toBe(0);
    expect(r.taxableWealth).toBe(0);
    expect(r.exoneration).toBe(25_000);
  });

  it('VS : fortune 50 000 → impôt > 0 (25 000 imposable)', () => {
    const r = calculateWealthTax(50_000, 'VS', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(0);
    expect(r.taxableWealth).toBe(25_000);
  });

  it('VS : fortune ≤ 50 000 → impôt 0 (couple, exon 50 000)', () => {
    const r = calculateWealthTax(50_000, 'VS', 'couple');
    expect(r.taxAmountTotal).toBe(0);
    expect(r.exoneration).toBe(50_000);
  });

  it('VS : fortune 100 000 couple → impôt < impôt célibataire (abattement double)', () => {
    const single = calculateWealthTax(100_000, 'VS', 'single');
    const couple = calculateWealthTax(100_000, 'VS', 'couple');
    expect(couple.taxAmountTotal).toBeLessThan(single.taxAmountTotal);
  });

  it('VD : fortune ≤ 50 000 → impôt 0 (célibataire)', () => {
    const r = calculateWealthTax(50_000, 'VD', 'single');
    expect(r.taxAmountTotal).toBe(0);
  });

  it('VD : fortune 100 000 → impôt > 0 (taxable = 50 000)', () => {
    const r = calculateWealthTax(100_000, 'VD', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(0);
    expect(r.taxableWealth).toBe(50_000);
  });

  it('GE : fortune ≤ 82 200 → impôt 0', () => {
    const r = calculateWealthTax(82_200, 'GE', 'single');
    expect(r.taxAmountTotal).toBe(0);
  });

  it('GE : fortune 100 000 → impôt > 0 (taxable = 17 800)', () => {
    const r = calculateWealthTax(100_000, 'GE', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(0);
    expect(r.taxableWealth).toBe(17_800);
  });

  it('NE : fortune ≤ 50 000 → impôt 0', () => {
    const r = calculateWealthTax(50_000, 'NE', 'single');
    expect(r.taxAmountTotal).toBe(0);
  });

  it('NE : fortune 100 000 → impôt > 0 (taxable = 50 000)', () => {
    const r = calculateWealthTax(100_000, 'NE', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(0);
    expect(r.taxableWealth).toBe(50_000);
  });
});

// ── Cas types VS (Sion, coefficient 1.30) ────────────────────────────────────

describe('calculateWealthTax — VS Sion calibration', () => {
  // Référence API : VS single 200k → ~618 CHF, VS single 500k → ~2102 CHF

  it('200 000 CHF : impôt total entre 400 et 900 CHF (réf API: ~618 CHF)', () => {
    const r = calculateWealthTax(200_000, 'VS', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(400);
    expect(r.taxAmountTotal).toBeLessThan(900);
  });

  it('200 000 CHF : taxAmountTotal ≈ taxAmountCantonal × 1.30 (Sion)', () => {
    const r = calculateWealthTax(200_000, 'VS', 'single');
    expect(r.taxAmountTotal).toBeCloseTo(r.taxAmountCantonal * 1.30, -1);
  });

  it('500 000 CHF : impôt total entre 1 500 et 3 000 CHF (réf API: ~2102 CHF)', () => {
    const r = calculateWealthTax(500_000, 'VS', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(1_500);
    expect(r.taxAmountTotal).toBeLessThan(3_000);
  });

  it('500 000 CHF : taux effectif entre 3‰ et 7‰', () => {
    const r = calculateWealthTax(500_000, 'VS', 'single');
    expect(r.effectiveRatePermille).toBeGreaterThan(3);
    expect(r.effectiveRatePermille).toBeLessThan(7);
  });

  it('1 000 000 CHF : taux effectif supérieur à 500k (progressivité)', () => {
    const r500k = calculateWealthTax(500_000,   'VS', 'single');
    const r1M   = calculateWealthTax(1_000_000, 'VS', 'single');
    expect(r1M.effectiveRatePermille).toBeGreaterThan(r500k.effectiveRatePermille);
  });

  it('impôt couple < impôt célibataire à 200k (abattement double)', () => {
    const single = calculateWealthTax(200_000, 'VS', 'single');
    const couple = calculateWealthTax(200_000, 'VS', 'couple');
    expect(couple.taxAmountTotal).toBeLessThan(single.taxAmountTotal);
  });

  it('pas de plafonnement en VS', () => {
    const r = calculateWealthTax(10_000_000, 'VS', 'single');
    expect(r.isCapped).toBe(false);
  });
});

// ── Cas types VD (Lausanne, coefficient 2.334, plafond 10‰) ─────────────────

describe('calculateWealthTax — VD Lausanne calibration', () => {
  // Référence API : VD single 100k → ~175 CHF, 500k → ~2552 CHF

  it('100 000 CHF : impôt total entre 100 et 300 CHF (réf API: ~175 CHF)', () => {
    const r = calculateWealthTax(100_000, 'VD', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(100);
    expect(r.taxAmountTotal).toBeLessThan(300);
  });

  it('500 000 CHF : impôt total entre 1 500 et 3 500 CHF (réf API: ~2552 CHF)', () => {
    const r = calculateWealthTax(500_000, 'VD', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(1_500);
    expect(r.taxAmountTotal).toBeLessThan(3_500);
  });

  it('500 000 CHF : taux effectif entre 3‰ et 8‰', () => {
    const r = calculateWealthTax(500_000, 'VD', 'single');
    expect(r.effectiveRatePermille).toBeGreaterThan(3);
    expect(r.effectiveRatePermille).toBeLessThan(8);
  });

  it('500 000 CHF : taxAmountTotal ≈ taxAmountCantonal × 2.334 (Lausanne)', () => {
    const r = calculateWealthTax(500_000, 'VD', 'single');
    if (!r.isCapped) {
      expect(r.taxAmountTotal).toBeCloseTo(r.taxAmountCantonal * 2.334, -1);
    }
  });

  it('taux marginal cantonal max = 3.39‰ pour les très grandes fortunes', () => {
    const r = calculateWealthTax(5_000_000, 'VD', 'single');
    expect(r.marginalRatePermille).toBe(3.39);
  });

  it('taux max all-in ~7.91‰ < plafond 10‰ → jamais capé à Lausanne', () => {
    // Taux max all-in = 3.39 × 2.334 ≈ 7.91‰ < 10‰ → plafond jamais atteint.
    const r = calculateWealthTax(50_000_000, 'VD', 'single');
    expect(r.isCapped).toBe(false);
  });
});

// ── Cas types GE (LIPP-GE × coeff 1.86) ─────────────────────────────────────

describe('calculateWealthTax — GE calibration', () => {
  // Référence API : GE single 200k → ~322 CHF, 500k → ~1591 CHF

  it('200 000 CHF : impôt total entre 200 et 500 CHF (réf API: ~322 CHF)', () => {
    const r = calculateWealthTax(200_000, 'GE', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(200);
    expect(r.taxAmountTotal).toBeLessThan(500);
  });

  it('500 000 CHF : taux effectif entre 2‰ et 6‰ (réf API: ~3.2‰)', () => {
    const r = calculateWealthTax(500_000, 'GE', 'single');
    expect(r.effectiveRatePermille).toBeGreaterThan(2);
    expect(r.effectiveRatePermille).toBeLessThan(6);
  });

  it('GE : taxAmountTotal ≈ taxAmountCantonal × 1.86 (coeff communal)', () => {
    const r = calculateWealthTax(500_000, 'GE', 'single');
    expect(r.taxAmountTotal).toBeCloseTo(r.taxAmountCantonal * 1.86, -1);
  });

  it('GE : fortune ≥ 164 400 couple → impôt > 0', () => {
    const r = calculateWealthTax(200_000, 'GE', 'couple');
    expect(r.taxAmountTotal).toBeGreaterThan(0);
  });

  it('GE : pas de plafond fortune', () => {
    const r = calculateWealthTax(10_000_000, 'GE', 'single');
    expect(r.isCapped).toBe(false);
  });
});

// ── Cas types NE ──────────────────────────────────────────────────────────────

describe('calculateWealthTax — NE Neuchâtel calibration', () => {
  // Référence API : NE single 100k → ~284 CHF, 500k → ~3402 CHF

  it('100 000 CHF : impôt total entre 200 et 400 CHF (réf API: ~284 CHF)', () => {
    const r = calculateWealthTax(100_000, 'NE', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(200);
    expect(r.taxAmountTotal).toBeLessThan(400);
  });

  it('500 000 CHF : impôt total entre 2 500 et 4 500 CHF (réf API: ~3402 CHF)', () => {
    const r = calculateWealthTax(500_000, 'NE', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(2_500);
    expect(r.taxAmountTotal).toBeLessThan(4_500);
  });

  it('500 000 CHF : taux effectif entre 4‰ et 9‰', () => {
    const r = calculateWealthTax(500_000, 'NE', 'single');
    expect(r.effectiveRatePermille).toBeGreaterThan(4);
    expect(r.effectiveRatePermille).toBeLessThan(9);
  });

  it('NE : taxAmountTotal ≈ taxAmountCantonal × 1.889 (Neuchâtel-Ville)', () => {
    const r = calculateWealthTax(500_000, 'NE', 'single');
    expect(r.taxAmountTotal).toBeCloseTo(r.taxAmountCantonal * 1.889, -1);
  });
});

// ── Progressivité générale ─────────────────────────────────────────────────────

describe('calculateWealthTax — progressivité', () => {
  const cantons = ['VS', 'VD', 'GE', 'NE'] as const;

  it('impôt croît avec la fortune (tous cantons)', () => {
    for (const canton of cantons) {
      const r200k = calculateWealthTax(200_000, canton, 'single');
      const r1M   = calculateWealthTax(1_000_000, canton, 'single');
      expect(r1M.taxAmountTotal).toBeGreaterThan(r200k.taxAmountTotal);
    }
  });

  it('taux effectif croît avec la fortune (barème progressif)', () => {
    for (const canton of cantons) {
      const r200k = calculateWealthTax(200_000, canton, 'single');
      const r1M   = calculateWealthTax(1_000_000, canton, 'single');
      if (r200k.taxAmountTotal > 0 && r1M.taxAmountTotal > 0) {
        expect(r1M.effectiveRatePermille).toBeGreaterThanOrEqual(r200k.effectiveRatePermille);
      }
    }
  });

  it('calcule sans erreur pour tous les cantons', () => {
    for (const canton of cantons) {
      expect(() => calculateWealthTax(500_000, canton, 'single')).not.toThrow();
    }
  });
});

// ── Cohérence interne ─────────────────────────────────────────────────────────

describe('calculateWealthTax — cohérence', () => {
  it('taxableWealth = max(0, fortune − exonération)', () => {
    const r = calculateWealthTax(200_000, 'VS', 'single');
    expect(r.taxableWealth).toBe(200_000 - r.exoneration);
  });

  it('effectiveRatePermille = taxAmountTotal / fortune × 1000 (arrondi)', () => {
    const r = calculateWealthTax(500_000, 'VS', 'single');
    const computed = (r.taxAmountTotal / 500_000) * 1000;
    expect(r.effectiveRatePermille).toBeCloseTo(computed, 0);
  });

  it('bareme contient le canton et la situation', () => {
    const r = calculateWealthTax(100_000, 'VD', 'couple');
    expect(r.bareme).toContain('VD');
    expect(r.bareme).toContain('couple');
  });

  it('marginalRatePermille = 0 si fortune sous le seuil', () => {
    const r = calculateWealthTax(20_000, 'VS', 'single'); // sous exon 25k
    expect(r.marginalRatePermille).toBe(0);
  });

  it('marginalRatePermille > 0 si fortune > seuil d\'exonération', () => {
    const r = calculateWealthTax(100_000, 'VS', 'single');
    expect(r.marginalRatePermille).toBeGreaterThan(0);
  });

  it('VS Sion: coefficient 1.30 appliqué (total = cantonal × 1.30)', () => {
    const r = calculateWealthTax(500_000, 'VS', 'single');
    expect(r.taxAmountTotal).toBeCloseTo(r.taxAmountCantonal * 1.30, -1);
  });
});
