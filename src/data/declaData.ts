import type { UserProfile } from '../types';
import type {
  DeclaKPI, IntroCard, DocItem,
  Badge, FieldItem, SimInputs, SimResult, SubmitStepItem,
} from '../types/decla';
import { getMarginalRateSimple } from '../utils/taxBrackets';
import { getCantonConfig } from '../utils/cantonConfig';
import type { Canton } from '../utils/cantonConfig';

// ── Helpers internes ──────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('fr-CH');
}

function getMarginalRate(annualIncome: number, canton: Canton = 'VS', situation = 'single'): number {
  return getMarginalRateSimple(annualIncome, canton, situation);
}

function badge(variant: Badge['variant'], text: string): Badge {
  return { variant, text };
}

interface ProfileDerived {
  annualIncome: number;
  marginalRate: number;
  isPermitB: boolean;
  conjointC: boolean;
  isOwner: boolean;
  isSelf: boolean;
  isCouple: boolean;
  children: number;
  has3a: boolean;
  canton: Canton;
  /** Seuil IS du canton (120k VS/VD/NE · 500k GE) */
  seuilDeclarationIS: number;
  /** true si revenu ≥ seuil → déclaration ordinaire obligatoire pour permis B */
  isAboveSeuil: boolean;
}

function derive(p: UserProfile): ProfileDerived {
  const annualIncome = (p.income ?? 0) * 12;
  const cc           = getCantonConfig(p.canton);
  const isPermitB    = p.permit === 'B' || p.permit === 'L';
  return {
    annualIncome,
    marginalRate:      getMarginalRate(annualIncome, p.canton ?? 'VS', p.situation ?? 'single'),
    isPermitB,
    conjointC:         p.conjoint_permit === 'C' || p.conjoint_permit === 'CH',
    isOwner:           p.housing === 'owner' || p.housing === 'owner_rental',
    isSelf:            p.activity === 'self' || p.activity === 'both',
    isCouple:          p.situation === 'couple',
    children:          p.children ?? 0,
    has3a:             p.has3a === 'yes',
    canton:            p.canton,
    seuilDeclarationIS: cc.seuilDeclarationIS,
    isAboveSeuil:      isPermitB && annualIncome >= cc.seuilDeclarationIS,
  };
}

// ── KPIs (section Intro) ──────────────────────────────────────────────────────

export function getKPIs(p: UserProfile): DeclaKPI[] {
  const { annualIncome, marginalRate, isPermitB, conjointC, has3a,
          isCouple, isOwner, children, isAboveSeuil } = derive(p);

  // Estimation du remboursement possible
  const gain3a        = has3a ? Math.round(7_258 * marginalRate) : 0;
  const gainTransport = Math.round(3_000 * marginalRate);
  const gainRepas     = Math.round(3_200 * marginalRate);
  const gainAssur     = Math.round((isCouple ? 5_200 : 2_600) * marginalRate * 0.5);
  const gainGarde     = children > 0 ? Math.round(3_060 * children * marginalRate) : 0;
  const estMin = Math.round((gainTransport + gainRepas + gainAssur) * 0.6);
  const estMax = gain3a + gainTransport + gainRepas + gainAssur + gainGarde;

  // Nombre de documents
  const docCount = 2
    + (has3a ? 1 : 0)
    + (isOwner ? 1 : 0)
    + (children > 0 ? 1 : 0)
    + (p.activity === 'self' ? 1 : 0)
    + 2; // bancaire + médical optionnels toujours listés

  // Deadline affichée dans le KPI "Deadline"
  const deadline = isPermitB && !conjointC
    ? (isAboveSeuil ? 'Décla obligatoire' : 'TOU facultative')
    : '31 mars 2026';

  return [
    { value: deadline,                                          label: 'Deadline',                color: 'danger'  },
    { value: `+${fmt(estMin)}–${fmt(estMax)}`,                 label: 'Remboursement estimé CHF', color: 'success' },
    { value: String(docCount),                                  label: 'Documents à rassembler',  color: 'default' },
    { value: '~45 min',                                         label: 'Durée estimée',            color: 'default' },
  ];
}

// ── Intro cards ───────────────────────────────────────────────────────────────

