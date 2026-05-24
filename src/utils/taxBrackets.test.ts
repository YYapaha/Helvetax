/**
 * taxBrackets.test.ts — Tests du moteur fiscal (barèmes AFC officiels 2026)
 *
 * Note sur les valeurs de référence :
 *   Les barèmes IS AFC sont des fonctions en escalier (taux effectif appliqué
 *   au revenu mensuel brut total). Le taux marginal est calculé par différence
 *   finie sur 1 000 CHF/an, ce qui peut traverser plusieurs paliers.
 *
 *   Propriété IS : effectiveRate ≤ marginalRate (égaux dans un palier,
 *   marginalRate > effectiveRate à la traversée d'un palier).
 */

import { describe, it, expect } from 'vitest';
import { getMarginalRate, getMarginalRateSimple } from './taxBrackets';

describe('getMarginalRate — structure', () => {
  it('retourne tous les champs attendus', () => {
    const result = getMarginalRate(80_000, 'VS', 'single');
    expect(result).toHaveProperty('marginalRate');
    expect(result).toHaveProperty('ifdRate');
    expect(result).toHaveProperty('cantonalRate');
    expect(result).toHaveProperty('totalTaxChf');
    expect(result).toHaveProperty('ifdTaxChf');
    expect(result).toHaveProperty('cantonalTaxChf');
    expect(result).toHaveProperty('effectiveRate');
  });

  it('valeurs strictement positives pour un revenu non nul', () => {
    const r = getMarginalRate(80_000, 'VS', 'single');
    expect(r.totalTaxChf).toBeGreaterThan(0);
    expect(r.marginalRate).toBeGreaterThan(0);
    expect(r.effectiveRate).toBeGreaterThan(0);
  });

  it('revenu zéro → impôt zéro', () => {
    const r = getMarginalRate(0, 'VS', 'single');
    expect(r.totalTaxChf).toBe(0);
    expect(r.marginalRate).toBe(0);
  });
});

describe('getMarginalRate — progressivité', () => {
  it('impôt croît avec le revenu', () => {
    const r60  = getMarginalRate(60_000,  'VS', 'single');
    const r100 = getMarginalRate(100_000, 'VS', 'single');
    const r200 = getMarginalRate(200_000, 'VS', 'single');
    expect(r100.totalTaxChf).toBeGreaterThan(r60.totalTaxChf);
    expect(r200.totalTaxChf).toBeGreaterThan(r100.totalTaxChf);
  });

  it('taux marginal croît avec le revenu (progressivité)', () => {
    const r60  = getMarginalRate(60_000,  'VS', 'single');
    const r150 = getMarginalRate(150_000, 'VS', 'single');
    expect(r150.marginalRate).toBeGreaterThan(r60.marginalRate);
  });

  it('taux effectif ≤ taux marginal (propriété barème IS en escalier)', () => {
    // Le barème IS est une fonction en escalier : taux effectif = taux de palier.
    // Le taux marginal (différence finie Δ1000 CHF) est ≥ au taux effectif car
    // la fonction est monotone croissante. L'égalité peut se produire en milieu de palier.
    for (const income of [40_000, 80_000, 150_000, 250_000]) {
      const r = getMarginalRate(income, 'VS', 'single');
      if (r.totalTaxChf > 0) {
        expect(r.effectiveRate).toBeLessThanOrEqual(r.marginalRate);
      }
    }
  });
});

describe('getMarginalRate — couples vs célibataires', () => {
  it('barème C couple : impôt différent d\'un célibataire à revenu égal', () => {
    const single = getMarginalRate(100_000, 'VS', 'single');
    const couple = getMarginalRate(100_000, 'VS', 'couple');
    // Barème A (single) vs barème C (couple 1 revenu) → montants différents
    expect(couple.totalTaxChf).not.toBe(single.totalTaxChf);
  });

  it('barème B couple : IFD inférieur au barème A (splitting implicite)', () => {
    // Barème IFD_B démarre à 28 300 CHF vs IFD_A à 14 500 CHF → moins d'IFD que barème A
    const single = getMarginalRate(150_000, 'VS', 'single');
    const couple = getMarginalRate(150_000, 'VS', 'couple');
    expect(couple.ifdTaxChf).toBeLessThan(single.ifdTaxChf);
  });
});

describe('getMarginalRate — cantons', () => {
  it('calcule sans erreur pour tous les cantons supportés', () => {
    for (const canton of ['VS', 'VD', 'GE', 'NE'] as const) {
      const r = getMarginalRate(80_000, canton, 'single');
      expect(r.totalTaxChf).toBeGreaterThan(0);
    }
  });

  it('cantons ont des impôts différents (pas de valeur identique pour tous)', () => {
    const totals = (['VS', 'VD', 'GE', 'NE'] as const).map(
      (c) => getMarginalRate(100_000, c, 'single').totalTaxChf
    );
    const unique = new Set(totals);
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe('getMarginalRate — plausibilité VS Sion (barèmes AFC officiels)', () => {
  // Valeurs de référence : barème A0N AFC 2026, chef-lieu Sion (coeff 1.30 inclus)
  // effectiveRate ≈ taux IS du palier (IFD + cantonal Sion)

  it('80k CHF : taux marginal entre 10% et 35%', () => {
    // AFC IS = taux effectif ~10.16% à 6 667 CHF/mois
    // Différence finie sur Δ1000 CHF → marginal inclut la progression du palier
    const r = getMarginalRate(80_000, 'VS', 'single');
    expect(r.marginalRate).toBeGreaterThan(0.10);
    expect(r.marginalRate).toBeLessThanOrEqual(0.35);
  });

  it('80k CHF : taux effectif IS plausible (~8–14%)', () => {
    const r = getMarginalRate(80_000, 'VS', 'single');
    expect(r.effectiveRate).toBeGreaterThan(0.08);
    expect(r.effectiveRate).toBeLessThan(0.14);
  });

  it('100k CHF : taux marginal supérieur à 80k', () => {
    const r80  = getMarginalRate(80_000,  'VS', 'single');
    const r100 = getMarginalRate(100_000, 'VS', 'single');
    expect(r100.marginalRate).toBeGreaterThan(r80.marginalRate);
  });

  it('150k CHF : taux marginal supérieur à 100k', () => {
    const r100 = getMarginalRate(100_000, 'VS', 'single');
    const r150 = getMarginalRate(150_000, 'VS', 'single');
    expect(r150.marginalRate).toBeGreaterThan(r100.marginalRate);
  });

  it('taux marginal capé à 45%', () => {
    const r = getMarginalRate(10_000_000, 'VS', 'single');
    expect(r.marginalRate).toBeLessThanOrEqual(0.45);
  });

  it('80k CHF : impôt total IS positif et < 20 000 CHF', () => {
    const r = getMarginalRate(80_000, 'VS', 'single');
    expect(r.totalTaxChf).toBeGreaterThan(0);
    expect(r.totalTaxChf).toBeLessThan(20_000);
  });
});

describe('getMarginalRateSimple — compatibilité', () => {
  it('retourne un nombre entre 0 et 1', () => {
    const rate = getMarginalRateSimple(80_000, 'VS', 'single');
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThanOrEqual(0.45);
  });

  it('cohérent avec getMarginalRate', () => {
    const simple = getMarginalRateSimple(100_000, 'VS', 'single');
    const full   = getMarginalRate(100_000, 'VS', 'single').marginalRate;
    expect(simple).toBe(full);
  });
});
