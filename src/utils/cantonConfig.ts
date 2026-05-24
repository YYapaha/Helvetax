export type Canton = 'VS' | 'VD' | 'GE' | 'NE';

export interface CantonConfig {
  name: string;
  // Declaration deadline
  declarationMonth: number;
  declarationDay: number;
  declarationLabel: string;        // e.g. "31 mars"
  declarationExtension: string;    // prolongation info
  declarationSource: string;       // official URL
  // TOU (Taxé Ordinairement Ultérieurement) for Permis B
  touMonth: number;
  touDay: number;
  touLabel: string;
  touSource: string;
  /**
   * Seuil de revenu brut annuel (CHF) au-delà duquel la déclaration ordinaire
   * est OBLIGATOIRE pour les personnes imposées à la source (permis B).
   * En-dessous : IS applicable, TOU facultative (art. 99a LIFD).
   * GE = 500 000 CHF (exception cantonale) — VS/VD/NE = 120 000 CHF.
   */
  seuilDeclarationIS: number;
  // LAMal subsidies
  subsidesInfo: string;            // how to get them
  subsidesURL: string;
  subsidesDeadline: string;        // when to apply / check
  // Tax authority
  taxAuthority: string;            // name of the cantonal tax office
  taxURL: string;
  // Coefficient communal range (indicative)
  coefficientNote: string;

  // ── Impôt sur la fortune ──────────────────────────────────────────────────
  /**
   * Abattement personnel sur la fortune nette (CHF) — personne seule.
   * La fortune imposable = max(0, fortune nette − exonérationFortune).
   * Source : lois fiscales cantonales 2026.
   */
  fortuneExoneration: number;
  /**
   * Abattement personnel pour couple marié / partenariat enregistré.
   * Généralement le double du montant célibataire.
   */
  fortuneExonerationCouple: number;
  /**
   * Coefficient communal appliqué à l'impôt cantonal de base sur la fortune.
   * Pour GE : 1.00 (taux uniforme, communal déjà inclus dans le barème).
   * Pour VS : 1.30 (Sion, même coefficient que pour le revenu).
   * Pour VD : 1.795 (Lausanne = cantonal × 1.795, car commune = 79.5% du cantonal).
   * Pour NE : 1.80 (Neuchâtel = cantonal × 1.80, car commune = 80% du cantonal).
   */
  fortuneCommunalCoeff: number;
  /**
   * Plafond de l'impôt cantonal + communal sur la fortune, exprimé en ‰ de
   * la fortune nette. 0 = pas de plafond. VD = 10 (soit 1% de la fortune).
   */
  fortuneCapPermille: number;
}