export function getIntroCards(p: UserProfile): IntroCard[] {
  const { isPermitB, conjointC, isAboveSeuil, seuilDeclarationIS, canton } = derive(p);
  const fmtSeuil = seuilDeclarationIS.toLocaleString('fr-CH');

  // Outil de déclaration selon le canton
  const cantonTool = canton === 'GE' ? 'GeTax (ge.ch/impots)'
    : canton === 'VD' ? 'VaudTax (vd.ch/impots)'
    : canton === 'NE' ? 'NeO (ne.ch/impots)'
    : 'VStax (vs.ch/scc-vstax)';

  const vstaxCard: IntroCard = {
    type:  'info',
    ref:   `Logiciel officiel ${canton}`,
    name:  `${cantonTool} — Télécharger et installer`,
    where: `Télécharge depuis le site cantonal. Lance le logiciel et importe l'année précédente si disponible.`,
    tip:   'Organise ta déclaration en sections : Bases → Revenus → Déductions → Fortune. Sauvegarde régulièrement.',
  };

  let situationCard: IntroCard;
  if (isPermitB && !conjointC && isAboveSeuil) {
    // Revenu ≥ seuil → déclaration OBLIGATOIRE
    situationCard = {
      type:  'important',
      ref:   'Situation fiscale — Action obligatoire',
      name:  `Permis B · revenu > ${fmtSeuil} CHF → Déclaration ordinaire obligatoire`,
      where: `Ton revenu annuel dépasse le seuil d'assujettissement IS du canton (${fmtSeuil} CHF). Tu dois déposer une déclaration ordinaire avant le 31 mars, comme tout contribuable C/CH.`,
      tip:   'Toutes les déductions sont accessibles : 3a, frais pro, frais médicaux, dons. L\'impôt retenu à la source sera déduit du montant final dû.',
    };
  } else if (isPermitB && !conjointC && !isAboveSeuil) {
    // Revenu < seuil → IS applicable, TOU FACULTATIVE
    situationCard = {
      type:  'autofill',
      ref:   'Situation fiscale — IS · TOU facultative',
      name:  `Permis B · revenu < ${fmtSeuil} CHF → Imposé à la source (TOU optionnelle)`,
      where: `Tu es en dessous du seuil d'assujettissement (${fmtSeuil} CHF/an). L'impôt à la source est définitif. Tu peux demander une TOU facultative avant le 31 mars si tu as des déductions importantes.`,
      tip:   `TOU recommandée si tu verses dans le 3a, as des frais pro élevés ou des frais médicaux importants. Gain typique : 500–3'000 CHF. Sans TOU : aucune démarche à faire.`,
    };
  } else if (isPermitB && conjointC) {
    situationCard = {
      type:  'autofill',
      ref:   'Situation fiscale',
      name:  'Permis B + conjoint C/CH → Taxation ordinaire automatique',
      where: 'Tu passes automatiquement en taxation ordinaire. Déclaration via VStax classique. Toutes les déductions accessibles.',
      tip:   'Informe ton employeur du changement de barème dès le 1er du mois suivant le mariage.',
    };
  } else {
    situationCard = {
      type:  'autofill',
      ref:   'Situation fiscale',
      name:  `Permis ${p.permit} → Déclaration ordinaire classique`,
      where: 'Déclaration directement via VStax. Toutes les déductions accessibles sans démarche préalable.',
      tip:   'Suis ce guide section par section. Toutes les données sont pré-remplies avec ton profil.',
    };
  }

  return [vstaxCard, situationCard];
}

// ── Documents ─────────────────────────────────────────────────────────────────

