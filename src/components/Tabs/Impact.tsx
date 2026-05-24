import { useMemo } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { generateActions } from '../../utils/generateActions';
import { getMarginalRate } from '../../utils/taxBrackets';
import { calculateWealthTax } from '../../utils/wealthTax';
import { cleanNumber } from '../../utils/numberUtils';

// ── Couleurs par catégorie ────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  '3a':           'var(--accent)',
  'Frais pro':    '#4f8ef7',
  'LAMal':        '#22c55e',
  'Prévoyance':   '#a78bfa',
  'Déductions':   '#f59e0b',
  'Immobilier':   '#06b6d4',
  'Famille':      '#ec4899',
  'Frais méd.':  '#14b8a6',
  'Dons':         '#84cc16',
  'Mobilité':     '#f97316',
  'Formation':    '#6366f1',
};
function catColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'var(--accent)';
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, padding: '16px 18px', borderRadius: 16,
      background: accent ? 'var(--accent)' : 'var(--bg-card)',
      border: `1px solid ${accent ? 'transparent' : 'var(--border)'}`,
    }}>
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent ? 'rgba(255,255,255,0.75)' : 'var(--text-3)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: accent ? '#fff' : 'var(--text)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text-3)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ── Barre horizontale ─────────────────────────────────────────────────────────
function CategoryBar({ label, gain, maxGain, color, completed, total }: {
  label: string; gain: number; maxGain: number; color: string; completed: number; total: number;
}) {
  const pct = maxGain > 0 ? (gain / maxGain) * 100 : 0;
  const donePct = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</span>
          {completed > 0 && (
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontWeight: 600 }}>
              {completed}/{total} ✓
            </span>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
          {gain.toLocaleString('fr-CH')} CHF
        </span>
      </div>
      {/* Track */}
      <div style={{ height: 8, borderRadius: 8, background: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
        {/* Gain total */}
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${pct}%`, borderRadius: 8,
          background: color, opacity: 0.25,
          transition: 'width 600ms ease',
        }} />
        {/* Gain réalisé */}
        {donePct > 0 && (
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${pct * donePct / 100}%`, borderRadius: 8,
            background: color,
            transition: 'width 600ms ease',
          }} />
        )}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
interface ImpactTabProps {
  onGoToActions?: () => void;
}

