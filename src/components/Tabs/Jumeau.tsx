import { useState, useMemo } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { getMarginalRate } from '../../utils/taxBrackets';
import { generateActions } from '../../utils/generateActions';
import { cleanNumber } from '../../utils/numberUtils';
import type { UserProfile } from '../../types';
import type { Canton } from '../../utils/cantonConfig';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString('fr-CH'); }
function pct(n: number) { return (n * 100).toFixed(1) + '%'; }
function delta(a: number, b: number) {
  const d = b - a;
  return { chf: Math.abs(d), sign: d > 0 ? '+' : d < 0 ? '-' : '=' as '+' | '-' | '=' };
}

// ── Types scénario ────────────────────────────────────────────────────────────
interface ScenarioState {
  income: string;
  canton: Canton;
  sit: 'single' | 'couple';
  housing: 'renter' | 'owner';
  children: number;
  has3a: 'yes' | 'no';
}

interface Scenario {
  id: string;
  label: string;
  icon: string;
  description: string;
  apply: (current: ScenarioState, profile: UserProfile) => Partial<ScenarioState>;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'max3a',
    icon: '💰',
    label: 'Maxer le pilier 3a',
    description: 'Active et max le 3a (7 258 CHF déduits)',
    apply: () => ({ has3a: 'yes' }),
  },
  {
    id: 'mariage',
    icon: '💍',
    label: 'Se marier',
    description: 'Passer en couple (barème B IFD)',
    apply: (cur) => ({ sit: 'couple', income: String(cleanNumber(cur.income)) }),
  },
  {
    id: 'augmentation',
    icon: '📈',
    label: '+10 000 CHF/an',
    description: 'Augmentation de salaire de 833 CHF/mois',
    apply: (cur) => ({ income: String(cleanNumber(cur.income) + 833) }),
  },
  {
    id: 'proprio',
    icon: '🏠',
    label: 'Devenir propriétaire',
    description: 'Passer de locataire à propriétaire',
    apply: () => ({ housing: 'owner' }),
  },
  {
    id: 'canton_vd',
    icon: '🗺️',
    label: 'Déménager en VD',
    description: 'Même revenu, canton Vaud (Lausanne)',
    apply: () => ({ canton: 'VD' }),
  },
  {
    id: 'canton_ge',
    icon: '🗺️',
    label: 'Déménager à GE',
    description: 'Même revenu, canton Genève',
    apply: () => ({ canton: 'GE' }),
  },
];

