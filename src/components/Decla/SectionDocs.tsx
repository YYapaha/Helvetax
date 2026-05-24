import { useProfileStore } from '../../stores/profileStore';
import { useDeclaStore } from '../../stores/declaStore';
import { getDocuments } from '../../data/declaData';
import { DocCheckItem } from './DocCheckItem';

interface SectionDocsProps {
  onNext: () => void;
  onBack: () => void;
}

export function SectionDocs({ onNext, onBack }: SectionDocsProps) {
  const profile      = useProfileStore((s) => s.profile);
  const checkedDocs  = useDeclaStore((s) => s.checkedDocs);
  const toggleDoc    = useDeclaStore((s) => s.toggleDoc);

  if (!profile) return null;

  const docs       = getDocuments(profile);
  const mandatory  = docs.filter((d) => d.mandatory);
  const optional   = docs.filter((d) => !d.mandatory);
  const doneCount  = checkedDocs.length;
  const totalCount = docs.length;
  const mandatoryDone = mandatory.every((d) => checkedDocs.includes(d.id));

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {/* Progress header */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16,
        border: '1px solid var(--border)', padding: '16px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 2px' }}>
            {doneCount}/{totalCount} documents prêts
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
            Cochez chaque document au fur et à mesure
          </p>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: mandatoryDone ? 'rgba(5,150,105,0.1)' : 'rgba(201,100,66,0.1)',
          color: mandatoryDone ? '#059669' : 'var(--accent)',
          fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)',
        }}>
          {Math.round((doneCount / Math.max(totalCount, 1)) * 100)}%
        </div>
      </div>

      {/* Mandatory documents */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--text-3)',
          }}>
            Obligatoires
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {mandatory.filter(d => checkedDocs.includes(d.id)).length}/{mandatory.length}
          </span>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {mandatory.map((doc) => (
            <DocCheckItem
              key={doc.id}
              doc={doc}
              checked={checkedDocs.includes(doc.id)}
              onToggle={() => toggleDoc(doc.id)}
            />
          ))}
        </div>
      </div>

      {/* Optional documents */}
      {optional.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--text-3)',
            }}>
              Optionnels
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {optional.filter(d => checkedDocs.includes(d.id)).length}/{optional.length}
            </span>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {optional.map((doc) => (
              <DocCheckItem
                key={doc.id}
                doc={doc}
                checked={checkedDocs.includes(doc.id)}
                onToggle={() => toggleDoc(doc.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tip banner */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        padding: '14px 16px', borderRadius: 12,
        background: 'rgba(201,100,66,0.06)', border: '1px solid rgba(201,100,66,0.2)',
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="8" cy="8" r="7" />
          <line x1="8" y1="7" x2="8" y2="11" />
          <circle cx="8" cy="4.5" r="0.4" fill="var(--accent)" />
        </svg>
        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
          Préparez ces documents en format PDF si possible. Certains sont disponibles dans votre e-banking ou espace RH en ligne.
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            height: 50, borderRadius: 14, fontSize: 14, fontWeight: 600,
            color: 'var(--text-2)', background: 'var(--bg-card)',
            border: '1.5px solid var(--border)', cursor: 'pointer',
            transition: 'all 150ms',
          }}
        >
          ← Retour
        </button>
        <button
          onClick={onNext}
          disabled={!mandatoryDone}
          style={{
            height: 50, borderRadius: 14, fontSize: 14, fontWeight: 700,
            color: '#fff',
            background: mandatoryDone ? 'var(--accent)' : 'var(--border)',
            border: 'none', cursor: mandatoryDone ? 'pointer' : 'not-allowed',
            transition: 'all 150ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          } as React.CSSProperties}
        >
          {mandatoryDone ? 'Continuer → Revenus' : `Encore ${mandatory.filter(d => !checkedDocs.includes(d.id)).length} doc(s) requis`}
        </button>
      </div>
    </div>
  );
}
