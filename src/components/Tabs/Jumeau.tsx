import { useState, useMemo } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { getMarginalRate } from '../../utils/taxBrackets';
import { generateActions } from '../../utils/generateActions';
import { cleanNumber } from '../../utils/numberUtils';
import type { UserProfile } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString('fr-CH'); }
function pct(n: number) { return (n * 100).toFixed(1) + '%'; }

function delta(a: number, b: number): { chf: number; sign: '+' | '-' | '=' } {
  const d = b - a;
  return { chf: Math.abs(d), sign: d > 0 ? '+' : d < 0 ? '-' : '=' };
}

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
          background: `${color}18`, color,
          fontFamily: 'var(--font-mono)', fontWeight: 600,
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

  // Twin state — initialisé sur le profil actuel
  const [twinIncome,    setTwinIncome]    = useState(String(profile.income));
  const [twinCanton,    setTwinCanton]    = useState(profile.canton);
  const [twinSit,       setTwinSit]       = useState<'single' | 'couple'>(profile.situation);
  const [twinHousing,   setTwinHousing]   = useState<'renter' | 'owner'>(
    profile.housing === 'owner_rental' ? 'owner' : profile.housing as 'renter' | 'owner'
  );
  const [twinChildren,  setTwinChildren]  = useState(profile.children ?? 0);
  const [twinHas3a,     setTwinHas3a]     = useState<'yes' | 'no'>(profile.has3a);

  // Profil jumeau complet
  const twinProfile: UserProfile = useMemo(() => ({
    ...profile,
    income:    cleanNumber(twinIncome),
    canton:    twinCanton,
    situation: twinSit,
    housing:   twinHousing,
    children:  twinChildren,
    has3a:     twinHas3a,
  }), [profile, twinIncome, twinCanton, twinSit, twinHousing, twinChildren, twinHas3a]);

  // Calculs vous
  const annualVous   = cleanNumber(profile.income) * 12;
  const taxVous      = useMemo(() => getMarginalRate(annualVous, profile.canton, profile.situation), [annualVous, profile.canton, profile.situation]);
  const actionsVous  = useMemo(() => generateActions(profile), [profile]);
  const gainVous     = actionsVous.reduce((s, a) => s + a.gain, 0);

  // Calculs jumeau
  const annualJumeau  = cleanNumber(twinIncome) * 12;
  const taxJumeau     = useMemo(() => getMarginalRate(annualJumeau, twinCanton, twinSit), [annualJumeau, twinCanton, twinSit]);
  const actionsJumeau = useMemo(() => generateActions(twinProfile), [twinProfile]);
  const gainJumeau    = actionsJumeau.reduce((s, a) => s + a.gain, 0);

  const impotDelta = taxVous.totalTaxChf - taxJumeau.totalTaxChf;

  // Reset
  const reset = () => {
    setTwinIncome(String(profile.income));
    setTwinCanton(profile.canton);
    setTwinSit(profile.situation);
    setTwinHousing(profile.housing === 'owner_rental' ? 'owner' : profile.housing as 'renter' | 'owner');
    setTwinChildren(profile.children ?? 0);
    setTwinHas3a(profile.has3a);
  };

  const hasChanges = twinCanton !== profile.canton
    || cleanNumber(twinIncome) !== cleanNumber(profile.income)
    || twinSit !== profile.situation
    || twinHousing !== (profile.housing === 'owner_rental' ? 'owner' : profile.housing)
    || twinChildren !== profile.children
    || twinHas3a !== profile.has3a;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Configurateur jumeau */}
      <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Configurer le jumeau</p>
          {hasChanges && (
            <button onClick={reset} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)',
            }}>Réinitialiser</button>
          )}
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {/* Revenu */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
              Revenu mensuel brut (CHF)
            </p>
            <input
              type="number" value={twinIncome} onChange={(e) => setTwinIncome(e.target.value)}
              min="1000" max="50000" step="500"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 14,
                fontFamily: 'var(--font-mono)', background: 'var(--bg)',
                border: '1.5px solid var(--border)', color: 'var(--text)', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>

          {/* Canton */}
          <ToggleGroup
            label="Canton"
            options={[{ v: 'VS', l: 'Valais' }, { v: 'VD', l: 'Vaud' }, { v: 'GE', l: 'Genève' }, { v: 'NE', l: 'Neuchâtel' }]}
            value={twinCanton}
            onChange={setTwinCanton}
          />

          {/* Situation */}
          <ToggleGroup
            label="Situation"
            options={[{ v: 'single', l: 'Célibataire' }, { v: 'couple', l: 'En couple' }]}
            value={twinSit}
            onChange={setTwinSit}
          />

          {/* Logement + Enfants */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ToggleGroup
              label="Logement"
              options={[{ v: 'renter', l: 'Locataire' }, { v: 'owner', l: 'Proprio' }]}
              value={twinHousing}
              onChange={setTwinHousing}
            />
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Enfants</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2, 3].map((n) => (
                  <button key={n} onClick={() => setTwinChildren(n)} style={{
                    flex: 1, padding: '6px 4px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
                    fontWeight: twinChildren === n ? 600 : 400,
                    background: twinChildren === n ? 'rgba(201,100,66,0.12)' : 'var(--bg)',
                    color:      twinChildren === n ? 'var(--accent)' : 'var(--text-3)',
                    border:     `1px solid ${twinChildren === n ? 'var(--accent)' : 'var(--border)'}`,
                  }}>{n === 3 ? '3+' : n}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Pilier 3a */}
          <ToggleGroup
            label="Pilier 3a"
            options={[{ v: 'yes', l: 'Actif' }, { v: 'no', l: 'Inactif' }]}
            value={twinHas3a}
            onChange={setTwinHas3a}
          />
        </div>
      </div>

      {/* Verdict global */}
      {hasChanges && (
        <div style={{
          padding: '14px 18px', borderRadius: 14,
          background: impotDelta > 0 ? 'rgba(34,197,94,0.08)' : impotDelta < 0 ? 'rgba(248,113,113,0.08)' : 'var(--bg-card)',
          border: `1px solid ${impotDelta > 0 ? 'rgba(34,197,94,0.3)' : impotDelta < 0 ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
          textAlign: 'center',
        }}>
          {impotDelta === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Aucune différence d'impôt estimée.</p>
          ) : (
            <>
              <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: impotDelta > 0 ? '#22c55e' : '#f87171' }}>
                {impotDelta > 0 ? '−' : '+'}{fmt(Math.abs(impotDelta))} CHF/an
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                {impotDelta > 0
                  ? `Le jumeau paie ${fmt(impotDelta)} CHF de moins d'impôt par an`
                  : `Le jumeau paie ${fmt(Math.abs(impotDelta))} CHF de plus d'impôt par an`}
              </p>
            </>
          )}
        </div>
      )}

      {/* Tableau comparatif */}
      <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Entête colonnes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <p style={{ flex: 1, fontSize: 12, color: 'var(--text-3)' }}>Indicateur</p>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', minWidth: 90, textAlign: 'right' }}>Vous</p>
          <div style={{ width: 1 }} />
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', minWidth: 90, textAlign: 'right' }}>Jumeau</p>
          <span style={{ minWidth: 60 }} />
        </div>

        <MetricRow label="Impôt total estimé" vous={taxVous.totalTaxChf} jumeau={taxJumeau.totalTaxChf} />
        <MetricRow label="dont IFD" vous={taxVous.ifdTaxChf} jumeau={taxJumeau.ifdTaxChf} />
        <MetricRow label="dont Cantonal+Communal" vous={taxVous.cantonalTaxChf} jumeau={taxJumeau.cantonalTaxChf} />
        <MetricRow label="Taux marginal" vous={taxVous.marginalRate} jumeau={taxJumeau.marginalRate} unit="%" />
        <MetricRow label="Taux effectif" vous={taxVous.effectiveRate} jumeau={taxJumeau.effectiveRate} unit="%" />
        <MetricRow label="Gain actions potentiel" vous={gainVous} jumeau={gainJumeau} lowerIsBetter={false} />
      </div>

      {/* Comparaison visuelle barres */}
      <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Répartition de l'impôt</p>
        {[
          { label: 'IFD',               vous: taxVous.ifdTaxChf,       jumeau: taxJumeau.ifdTaxChf },
          { label: 'Cantonal+Communal', vous: taxVous.cantonalTaxChf,  jumeau: taxJumeau.cantonalTaxChf },
        ].map(({ label, vous, jumeau }) => {
          const max = Math.max(vous, jumeau, 1);
          return (
            <div key={label} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{label}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[{ v: vous, color: 'var(--text-3)', name: 'Vous' }, { v: jumeau, color: 'var(--accent)', name: 'Jumeau' }].map(({ v, color, name }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color, width: 42, textAlign: 'right' }}>{name}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 8, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 8, background: color, width: `${(v / max) * 100}%`, transition: 'width 400ms ease' }} />
                    </div>
                    <span style={{ fontSize: 11, color, fontFamily: 'var(--font-mono)', width: 72, textAlign: 'right' }}>{fmt(v)} CHF</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5 }}>
        Simulation basée sur revenu imposable estimé à 80% du brut. Coefficients communaux par défaut (VS: Sion 1.30, VD: Lausanne 1.345).
      </p>
    </div>
  );
}
