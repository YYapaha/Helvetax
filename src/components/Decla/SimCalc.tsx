import { useRef } from 'react';
import { useDeclaStore } from '../../stores/declaStore';
import { calcSimulation } from '../../data/declaData';
import { SimInputs } from '../../types/decla';

interface SliderRowProps {
  label: string;
  sublabel?: string;
  field: keyof SimInputs;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
  formatValue?: (v: number) => string;
}

function SliderRow({ label, sublabel, field, min, max, step, value, onChange, formatValue }: SliderRowProps) {
  const fmt = formatValue ?? ((v: number) => `CHF ${v.toLocaleString('fr-CH')}`);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
          {sublabel && (
            <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>{sublabel}</span>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
          {fmt(value)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)', height: 4, cursor: 'pointer' }}
        aria-label={label}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{fmt(min)}</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{fmt(max)}</span>
      </div>
    </div>
  );
}

interface ResultRowProps { label: string; value: string; highlight?: boolean; }
function ResultRow({ label, value, highlight }: ResultRowProps) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 13, color: highlight ? 'var(--text)' : 'var(--text-2)', fontWeight: highlight ? 600 : 400 }}>
        {label}
      </span>
      <span style={{
        fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)',
        color: highlight ? 'var(--accent)' : 'var(--text)',
      }}>
        {value}
      </span>
    </div>
  );
}

export function SimCalc() {
  const { simInputs, setSimInput } = useDeclaStore();
  const result = calcSimulation(simInputs);

  const fmt = (n: number) => `CHF ${Math.round(n).toLocaleString('fr-CH')}`;
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)} %`;

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Sliders */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16,
        border: '1px solid var(--border)', padding: '20px 18px',
        display: 'grid', gap: 20,
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', margin: 0 }}>
          Vos paramètres
        </h3>
        <SliderRow label="Revenu brut annuel" field="brut"
          min={30000} max={300000} step={1000} value={simInputs.brut}
          onChange={(v) => setSimInput('brut', v)} />
        <SliderRow label="Pilier 3a" sublabel="max CHF 7'258" field="pillar3a"
          min={0} max={7258} step={100} value={simInputs.pillar3a}
          onChange={(v) => setSimInput('pillar3a', v)} />
        <SliderRow label="Frais professionnels" field="fraisPro"
          min={0} max={25000} step={100} value={simInputs.fraisPro}
          onChange={(v) => setSimInput('fraisPro', v)} />
        <SliderRow label="Primes assurances" field="assurances"
          min={0} max={20000} step={100} value={simInputs.assurances}
          onChange={(v) => setSimInput('assurances', v)} />
        <SliderRow label="Autres déductions" field="autres"
          min={0} max={50000} step={500} value={simInputs.autres}
          onChange={(v) => setSimInput('autres', v)} />
        <SliderRow label="Impôt source déjà payé" sublabel="permis B" field="impotSource"
          min={0} max={60000} step={200} value={simInputs.impotSource}
          onChange={(v) => setSimInput('impotSource', v)} />
      </div>

      {/* Results */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16,
        border: '1px solid var(--border)', padding: '20px 18px',
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', margin: '0 0 4px' }}>
          Simulation
        </h3>
        <ResultRow label="Revenu net" value={fmt(result.revenuNet)} />
        <ResultRow label="Revenu imposable" value={fmt(result.revenuImposable)} />
        <ResultRow label="Impôt estimé" value={fmt(result.impotEstime)} />
        <ResultRow label="Taux marginal" value={fmtPct(result.marginalRate)} />
        {result.remboursement !== 0 && (
          <div style={{
            marginTop: 14, padding: '14px 16px', borderRadius: 12,
            background: result.remboursement > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(201,100,66,0.08)',
            border: `1.5px solid ${result.remboursement > 0 ? 'rgba(16,185,129,0.3)' : 'var(--accent)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: result.remboursement > 0 ? '#059669' : 'var(--accent)' }}>
              {result.remboursement > 0 ? 'Remboursement estimé' : 'Complément dû'}
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: result.remboursement > 0 ? '#059669' : 'var(--accent)' }}>
              {fmt(Math.abs(result.remboursement))}
            </span>
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '14px 0 0', lineHeight: 1.5 }}>
          Estimation indicative. Basée sur le barème Valais 2026. Consultez un conseiller fiscal pour votre situation exacte.
        </p>
      </div>
    </div>
  );
}