export function ImpactTab({ onGoToActions }: ImpactTabProps = {}) {
  const profile          = useProfileStore((s) => s.profile)!;
  const completedActions = useProfileStore((s) => s.completedActions);

  const actions = useMemo(() => generateActions(profile), [profile]);

  const annualIncome = cleanNumber(profile.income) * 12;
  const taxInfo = useMemo(
    () => getMarginalRate(annualIncome, profile.canton, profile.situation, undefined, cleanNumber(profile.children), profile.coupleIncomeType),
    [annualIncome, profile.canton, profile.situation, profile.children, profile.coupleIncomeType],
  );

  // Impôt sur la fortune
  const fortune    = cleanNumber(profile.fortune ?? 0);
  const wealthTax  = useMemo(
    () => fortune > 0 ? calculateWealthTax(fortune, profile.canton, profile.situation) : null,
    [fortune, profile.canton, profile.situation],
  );

  // Regrouper par catégorie
  const byCategory = useMemo(() => {
    const map: Record<string, { gain: number; ids: string[] }> = {};
    for (const a of actions) {
      if (!map[a.category]) map[a.category] = { gain: 0, ids: [] };
      map[a.category].gain += a.gain;
      map[a.category].ids.push(a.id);
    }
    return Object.entries(map)
      .map(([cat, { gain, ids }]) => ({
        cat,
        gain,
        ids,
        completed: ids.filter((id) => completedActions.includes(id)).length,
      }))
      .sort((a, b) => b.gain - a.gain);
  }, [actions, completedActions]);

  const totalGain      = actions.reduce((s, a) => s + a.gain, 0);
  const realizedGain   = actions.filter((a) => completedActions.includes(a.id)).reduce((s, a) => s + a.gain, 0);
  const maxCatGain     = byCategory[0]?.gain ?? 1;
  const doneCount      = completedActions.filter((id) => actions.some((a) => a.id === id)).length;
  // Recalcul exact sur revenu diminué des déductions (plus rigoureux que approximation linéaire)
  const taxInfoOptimized = useMemo(
    () => getMarginalRate(Math.max(0, annualIncome - totalGain), profile.canton, profile.situation, undefined, cleanNumber(profile.children), profile.coupleIncomeType),
    [annualIncome, totalGain, profile.canton, profile.situation, profile.children, profile.coupleIncomeType],
  );
  const optimizedTax   = taxInfoOptimized.totalTaxChf;
  const taxSaved       = Math.max(0, taxInfo.totalTaxChf - optimizedTax);
  const savingsPct     = taxInfo.totalTaxChf > 0
    ? Math.round((taxSaved / taxInfo.totalTaxChf) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard
          label="Gain potentiel"
          value={`${totalGain.toLocaleString('fr-CH')} CHF`}
          sub={`${savingsPct}% de votre impôt actuel`}
          accent
        />
        <KpiCard
          label="Taux marginal"
          value={`${(taxInfo.marginalRate * 100).toFixed(1)}%`}
          sub={`Effectif: ${(taxInfo.effectiveRate * 100).toFixed(1)}%`}
        />
        <KpiCard
          label="Impôt estimé"
          value={`${taxInfo.totalTaxChf.toLocaleString('fr-CH')} CHF`}
          sub={`IFD: ${taxInfo.ifdTaxChf.toLocaleString('fr-CH')} · Ct: ${taxInfo.cantonalTaxChf.toLocaleString('fr-CH')}`}
        />
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: -12 }}>
        Impôt estimé sur la base de 80&nbsp;% de votre revenu brut (déductions forfaitaires).
      </p>

      {/* Progression globale */}
      <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Progression globale</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{doneCount}/{actions.length} actions</p>
        </div>
        <div style={{ height: 10, borderRadius: 10, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 10, background: 'var(--accent)',
            width: `${actions.length > 0 ? (doneCount / actions.length) * 100 : 0}%`,
            transition: 'width 600ms ease',
          }} />
        </div>
        {doneCount === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
              Cochez votre première action pour voir l'impact ici.
            </p>
            {onGoToActions && (
              <button
                onClick={onGoToActions}
                style={{
                  alignSelf: 'flex-start',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
                  transition: 'background 150ms',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-dark)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
              >
                Commencer par la première action
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="6.5" x2="11" y2="6.5" /><polyline points="7.5,3 11,6.5 7.5,10" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Économies réalisées: <strong style={{ color: '#22c55e' }}>{realizedGain.toLocaleString('fr-CH')} CHF</strong>
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Restant: <strong style={{ color: 'var(--text-2)' }}>{(totalGain - realizedGain).toLocaleString('fr-CH')} CHF</strong>
            </p>
          </div>
        )}
      </div>

      {/* Avant / Après */}
      <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Impôt avant / après optimisation</p>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'Avant', chf: taxInfo.totalTaxChf, color: 'var(--text-3)' },
            { label: 'Après', chf: optimizedTax, color: '#22c55e' },
          ].map(({ label, chf, color }) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', padding: '14px 0', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
                {chf.toLocaleString('fr-CH')} <span style={{ fontSize: 12, fontWeight: 400 }}>CHF</span>
              </p>
            </div>
          ))}
        </div>
        {totalGain > 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 10 }}>
            Économie maximale: <strong style={{ color: 'var(--accent)' }}>{totalGain.toLocaleString('fr-CH')} CHF/an</strong> · soit {savingsPct}% d'impôt en moins
          </p>
        )}
      </div>

      {/* ── Impôt sur la fortune ─────────────────────────────────────── */}
      {wealthTax ? (
        <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Impôt sur la fortune</p>
            {wealthTax.isCapped && (
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(234,179,8,0.12)', color: '#ca8a04', fontWeight: 600, border: '1px solid rgba(234,179,8,0.25)' }}>
                Plafond 10‰ appliqué
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              {
                label: 'Fortune nette',
                value: `${fortune.toLocaleString('fr-CH')} CHF`,
                sub: `Imposable : ${wealthTax.taxableWealth.toLocaleString('fr-CH')} CHF`,
              },
              {
                label: 'Abattement',
                value: `−${wealthTax.exoneration.toLocaleString('fr-CH')} CHF`,
                sub: `Exonération ${profile.situation === 'couple' ? 'couple' : 'célibataire'}`,
              },
              {
                label: 'Impôt total estimé',
                value: `${wealthTax.taxAmountTotal.toLocaleString('fr-CH')} CHF/an`,
                sub: `Cantonal de base : ${wealthTax.taxAmountCantonal.toLocaleString('fr-CH')} CHF`,
                highlight: true,
              },
              {
                label: 'Taux effectif',
                value: `${wealthTax.effectiveRatePermille.toFixed(2)} ‰`,
                sub: `Marginal : ${wealthTax.marginalRatePermille.toFixed(2)} ‰`,
              },
            ].map(({ label, value, sub, highlight }) => (
              <div key={label} style={{
                padding: '12px 14px', borderRadius: 12,
                background: highlight ? 'rgba(201,100,66,0.06)' : 'var(--bg)',
                border: `1px solid ${highlight ? 'rgba(201,100,66,0.2)' : 'var(--border)'}`,
              }}>
                <p style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: highlight ? 'var(--accent)' : 'var(--text)', fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>{value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{sub}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Barème officiel {profile.canton} 2026 · coefficient communal chef-lieu inclus.
            {wealthTax.taxAmountTotal === 0
              ? ' Fortune sous le seuil d\'exonération — aucun impôt dû.'
              : ' Se déclare avec les revenus dans la déclaration annuelle.'}
          </p>
        </div>
      ) : (
        <div style={{
          padding: '14px 18px', borderRadius: 16,
          background: 'var(--bg-card)', border: '1px dashed var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-3)" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="8" cy="8" r="7" /><line x1="8" y1="5" x2="8" y2="8" /><line x1="8" y1="11" x2="8" y2="11" strokeWidth="2" />
          </svg>
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-2)' }}>Impôt sur la fortune</strong> — renseigne ta fortune nette dans le profil (onboarding) pour voir ce calcul.
          </p>
        </div>
      )}

      {/* Graphique par catégorie */}
      <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>Gain par catégorie</p>
        {byCategory.map(({ cat, gain, ids, completed }) => (
          <CategoryBar
            key={cat}
            label={cat}
            gain={gain}
            maxGain={maxCatGain}
            color={catColor(cat)}
            completed={completed}
            total={ids.length}
          />
        ))}
      </div>

      {/* Note méthodologie */}
      <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5, textAlign: 'center' }}>
        Calculs basés sur taux marginal {(taxInfo.marginalRate * 100).toFixed(1)}% (IFD + cantonal {profile.canton}, différence finie). Revenu imposable estimé à 80% du brut.
      </p>
    </div>
  );
}
