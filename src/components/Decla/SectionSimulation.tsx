import { useEffect } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { useDeclaStore } from '../../stores/declaStore';
import { getSimulationDefaults } from '../../data/declaData';
import { SimCalc } from './SimCalc';

interface SectionSimulationProps {
  onNext: () => void;
  onBack: () => void;
}

export function SectionSimulation({ onNext, onBack }: SectionSimulationProps) {
  const profile     = useProfileStore((s) => s.profile);
  const setSimInput = useDeclaStore((s) => s.setSimInput);
  const simInputs   = useDeclaStore((s) => s.simInputs);

  // Pre-fill simulation defaults from profile on first load
  useEffect(() => {
    if (!profile) return;
    // Only pre-fill if still at zero (fresh start)
    if (simInputs.brut > 0) return;
    const defaults = getSimulationDefaults(profile);
    (Object.keys(defaults) as (keyof typeof defaults)[]).forEach((key) => {
      setSimInput(key, defaults[key]);
    });
  }, [profile]);

  if (!profile) return null;

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {/* Context */}
      <div style={{
        padding: '16px 18px', borderRadius: 14,
        background: 'var(--bg-dark)', color: 'var(--text-inv)',
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-inv-2)', marginBottom: 6 }}>
          Simulation fiscale
        </p>
        <p style={{ fontSize: 14, fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
          Ajustez les sliders pour voir l'impact de chaque déduction sur votre impôt estimé.
        </p>
      </div>

      {/* Calculator */}
      <SimCalc />

      {/* Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <button onClick={onBack} style={{
          height: 50, borderRadius: 14, fontSize: 14, fontWeight: 600,
          color: 'var(--text-2)', background: 'var(--bg-card)',
          border: '1.5px solid var(--border)', cursor: 'pointer',
        }}>
          ← Retour
        </button>
        <button
          onClick={onNext}
          style={{
            height: 50, borderRadius: 14, fontSize: 14, fontWeight: 700,
            color: '#fff', background: 'var(--accent)',
            border: 'none', cursor: 'pointer', transition: 'background 150ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          } as React.CSSProperties}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-dark)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
        >
          Soumettre ma déclaration →
        </button>
      </div>
    </div>
  );
}
