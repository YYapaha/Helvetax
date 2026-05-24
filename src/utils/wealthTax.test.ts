/**
 * wealthTax.test.ts — Tests de l'impôt sur la fortune 2026
 *
 * Les tranches WEALTH_BRACKETS sont définies en fortune IMPOSABLE (après abattement).
 * Le coefficient communal chef-lieu est appliqué au total cantonal :
 *   VS Sion : 1.30 · VD Lausanne : 1.795 · GE : 1.00 (all-in) · NE Neuchâtel : 1.80
 *
 * Valeurs de référence calculées à partir des barèmes wealthTax.ts :
 *   VS 200k (single, exon 25k) : cantonal ~725 CHF, total Sion ~943 CHF, effectif ~4.7‰
 *   VS 500k (single)           : cantonal ~2525 CHF, total ~3283 CHF, effectif ~6.6‰
 *   VD 500k (single, exon 59.4k): cantonal ~1011 CHF, total Lausanne ~1815 CHF, effectif ~3.6‰
 *   GE 500k (single, exon 25k) : total all-in ~3038 CHF, effectif ~6.1‰
 *   NE 500k (single, exon 50k) : cantonal ~800 CHF, total Neuchâtel ~1440 CHF, effectif ~2.9‰
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

  it('VS : fortune 50 000 → impôt > 0 (25 000 imposable × 2‰ × 1.30 = 65 CHF)', () => {
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

  it('VD : fortune ≤ 59 400 → impôt 0 (célibataire)', () => {
    const r = calculateWealthTax(59_400, 'VD', 'single');
    expect(r.taxAmountTotal).toBe(0);
  });

  it('VD : fortune 100 000 → impôt > 0 (taxable = 40 600)', () => {
    const r = calculateWealthTax(100_000, 'VD', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(0);
    expect(r.taxableWealth).toBe(40_600);
  });

  it('GE : fortune ≤ 25 000 → impôt 0', () => {
    const r = calculateWealthTax(25_000, 'GE', 'single');
    expect(r.taxAmountTotal).toBe(0);
  });

  it('GE : fortune 100 000 → impôt > 0 (taxable = 75 000)', () => {
    const r = calculateWealthTax(100_000, 'GE', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(0);
  });

  it('NE : fortune ≤ 50 000 → impôt 0', () => {
    const r = calculateWealthTax(50_000, 'NE', 'single');
    expect(r.taxAmountTotal).toBe(0);
  });

  it('NE : fortune 100 000 → impôt > 0 (taxable = 50 000)', () => {
    const r = calculateWealthTax(100_000, 'NE', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(0);
  });
});

// ── Cas types VS (Sion, coefficient 1.30) ────────────────────────────────────

describe('calculateWealthTax — VS Sion plausibilité', () => {
  // taxable 200k = 175k → cantonal: 0-25k×2‰+25k-50k×3‰+50k-75k×4‰+75k-175k×5‰ = 725 CHF
  // total Sion = 725 × 1.30 = 942.5 → 943 CHF

  it('200 000 CHF : impôt total entre 700 et 1 200 CHF', () => {
    const r = calculateWealthTax(200_000, 'VS', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(700);
    expect(r.taxAmountTotal).toBeLessThan(1_200);
  });

  it('200 000 CHF : taxAmountTotal ≈ taxAmountCantonal × 1.30 (Sion)', () => {
    const r = calculateWealthTax(200_000, 'VS', 'single');
    expect(r.taxAmountTotal).toBeCloseTo(r.taxAmountCantonal * 1.30, -1);
  });

  it('500 000 CHF : taux effectif entre 4‰ et 9‰', () => {
    const r = calculateWealthTax(500_000, 'VS', 'single');
    expect(r.effectiveRatePermille).toBeGreaterThan(4);
    expect(r.effectiveRatePermille).toBeLessThan(9);
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

// ── Cas types VD (Lausanne, coefficient 1.795, plafond 10‰) ─────────────────

describe('calculateWealthTax — VD Lausanne plausibilité', () => {
  // taxable 500k = 440 600 → cantonal: 0-40.6k×1.5‰ + 40.6k-140.6k×2‰ + 140.6k-440.6k×2.5‰
  //   = 60.9 + 200 + 750 = 1010.9 CHF → ×1.795 = 1814.6 → 1815 CHF
  //   effectif = 1815/500k × 1000 = 3.63‰

  it('500 000 CHF : impôt total entre 1 000 et 3 000 CHF', () => {
    const r = calculateWealthTax(500_000, 'VD', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(1_000);
    expect(r.taxAmountTotal).toBeLessThan(3_000);
  });

  it('500 000 CHF : taux effectif entre 2‰ et 6‰', () => {
    const r = calculateWealthTax(500_000, 'VD', 'single');
    expect(r.effectiveRatePermille).toBeGreaterThan(2);
    expect(r.effectiveRatePermille).toBeLessThan(6);
  });

  it('500 000 CHF : taxAmountTotal ≈ taxAmountCantonal × 1.795', () => {
    const r = calculateWealthTax(500_000, 'VD', 'single');
    if (!r.isCapped) {
      expect(r.taxAmountTotal).toBeCloseTo(r.taxAmountCantonal * 1.795, -1);
    }
  });

  it('taux marginal cantonal max = 3.39‰ pour les très grandes fortunes', () => {
    const r = calculateWealthTax(5_000_000, 'VD', 'single');
    expect(r.marginalRatePermille).toBe(3.39);
  });

  it('barème VD — max effectif (3.39‰ × 1.795 ≈ 6.09‰) < plafond 10‰ → jamais capé', () => {
    // Le taux maximum théorique VD + Lausanne est ~6.09‰, inférieur au plafond de 10‰.
    // Le plafond ne serait atteint qu'avec un coefficient communal très élevé.
    const r = calculateWealthTax(50_000_000, 'VD', 'single');
    expect(r.isCapped).toBe(false);
  });
});

// ── Cas types GE (taux all-in, coefficient 1.00) ─────────────────────────────

describe('calculateWealthTax — GE plausibilité', () => {
  // taxable 500k = 475k → 0-75k×4.5‰ + 75k-175k×6‰ + 175k-475k×7‰
  //   = 337.5 + 600 + 2100 = 3037.5 × 1.00 = 3038 CHF → effectif 6.08‰

  it('500 000 CHF : taux effectif entre 4‰ et 10‰ (GE haute fiscalité fortune)', () => {
    const r = calculateWealthTax(500_000, 'GE', 'single');
    expect(r.effectiveRatePermille).toBeGreaterThan(4);
    expect(r.effectiveRatePermille).toBeLessThan(10);
  });

  it('GE : taxAmountTotal = taxAmountCantonal (coeff all-in = 1.00)', () => {
    const r = calculateWealthTax(500_000, 'GE', 'single');
    expect(r.taxAmountTotal).toBe(r.taxAmountCantonal);
  });

  it('GE impôt cantonal (sans communal) > VS impôt cantonal à 500k', () => {
    // GE barème de base plus élevé que VS ; c'est le coefficient VS (1.30) qui fait que
    // le TOTAL VS > GE total, mais la base cantonale GE est bien supérieure.
    const ge = calculateWealthTax(500_000, 'GE', 'single');
    const vs = calculateWealthTax(500_000, 'VS', 'single');
    expect(ge.taxAmountCantonal).toBeGreaterThan(vs.taxAmountCantonal);
  });
});

// ── Cas types NE ──────────────────────────────────────────────────────────────

describe('calculateWealthTax — NE Neuchâtel plausibilité', () => {
  // taxable 500k = 450k → 0-50k×1‰ + 50k-150k×1.5‰ + 150k-450k×2‰
  //   = 50 + 150 + 600 = 800 CHF × 1.80 = 1440 CHF → effectif 2.88‰

  it('500 000 CHF : impôt total entre 800 et 2 500 CHF', () => {
    const r = calculateWealthTax(500_000, 'NE', 'single');
    expect(r.taxAmountTotal).toBeGreaterThan(800);
    expect(r.taxAmountTotal).toBeLessThan(2_500);
  });

  it('500 000 CHF : taux effectif entre 1‰ et 5‰', () => {
    const r = calculateWealthTax(500_000, 'NE', 'single');
    expect(r.effectiveRatePermille).toBeGreaterThan(1);
    expect(r.effectiveRatePermille).toBeLessThan(5);
  });

  it('NE : taxAmountTotal ≈ taxAmountCantonal × 1.80 (Neuchâtel-Ville)', () => {
    const r = calculateWealthTax(500_000, 'NE', 'single');
    expect(r.taxAmountTotal).toBeCloseTo(r.taxAmountCantonal * 1.80, -1);
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
});