// ── Toggle buttons ────────────────────────────────────────────────────────────
function ToggleGroup<T extends string>({
  label, options, value, onChange,
}: { label: string; options: { v: T; l: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>{label}</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map(({ v, l }) => (
          <button key={v} onClick={() => onChange(v)} style={{
            padding: '6px 12px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
            fontWeight: value === v ? 600 : 400,
            background: value === v ? 'rgba(201,100,66,0.12)' : 'var(--bg)',
            color:      value === v ? 'var(--accent)' : 'var(--text-3)',
            border:     `1px solid ${value === v ? 'var(--accent)' : 'var(--border)'}`,
            transition: 'all 150ms',
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

// ── Metric row ────────────────────────────────────────────────────────────────
function MetricRow({ label, vous, jumeau, unit = 'CHF', lowerIsBetter = true }: {
  label: string; vous: number; jumeau: number; unit?: string; lowerIsBetter?: boolean;
}) {
  const d = delta(vous, jumeau);
  const jumeauBetter = lowerIsBetter ? jumeau < vous : jumeau > vous;
  const color = d.chf === 0 ? 'var(--text-3)' : jumeauBetter ? '#22c55e' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <p style={{ flex: 1, fontSize: 13, color: 'var(--text-2)' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-mono)', minWidth: 90, textAlign: 'right' }}>
        {unit === '%' ? pct(vous) : fmt(vous)}
      </p>
      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
      <p style={{ fontSize: 13, fontWeight: 600, color, fontFamily: 'var(--font-mono)', minWidth: 90, textAlign: 'right' }}>
        {unit === '%' ? pct(jumeau) : fmt(jumeau)}
      </p>
      {d.chf > 0 && (
        <span style={{
          fontSize: 11, padding: '2px 7px', borderRadius: 20, minWidth: 60, textAlign: 'center',
          background: `${color}18`, color, fontFamily: 'var(--font-mono)', fontWeight: 600,
        }}>
          {d.sign}{unit === '%' ? pct(d.chf / 100) : fmt(d.chf)}
        </span>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export function JumeauTab() {
  const profile = useProfileStore((s) => s.profile)!;

  const defaultState: ScenarioState = {
    income:   String(profile.income),
    canton:   profile.canton,
    sit:      profile.situation,
    housing:  profile.housing === 'owner_rental' ? 'owner' : profile.housing as 'renter' | 'owner',
    children: profile.children ?? 0,
    has3a:    profile.has3a,
  };

  const [twin, setTwin]               = useState<ScenarioState>(defaultState);
  const [activeScenario, setActive]   = useState<string | null>(null);

  // Appliquer un scénario
  const applyScenario = (s: Scenario) => {
    if (activeScenario === s.id) {
      // deselect → reset
      setTwin(defaultState);
      setActive(null);
    } else {
      setTwin((cur) => ({ ...cur, ...s.apply(cur, profile) }));
      setActive(s.id);
    }
  };

  // Mise à jour manuelle → désélectionne le scénario
  const update = (patch: Partial<ScenarioState>) => {
    setTwin((cur) => ({ ...cur, ...patch }));
    setActive(null);
  };

  const reset = () => { setTwin(defaultState); setActive(null); };

  // Profil jumeau
  const twinProfile: UserProfile = useMemo(() => ({
    ...profile,
    income:    cleanNumber(twin.income),
    canton:    twin.canton,
    situation: twin.sit,
    housing:   twin.housing,
    children:  twin.children,
    has3a:     twin.has3a,
  }), [profile, twin]);

  // Calculs
  const annualVous   = cleanNumber(profile.income) * 12;
  const annualJumeau = cleanNumber(twin.income) * 12;
  const taxVous      = useMemo(() => getMarginalRate(annualVous,   profile.canton, profile.situation), [annualVous,   profile.canton, profile.situation]);
  const taxJumeau    = useMemo(() => getMarginalRate(annualJumeau, twin.canton,    twin.sit),           [annualJumeau, twin.canton,    twin.sit]);
  const actionsVous  = useMemo(() => generateActions(profile),     [profile]);
  const actionsJumeau = useMemo(() => generateActions(twinProfile), [twinProfile]);
  const gainVous     = actionsVous.reduce((s, a) => s + a.gain, 0);
  const gainJumeau   = actionsJumeau.reduce((s, a) => s + a.gain, 0);
  const impotDelta   = taxVous.totalTaxChf - taxJumeau.totalTaxChf;

  const hasChanges = JSON.stringify(twin) !== JSON.stringify(defaultState);

  // Pré-calculer l'impact de chaque scénario (pour afficher le delta sur la carte)
  const scenarioImpacts = useMemo(() => {
    return SCENARIOS.map((s) => {
      const applied = { ...defaultState, ...s.apply(defaultState, profile) };
      const annual  = cleanNumber(applied.income) * 12;
      const tax     = getMarginalRate(annual, applied.canton, applied.sit);
      return { id: s.id, delta: taxVous.totalTaxChf - tax.totalTaxChf };
    });
  }, [profile, taxVous.totalTaxChf]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Scénarios rapides */}
      <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Scénarios</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {SCENARIOS.map((s) => {
            const impact = scenarioImpacts.find((x) => x.id === s.id)?.delta ?? 0;
            const isActive = activeScenario === s.id;
            const impactColor = impact > 0 ? '#22c55e' : impact < 0 ? '#f87171' : 'var(--text-3)';
            return (
              <button
                key={s.id}
                onClick={() => applyScenario(s)}
                style={{
                  padding: '12px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  background: isActive ? 'rgba(201,100,66,0.10)' : 'var(--bg)',
                  border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'all 150ms',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{s.icon}</span>
                  {impact !== 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: impactColor, fontWeight: 700 }}>
                      {impact > 0 ? '−' : '+'}{fmt(Math.abs(impact))} CHF
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text)', marginTop: 6 }}>{s.label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{s.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configurateur manuel */}
      <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Ajustement manuel</p>
          {hasChanges && (
            <button onClick={reset} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)',
            }}>Réinitialiser</button>
          )}
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
              Revenu mensuel brut (CHF)
            </p>
            <input
              type="number" value={twin.income} min="1000" max="50000" step="500"
              onChange={(e) => update({ income: e.target.value })}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 14,
                fontFamily: 'var(--font-mono)', background: 'var(--bg)',
                border: '1.5px solid var(--border)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>
          <ToggleGroup label="Canton"
            options={[{ v: 'VS', l: 'Valais' }, { v: 'VD', l: 'Vaud' }, { v: 'GE', l: 'Genève' }, { v: 'NE', l: 'Neuchâtel' }]}
            value={twin.canton} onChange={(v) => update({ canton: v })} />
          <ToggleGroup label="Situation"
            options={[{ v: 'single', l: 'Célibataire' }, { v: 'couple', l: 'En couple' }]}
            value={twin.sit} onChange={(v) => update({ sit: v as 'single' | 'couple' })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ToggleGroup label="Logement"
              options={[{ v: 'renter', l: 'Locataire' }, { v: 'owner', l: 'Proprio' }]}
              value={twin.housing} onChange={(v) => update({ housing: v as 'renter' | 'owner' })} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Enfants</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2, 3].map((n) => (
                  <button key={n} onClick={() => update({ children: n })} style={{
                    flex: 1, padding: '6px 4px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
                    fontWeight: twin.children === n ? 600 : 400,
                    background: twin.children === n ? 'rgba(201,100,66,0.12)' : 'var(--bg)',
                    color:      twin.children === n ? 'var(--accent)' : 'var(--text-3)',
                    border:     `1px solid ${twin.children === n ? 'var(--accent)' : 'var(--border)'}`,
                  }}>{n === 3 ? '3+' : n}</button>
                ))}
              </div>
            </div>
          </div>
          <ToggleGroup label="Pilier 3a"
            options={[{ v: 'yes', l: 'Actif' }, { v: 'no', l: 'Inactif' }]}
            value={twin.has3a} onChange={(v) => update({ has3a: v as 'yes' | 'no' })} />
        </div>
      </div>

      {/* Verdict */}
      {hasChanges && (
        <div style={{
          padding: '14px 18px', borderRadius: 14, textAlign: 'center',
          background: impotDelta > 0 ? 'rgba(34,197,94,0.08)' : impotDelta < 0 ? 'rgba(248,113,113,0.08)' : 'var(--bg-card)',
          border: `1px solid ${impotDelta > 0 ? 'rgba(34,197,94,0.3)' : impotDelta < 0 ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
        }}>
          {impotDelta === 0
            ? <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Aucune différence d'impôt estimée.</p>
            : <>
                <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: impotDelta > 0 ? '#22c55e' : '#f87171' }}>
                  {impotDelta > 0 ? '−' : '+'}{fmt(Math.abs(impotDelta))} CHF/an
                  <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 6 }}>
                    ({impotDelta > 0 ? 'économie' : 'surcoût'})
                  </span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                  {impotDelta > 0
                    ? `−${Math.round(Math.abs(impotDelta) / taxVous.totalTaxChf * 100)}% d'impôt · sur 10 ans : ${fmt(Math.abs(impotDelta) * 10)} CHF économisés`
                    : `+${Math.round(Math.abs(impotDelta) / taxVous.totalTaxChf * 100)}% d'impôt · sur 10 ans : ${fmt(Math.abs(impotDelta) * 10)} CHF de surcoût`
                  }
                </p>
                {activeScenario === 'augmentation' && (
                  <p style={{ fontSize: 12, marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(79,142,247,0.10)', color: '#4f8ef7', textAlign: 'left' }}>
                    💡 Pensez à ajuster vos frais de transport ou votre pilier 3a pour compenser cette hausse de revenu imposable.
                  </p>
                )}
              </>
          }
        </div>
      )}

      {/* Tableau métriques */}
      <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Comparatif détaillé</p>
        {[
          { label: 'Revenu annuel brut', cur: fmt(annualVous), twn: fmt(annualJumeau) },
          { label: 'Taux marginal', cur: `${(taxVous.marginalRate * 100).toFixed(1)}%`, twn: `${(taxJumeau.marginalRate * 100).toFixed(1)}%` },
          { label: 'Taux effectif', cur: `${(taxVous.effectiveRate * 100).toFixed(1)}%`, twn: `${(taxJumeau.effectiveRate * 100).toFixed(1)}%` },
          { label: 'IFD', cur: `${taxVous.ifdTaxChf.toLocaleString('fr-CH')} CHF`, twn: `${taxJumeau.ifdTaxChf.toLocaleString('fr-CH')} CHF` },
          { label: 'Impôt cantonal', cur: `${taxVous.cantonalTaxChf.toLocaleString('fr-CH')} CHF`, twn: `${taxJumeau.cantonalTaxChf.toLocaleString('fr-CH')} CHF` },
          { label: 'Total impôt', cur: `${taxVous.totalTaxChf.toLocaleString('fr-CH')} CHF`, twn: `${taxJumeau.totalTaxChf.toLocaleString('fr-CH')} CHF`, bold: true },
        ].map(({ label, cur, twn, bold }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', minWidth: 100, textAlign: 'right' }}>{cur}</span>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: bold ? (impotDelta > 0 ? '#22c55e' : impotDelta < 0 ? '#f87171' : 'var(--text)') : 'var(--text)', fontWeight: bold ? 700 : 400, minWidth: 100, textAlign: 'right' }}>{twn}</span>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
        Simulation basée sur le revenu imposable estimé à 80 % du brut. Résultat indicatif.
      </p>
    </div>
  );
}
