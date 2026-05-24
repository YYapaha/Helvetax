import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeclaStore, SimInputs } from '../types/decla';

const defaultSimInputs: SimInputs = {
  brut:        72000,
  pillar3a:    7258,
  fraisPro:    6200,
  assurances:  2600,
  autres:      0,
  impotSource: 0,
};

export const useDeclaStore = create<DeclaStore>()(
  persist(
    (set) => ({
      // ── Navigation ──────────────────────────────────────────────────────────
      currentStep: 0,
      setStep: (step) => set({ currentStep: step }),

      // ── Documents ───────────────────────────────────────────────────────────
      checkedDocs: [],
      toggleDoc: (id) =>
        set((state) => ({
          checkedDocs: state.checkedDocs.includes(id)
            ? state.checkedDocs.filter((d) => d !== id)
            : [...state.checkedDocs, id],
        })),

      // ── Champs revenus / déductions ─────────────────────────────────────────
      checkedFields: [],
      toggleField: (id) =>
        set((state) => ({
          checkedFields: state.checkedFields.includes(id)
            ? state.checkedFields.filter((f) => f !== id)
            : [...state.checkedFields, id],
        })),

      // ── Étapes de soumission ────────────────────────────────────────────────
      checkedSubmitSteps: [],
      toggleSubmitStep: (n) =>
        set((state) => ({
          checkedSubmitSteps: state.checkedSubmitSteps.includes(n)
            ? state.checkedSubmitSteps.filter((s) => s !== n)
            : [...state.checkedSubmitSteps, n],
        })),

      // ── Simulation ──────────────────────────────────────────────────────────
      simInputs: defaultSimInputs,
      setSimInput: (key, value) =>
        set((state) => ({
          simInputs: { ...state.simInputs, [key]: value },
        })),

      // ── Reset ────────────────────────────────────────────────────────────────
      resetDecla: () =>
        set({
          currentStep:       0,
          checkedDocs:       [],
          checkedFields:     [],
          checkedSubmitSteps:[],
          simInputs:         defaultSimInputs,
        }),
    }),
    {
      name: 'helvetax-decla',
      // Persiste tout sauf les méthodes (automatique avec zustand/persist)
      partialize: (state) => ({
        currentStep:        state.currentStep,
        checkedDocs:        state.checkedDocs,
        checkedFields:      state.checkedFields,
        checkedSubmitSteps: state.checkedSubmitSteps,
        simInputs:          state.simInputs,
      }),
    }
  )
);
