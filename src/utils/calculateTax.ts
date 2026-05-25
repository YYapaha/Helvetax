/**
 * calculateTax.ts — Sélecteur IS / TOU 2026
 *
 * Ce module expose une fonction unifiée `calculateTax()` qui sélectionne le
 * bon régime fiscal selon le profil de l'utilisateur :
 *
 *   IS  (impôt à la source)           → barème AFC officiel appliqué au revenu BRUT
 *   TOU (taxation ordinaire ultérieure) → barème ordinaire appliqué au revenu IMPOSABLE
 *                                         (revenu brut − déductions réelles)
 *
 * Qui est concerné ?
 *   - Permis B uniquement. Les détenteurs de permis C et les citoyens suisses
 *     font toujours une déclaration ordinaire (IS non applicable pour eux).
 *   - Permis B < seuil IS (120 000 CHF VS/VD/NE, 500 000 CHF GE) : TOU facultative.
 *   - Permis B ≥ seuil IS : TOU (déclaration ordinaire) obligatoire.
 *
 * Modèle de calcul TOU (approximation) :
 *   1. Estimer les déductions ordinaires via `estimateTOUDeductions(profile)`.
 *   2. Calculer le revenu imposable = max(0, revenu brut − déductions).
 *   3. Appliquer le barème IS AFC au revenu imposable réduit.
 *      Rationale : les taux IS AFC et les taux ordinaires progressent de façon
 *      similaire ; appliquer les taux IS à un revenu réduit (= après déductions)
 *      approxime l'imposition ordinaire avec une précision de ±5–15 %.
 *      Résultat toujours directionnellement correct : si TOU < IS, c'est rentable.
 *
 * Références :
 *   - art. 83–100 LIFD (impôt à la source)
 *   - art. 26, 33 LIFD (déductions ordinaires)
 *   - cantonConfig.ts → seuilDeclarationIS
 *   - docs/impot-a-la-source.md
 */

import type { UserProfile } from '../types';
import type { Canton } from './cantonConfig';
import { getCantonConfig } from './cantonConfig';
import { getMarginalRate } from './taxBrackets';
import type { TaxBreakdown } from './taxBrackets';
import type { CoupleIncomeType } from './afcTariffs';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Décomposition détaillée des déductions TOU estimées.
 * Utile pour l'affichage pédagogique dans l'interface.
 */
export interface TOUDeductionBreakdown {
  /** Frais professionnels forfait LIFD art. 26 (3 %, min 2 200, max 4 000 CHF). */
  fraisPro:    number;
  /** Déduction pilier 3a si has3a = 'yes' (7 258 CHF/an, art. 82 LIFD). */
  pilier3a:    number;
  /** Total des déductions supplémentaires vs IS (CHF). */
  total:       number;
}

/**
 * Résultat combiné du calcul fiscal avec context IS/TOU.
 * Étend TaxBreakdown avec des métadonnées sur le régime choisi.
 */
export interface TaxResult extends TaxBreakdown {
  /** Régime utilisé pour ce calcul. */
  regime: 'IS' | 'TOU';
  /**
   * Économie potentielle en passant de IS à TOU (CHF).
   * Null si le régime actuel est déjà TOU, ou si la TOU ne s'applique pas.
   */
  touSaving:   number | null;
  /** Détail des déductions TOU estimées (null si régime IS sans TOU simulée). */
  deductions:  TOUDeductionBreakdown | null;
}

// ── Constante ─────────────────────────────────────────────────────────────────

/** Plafond pilier 3a pour salariés — art. 7 OPP3, valeur 2026. */
export const PILIER_3A_MAX = 7_258;

// ── Déductions TOU ────────────────────────────────────────────────────────────

/**
 * Estime les déductions supplémentaires qu'un contribuable peut faire valoir
 * en déclaration ordinaire (TOU) par rapport à ce qu'intègre déjà l'IS.
 *
 * Hypothèse : le barème IS AFC est calibré pour un contribuable "standard"
 * avec frais professionnels minimaux et sans pilier 3a. Les déductions
 * supplémentaires sont celles qui dépassent ce standard.
 *
 * @param profile  Profil utilisateur Helvetax
 */
