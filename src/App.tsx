import { useState } from 'react';
import { cleanNumber } from './utils/numberUtils';
import { LegalDisclaimer } from './components/Shared/LegalDisclaimer';
import { Sidebar } from './components/Layout/Sidebar';
import { ActionsTab } from './components/Tabs/Actions';
import { TimelineTab } from './components/Tabs/Timeline';
import { FicheTab } from './components/Tabs/Fiche';
import { DeclaTab } from './components/Tabs/Decla';
import { ImpactTab } from './components/Tabs/Impact';
import { LexiqueTab } from './components/Tabs/Lexique';
import { JumeauTab } from './components/Tabs/Jumeau';
import { PageHeader } from './components/Layout/PageHeader';
import { BottomNav } from './components/Layout/BottomNav';
import { useProfileStore } from './stores/profileStore';
import type { Canton } from './utils/cantonConfig';
import './index.css';

const TAB_SHORT_LABELS: Record<string, string> = {
  actions:  'Actions',
  timeline: 'Timeline',
  impact:   'Impact',
  lexique:  'Lexique',
  fiche:    'Ma fiche',
  decla:    'Déclaration',
  jumeau:   'Jumeau',
};

const HEADERS: Record<string, { eyebrow: string; title: string; accent: string }> = {
  actions:  { eyebrow: 'Vos leviers fiscaux',        title: 'Gain potentiel',  accent: 'identifié' },
  timeline: { eyebrow: 'Année fiscale 2026',         title: '12 mois',         accent: 'à suivre' },
  impact:   { eyebrow: 'Calculs personnalisés',      title: 'Votre impact',    accent: 'financier' },
  lexique:  { eyebrow: 'Vocabulaire fiscal',         title: 'Tout',            accent: 'simplifié' },
  fiche:    { eyebrow: 'Votre profil',               title: 'Ma fiche',        accent: 'de paie' },
  jumeau:   { eyebrow: 'Simulateur',                 title: 'Votre jumeau',    accent: 'fiscal' },
  decla:    { eyebrow: 'Aide à la déclaration',      title: 'Déclaration',     accent: '2026' },
};

