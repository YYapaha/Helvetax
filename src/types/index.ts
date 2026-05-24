// Déclaration Types
export * from './decla';

// User Profile Types
export interface UserProfile {
  canton: string;
  situation: "single" | "couple";
  children: number;
  income: number;
  permit: string;
  housing: "renter" | "owner" | "owner_rental";
  activity: "employee" | "self" | "both";
  conjoint_permit?: string;
  rent?: number;
  has3a: "yes" | "no";
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