export function getDocuments(p: UserProfile): DocItem[] {
  const { has3a, isOwner, isSelf, children } = derive(p);

  const docs: DocItem[] = [
    {
      id:        'certificat-salaire',
      title:     'Certificat de salaire 2025',
      where:     'Envoyé par ton employeur en janv.–févr. Demande-le si pas reçu avant fin février.',
      mandatory: true,
    },
    {
      id:        'releve-bancaire',
      title:     'Relevé annuel bancaire (intérêts)',
      where:     'Téléchargeable sur e-banking. Couvre comptes épargne, compte titres et dividendes.',
      mandatory: false,
    },
    {
      id:        'factures-medicales',
      title:     'Factures médicales non remboursées',
      where:     'Dentiste, lunettes, pharmacie sur ordonnance, physio. Attestation annuelle si possible.',
      mandatory: false,
    },
    {
      id:        'formation',
      title:     'Justificatifs formation continue',
      where:     'Factures de cours + certificats de participation. Formation liée à l\'emploi actuel.',
      mandatory: false,
    },
    {
      id:        'dons',
      title:     'Attestations fiscales de dons (label Zewo)',
      where:     'Envoyées janv.–févr. par les organisations. Téléchargeable sur leur site.',
      mandatory: false,
    },
    {
      id:        'cotisations-syndicat',
      title:     'Cotisations syndicat / association professionnelle',
      where:     'Demande une attestation annuelle à ton syndicat (Unia, Syna, Travail.Suisse…).',
      mandatory: false,
    },
  ];

  if (has3a) {
    docs.splice(1, 0, {
      id:        'attestation-3a',
      title:     'Attestation pilier 3a 2025',
      where:     'VIAC / finpension / banque → espace client ou courrier janvier. Montant exact requis.',
      mandatory: true,
    });
  }

  if (children > 0) {
    docs.push({
      id:        'garde-enfants',
      title:     `Factures garde d'enfants (${children} enfant${children > 1 ? 's' : ''})`,
      where:     'Crèche, garderie, parascolaire, maman de jour. Demande une attestation annuelle à la crèche.',
      mandatory: true,
    });
  }

  if (isOwner) {
    docs.push({
      id:        'interets-hypothecaires',
      title:     'Attestation intérêts hypothécaires',
      where:     'Ta banque envoie un relevé annuel en janvier. Aussi disponible sur e-banking.',
      mandatory: true,
    });
  }

  if (isSelf) {
    docs.push({
      id:        'factures-pro',
      title:     'Factures charges professionnelles (bureau, véhicule, SaaS)',
      where:     'Toutes les factures avec mention de l\'objet professionnel clairement indiqué.',
      mandatory: true,
    });
  }

  return docs;
}

// ── Revenus ───────────────────────────────────────────────────────────────────

export function getRevenus(p: UserProfile): FieldItem[] {
  const { annualIncome, isOwner } = derive(p);

  const items: FieldItem[] = [
    {
      id:      'f-salaire',
      ref:     'VStax — Page 2, Revenus',
      name:    'Salaire brut annuel',
      type:    'mandatory',
      badges:  [badge('mandatory', 'Obligatoire'), badge('autofill', 'Depuis certificat salaire')],
      amount:  `${fmt(annualIncome)} CHF`,
      amountPositive: false,
      profile: `Ton estimation : **${fmt(annualIncome)} CHF** (${fmt(p.income ?? 0)} CHF/mois × 12). Ajuste si bonus ou salaire variable en 2025.`,
      where:   'Certificat de salaire 2025, ligne 1 "Salaire brut". Reporter le montant exactement — même si déjà prélevé à la source.',
      tip:     'Si plusieurs employeurs en 2025 : additionne tous les certificats. Bonus, 13e salaire et participations sont inclus dans le total du certificat.',
      explain: 'Le salaire brut est la base de tout le calcul. Il doit être identique au total de ton certificat (ligne 1). Les avantages en nature (voiture de fonction) figurent ligne 2 et doivent aussi être inclus.',
    },
    {
      id:      'f-interets',
      ref:     'VStax — Page 2, Fortune mobilière',
      name:    'Intérêts et dividendes suisses',
      type:    'optional',
      badges:  [badge('optional', 'Si applicable'), badge('important', 'Récupère les 35% !')],
      where:   'Relevé annuel bancaire (janvier 2026). Intérêts comptes épargne, dividendes actions suisses, obligations.',
      tip:     '35% est retenu à la source par l\'État sur ces revenus. En les déclarant, tu récupères ces 35% intégralement. Ne pas déclarer = perdre cet argent définitivement. ETF irlandais (VWCE) → pas d\'impôt anticipé.',
      explain: 'L\'impôt anticipé (35%) est retenu automatiquement sur tes revenus de capitaux suisses. En les déclarant dans VStax, tu récupères la totalité. À déclarer même si les montants semblent faibles.',
    },
  ];

  if (isOwner) {
    items.push({
      id:      'f-val-loc',
      ref:     'VStax — Page 2, Revenus immobiliers',
      name:    'Valeur locative (propriétaire — jusqu\'en 2028)',
      type:    'important',
      badges:  [badge('important', 'Propriétaire'), badge('mandatory', 'Obligatoire')],
      where:   'Normalement pré-remplie par le canton dans VStax. Basée sur la valeur officielle de ton bien.',
      tip:     'Revenu fictif imposable — mais tu déduis en contrepartie les intérêts hypothécaires et frais d\'entretien (page Déductions). Dès 2029 : valeur locative supprimée (vote populaire sept. 2025).',
      explain: 'La valeur locative = loyer théorique de ton bien (~70% du loyer marché). Elle augmente ton revenu imposable, MAIS elle ouvre droit aux déductions propriétaire qui compensent souvent largement.',
    });
  }

  return items;
}