function Onboarding({ onComplete }: { onComplete: (data: any) => void }) {
  const [canton, setCanton]             = useState<Canton>('VS');
  const [sit, setSit]                   = useState('single');
  const [income, setIncome]             = useState('5000');
  const [fortune, setFortune]           = useState('');
  const [permit, setPermit]             = useState('B');
  const [housing, setHousing]           = useState('renter');
  const [has3a, setHas3a]               = useState<'yes' | 'no'>('no');
  const [children, setChildren]         = useState(0);
  const [conjointPermit, setConjointPermit] = useState<'B' | 'C' | 'CH'>('B');
  const [coupleIncomeType, setCoupleIncomeType] = useState<'single' | 'dual'>('single');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      canton,
      situation: sit,
      children: cleanNumber(children),
      income: cleanNumber(income),
      permit,
      housing,
      activity: 'employee',
      has3a,
      conjoint_permit: sit === 'couple' ? conjointPermit : '',
      fortune: fortune ? cleanNumber(fortune) : 0,
      coupleIncomeType: sit === 'couple' ? coupleIncomeType : 'single',
    });
  };

  const toggleStyle = (active: boolean): React.CSSProperties => active
    ? { background: 'rgba(201,100,66,0.12)', color: 'var(--accent)', border: '1.5px solid var(--accent)', fontWeight: 600 }
    : { background: 'var(--bg)', color: 'var(--text-2)', border: '1.5px solid var(--border)' };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 500,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    marginBottom: 8, color: 'var(--text-2)',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '56px 24px 40px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <div className="eyebrow" style={{ color: 'var(--text-inv-2)', marginBottom: 20 }}>
          Helvetax · Bêta privée
        </div>
        <h1 className="display" style={{ fontSize: 'var(--fs-display-xl)', color: 'var(--text-inv)', marginBottom: 16, lineHeight: 1.05 }}>
          Bienvenue.<br />
          <span className="italic-accent">Optimisons.</span>
        </h1>
        <p style={{ color: 'var(--text-inv-2)', fontSize: 15, lineHeight: 1.6, maxWidth: 320, margin: 0 }}>
          2 minutes. Calculs 100&nbsp;% locaux&nbsp;— aucune donnée ne quitte votre appareil.
        </p>
      </div>

      <form
        onSubmit={submit}
        style={{ background: 'var(--bg)', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '32px 24px 40px', maxWidth: 500, width: '100%', marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 -8px 40px rgba(15,12,9,0.35)' }}
      >
        <div style={{ display: 'grid', gap: 20 }}>

          {/* Canton */}
          <div>
            <label style={labelStyle}>Canton</label>
            <select value={canton} onChange={(e) => setCanton(e.target.value as Canton)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14, background: 'var(--bg-card)', border: '1.5px solid var(--border)', color: 'var(--text)', outline: 'none', appearance: 'none' as const }}>
              <option value="VS">Valais (VS)</option>
              <option value="VD">Vaud (VD)</option>
              <option value="GE">Genève (GE)</option>
              <option value="NE">Neuchâtel (NE)</option>
            </select>
          </div>

          {/* Permit */}
          <div>
            <label style={labelStyle}>Statut de résidence</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(['B', 'C', 'CH'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPermit(p)}
                  style={{ padding: '10px 8px', borderRadius: 12, fontSize: 13, cursor: 'pointer', transition: 'all 150ms', ...toggleStyle(permit === p) }}>
                  {p === 'CH' ? 'Citoyen' : 'Permis ' + p}
                </button>
              ))}
            </div>
          </div>

          {/* Situation civile */}
          <div>
            <label style={labelStyle}>Situation civile</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ v: 'single', l: 'Célibataire' }, { v: 'couple', l: 'En couple' }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setSit(v)}
                  style={{ padding: '10px 8px', borderRadius: 12, fontSize: 13, cursor: 'pointer', transition: 'all 150ms', ...toggleStyle(sit === v) }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Permis conjoint — conditionnel */}
          {sit === 'couple' && (
            <div>
              <label style={labelStyle}>Statut de résidence du conjoint</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(['B', 'C', 'CH'] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setConjointPermit(p)}
                    style={{ padding: '10px 8px', borderRadius: 12, fontSize: 13, cursor: 'pointer', transition: 'all 150ms', ...toggleStyle(conjointPermit === p) }}>
                    {p === 'CH' ? 'Citoyen' : 'Permis ' + p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Revenus du couple — conditionnel */}
          {sit === 'couple' && (
            <div>
              <label style={labelStyle}>Revenus du ménage</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([
                  { v: 'single', l: '1 revenu', sub: 'barème C' },
                  { v: 'dual',   l: '2 revenus', sub: 'barème B' },
                ] as const).map(({ v, l, sub }) => (
                  <button key={v} type="button" onClick={() => setCoupleIncomeType(v)}
                    style={{ padding: '10px 8px', borderRadius: 12, fontSize: 13, cursor: 'pointer', transition: 'all 150ms', ...toggleStyle(coupleIncomeType === v) }}>
                    {l}
                    <span style={{ display: 'block', fontSize: 10, opacity: 0.65, marginTop: 2, fontWeight: 400 }}>{sub}</span>
                  </button>
                ))}
              </div>
              {coupleIncomeType === 'dual' && (
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5, margin: '6px 0 0' }}>
                  Le barème B (splitting) s'applique lorsque les deux conjoints ont un revenu propre soumis à l'impôt à la source.
                </p>
              )}
            </div>
          )}

          {/* Enfants */}
          <div>
            <label style={labelStyle}>Enfants à charge</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[0, 1, 2, 3].map((n) => (
                <button key={n} type="button" onClick={() => setChildren(n)}
                  style={{ padding: '10px 8px', borderRadius: 12, fontSize: 13, cursor: 'pointer', transition: 'all 150ms', ...toggleStyle(children === n) }}>
                  {n === 3 ? '3+' : String(n)}
                </button>
              ))}
            </div>
          </div>

          {/* Logement */}
          <div>
            <label style={labelStyle}>Logement</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ v: 'renter', l: 'Locataire' }, { v: 'owner', l: 'Propriétaire' }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setHousing(v)}
                  style={{ padding: '10px 8px', borderRadius: 12, fontSize: 13, cursor: 'pointer', transition: 'all 150ms', ...toggleStyle(housing === v) }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Pilier 3a */}
          <div>
            <label style={labelStyle}>Pilier 3a actif</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['yes', 'no'] as const).map((v) => (
                <button key={v} type="button" onClick={() => setHas3a(v)}
                  style={{ padding: '10px 8px', borderRadius: 12, fontSize: 13, cursor: 'pointer', transition: 'all 150ms', ...toggleStyle(has3a === v) }}>
                  {v === 'yes' ? 'Oui' : 'Non'}
                </button>
              ))}
            </div>
          </div>

          {/* Revenu */}
          <div>
            <label style={labelStyle}>Revenu mensuel brut (CHF)</label>
            <input
              type="number" value={income} onChange={(e) => setIncome(e.target.value)}
              min="1000" max="50000" step="100"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 15, fontFamily: 'var(--font-mono)', background: 'var(--bg-card)', border: '1.5px solid var(--border)', color: 'var(--text)', outline: 'none' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,100,66,0.12)'; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Fortune */}
          <div>
            <label style={labelStyle}>
              Fortune nette estimée (CHF) —{' '}
              <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.7 }}>optionnel</span>
            </label>
            <input
              type="number" value={fortune} onChange={(e) => setFortune(e.target.value)}
              min="0" max="50000000" step="10000"
              placeholder="ex : 150 000 (comptes, titres, crypto…)"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 15, fontFamily: 'var(--font-mono)', background: 'var(--bg-card)', border: '1.5px solid var(--border)', color: 'var(--text)', outline: 'none' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,100,66,0.12)'; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.boxShadow = 'none'; }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5, margin: '6px 0 0' }}>
              Épargne + placements + immobilier − dettes. Utilisé pour l'impôt sur la fortune.
            </p>
          </div>

          <button
            type="submit"
            style={{ width: '100%', height: 52, borderRadius: 14, fontSize: 15, fontWeight: 600, color: '#fff', background: 'var(--accent)', border: 'none', cursor: 'pointer', transition: 'background 150ms', letterSpacing: '0.01em' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-dark)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
          >
            Démarrer l'optimisation →
          </button>
        </div>
      </form>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 80, borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, background: 'var(--accent-bg)', color: 'var(--accent)' }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="11" cy="11" r="9" /><path d="M11 7v5l3 2" />
        </svg>
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: 'var(--text)' }}>{label}</p>
      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Bientôt disponible</p>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('actions');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profile    = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);

  if (!profile) return <Onboarding onComplete={setProfile} />;

  const header = HEADERS[activeTab] ?? HEADERS.actions;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
        <div
          className="md:hidden flex items-center gap-2"
          style={{ position: 'fixed', top: 12, left: 12, zIndex: 40 }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(31,29,27,0.08)', cursor: 'pointer', flexShrink: 0 }}
            aria-label="Menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-2)" strokeWidth="1.6" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4" /><line x1="2" y1="8" x2="14" y2="8" /><line x1="2" y1="12" x2="14" y2="12" />
            </svg>
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.01em' }}>
            {TAB_SHORT_LABELS[activeTab] ?? activeTab}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }} className="pb-20 md:pb-0">
          <div key={activeTab} className="max-w-3xl mx-auto px-5 lg:px-8 pt-6 md:pt-0 animate-slide-up">
            <PageHeader eyebrow={header.eyebrow} title={header.title} accent={header.accent} />
            <div style={{ paddingBottom: 40 }}>
              {activeTab === 'actions'  && <ActionsTab />}
              {activeTab === 'timeline' && <TimelineTab />}
              {activeTab === 'impact'   && <ImpactTab onGoToActions={() => setActiveTab('actions')} />}
              {activeTab === 'lexique'  && <LexiqueTab />}
              {activeTab === 'fiche'    && <FicheTab />}
              {activeTab === 'jumeau'   && <JumeauTab />}
              {activeTab === 'decla'    && <DeclaTab />}
              <LegalDisclaimer compact />
            </div>
          </div>
        </div>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
    </div>
  );
}

export default App;