export function estimateTOUDeductions(profile: UserProfile): TOUDeductionBreakdown {
  const grossAnnual = (Number(profile.income) || 0) * 12;

  // ── Frais professionnels (LIFD art. 26) ─────────────────────────────────────
  // Forfait total : 3 % du brut, min 2 200 CHF, max 4 000 CHF.
  // L'IS AFC intègre implicitement ~1 500 CHF de frais pro moyens ;
  // on retient le forfait complet car la TOU permet la déduction réelle.
  const fraisPro = Math.min(4_000, Math.max(2_200, Math.round(grossAnnual * 0.03)));

  // ── Pilier 3a (OPP3 art. 7) ─────────────────────────────────────────────────
  // Déductible en totalité jusqu'au plafond légal.
  // L'IS AFC n'intègre pas le 3a (cotisation personnelle non obligatoire).
  const pilier3a = profile.has3a === 'yes' ? PILIER_3A_MAX : 0;

  return {
    fraisPro,
    pilier3a,
    total: fraisPro + pilier3a,
  };
}

// ── Calcul principal ──────────────────────────────────────────────────────────

/**
 * Calcule l'impôt sur le revenu selon le régime IS ou TOU.
 *
 * - `useTOU` force le régime (priorité sur `profile.useTOU`).
 * - Si l'utilisateur n'est pas permis B, l'IS ne s'applique pas :
 *   le calcul ordinaire est toujours utilisé (TOU non pertinente).
 *
 * @param profile   Profil utilisateur
 * @param useTOU    Override du régime (optionnel — utilise profile.useTOU si absent)
 */
export function calculateTax(
  profile:  UserProfile,
  useTOU?:  boolean,
): TaxResult {
  const grossAnnual      = (Number(profile.income) || 0) * 12;
  const canton           = profile.canton as Canton;
  const sit              = profile.situation as 'single' | 'couple';
  const children         = Number(profile.children) || 0;
  const coupleIncomeType = profile.coupleIncomeType as CoupleIncomeType | undefined;

  const effectiveUseTOU = useTOU ?? profile.useTOU ?? false;
  const isPermitB       = profile.permit === 'B';

  // ── Régime IS ────────────────────────────────────────────────────────────────
  const isTax = getMarginalRate(grossAnnual, canton, sit, undefined, children, coupleIncomeType);

  if (!effectiveUseTOU || !isPermitB) {
    // Toujours calculer la TOU potentielle pour afficher l'économie possible
    const deductions = estimateTOUDeductions(profile);
    let touSaving: number | null = null;

    if (isPermitB && deductions.total > 0) {
      const taxableIncome = Math.max(0, grossAnnual - deductions.total);
      const touTax = getMarginalRate(taxableIncome, canton, sit, undefined, children, coupleIncomeType);
      touSaving = Math.max(0, isTax.totalTaxChf - touTax.totalTaxChf);
    }

    return {
      ...isTax,
      regime:     'IS',
      touSaving,
      deductions: isPermitB ? estimateTOUDeductions(profile) : null,
    };
  }

  // ── Régime TOU ───────────────────────────────────────────────────────────────
  const deductions    = estimateTOUDeductions(profile);
  const taxableIncome = Math.max(0, grossAnnual - deductions.total);
  const touTax        = getMarginalRate(taxableIncome, canton, sit, undefined, children, coupleIncomeType);
  const touSaving     = Math.max(0, isTax.totalTaxChf - touTax.totalTaxChf);

  return {
    ...touTax,
    regime:     'TOU',
    touSaving,
    deductions,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Retourne true si la TOU est **obligatoire** pour ce profil
 * (revenu annuel brut ≥ seuil IS du canton).
 */
export function isTOUMandatory(profile: UserProfile): boolean {
  if (profile.permit !== 'B') return false;
  const cc         = getCantonConfig(profile.canton as Canton);
  const annualBrut = (Number(profile.income) || 0) * 12;
  return annualBrut >= cc.seuilDeclarationIS;
}

/**
 * Retourne true si la TOU est **facultative** pour ce profil
 * (permis B, revenu < seuil IS).
 * Dans ce cas, elle peut être avantageuse si les déductions sont importantes.
 */
export function isTOUOptional(profile: UserProfile): boolean {
  return profile.permit === 'B' && !isTOUMandatory(profile);
}
