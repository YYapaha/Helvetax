import { useProfileStore } from '../../stores/profileStore';
import { useDeclaStore } from '../../stores/declaStore';
import { getSubmitSteps } from '../../data/declaData';
import { SubmitChecklist } from './SubmitChecklist';

interface SectionSoumettreProps {
  onBack: () => void;
}

export function SectionSoumettre({ onBack }: SectionSoumettreProps) {
  const profile            = useProfileStore((s) => s.profile);
  const checkedSubmitSteps = useDeclaStore((s) => s.checkedSubmitSteps);
  const toggleSubmitStep   = useDeclaStore((s) => s.toggleSubmitStep);

  if (!profile) return null;

  const steps    = getSubmitSteps(profile);
  const allDone  = steps.every((s) => checkedSubmitSteps.includes(s.n));
  const doneCount = checkedSubmitSteps.filter(n => steps.some(s => s.n === n)).length;

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {/* Hero */}
      <div style={{
        background: allDone ? 'rgba(5,150,105,0.08)' : 'var(--bg-dark)',
        border: allDone ? '1.5px solid rgba(5,150,105,0.3)' : 'none',
        borderRadius: 16, padding: '20px 20px',
        transition: 'all 400ms ease',
      }}>
        {allDone ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, background: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3,11 8,16 19,5" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#059669', margin: '0 0 3px' }}>
                Déclaration soumise !
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
                Conservez l'accusé de réception. Réponse sous 3–6 mois.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-inv-2)', marginBottom: 8 }}>
              Dernière étape
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-inv)', margin: '0 0 4px', lineHeight: 1.3 }}>
              Soumettez votre déclaration
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-inv-2)', margin: 0, lineHeight: 1.5 }}>
              Suivez ces étapes dans l'ordre. Cochez chaque action au fur et à mesure.
            </p>
          </>
        )}
      </div>

      {/* Checklist */}
      <SubmitChecklist
        steps={steps}
        checked={checkedSubmitSteps}
        onToggle={toggleSubmitStep}
      />

      {/* Post-submit advice — visible once done */}
      {allDone && (
        <div style={{
          display: 'grid', gap: 10,
          padding: '18px 18px', borderRadius: 14,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', margin: 0 }}>
            Que faire maintenant ?
          </p>
          {[
            'Conservez une copie de votre déclaration complète (PDF VStax).',
            'Notez le numéro de votre dossier si communiqué.',
            'Attendez la décision de taxation (3–6 mois) — vous recevrez un courrier.',
            'En cas de désaccord, vous avez 30 jours pour faire une réclamation.',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                flexShrink: 0, width: 18, height: 18, borderRadius: 5,
                background: 'var(--accent-bg)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, marginTop: 1,
              }}>
                {i + 1}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>{item}</p>
            </div>
          ))}
        </div>
      )}

      {/* Back only (this is the last step) */}
      <button onClick={onBack} style={{
        height: 50, borderRadius: 14, fontSize: 14, fontWeight: 600,
        color: 'var(--text-2)', background: 'var(--bg-card)',
        border: '1.5px solid var(--border)', cursor: 'pointer', width: '100%',
      }}>
        ← Retour à la simulation
      </button>
    </div>
  );
}