// ── Déductions ────────────────────────────────────────────────────────────────

export function getDeductions(p: UserProfile): FieldItem[] {
  const {
    annualIncome, marginalRate, has3a,
    isCouple, isOwner, isSelf, children,
  } = derive(p);

  const assurForfait = (isCouple ? 5_200 : 2_600) + children * 700;
  const medicalThreshold = Math.round(annualIncome * 0.05);

  const items: FieldItem[] = [
    // ── 3a ──────────────────────────────────────────────────────────────────
    {
      id:      'fd-3a',
      ref:     'VStax — Déductions, Prévoyance',
      name:    has3a ? 'Cotisations pilier 3a 2025' : '3a non applicable (pas encore ouvert)',
      type:    has3a ? 'gain' : 'optional',
      badges:  [
        badge('important', 'Déduction n°1'),
        badge('autofill',  `Économie ~${fmt(Math.round(7_258 * marginalRate))} CHF`),
      ],
      amount:        has3a ? 'Jusqu\'à 7\'258 CHF' : '—',
      amountPositive: true,
      profile: has3a
        ? `Montant à saisir : **ton versement exact 2025** (sur attestation). Plafond salarié : 7\'258 CHF. Indépendant sans LPP : jusqu\'à 36\'288 CHF.`
        : `Tu n'as pas encore de 3a. Cette déduction n'est pas applicable pour 2025. **Ouvre un compte chez VIAC ou finpension dès maintenant pour 2026 !**`,
      where:   'Attestation de ta banque 3a (VIAC, finpension…) envoyée en janvier. Montant exact sur l\'attestation.',
      tip:     'Plafond 2025 : 7\'258 CHF (salarié) ou 36\'288 CHF (indépendant sans LPP). Si plusieurs comptes 3a, additionne tous les montants.',
      explain: `Le pilier 3a est la déduction fiscale la plus puissante en Suisse. Chaque franc versé réduit ton revenu imposable. Avec un taux marginal de ~${Math.round(marginalRate * 100)}%, 7\'258 CHF versés = ~${fmt(Math.round(7_258 * marginalRate))} CHF d\'impôts économisés.`,
    },

    // ── Transport ────────────────────────────────────────────────────────────
    {
      id:      'fd-transport',
      ref:     'VStax — Déductions, Frais pro, Transport',
      name:    'Frais de transport domicile-travail',
      type:    'gain',
      badges:  [badge('important', 'Déduction clé'), badge('autofill', 'Sans justificatifs')],
      amount:  'Max 3\'000 CHF (VS)',
      amountPositive: true,
      profile: `Calcule ta distance quotidienne × 220 jours × 0.70 CHF. **Plafond cantonal Valais : 3\'000 CHF/an.** Ex : 10 km A/R → 1\'540 CHF. 20 km A/R → 2\'860 CHF.`,
      where:   'Pas de justificatif pour le forfait. Tu indiques ta distance dans VStax. Formule : km A/R × 220 jours × 0.70 CHF.',
      tip:     'Si transports publics : déduis le coût réel de l\'abonnement (CFF / AG : montant exact). Vélo : forfait 700 CHF/an. Prends la méthode la plus avantageuse.',
      explain: 'Tu choisis la méthode la plus avantageuse : forfait km (0.70 CHF/km) ou coût réel de l\'abonnement TP. Plafonné à 3\'000 CHF cantonal / 3\'300 CHF fédéral.',
    },

    // ── Repas ────────────────────────────────────────────────────────────────
    {
      id:      'fd-repas',
      ref:     'VStax — Déductions, Frais pro, Repas',
      name:    'Frais de repas hors domicile',
      type:    'gain',
      badges:  [badge('autofill', 'Forfait 15 CHF/jour'), badge('autofill', 'Sans justificatifs')],
      amount:  `+${fmt(Math.round(3_200 * marginalRate))} CHF`,
      amountPositive: true,
      profile: `**15 CHF/jour × 220 jours = 3\'300 CHF → plafonné à 3\'200 CHF/an.** Économie estimée : ~${fmt(Math.round(3_200 * marginalRate))} CHF.`,
      where:   'Tu coches dans VStax que tu prends tes repas hors domicile. Pas de tickets à conserver.',
      tip:     'Pas de cantine gratuite → 15 CHF/jour. Cantine subventionnée → 7.50 CHF/jour. Cantine totalement gratuite → 0 CHF. Cumulable avec les frais de transport.',
      explain: 'Forfait automatique dans VStax. Aucun ticket de restaurant à garder. Il suffit de confirmer que tu ne rentres pas déjeuner et qu\'il n\'y a pas de cantine gratuite.',
    },

    // ── Formation ────────────────────────────────────────────────────────────
    {
      id:      'fd-formation',
      ref:     'VStax — Déductions, Frais pro, Formation',
      name:    'Frais de formation et perfectionnement professionnel',
      type:    'optional',
      badges:  [badge('optional', 'Si applicable'), badge('gain', 'Jusqu\'à 12\'550 CHF')],
      where:   'Factures de formation + certificats de participation. Conserve tout avec description de la formation.',
      tip:     'Conditions : formation liée à l\'emploi actuel (pas pour changer de métier). Plafond Valais 2025 : 12\'550 CHF.',
      explain: 'Déductibles : cours, certifications, langues utilisées au travail, conférences, livres professionnels. Non déductibles : hobbies, reconversion professionnelle, permis de conduire (sauf usage pro).',
    },

    // ── Médical ──────────────────────────────────────────────────────────────
    {
      id:      'fd-medical',
      ref:     'VStax — Déductions, Frais de santé',
      name:    `Frais médicaux non remboursés (seuil 5% = ${fmt(medicalThreshold)} CHF)`,
      type:    'optional',
      badges:  [badge('optional', 'Si applicable'), badge('profile', `Seuil : ${fmt(medicalThreshold)} CHF`)],
      profile: `Ton seuil 5% : **${fmt(medicalThreshold)} CHF**. Tu ne déduis que le montant *au-delà* de ce seuil.`,
      where:   'Dentiste, lunettes, médicaments prescrits, physio sur ordonnance, franchise + quote-part LAMal.',
      tip:     'Concentre plusieurs soins sur une même année fiscale pour dépasser le seuil. Gros soins dentaires prévus ? Planifie-les en 2025 ou 2026 pour maximiser l\'impact.',
      explain: 'Déductibles (si > 5% du revenu) : dentiste, orthodontiste, lunettes/lentilles, médicaments prescrits, franchise + quote-part LAMal, physio sur ordonnance. Non déductibles : cosmétique, vitamines libres.',
    },

    // ── Assurances ───────────────────────────────────────────────────────────
    {
      id:      'fd-assurances',
      ref:     'VStax — Déductions, Primes d\'assurance',
      name:    'Primes d\'assurance (forfait automatique)',
      type:    'gain',
      badges:  [badge('autofill', 'Auto-calculé VStax'), badge('autofill', 'Sans justificatifs')],
      amount:  `${fmt(assurForfait)} CHF`,
      amountPositive: true,
      profile: `Forfait pour toi : **${fmt(assurForfait)} CHF** (${isCouple ? 'couple : 5\'200' : 'célibataire : 2\'600'} CHF${children > 0 ? ` + ${children} × 700 CHF enfants` : ''}).`,
      where:   'Forfait automatique dans VStax selon ta situation familiale. Couvre LAMal, assurance vie, RC.',
      tip:     'Ce forfait est pré-rempli. Si tes primes réelles sont plus élevées (assurance vie importante), tu peux déduire les frais réels avec justificatifs.',
      explain: 'Forfait standard 2025 Valais. Aucun document à fournir. Vérifier simplement que le montant pré-rempli correspond à ta situation dans VStax.',
    },

    // ── Dons ─────────────────────────────────────────────────────────────────
    {
      id:      'fd-dons',
      ref:     'VStax — Déductions, Libéralités',
      name:    'Dons à organisations d\'utilité publique (label Zewo)',
      type:    'optional',
      badges:  [badge('optional', 'Si applicable'), badge('gain', 'Jusqu\'à 20% du revenu')],
      where:   'Attestations fiscales des organisations (janv.–févr.). Minimum 100 CHF/an total.',
      tip:     'Organisations reconnues : UNICEF, Croix-Rouge, Caritas, WWF, Pro Natura. Vérifie le label Zewo sur zewo.ch. Les dons par virement sont valables avec attestation.',
      explain: 'Déductibles jusqu\'à 20% du revenu net. Joins l\'attestation fiscale à ta déclaration. Les dons par TWINT/virement sont valables si tu obtiens une attestation officielle.',
    },

    // ── Titres ───────────────────────────────────────────────────────────────
    {
      id:      'fd-titres',
      ref:     'VStax — Déductions, Fortune mobilière',
      name:    'Frais de gestion de titres (forfait 1.5‰)',
      type:    'optional',
      badges:  [badge('autofill', 'Sans justificatifs'), badge('optional', 'Si portefeuille titres')],
      where:   'Section "Titres et placements". Tu indiques la valeur totale au 31.12.2025. VStax calcule le forfait.',
      tip:     'Exemple : 50\'000 CHF de portefeuille → 75 CHF de déduction. 100\'000 CHF → 150 CHF. Si frais réels IBKR plus élevés, déclare les frais réels avec relevé annuel.',
      explain: 'Le forfait couvre custody, courtage, frais de gestion. S\'applique même avec IBKR ou Trading 212. Coche "déduction forfaitaire" dans VStax, aucun justificatif requis.',
    },
  ];

  // ── Garde d'enfants ────────────────────────────────────────────────────────
  if (children > 0) {
    items.splice(6, 0, {
      id:      'fd-garde',
      ref:     'VStax — Déductions, Frais de garde tiers',
      name:    `Frais de garde d'enfants par des tiers (${children} enfant${children > 1 ? 's' : ''})`,
      type:    'gain',
      badges:  [badge('important', `${children} enfant(s)`), badge('mandatory', 'Factures requises')],
      amount:  `Max ${fmt(3_060 * children)} CHF (VS)`,
      amountPositive: true,
      profile: `Plafond Valais : **${fmt(3_060 * children)} CHF** (3\'060 CHF/enfant). IFD fédéral : jusqu\'à ${fmt(25_500 * children)} CHF. Les deux parents doivent travailler.`,
      where:   'Factures crèche, garderie, parascolaire, maman de jour. Attestation annuelle à demander à la crèche.',
      tip:     'Inclus : crèche, garderie, parascolaire, maman de jour officielle. Garde par les grands-parents : non déductible sauf paiement officiel documenté.',
      explain: 'Condition : les deux parents doivent avoir un revenu d\'activité lucrative. Enfants < 14 ans. Factures officielles requises.',
    });
  }

  // ── Propriétaire ───────────────────────────────────────────────────────────
  if (isOwner) {
    items.push({
      id:      'fd-entretien',
      ref:     'VStax — Déductions, Frais entretien immeuble',
      name:    'Frais d\'entretien résidence principale (forfait ou frais réels)',
      type:    'gain',
      badges:  [badge('important', 'Propriétaire'), badge('autofill', 'Forfait ou frais réels')],
      where:   'Forfait : 10% (bien < 10 ans) ou 20% (≥ 10 ans) de la valeur locative. Frais réels : factures travaux + assurance bâtiment + charges PPE.',
      tip:     'Réforme 2029 : ces déductions disparaissent pour les résidences principales. Fais tes rénovations avant 2029 ! Compare forfait vs frais réels chaque année.',
      explain: 'Tu choisis librement chaque année entre forfait (sans justificatifs) et frais réels (avec factures). Années sans travaux → forfait. Années avec gros travaux → compare.',
    });
  }

  // ── Indépendant ────────────────────────────────────────────────────────────
  if (isSelf) {
    items.push({
      id:      'fd-indep',
      ref:     'VStax — Déductions, Activité indépendante',
      name:    'Charges professionnelles indépendant',
      type:    'gain',
      badges:  [badge('important', 'Indépendant'), badge('mandatory', 'Justificatifs requis')],
      where:   'Bureau domicile : surface pro/totale × loyer. Véhicule : 0.70 CHF/km (carnet de bord). SaaS, matériel, honoraires fiduciaire : montant exact des factures.',
      tip:     '3a jusqu\'à 36\'288 CHF si sans LPP ! Cotisations AVS (~10.1% du revenu net) déductibles. Garde TOUTES les factures avec objet commercial clairement indiqué.',
      explain: 'Tu peux déduire quasi toutes tes dépenses pro : bureau domicile (prorata surface), véhicule (km ou réel), SaaS, matériel, honoraires comptable (100%), repas d\'affaires (50–100%).',
    });
  }

  return items;
}

