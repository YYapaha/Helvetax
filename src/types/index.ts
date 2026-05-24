// Déclaration Types
export * from './decla';

// Canton type — central export (defined in cantonConfig, re-exported here for convenience)
export type { Canton } from '../utils/cantonConfig';

// User Profile Types
import type { Canton } from '../utils/cantonConfig';
export interface UserProfile {
  canton: Canton;
  situation: "single" | "couple";
  children: number;
  income: number;
  permit: string;
  housing: "renter" | "owner" | "owner_rental";
  activity: "employee" | "self" | "both";
  conjoint_permit?: string;
  rent?: number;
  has3a: "yes" | "no";
  /** Fortune nette estimée en CHF (optionnel, défaut 0). Utilisée pour le calcul de l'impôt sur la fortune. */
  fortune?: number;
}

// Action Types
export interface Action {
  id: string;
  titre: string;
  category: string;
  priority: "high" | "medium" | "low";
  gain: number;
  guide: string;
  why: string;
  checklist: string[];
  completed?: boolean;
}

// Tax Calculation Types
export interface TaxResult {
  revenuImposable: number;
  impotFederal: number;
  impotCantonal: number;
  impotTotal: number;
  taux: number;
}

// Store Types
export interface ProfileStore {
  profile: UserProfile | null;
  completedActions: string[];
  darkMode: boolean;
  language: "fr" | "en" | "it" | "de";

  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  toggleAction: (actionId: string) => void;
  toggleDarkMode: () => void;
  setLanguage: (lang: string) => void;
  resetProfile: () => void;
}
