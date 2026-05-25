/**
 * calculateTax.test.ts — Tests IS / TOU 2026
 *
 * Vérifie que :
 *   - Le régime IS utilise le barème AFC officiel sur le revenu brut.
 *   - Le régime TOU réduit le revenu imposable via les déductions.
 *   - Les déductions (3a, frais pro) sont correctement estimées.
 *   - La logique obligatoire/facultatif du seuil genevois est respectée.
 *   - Les non-permis B ignorent le flag useTOU (calcul IS toujours).
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTax,
  estimateTOUDeductions,
  isTOUMandatory,
  isTOUOptional,
  PILIER_3A_MAX,
} from './calculateTax';
import { getMarginalRate } from './taxBrackets';
import type { UserProfile } from '../types';

// ── Profils de base ───────────────────────────────────────────────────────────

const BASE_SINGLE_B: UserProfile = {
  canton:    'VS',
  situation: 'single',
  children:  0,
  income:    6_667,        // ~80 000 CHF/an
  permit:    'B',
  housing:   'renter',
  activity:  'employee',
  has3a:     'no',
  useTOU:    false,
};

const BASE_SINGLE_B_3A: UserProfile = {
  ...BASE_SINGLE_B,
  has3a: 'yes',
};

const BASE_COUPLE_B: UserProfile = {
  canton:          'VS',
  situation:       'couple',
  children:        0,
  income:          6_667,
  permit:          'B',
  housing:         'renter',
  activity:        'employee',
  has3a:           'yes',
  useTOU:          false,
  coupleIncomeType: 'dual',
};

const BASE_SINGLE_C: UserProfile = {
  ...BASE_SINGLE_B,
  permit: 'C',
  has3a:  'yes',
};

// ── estimateTOUDeductions ─────────────────────────────────────────────────────

describe('estimateTOUDeductions', () => {
  it('sans 3a : renvoie uniquement les frais pro', () => {
    const d = estimateTOUDeductions(BASE_SINGLE_B);
    expect(d.pilier3a).toBe(0);
    expect(d.fraisPro).toBeGreaterThanOrEqual(2_200);
    expect(d.fraisPro).toBeLessThanOrEqual(4_000);
    expect(d.total).toBe(d.fraisPro + d.pilier3a);
  });

  it('avec 3a : inclut 7 258 CHF de pilier 3a', () => {
    const d = estimateTOUDeductions(BASE_SINGLE_B_3A);
    expect(d.pilier3a).toBe(PILIER_3A_MAX);
    expect(d.total).toBe(d.fraisPro + PILIER_3A_MAX);
  });

  it('frais pro plafonnés à 4 000 CHF pour hauts revenus', () => {
    const highIncome: UserProfile = { ...BASE_SINGLE_B, income: 20_000 }; // 240k/an
    const d = estimateTOUDeductions(highIncome);
    expect(d.fraisPro).toBe(4_000);
  });

  it('frais pro au minimum 2 200 CHF pour bas revenus', () => {
    const lowIncome: UserProfile = { ...BASE_SINGLE_B, income: 2_000 }; // 24k/an
    const d = estimateTOUDeductions(lowIncome);
    expect(d.fraisPro).toBe(2_200);
  });

  it('frais pro = 3 % pour revenu intermédiaire (entre 73k et 133k)', () => {
    // 3 % × 90 000 = 2 700 — dans la fourchette [2200, 4000]
    const mid: UserProfile = { ...BASE_SINGLE_B, income: 7_500 }; // 90k/an
    const d = estimateTOUDeductions(mid);
    expect(d.fraisPro).toBe(2_700);
  });
});

// ── calculateTax — régime IS ──────────────────────────────────────────────────

describe('calculateTax — régime IS (useTOU = false)', () => {
  it('retourne le régime IS par défaut pour un permis B', () => {
    const r = calculateTax(BASE_SINGLE_B);
    expect(r.regime).toBe('IS');
  });

  it('résultat IS = getMarginalRate direct sur le revenu brut', () => {
    const r   = calculateTax(BASE_SINGLE_B);
    const ref = getMarginalRate(BASE_SINGLE_B.income * 12, 'VS', 'single');
    expect(r.totalTaxChf).toBe(ref.totalTaxChf);
    expect(r.marginalRate).toBe(ref.marginalRate);
  });

  it('calcule la touSaving potentielle même en mode IS (si permis B + 3a)', () => {
    const r = calculateTax(BASE_SINGLE_B_3A, false);
    expect(r.regime).toBe('IS');
    // Avec 3a, la TOU est avantageuse → économie > 0
    expect(r.touSaving).toBeGreaterThan(0);
  });

  it('touSaving = null si permis C (TOU non applicable)', () => {
    const r = calculateTax(BASE_SINGLE_C);
    expect(r.regime).toBe('IS');
    expect(r.touSaving).toBeNull();
    expect(r.deductions).toBeNull();
  });
});

// ── calculateTax — régime TOU ─────────────────────────────────────────────────

describe('calculateTax — régime TOU (useTOU = true)', () => {
  it('retourne le régime TOU quand useTOU = true', () => {
    const r = calculateTax(BASE_SINGLE_B_3A, true);
    expect(r.regime).toBe('TOU');
  });

  it('TOU avec 3a : impôt total < IS (déductions réduisent le revenu imposable)', () => {
    const rIS  = calculateTax(BASE_SINGLE_B_3A, false);
    const rTOU = calculateTax(BASE_SINGLE_B_3A, true);
    expect(rTOU.totalTaxChf).toBeLessThan(rIS.totalTaxChf);
  });

  it('TOU sans 3a : impôt total < IS (frais pro seuls suffisent à réduire)', () => {
    const rIS  = calculateTax(BASE_SINGLE_B,    false);
    const rTOU = calculateTax(BASE_SINGLE_B,    true);
    expect(rTOU.totalTaxChf).toBeLessThan(rIS.totalTaxChf);
  });

  it('touSaving = IS - TOU (positif)', () => {
    const rTOU = calculateTax(BASE_SINGLE_B_3A, true);
    const rIS  = calculateTax(BASE_SINGLE_B_3A, false);
    // En mode TOU, touSaving est la différence par rapport à IS
    expect(rTOU.touSaving).toBeGreaterThanOrEqual(0);
    // La saving doit correspondre à la différence IS - TOU
    expect(rTOU.touSaving).toBeCloseTo(rIS.totalTaxChf - rTOU.totalTaxChf, -1);
  });

  it('TOU expose le détail des déductions', () => {
    const r = calculateTax(BASE_SINGLE_B_3A, true);
    expect(r.deductions).not.toBeNull();
    expect(r.deductions!.pilier3a).toBe(PILIER_3A_MAX);
    expect(r.deductions!.fraisPro).toBeGreaterThan(0);
    expect(r.deductions!.total).toBeGreaterThan(0);
  });

  it('TOU couple barème B : impôt inférieur à célibataire même revenu', () => {
    const rSingle = calculateTax(BASE_SINGLE_B_3A, true);
    const rCouple = calculateTax(BASE_COUPLE_B,    true);
    // Barème B (splitting) → impôt TOU couple < célibataire à même revenu total
    expect(rCouple.totalTaxChf).toBeLessThan(rSingle.totalTaxChf);
  });
});

// ── useTOU du profil utilisé en fallback ──────────────────────────────────────

describe('calculateTax — profil.useTOU comme fallback', () => {
  it('profile.useTOU = true → calcul TOU sans override explicite', () => {
    const profile: UserProfile = { ...BASE_SINGLE_B_3A, useTOU: true };
    const r = calculateTax(profile);
    expect(r.regime).toBe('TOU');
  });

  it('override useTOU = false prime sur profile.useTOU = true', () => {
    const profile: UserProfile = { ...BASE_SINGLE_B_3A, useTOU: true };
    const r = calculateTax(profile, false);
    expect(r.regime).toBe('IS');
  });
});

// ── isTOUMandatory / isTOUOptional ────────────────────────────────────────────

describe('isTOUMandatory / isTOUOptional', () => {
  it('permis B revenu < 120k VS → TOU facultative', () => {
    const profile: UserProfile = { ...BASE_SINGLE_B, income: 9_000 }; // 108k/an
    expect(isTOUMandatory(profile)).toBe(false);
    expect(isTOUOptional(profile)).toBe(true);
  });

  it('permis B revenu ≥ 120k VS → TOU obligatoire', () => {
    const profile: UserProfile = { ...BASE_SINGLE_B, income: 10_001 }; // 120 012/an
    expect(isTOUMandatory(profile)).toBe(true);
    expect(isTOUOptional(profile)).toBe(false);
  });

  it('permis B revenu exactement = 120k VS → TOU obligatoire (seuil inclus)', () => {
    const profile: UserProfile = { ...BASE_SINGLE_B, income: 10_000 }; // 120 000/an
    expect(isTOUMandatory(profile)).toBe(true);
  });

  it('permis B Genève : seuil spécial 500 000 CHF', () => {
    const profileGE: UserProfile = { ...BASE_SINGLE_B, canton: 'GE', income: 30_000 }; // 360k/an
    expect(isTOUMandatory(profileGE)).toBe(false);
    expect(isTOUOptional(profileGE)).toBe(true);

    const profileGEHigh: UserProfile = { ...BASE_SINGLE_B, canton: 'GE', income: 41_667 }; // 500 004/an
    expect(isTOUMandatory(profileGEHigh)).toBe(true);
  });

  it('permis C → jamais obligatoire ni facultatif (IS non applicable)', () => {
    const profileC: UserProfile = { ...BASE_SINGLE_B, permit: 'C', income: 200_000 };
    expect(isTOUMandatory(profileC)).toBe(false);
    expect(isTOUOptional(profileC)).toBe(false);
  });

  it('citoyen CH → jamais obligatoire ni facultatif', () => {
    const profileCH: UserProfile = { ...BASE_SINGLE_B, permit: 'CH', income: 200_000 };
    expect(isTOUMandatory(profileCH)).toBe(false);
    expect(isTOUOptional(profileCH)).toBe(false);
  });
});

// ── Cohérence tous cantons ────────────────────────────────────────────────────

describe('calculateTax — cohérence VS / VD / GE / NE', () => {
  for (const canton of ['VS', 'VD', 'GE', 'NE'] as const) {
    it(`${canton} : TOU (avec 3a) < IS pour célibataire 80k`, () => {
      const profile: UserProfile = { ...BASE_SINGLE_B_3A, canton };
      const rIS  = calculateTax(profile, false);
      const rTOU = calculateTax(profile, true);
      expect(rTOU.totalTaxChf).toBeLessThan(rIS.totalTaxChf);
    });

    it(`${canton} : isTOUMandatory(false) pour 80k permis B`, () => {
      // 80k < tous les seuils (120k ou 500k GE)
      const profile: UserProfile = { ...BASE_SINGLE_B, canton };
      expect(isTOUMandatory(profile)).toBe(false);
    });
  }
});