// ── Simulation — valeurs par défaut ──────────────────────────────────────────

export function getSimulationDefaults(p: UserProfile): SimInputs {
  const { annualIncome, isPermitB, isCouple, has3a, children } = derive(p);

  const assurForfait = (isCouple ? 5_200 : 2_600) + children * 700;

  return {
    brut:        annualIncome,
    pillar3a:    has3a ? 7_258 : 0,
    fraisPro:    3_200 + Math.min(3_000, Math.round(annualIncome * 0.04)),
    assurances:  assurForfait,
    autres:      0,
    impotSource: isPermitB ? Math.round(annualIncome * 0.12) : 0,
  };
}

// ── Calcul simulation ─────────────────────────────────────────────────────────

export function calcSimulation(inputs: SimInputs): SimResult {
  const { brut, pillar3a, fraisPro, assurances, autres, impotSource } = inputs;

  // Cotisations sociales 6.4% = AVS 5.3% + AC 1.1% (LPP exclue — épargne forcée, non une charge)
  const cotisations   = Math.round(brut * 0.064);
  const revenuNet     = brut - cotisations;

  // Déductions fiscales
  const totalDeductions = pillar3a + fraisPro + assurances + autres;
  const revenuImposable = Math.max(0, revenuNet - totalDeductions);

  // Impôt estimé (approximation — VStax calcule le montant exact)
  const marginalRate  = getMarginalRate(brut * 12); // brut = mensuel → annualiser
  const impotEstime   = Math.round(revenuImposable * marginalRate * 0.85); // 0.85 = correction progressive

  // Remboursement
  const remboursement = impotSource > 0
    ? Math.max(0, impotSource - impotEstime)
    : Math.round(totalDeductions * marginalRate * 0.9); // gain fiscal estimé sans IS

  return { revenuNet, revenuImposable, impotEstime, remboursement, marginalRate };
}

