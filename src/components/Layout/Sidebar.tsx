import { useProfileStore } from '../../stores/profileStore';
import {
  AppIcon,
  IconActions, IconTimeline, IconImpact,
  IconLexique, IconFiche, IconJumeau, IconDecla,
} from '../icons';

const TABS = [
  { id: 'actions',  label: 'Actions fiscales', Icon: IconActions  },
  { id: 'timeline', label: 'Timeline 2026',    Icon: IconTimeline },
  { id: 'impact',   label: 'Impact financier', Icon: IconImpact   },
  { id: 'lexique',  label: 'Lexique',          Icon: IconLexique  },
  { id: 'fiche',    label: 'Ma fiche de paie', Icon: IconFiche    },
  { id: 'jumeau',   label: 'Jumeau fiscal',    Icon: IconJumeau   },
  { id: 'decla',    label: 'Déclaration',      Icon: IconDecla    },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeTab, onTabChange, isOpen = false, onClose }: SidebarProps) {
  const profile = useProfileStore((state) => state.profile);
  const completedActions = useProfileStore((state) => state.completedActions);
  const resetProfile = useProfileStore((state) => (state as any).resetProfile);
  const completionPercent = profile ? Math.round((completedActions.length / 42) * 100) : 0;

  const permitLabel: Record<string, string> = { B: 'Permis B', C: 'Permis C', CH: 'Citoyen CH' };
  const situationLabel = profile?.situation === 'couple' ? 'En couple' : 'Célibataire';
  const housingLabel   = profile?.housing   === 'owner'  ? 'Propriétaire' : 'Locataire';

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onClose?.();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(31,29,27,0.4)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static left-0 top-0 bottom-0 flex flex-col z-50
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          md:transition-none md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: '256px', minWidth: '256px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <AppIcon size={32} />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-none mb-0.5" style={{ color: 'var(--text)' }}>Fiscal Suisse</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Optimiseur 2026</p>
          </div>
        </div>

        {/* Profile card */}
        {profile && (
          <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>Revenu annuel</span>
                <span className="text-sm font-semibold font-mono" style={{ color: 'var(--text)' }}>
                  {profile.income ? `CHF ${(profile.income * 12).toLocaleString('fr-CH')}` : '—'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3.5">
                {[permitLabel[profile.permit] ?? profile.permit, situationLabel, housingLabel].map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>Progression</span>
                  <span className="text-xs font-semibold font-mono" style={{ color: 'var(--accent)' }}>
                    {completedActions.length}/42
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${completionPercent}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <p className="text-xs font-semibold uppercase px-2.5 mb-2"
            style={{ color: 'var(--text-3)', letterSpacing: '0.08em' }}>
            Navigation
          </p>
          <div className="flex flex-col gap-0.5">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="group flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left text-sm transition-all duration-100"
                  style={{
                    fontWeight: active ? 500 : 400,
                    background: active ? 'var(--accent-bg)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-2)',
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span
                    className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                    style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
                  >
                    <Icon size={18} stroke={1.5} />
                  </span>
                  <span className="flex-1 leading-snug">{tab.label}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-4" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <button onClick={() => onTabChange('fiche')}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
            Mon profil
          </button>
          <button onClick={() => resetProfile?.()}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
            Réinitialiser
          </button>
        </div>
      </aside>
    </>
  );
}
