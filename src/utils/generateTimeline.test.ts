import { describe, it, expect } from 'vitest';
import { generateTimeline } from './generateTimeline';
import type { UserProfile } from '../types';

// Profil de base couvrant tous les cas génériques (sans indépendant ni propriétaire)
const BASE_PROFILE: UserProfile = {
  canton:    'VS',
  situation: 'single',
  children:  0,
  income:    5000,
  permit:    'B',
  housing:   'renter',
  activity:  'employee',
  has3a:     'yes',
};

describe('generateTimeline', () => {
  it('retourne exactement 12 mois (janvier à décembre)', () => {
    const months = generateTimeline(BASE_PROFILE);
    expect(months).toHaveLength(12);
    for (let m = 1; m <= 12; m++) {
      const found = months.find((mo) => mo.month === m);
      expect(found, `Mois ${m} (${found?.name ?? '???'}) manquant`).toBeDefined();
    }
  });

  it('les mois sont triés de 1 à 12 sans saut', () => {
    const months = generateTimeline(BASE_PROFILE);
    months.forEach((mo, idx) => {
      expect(mo.month).toBe(idx + 1);
    });
  });

  it('août (mois 8) est toujours présent', () => {
    // profil minimaliste sans 3a ni propriétaire
    const minProfile: UserProfile = { ...BASE_PROFILE, has3a: 'no', permit: 'C' };
    const months = generateTimeline(minProfile);
    const august = months.find((m) => m.month === 8);
    expect(august).toBeDefined();
    expect(august!.events.length).toBeGreaterThanOrEqual(1);
  });

  it('chaque mois a au moins un événement', () => {
    const months = generateTimeline(BASE_PROFILE);
    months.forEach((mo) => {
      expect(mo.events.length, `Mois ${mo.month} sans événements`).toBeGreaterThan(0);
    });
  });

  it('tous les noms de mois sont bien renseignés', () => {
    const months = generateTimeline(BASE_PROFILE);
    months.forEach((mo) => {
      expect(mo.name).toBeTruthy();
    });
  });
});