// ── Étapes de soumission ──────────────────────────────────────────────────────

export function getSubmitSteps(p: UserProfile): SubmitStepItem[] {
  const { isPermitB, conjointC, isAboveSeuil, canton } = derive(p);

  const cc = getCantonConfig(canton);
  const touUrl  = cc.touSource;
  const declUrl = cc.declarationSource;

  if (isPermitB && !conjointC && !isAboveSeuil) {
    // Permis B · revenu < seuil → IS définitif, TOU FACULTATIVE
    return [
      {
        n: 1,
        title: 'Évaluer si la TOU est avantageuse',
        desc:  'Compare tes déductions potentielles (3a, frais pro, frais médicaux) avec ton impôt à la source actuel. Si tes déductions dépassent les abattements forfaitaires inclus dans ton barème, la TOU te remboursera la différence.',
      },
      {
        n: 2,
        title: 'Décider : TOU ou pas ?',
        desc:  'Sans TOU : aucune démarche à faire — l\'IS prélevé par ton employeur est définitif. Avec TOU : décision irréversible — tu devras déposer une déclaration chaque année. Réfléchis à long terme.',
        link:     touUrl,
        linkText: 'Informations officielles TOU',
      },
      {
        n: 3,
        title: 'Si TOU choisie : faire la demande avant le 31 mars',
        desc:  'Formulaire en ligne sur le portail cantonal (~10 min). Joindre le certificat de salaire. Tu recevras un courrier du canton dans les 4–8 semaines.',
        link:     touUrl,
        linkText: 'Formulaire TOU officiel',
      },
      {
        n: 4,
        title: 'Si TOU choisie : remplir la déclaration',
        desc:  'Utilise le logiciel cantonal. Suis les 4 sections : Bases → Revenus → Déductions → Fortune. L\'impôt à la source déjà prélevé sera déduit automatiquement.',
      },
      {
        n: 5,
        title: 'Attendre la décision de taxation',
        desc:  'Délai : 2–4 mois. Le remboursement (si applicable) est versé directement sur ton compte. En cas de désaccord : opposition dans les 30 jours.',
      },
    ];
  }

  if (isPermitB && !conjointC && isAboveSeuil) {
    // Permis B · revenu ≥ seuil → déclaration OBLIGATOIRE
    return [
      {
        n: 1,
        title: 'Déclaration obligatoire — aucune option IS',
        desc:  `Ton revenu dépasse le seuil cantonal (${cc.seuilDeclarationIS.toLocaleString('fr-CH')} CHF/an). Tu dois déposer une déclaration ordinaire avant le ${cc.declarationLabel}. L'impôt à la source prélevé sera déduit du montant final.`,
        link:     declUrl,
        linkText: 'Portail cantonal déclaration',
      },
      {
        n: 2,
        title: 'Rassembler les justificatifs',
        desc:  'Certificat de salaire, attestation 3a, frais pro, frais médicaux non remboursés, dons. Tout ce qui figure dans ce guide.',
      },
      {
        n: 3,
        title: 'Remplir la déclaration avec le logiciel cantonal',
        desc:  'Télécharge le logiciel de déclaration cantonal. Suis les 4 sections : Bases → Revenus → Déductions → Fortune. Sauvegarde régulièrement.',
        link:     declUrl,
        linkText: 'Télécharger le logiciel cantonal',
      },
      {
        n: 4,
        title: 'Joindre les documents scannés',
        desc:  'Scanne et attache tes justificatifs (drag & drop). Certificat de salaire et attestation 3a sont minimum requis.',
      },
      {
        n: 5,
        title: 'Soumettre avant le ' + cc.declarationLabel,
        desc:  'Envoi électronique depuis le logiciel. Tu reçois un accusé de réception. Conserve une copie PDF.',
      },
      {
        n: 6,
        title: 'Attendre la décision de taxation',
        desc:  'Délai : 2–4 mois. En cas de désaccord : opposition possible dans les 30 jours suivant réception.',
      },
    ];
  }

  return [
    {
      n: 1,
      title: 'Télécharger et lancer VStax',
      desc:  'Télécharge la version 2025 sur vs.ch. Installe et importe ton fichier de l\'an passé si disponible.',
      link:     'https://www.vs.ch/web/ext-cant-gouv-scc-vstax/telechargement-du-vstax',
      linkText: 'Télécharger VStax',
    },
    {
      n: 2,
      title: 'Remplir les 4 pages',
      desc:  'Page 1 Bases (infos perso, enfants). Page 2 Revenus (salaire, intérêts). Page 3 Déductions (3a, frais pro, assurances). Page 4 Fortune (comptes, titres, véhicule).',
    },
    {
      n: 3,
      title: 'Joindre les justificatifs',
      desc:  'Scanne tes documents et attache-les (drag & drop dans VStax). Certificat de salaire obligatoire. Attestation 3a si applicable.',
    },
    {
      n: 4,
      title: 'Soumettre électroniquement',
      desc:  'Clique "Envoyer électroniquement". Deadline : 31 mars 2026. Extension possible jusqu\'à fin août sur demande au +41 27 606 24 00.',
    },
    {
      n: 5,
      title: 'Décision de taxation',
      desc:  'Délai 2–4 mois. En cas de désaccord : opposition possible dans les 30 jours suivant réception.',
    },
  ];
}
