// ── Déclaration — Types ───────────────────────────────────────────────────────

/** Les 6 étapes du wizard déclaration */
export type DeclaStepId =
  | 'intro'
  | 'docs'
  | 'revenus'
  | 'deductions'
  | 'simulation'
  | 'soumettre';

export const DECLA_STEPS: { id: DeclaStepId; label: string; short: string }[] = [
  { id: 'intro',      label: 'Introduction',  short: 'Intro'  },
  { id: 'docs',       label: 'Documents',     short: 'Docs'   },
  { id: 'revenus',    label: 'Revenus',       short: 'Rev.'   },
  { id: 'deductions', label: 'Déductions',    short: 'Ded.'   },
  { id: 'simulation', label: 'Simulation',    short: 'Sim.'   },
  { id: 'soumettre',  label: 'Soumettre',     short: 'Go'     },
];

// ── KPI (section Intro) ───────────────────────────────────────────────────────

export interface DeclaKPI {
  value: string;
  label: string;
  color?: 'accent' | 'success' | 'danger' | 'default';
}

// ── Intro cards ───────────────────────────────────────────────────────────────

export type IntroCardType = 'info' | 'important' | 'autofill';

export interface IntroCard {
  type: IntroCardType;
  ref: string;
  name: string;
  where: string;
  tip: string;
}

// ── Documents (section Docs) ──────────────────────────────────────────────────

export interface DocItem {
  id: string;
  title: string;
  where: string;       // où trouver le document
  mandatory: boolean;
}

// ── Badge (partagé par FieldItem) ─────────────────────────────────────────────

export type BadgeVariant =
  | 'mandatory'   // rouge — obligatoire
  | 'important'   // orange — important
  | 'autofill'    // bleu — pré-rempli automatiquement
  | 'optional'    // gris — optionnel
  | 'gain'        // vert — économie fiscale
  | 'profile';    // violet — personnalisé selon profil

export interface Badge {
  variant: BadgeVariant;
  text: string;
}

// ── Field card (Revenus + Déductions) ────────────────────────────────────────

export type FieldType = 'mandatory' | 'optional' | 'important' | 'gain';

export interface FieldItem {
  id: string;
  ref: string;          // ex: "VStax — Page 2, Revenus"
  name: string;
  type: FieldType;
  badges: Badge[];
  amount?: string;      // valeur affichée (ex: "7'258 CHF")
  amountPositive?: boolean; // true = vert, false = neutre
  profile?: string;     // texte personnalisé selon profil (peut contenir du HTML)
  where: string;        // où remplir / quel document
  tip: string;          // conseil pratique
  explain: string;      // explication pédagogique
}

// ── Simulation ────────────────────────────────────────────────────────────────

export interface SimInputs {
  brut: number;         // salaire brut annuel
  pillar3a: number;     // déduction 3a
  fraisPro: number;     // frais professionnels (transport + repas)
  assurances: number;   // primes assurance forfait
  autres: number;       // autres déductions
  impotSource: number;  // IS déjà prélevé (permis B)
}

export interface SimResult {
  revenuNet: number;        // brut − cotisations sociales ~6.4%
  revenuImposable: number;  // revenuNet − déductions
  impotEstime: number;      // estimation taux marginal
  remboursement: number;    // impotSource − impotEstime (si permis B) ou gain
  marginalRate: number;     // taux marginal utilisé
}

// ── Étapes de soumission ──────────────────────────────────────────────────────

export interface SubmitStepItem {
  n: number;
  title: string;
  desc: string;
  link?: string;
  linkText?: string;
}

// ── Store state ───────────────────────────────────────────────────────────────

export interface DeclaStore {
  // Navigation
  currentStep: number;              // index 0-5 dans DECLA_STEPS
  setStep: (step: number) => void;

  // Documents cochés
  checkedDocs: string[];
  toggleDoc: (id: string) => void;

  // Champs revenus/déductions cochés (validés par l'utilisateur)
  checkedFields: string[];
  toggleField: (id: string) => void;

  // Étapes de soumission cochées
  checkedSubmitSteps: number[];
  toggleSubmitStep: (n: number) => void;

  // Simulation
  simInputs: SimInputs;
  setSimInput: (key: keyof SimInputs, value: number) => void;

  // Reset (si l'utilisateur veut recommencer)
  resetDecla: () => void;
}
