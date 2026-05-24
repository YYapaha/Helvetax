/**
 * afcTariffs.ts — Barèmes IS officiels AFC 2026
 *
 * Source: src/data/fiscalData2026.json (généré par le pipeline fetch-afc.ts)
 *
 * Structure JSON :
 *   cantons[canton][codeBareme] = [{revenu: CHF/mois, taux: décimal}]
 *
 * Le taux est le taux effectif TOTAL (IFD + cantonal + communal chef-lieu)
 * appliqué directement au revenu mensuel brut.
 *
 * Codes barème :
 *   A = personne seule (célibataire, divorcé, veuf)
 *   B = couple marié, 2 revenus (chaque conjoint taxé séparément)
 *   C = couple marié, 1 seul revenu
 *   Suffixe = nombre d'enfants (0–9, selon canton)
 *   Suffixe N = barème normal (pas de fortune ou revenus extraordinaires)
 *
 * Chef-lieu de référence par canton (communal coefficient inclus dans le tarif) :
 *   VS → Sion (coefficient 1.30)
 *   VD → Lausanne (coefficient ~1.345)
 *   GE → uniforme (pas de coefficient communal)
 *   NE → Neuchâtel (coefficient intégré)
 */

import type { Canton } from './cantonConfig';

// ── Types ─────────────────────────────────────────────────────────────────────

interface IsPoint    { revenu: number; taux: number }
type BaremeTarif = IsPoint[];
type CantonTarifs = Record<string, BaremeTarif>;
interface FiscalJson { cantons: Record<string, CantonTarifs> }

/**
 * Type de revenu pour un couple marié.
 *
 * - 'single' : un seul revenu (barème C — modèle traditionnel)
 * - 'dual'   : deux revenus (barème B — chaque conjoint taxé séparément,
 *              effet de splitting : impôt généralement inférieur)
 *
 * Défaut : 'single' (rétrocompatibilité).
 */
export type CoupleIncomeType = 'single' | 'dual';

// Chargement du JSON (import statique — Vite inclut dans le bundle)
// Utilisation de 'unknown' pour éviter l'inférence TypeScript sur 4.7 MB
import _fiscal from '../data/fiscalData2026.json';
const FISCAL = _fiscal as unknown as FiscalJson;

// ── Config ────────────────────────────────────────────────────────────────────

/**
 * Nombre maximum d'enfants supportés par chaque canton dans le fichier AFC.
 * Au-delà, on utilise le barème au plafond.
 */
export const MAX_CHILDREN_IS: Record<Canton, number> = {
  VS: 9,
  VD: 9,
  GE: 5,
  NE: 9,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Retourne le code barème AFC pour une situation et un nombre d'enfants donnés.
 *
 * - 'single'                        → préfixe A (personne seule)
 * - 'couple' + coupleIncomeType 'single' (défaut) → préfixe C (1 revenu)
 * - 'couple' + coupleIncomeType 'dual'             → préfixe B (2 revenus, splitting)
 *
 * Le suffixe numérique = enfants, plafonné au max du canton.
 * Le suffixe N = barème normal (revenus courants).
 *
 * @param situation         'single' | 'couple'
 * @param children          Nombre d'enfants à charge (≥ 0)
 * @param canton            Code canton : 'VS' | 'VD' | 'GE' | 'NE'
 * @param coupleIncomeType  'single' (1 revenu, défaut) | 'dual' (2 revenus)
 */
export function getBaremeCode(
  situation:         'single' | 'couple',
  children:          number,
  canton:            Canton,
  coupleIncomeType?: CoupleIncomeType,
): string {
  let prefix: string;
  if (situation === 'couple') {
    prefix = coupleIncomeType === 'dual' ? 'B' : 'C';
  } else {
    prefix = 'A';
  }
  const maxN = MAX_CHILDREN_IS[canton] ?? 9;
  const n    = Math.min(Math.max(0, Math.floor(children)), maxN);
  return `${prefix}${n}N`;
}

/**
 * Recherche dichotomique (floor lookup) dans un tableau trié par revenu croissant.
 *
 * Le barème IS est une fonction en escalier : pour un revenu m CHF/mois,
 * on utilise le taux de la plus grande entrée dont revenu ≤ m.
 * Retourne 0 si le revenu est inférieur à la première entrée (exonéré).
 */
function lookupRate(points: BaremeTarif, monthlyIncome: number): number {
  if (!points || points.length === 0) return 0;
  if (monthlyIncome < points[0].revenu)          return 0;          // sous le seuil → exonéré
  if (monthlyIncome >= points[points.length - 1].revenu)
    return points[points.length - 1].taux;                           // au-delà du max → last rate

  let lo = 0, hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (points[mid].revenu <= monthlyIncome) lo = mid;
    else hi = mid - 1;
  }
  return points[lo].taux;
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Retourne le taux effectif IS (0–1) pour un revenu mensuel brut donné.
 * Le taux inclut IFD + cantonal + communal (chef-lieu du canton).
 *
 * @param monthlyGrossIncome   Revenu mensuel brut CHF
 * @param canton               'VS' | 'VD' | 'GE' | 'NE'
 * @param bareme               Code AFC (ex: 'A0N', 'C1N')
 */
export function getIsRate(
  monthlyGrossIncome: number,
  canton:             Canton,
  bareme:             string,
): number {
  const cantonTarifs = FISCAL.cantons[canton];
  if (!cantonTarifs) return 0;
  const points = cantonTarifs[bareme];
  if (!points || points.length === 0) return 0;
  return lookupRate(points, monthlyGrossIncome);
}

/**
 * Calcule l'impôt annuel IS (CHF) et le taux effectif pour un revenu annuel brut.
 * Utile pour les calculs directs sans passer par getMarginalRate().
 *
 * @param coupleIncomeType  'single' (1 revenu, défaut) | 'dual' (2 revenus — barème B)
 */
export function getIsAnnualTax(
  annualGrossIncome: number,
  canton:            Canton,
  situation:         'single' | 'couple',
  children           = 0,
  coupleIncomeType?: CoupleIncomeType,
): { rate: number; taxChf: number; bareme: string } {
  const bareme  = getBaremeCode(situation, children, canton, coupleIncomeType);
  const monthly = annualGrossIncome / 12;
  const rate    = getIsRate(monthly, canton, bareme);
  return { rate, taxChf: Math.round(annualGrossIncome * rate), bareme };
}
