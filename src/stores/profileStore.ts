import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, ProfileStore } from '../types';

const defaultProfile: UserProfile = {
  canton: 'VS',
  situation: 'single',
  children: 0,
  income: 0,
  permit: 'B',
  housing: 'renter',
  activity: 'employee',
  conjoint_permit: '',
  rent: 0,
  has3a: 'no',
  fortune: 0,
  coupleIncomeType: 'single',
  useTOU: false,
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: null,
      completedActions: [],
      darkMode: false,
      language: 'fr',

      setProfile: (profile: UserProfile) => set({ profile }),

      updateProfile: (updates: Partial<UserProfile>) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : { ...defaultProfile, ...updates },
        })),

      toggleAction: (actionId: string) =>
        set((state) => {
          const completed = state.completedActions.includes(actionId);
          return {
            completedActions: completed
              ? state.completedActions.filter((id) => id !== actionId)
              : [...state.completedActions, actionId],
          };
        }),

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      setLanguage: (lang: string) => set({ language: lang as any }),

      resetProfile: () => set({ profile: null, completedActions: [] }),
    }),
    {
      name: 'tax-optimizer-profile',
      partialize: (state) => ({
        profile: state.profile,
        completedActions: state.completedActions,
        darkMode: state.darkMode,
        language: state.language,
      }),
    }
  )
);
