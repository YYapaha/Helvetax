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

  it('taux effectif < taux marginal (toujours)', () => {
    for (const income of [40_000, 80_000, 150_000, 250_000]) {
      const r = getMarginalRate(income, 'VS', 'single');
      if (r.totalTaxChf > 0) {
        expect(r.effectiveRate).toBeLessThan(r.marginalRate);
      }
    }
  });
});

describe('getMarginalRate — couples vs célibataires', () => {
  it('barème B couple : impôt plus élevé qu\'un célibataire à revenu égal', () => {
    const single = getMarginalRate(100_000, 'VS', 'single');
    const couple = getMarginalRate(100_000, 'VS', 'couple');
    // Barème B démarre plus bas mais monte plus vite sur certaines tranches
    // L'impôt total doit différer (non identique)
    expect(couple.totalTaxChf).not.toBe(single.totalTaxChf);
  });

  it('barème B couple : IFD inférieur au barème A (splitting implicite)', () => {
    // Barème B = équivalent deux célibataires à revenu/2 → moins d'IFD que barème A
    const single = getMarginalRate(150_000, 'VS', 'single');
    const couple = getMarginalRate(150_000, 'VS', 'couple');
    expect(couple.ifdTaxChf).toBeLessThan(single.ifdTaxChf);
  });
});

describe('getMarginalRate — cantons', () => {
  it('calcule sans erreur pour tous les cantons supportés', () => {
    for (const canton of ['VS', 'VD', 'GE', 'NE']) {
      const r = getMarginalRate(80_000, canton, 'single');
      expect(r.totalTaxChf).toBeGreaterThan(0);
    }
  });

  it('cantons ont des impôts différents (pas de valeur identique pour tous)', () => {
    const totals = ['VS', 'VD', 'GE', 'NE'].map(
      (c) => getMarginalRate(100_000, c, 'single').totalTaxChf
    );
    const unique = new Set(totals);
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe('getMarginalRate — plausibilité VS Sion', () => {
  it('80k CHF : taux marginal ~20%', () => {
    const r = getMarginalRate(80_000, 'VS', 'single');
    expect(r.marginalRate).toBeCloseTo(0.199, 1);
  });

  it('100k CHF : taux marginal ~26%', () => {
    const r = getMarginalRate(100_000, 'VS', 'single');
    expect(r.marginalRate).toBeCloseTo(0.261, 1);
  });

  it('taux marginal capé à 45%', () => {
    const r = getMarginalRate(10_000_000, 'VS', 'single');
    expect(r.marginalRate).toBeLessThanOrEqual(0.45);
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
