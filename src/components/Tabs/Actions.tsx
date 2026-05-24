import { useState, useMemo } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { generateActions } from '../../utils/generateActions';
import { WhyPanel } from '../WhyPanel';
import { BottomSheet } from '../Shared/BottomSheet';
import { useReveal } from '../../hooks/useReveal';
import { useCountUp } from '../../hooks/useCountUp';

const PRIORITY_CONFIG = {
  high:   { label: 'Haute',   color: '#C94242', bg: '#FDF0F0' },
  medium: { label: 'Moyenne', color: '#C9830A', bg: '#FDF6EC' },
  low:    { label: 'Basse',   color: '#2E9E6B', bg: '#EFFAF5' },
} as const;

// ─── KPI Card avec count-up ────────────────────────────────────────────────
function KPICard({
  value,
  label,
  accent,
  prefix,
  delayClass,
}: {
  value: number;
  label: string;
  accent?: boolean;
  prefix?: string;
  delayClass?: string;
}) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  const n = useCountUp(value, { start: inView });

  return (
    <div
      ref={ref}
      className={`reveal ${delayClass ?? ''}`}
      style={{ flex: 1, padding: '20px 12px', textAlign: 'center' }}
    >
      {prefix && (
        <div style={{ fontSize: 10, color: 'var(--text-3)', fontStyle: 'italic', marginBottom: 2, letterSpacing: '0.04em' }}>
          {prefix}
        </div>
      )}
      <div
        className="display mono-num"
        style={{
          fontSize: 'clamp(18px, 4vw, 26px)',
          color: accent ? 'var(--accent)' : 'var(--text)',
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {n.toLocaleString('fr-CH')}
      </div>
      <div className="eyebrow" style={{ fontSize: 9, justifyContent: 'center' }}>{label}</div>
    </div>
  );
}

// ─── Filtre bouton ─────────────────────────────────────────────────────────
function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 16px',
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 150ms',
        border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-2)',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {children}
    </button>
  );
}