export const CANTON_CONFIG: Record<Canton, CantonConfig> = {
  VS: {
    name: 'Valais',
    declarationMonth: 3,
    declarationDay: 31,
    declarationLabel: '31 mars',
    declarationExtension: 'Prolongation sur demande écrite avant le 31 mars — généralement accordée jusqu\'à fin juin',
    declarationSource: 'https://www.vs.ch/web/scc/impots',
    touMonth: 3,
    touDay: 31,
    touLabel: '31 mars',
    touSource: 'https://www.vs.ch/web/scc/impots-sourciers',
    seuilDeclarationIS: 120_000,
    subsidesInfo: 'Notification automatique de la commune fin février — vérifier sur le portail AVS Valais. Pas de demande à faire, c\'est automatique si tu es éligible.',
    subsidesURL: 'https://www.avsvalais.ch',
    subsidesDeadline: 'Notification automatique fin février',
    taxAuthority: 'Service cantonal des contributions (SCC)',
    taxURL: 'https://www.vs.ch/web/scc',
    coefficientNote: 'Le coefficient varie par commune : Sion 1.30, Sierre 1.35, Monthey 1.45, Martigny 1.40. Vérifier sur vsfisco.ch.',
    fortuneExoneration: 25_000,         // art. 58 LF-VS 2026 — célibataire
    fortuneExonerationCouple: 50_000,   // art. 58 LF-VS 2026 — couple
    fortuneCommunalCoeff: 1.30,         // chef-lieu : Sion
    fortuneCapPermille: 0,              // pas de plafond en Valais
  },
  VD: {
    name: 'Vaud',
    declarationMonth: 3,
    declarationDay: 15,
    declarationLabel: '15 mars',
    declarationExtension: 'Prolongation gratuite jusqu\'au 31 mai en faisant la demande en ligne avant le 15 mars. Prolongation payante (CHF 60) jusqu\'au 30 juin.',
    declarationSource: 'https://www.vd.ch/themes/etat-droit-finances/impots/impots-personnes-physiques',
    touMonth: 3,
    touDay: 31,
    touLabel: '31 mars',
    touSource: 'https://www.vd.ch/themes/etat-droit-finances/impots/impots-sourciers',
    seuilDeclarationIS: 120_000,
    subsidesInfo: 'Demande active requise via le Service de l\'assurance maladie (SAM). Contrairement à d\'autres cantons, ce n\'est pas automatique — tu dois faire la demande chaque année.',
    subsidesURL: 'https://www.vd.ch/themes/sante-et-social/assurance-maladie/subsides-lca',
    subsidesDeadline: 'Demande à faire avant le 30 septembre pour l\'année suivante',
    taxAuthority: 'Direction générale de la fiscalité (DGF)',
    taxURL: 'https://www.vd.ch/themes/etat-droit-finances/impots',
    coefficientNote: 'Coefficient fiscal vaudois : Lausanne 0.795, Nyon 0.655, Renens 0.795. Vérifier sur le simulateur fiscal VD.',
    fortuneExoneration: 59_400,           // art. 50 LICD-VD 2026 (indexé) — célibataire
    fortuneExonerationCouple: 118_800,    // art. 50 LICD-VD 2026 — couple
    fortuneCommunalCoeff: 1.795,          // Lausanne : impôt communal = 79.5% du cantonal → total = 1.795 × cantonal
    fortuneCapPermille: 10,               // art. 52 LICD-VD : plafond 10‰ (= 1%) de la fortune nette
  },
  GE: {
    name: 'Genève',
    declarationMonth: 3,
    declarationDay: 31,
    declarationLabel: '31 mars',
    declarationExtension: 'Prolongation gratuite jusqu\'au 30 juin en faisant la demande en ligne avant le 31 mars sur ge.ch/impots.',
    declarationSource: 'https://www.ge.ch/impots',
    touMonth: 3,
    touDay: 31,
    touLabel: '31 mars',
    touSource: 'https://www.ge.ch/impots/sourciers',
    seuilDeclarationIS: 500_000,  // exception cantonale genevoise (art. 33 RIPS-GE)
    subsidesInfo: 'Via le Service des prestations complémentaires (SPC). Calculateur en ligne disponible. Demande à faire si pas encore bénéficiaire.',
    subsidesURL: 'https://www.ge.ch/spc',
    subsidesDeadline: 'Demande en continu, réévaluation annuelle automatique',
    taxAuthority: 'Administration fiscale cantonale (AFC)',
    taxURL: 'https://www.ge.ch/impots',
    coefficientNote: 'Genève n\'a pas de coefficient communal — le taux cantonal est uniforme. Avantage : pas de variation selon la commune.',
    fortuneExoneration: 25_000,           // LIPP-GE art. 56 — célibataire
    fortuneExonerationCouple: 50_000,     // LIPP-GE art. 56 — couple
    fortuneCommunalCoeff: 1.00,           // taux uniforme GE, communal déjà inclus dans le barème
    fortuneCapPermille: 0,                // pas de plafond à GE
  },
  NE: {
    name: 'Neuchâtel',
    declarationMonth: 3,
    declarationDay: 31,
    declarationLabel: '31 mars',
    declarationExtension: 'Prolongation sur demande avant le 31 mars — généralement accordée jusqu\'à fin mai.',
    declarationSource: 'https://www.ne.ch/autorites/DFS/SCCOI/Pages/accueil.aspx',
    touMonth: 3,
    touDay: 31,
    touLabel: '31 mars',
    touSource: 'https://www.ne.ch/autorites/DFS/SCCOI/Pages/accueil.aspx',
    seuilDeclarationIS: 120_000,
    subsidesInfo: 'Via l\'Office de l\'assurance-invalidité et des prestations complémentaires (OAI/PC). Demande à formuler auprès du service cantonal.',
    subsidesURL: 'https://www.ne.ch/autorites/DFS/OAS/subsides/Pages/accueil.aspx',
    subsidesDeadline: 'Demande annuelle, réévaluation selon revenu',
    taxAuthority: 'Service cantonal des contributions (SCCOI)',
    taxURL: 'https://www.ne.ch/autorites/DFS/SCCOI',
    coefficientNote: 'Coefficient communal neuchâtelois : La Chaux-de-Fonds 86%, Neuchâtel 80%, Le Locle 91%. Vérifier sur le simulateur cantonal.',
    fortuneExoneration: 50_000,           // LI-NE — seuil d'imposition célibataire
    fortuneExonerationCouple: 100_000,    // LI-NE — couple
    fortuneCommunalCoeff: 1.80,           // Neuchâtel-Ville : communal = 80% du cantonal → total = 1.80 × cantonal
    fortuneCapPermille: 0,                // pas de plafond à NE
  },
};

export function getCantonConfig(canton: Canton): CantonConfig {
  // Direct lookup — all Canton keys are guaranteed in CANTON_CONFIG
  return CANTON_CONFIG[canton];
}