// ─── Actions Tab ───────────────────────────────────────────────────────────
export function ActionsTab() {
  const profile          = useProfileStore((s) => s.profile);
  const completedActions = useProfileStore((s) => s.completedActions);
  const toggleAction     = useProfileStore((s) => s.toggleAction);

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [whyAction,      setWhyAction]      = useState<any>(null);
  const [filterOpen,     setFilterOpen]     = useState(false);

  const actions  = useMemo(() => (profile ? generateActions(profile) : []), [profile]);
  const filtered = useMemo(() => actions.filter((a) => {
    const matchCat = filterCategory === 'all' || a.category === filterCategory;
    const matchPri = filterPriority === 'all' || a.priority === filterPriority;
    const matchSrc = !searchQuery ||
      a.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchPri && matchSrc;
  }), [actions, filterCategory, filterPriority, searchQuery]);

  const categories  = [...new Set(actions.map((a) => a.category))];
  const totalGain   = actions.reduce((s, a) => s + a.gain, 0);
  const doneGain    = actions.filter((a) => completedActions.includes(a.id)).reduce((s, a) => s + a.gain, 0);
  const hasFilters  = searchQuery !== '' || filterCategory !== 'all' || filterPriority !== 'all';
  const activeFilterCount = (filterCategory !== 'all' ? 1 : 0) + (filterPriority !== 'all' ? 1 : 0);

  if (!profile) return (
    <div className="flex items-center justify-center py-20 rounded-2xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-sm" style={{ color: 'var(--text-2)' }}>Veuillez compléter votre profil</p>
    </div>
  );

  return (
    <>
      <WhyPanel action={whyAction} profile={profile} onClose={() => setWhyAction(null)} />

      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filtrer les actions"
      >
        <div style={{ display: 'grid', gap: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>
              Catégorie
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <FilterBtn active={filterCategory === 'all'} onClick={() => setFilterCategory('all')}>Toutes</FilterBtn>
              {categories.map((cat) => (
                <FilterBtn key={cat} active={filterCategory === cat} onClick={() => setFilterCategory(cat)}>{cat}</FilterBtn>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>
              Priorité
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                <FilterBtn key={p} active={filterPriority === p} onClick={() => setFilterPriority(p)}>
                  {p === 'all' ? 'Toutes' : PRIORITY_CONFIG[p].label}
                </FilterBtn>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setFilterCategory('all'); setFilterPriority('all'); setSearchQuery(''); setFilterOpen(false); }}
              style={{
                padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 500,
                background: 'var(--bg-sidebar)', color: 'var(--text-2)',
                border: '1px solid var(--border)', cursor: 'pointer',
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </BottomSheet>

      <div style={{ display: 'grid', gap: 16 }}>

        {/* KPI Strip */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex' }}
        >
          <KPICard value={totalGain}               label="Gain potentiel"              prefix="CHF" delayClass="reveal-delay-1" />
          <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
          <KPICard value={completedActions.length} label={`sur ${actions.length} actions`} accent   delayClass="reveal-delay-2" />
          <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
          <KPICard value={doneGain}                label="Déjà réalisé"                prefix="CHF" delayClass="reveal-delay-3" />
        </div>

        {/* Barre recherche + bouton filtres */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <svg
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text-3)" strokeWidth="1.5"
            >
              <circle cx="6" cy="6" r="4.5" /><line x1="9.5" y1="9.5" x2="13" y2="13" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher une action…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
                borderRadius: 12, fontSize: 14, outline: 'none',
                background: 'var(--bg-card)', border: '1.5px solid var(--border)', color: 'var(--text)',
                transition: 'border-color 150ms, box-shadow 150ms',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,100,66,0.10)'; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '11px 16px', borderRadius: 12, fontSize: 13, fontWeight: 500,
              background: activeFilterCount > 0 ? 'var(--accent)' : 'var(--bg-card)',
              color: activeFilterCount > 0 ? '#fff' : 'var(--text-2)',
              border: `1.5px solid ${activeFilterCount > 0 ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer', whiteSpace: 'nowrap' as const,
              transition: 'all 150ms',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="4" x2="13" y2="4" />
              <line x1="3" y1="8" x2="11" y2="8" />
              <line x1="5" y1="12" x2="9" y2="12" />
            </svg>
            Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>

        {/* Count + reset */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
            {filtered.length} action{filtered.length !== 1 ? 's' : ''}{hasFilters ? ' filtrée' + (filtered.length !== 1 ? 's' : '') : ''}
          </p>
          {hasFilters && (
            <button
              onClick={() => { setSearchQuery(''); setFilterCategory('all'); setFilterPriority('all'); }}
              style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, paddingTop: 56, paddingBottom: 56, borderRadius: 16,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="16" cy="16" r="11" />
              <line x1="25" y1="25" x2="32" y2="32" strokeWidth="2" />
              <line x1="12" y1="16" x2="20" y2="16" />
            </svg>
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>Aucune action trouvée</p>
            {hasFilters && (
              <button
                onClick={() => { setSearchQuery(''); setFilterCategory('all'); setFilterPriority('all'); }}
                style={{
                  fontSize: 12, fontWeight: 500, color: 'var(--accent)',
                  background: 'var(--accent-bg)', border: '1px solid var(--accent)',
                  borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
                }}
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {filtered.map((action) => {
              const done  = completedActions.includes(action.id);
              const pConf = PRIORITY_CONFIG[action.priority];
              return (
                <ActionCard
                  key={action.id}
                  action={action}
                  done={done}
                  pConf={pConf}
                  onToggle={() => toggleAction(action.id)}
                  onWhy={() => setWhyAction(action)}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Action Card ───────────────────────────────────────────────────────────
function ActionCard({
  action,
  done,
  pConf,
  onToggle,
  onWhy,
}: {
  action: any;
  done: boolean;
  pConf: { label: string; color: string; bg: string };
  onToggle: () => void;
  onWhy: () => void;
}) {
  const { ref } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="reveal rounded-2xl overflow-hidden"
      style={{
        background: done ? 'var(--bg-sidebar)' : 'var(--bg-card)',
        border: `1px solid ${done ? 'var(--border-soft)' : 'var(--border)'}`,
        opacity: done ? 0.65 : 1,
        transition: 'opacity 300ms, box-shadow 150ms',
      }}
      onMouseEnter={(e) => { if (!done) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(31,29,27,0.08)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Header : checkbox + titre + gain */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 18px 14px' }}>

        {/* Checkbox avec padding pour touch target ≥ 44px */}
        <button
          onClick={onToggle}
          aria-label={done ? 'Décocher' : 'Marquer comme fait'}
          style={{
            flexShrink: 0, padding: 10, margin: -10, marginTop: -6,
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: 7,
            background: done ? 'var(--accent)' : 'transparent',
            border: `1.5px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 200ms',
            animation: done ? 'checkPulse 300ms ease-out' : 'none',
          }}>
            {done && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4.5 4 7l6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>

        {/* Titre */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 15, fontWeight: 500, lineHeight: 1.45,
            color: done ? 'var(--text-3)' : 'var(--text)',
            textDecoration: done ? 'line-through' : 'none',
            textDecorationColor: 'var(--text-3)',
            margin: 0,
          }}>
            {action.titre}
          </p>
        </div>

        {/* Gain — Instrument Serif + Mono */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div
            className="display mono-num"
            style={{ fontSize: 22, lineHeight: 1, color: done ? 'var(--text-3)' : 'var(--accent)' }}
          >
            {action.gain.toLocaleString('fr-CH')}
          </div>
          <div style={{
            fontSize: 9, color: 'var(--text-3)', marginTop: 5,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            fontFamily: 'var(--font-body)', fontWeight: 600,
          }}>
            CHF
          </div>
        </div>
      </div>

      {/* Footer : priority tag + category + "Pourquoi ?" CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 18px',
        background: done ? 'transparent' : 'var(--bg)',
        borderTop: '1px solid var(--border-soft)',
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 99,
          background: pConf.bg, color: pConf.color, fontWeight: 600,
        }}>
          {pConf.label}
        </span>
        <span style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 99,
          color: 'var(--text-3)', border: '1px solid var(--border-soft)',
        }}>
          {action.category}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onWhy(); }}
          style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', minHeight: 36,
            fontSize: 12, fontWeight: 500,
            background: 'var(--accent-bg)', color: 'var(--accent)',
            border: 'none', borderRadius: 99, cursor: 'pointer',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(201,100,66,0.2)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--accent-bg)')}
        >
          Pourquoi ?
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="m3.5 2 3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      </div>
    </div>
  );
}
