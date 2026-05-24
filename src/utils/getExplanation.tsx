import type { UserProfile } from '../types';
import { getCantonConfig } from './cantonConfig';
import { getMarginalRateSimple } from './taxBrackets';
import { cleanNumber } from './numberUtils';

interface Action {
  id: string;
  titre: string;
  gain: number;
  category: string;
  why?: string;
  source?: string;
}

interface Section {
  title: string;
  content: React.ReactNode;
}

export interface Explanation {
  sections: Section[];
  source?: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────── */

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span className="font-mono font-semibold" style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
    </div>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-xl p-4 space-y-1"
      style={{ background: accent ? 'var(--accent-bg)' : 'var(--bg)', border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}` }}>
      {children}
    </div>
  );
}

function Alert({ type, children }: { type: 'warn' | 'ok' | 'err'; children: React.ReactNode }) {
  const cfg = {
    warn: { bg: '#FDF6EC', border: '#F0C478', color: '#C9830A' },
    ok:   { bg: '#EFFAF5', border: '#A8DFC4', color: '#2E9E6B' },
    err:  { bg: '#FDF0F0', border: '#F0A0A0', color: '#C94242' },
  }[type];
  return (
    <div className="rounded-xl p-3.5 text-sm leading-relaxed"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      {children}
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center mt-0.5"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{i + 1}</span>
          <span className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main function ─────────────────────────────────────────────────── */

export function getExplanation(action: Action, profile: UserProfile): Explanation {
  const cc = getCantonConfig(profile.canton);
  const isCouple = profile.situation === 'couple';
  const income = cleanNumber(profile.income);
  const annualIncome = income * 12;
  const children = cleanNumber(profile.children);

  const marginalRate = getMarginalRateSimple(annualIncome, profile.canton ?? 'VS', profile.situation ?? 'single');
  const rPct = Math.round(marginalRate * 100);

  const explanations: Record<string, Explanation> = {

    /* ── 1 : Pilier 3a ───────────────────────────────────────────────── */
    '1': {
      source: 'https://www.admin.ch/gov/fr/accueil/documentation/communiques.msg-id-100556.html',
      sections: [
        {
          title: 'Mécanisme',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Le pilier 3a est un compte de prévoyance liée. Chaque franc versé est déductible
              de ton revenu imposable, ce qui réduit directement l'impôt de l'année en cours.
              Le plafond 2026 est de <strong style={{ color: 'var(--text)' }}>7'258 CHF</strong> par
              personne{isCouple ? ' (14\'516 CHF pour vous deux)' : ''}.
            </p>
          ),
        },
        {
          title: 'Impact concret',
          content: (
            <Card accent>
              <Row label="Versement annuel" value={`CHF ${(7258 * (isCouple ? 2 : 1)).toLocaleString('fr-CH')}`} />
              <Row label="Réduction d'impôt" value={`− CHF ${action.gain.toLocaleString('fr-CH')}`} accent />
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <Row label="Coût réel net" value={`CHF ${(7258 * (isCouple ? 2 : 1) - action.gain).toLocaleString('fr-CH')}`} />
              </div>
            </Card>
          ),
        },
        {
          title: 'Choix du véhicule',
          content: (
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
              <p><strong style={{ color: 'var(--text)' }}>3a en titres (recommandé)</strong> — VIAC, finpension, Frankly. Rendement historique ~5-7%/an en stratégie actions. Dividendes et plus-values non imposés dans le compte.</p>
              <p><strong style={{ color: 'var(--text)' }}>3a en compte épargne</strong> — Taux actuels : 0.2-0.8%. Le capital ne croît pas suffisamment pour compenser l'inflation à long terme.</p>
            </div>
          ),
        },
        {
          title: 'Trois erreurs fréquentes',
          content: (
            <div className="space-y-3">
              {[
                ['Un seul compte 3a', 'À la retraite, chaque retrait est imposé progressivement. 3-5 comptes distincts permettent d\'étaler les retraits sur plusieurs années et de réduire le taux marginal appliqué.'],
                ['Verser en décembre', 'Tu perds 11 mois de rendement composé. Programme un ordre permanent en janvier.'],
                ['Utiliser la banque de ton employeur', 'Frais de gestion : 0.44%/an chez VIAC vs 0.8-1.5% en banque traditionnelle. L\'écart est significatif sur 20-30 ans.'],
              ].map(([t, d]) => (
                <div key={t as string} className="flex gap-3">
                  <span className="flex-shrink-0 mt-0.5 text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: '#FDF0F0', color: '#C94242' }}>✕</span>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{t as string}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{d as string}</p>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
      ],
    },

    /* ── 2 : Frais professionnels ─────────────────────────────────────── */
    '2': {
      sections: [
        {
          title: 'Principe',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Les frais professionnels réduisent ton revenu imposable de manière forfaitaire — aucun justificatif à fournir. L'administration fiscale accepte ces montants sur simple déclaration.
            </p>
          ),
        },
        {
          title: 'Frais déductibles',
          content: (
            <div className="space-y-3 text-sm">
              <Card>
                <p className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Transport domicile–travail</p>
                <Row label="Voiture" value="distance × 0.70 CHF/km (max 3'000)" />
                <Row label="Vélo" value="700 CHF/an (forfait)" />
                <Row label="Transports publics" value="montant exact de l'abonnement" />
              </Card>
              <Card>
                <p className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Repas hors domicile</p>
                <p style={{ color: 'var(--text-2)' }}>Sans cantine subventionnée : <strong>3'200 CHF/an forfaitaires</strong>{isCouple ? ' par personne' : ''}, soit 15 CHF par jour travaillé. Aucun ticket à conserver.</p>
              </Card>
            </div>
          ),
        },
        {
          title: 'Simulation',
          content: (
            <Card accent>
              <Row label="Frais transport estimés" value={`CHF ${(3000 * (isCouple ? 2 : 1)).toLocaleString('fr-CH')}`} />
              <Row label="Frais repas" value={`CHF ${(3200 * (isCouple ? 2 : 1)).toLocaleString('fr-CH')}`} />
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <Row label="Réduction d'impôt estimée" value={`− CHF ${action.gain.toLocaleString('fr-CH')}`} accent />
              </div>
            </Card>
          ),
        },
        {
          title: 'À noter',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Si ton employeur rembourse une partie des frais de transport, tu déduis uniquement ta part non remboursée. Le forfait repas reste intégralement déductible même avec un remboursement partiel.
            </p>
          ),
        },
      ],
    },

    /* ── 3 : Subsides LAMal (canton-aware) ─────────────────────────── */
    '3': {
      source: cc.subsidesURL,
      sections: [
        {
          title: 'Mécanisme du subside',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              {profile.canton === 'GE'
                ? 'Genève offre parmi les subsides LAMal les plus élevés de Suisse. Le SPC (Service des prestations complémentaires) verse la réduction directement à ta caisse maladie — tu paies uniquement la différence.'
                : profile.canton === 'VD'
                ? "Le canton de Vaud subventionne les primes LAMal via le SAM (Service de l'assurance maladie). Contrairement à d'autres cantons, la demande n'est pas automatique — tu dois en faire la démarche chaque année."
                : profile.canton === 'NE'
                ? "Neuchâtel verse des subsides LAMal via le service cantonal. La demande doit être formulée auprès du service compétent — elle n'est pas automatique."
                : "Le Valais verse une réduction de prime directement à ta caisse maladie. Le subside est calculé sur ta dernière taxation fiscale. C'est automatique — aucune demande à formuler si tu es éligible."}
            </p>
          ),
        },
        {
          title: 'Conditions 2026',
          content: (
            <Card>
              {[
                ['Revenu', `< 90'000 CHF/an`],
                ['Fortune', `< 1'000'000 CHF`],
                ['Domicile', `${cc.name} au 1er janvier 2026`],
                ['Couverture', 'Assuré LAMal obligatoire'],
              ].map(([l, v]) => (
                <Row key={l as string} label={l as string} value={v as string} />
              ))}
            </Card>
          ),
        },
        {
          title: profile.canton === 'VS' ? 'Démarche (automatique)' : 'Démarche (demande requise)',
          content: (
            <Steps items={
              profile.canton === 'VS' ? [
                `Va sur ${cc.subsidesURL} et utilise le simulateur de subsidiation`,
                'Si éligible, la demande est traitée automatiquement — pas de formulaire',
                'Notification reçue fin février 2026',
                'Le subside est versé directement à ta caisse — ta prime diminue automatiquement',
              ] : profile.canton === 'VD' ? [
                `Va sur ${cc.subsidesURL} et complète le formulaire de demande`,
                'La demande doit être renouvelée chaque année avant le 30 septembre',
                'Délai de traitement : 4-6 semaines',
                'Le subside est versé directement à ta caisse maladie',
              ] : profile.canton === 'GE' ? [
                `Va sur ${cc.subsidesURL} — calculateur en ligne disponible`,
                "Si tu n'es pas encore bénéficiaire, dépose une demande en ligne",
                'Réévaluation annuelle automatique si déjà bénéficiaire',
                'Versement direct à ta caisse maladie chaque mois',
              ] : [
                `Contacte le service cantonal : ${cc.subsidesURL}`,
                'Formule une demande avec les pièces justificatives (revenus, composition du ménage)',
                'Réévaluation annuelle selon ton revenu',
                'Versement direct à ta caisse maladie',
              ]
            } />
          ),
        },
        {
          title: 'Délai important',
          content: (
            <Alert type="warn">
              {cc.subsidesDeadline}
            </Alert>
          ),
        },
      ],
    },

    /* ── 4 : Comparaison primes LAMal ────────────────────────────────── */
    '4': {
      source: 'https://www.priminfo.admin.ch',
      sections: [
        {
          title: 'Pourquoi les prestations de base sont identiques',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              La LAMal impose des prestations uniformes à toutes les caisses. La différence de prime reflète uniquement la structure de coûts et la composition du portefeuille assurés — pas la qualité des soins remboursés.
            </p>
          ),
        },
        {
          title: 'Trois leviers d\'optimisation',
          content: (
            <div className="space-y-3 text-sm">
              {[
                ['Changement de caisse', 'Économie : 200-400 CHF/an. Comparer sur priminfo.ch en septembre. Deadline : 30 novembre pour entrée en vigueur au 1er janvier.'],
                ['Modèle de soins alternatif', 'Médecin de famille : −15 à 20%. HMO : −20 à 25%. Télémédecine : −15 à 20%. Contrepartie : passage obligatoire par un médecin référent.'],
                ['Franchise élevée', `Si tu consultes rarement : passer de 300 à 2'500 CHF de franchise réduit la prime de 100-150 CHF/mois. Pertinent si tes dépenses annuelles de santé restent sous la franchise choisie.`],
              ].map(([t, d], i) => (
                <Card key={i}>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>{i + 1}. {t as string}</p>
                  <p style={{ color: 'var(--text-2)' }}>{d as string}</p>
                </Card>
              ))}
            </div>
          ),
        },
        {
          title: 'Simulation optimisation complète',
          content: (
            <Card>
              <Row label="Prime actuelle estimée" value={`${isCouple ? '900' : '450'} CHF/mois`} />
              <Row label="Après changement caisse (−15%)" value={`${isCouple ? '765' : '383'} CHF/mois`} />
              <Row label="Après modèle alternatif (−20%)" value={`${isCouple ? '612' : '306'} CHF/mois`} />
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <Row label="Économie annuelle" value={`≈ CHF ${action.gain.toLocaleString('fr-CH')}`} accent />
              </div>
            </Card>
          ),
        },
      ],
    },

    /* ── 5 : Rachat LPP ──────────────────────────────────────────────── */
    '5': {
      sections: [
        {
          title: 'Mécanisme',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Ta caisse calcule un avoir théorique (ce que tu aurais accumulé si tu avais cotisé au maximum depuis 25 ans). L'écart entre ce montant et ton avoir réel constitue tes lacunes rachetables — déductibles fiscalement comme le pilier 3a.
            </p>
          ),
        },
        {
          title: 'Causes fréquentes de lacunes',
          content: (
            <div className="flex flex-wrap gap-2">
              {['Années à l\'étranger', 'Période d\'études', 'Temps partiel prolongé', 'Changements d\'employeur fréquents', 'Augmentation de salaire récente'].map((c) => (
                <span key={c} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--bg-sidebar)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{c}</span>
              ))}
            </div>
          ),
        },
        {
          title: '3a vs LPP : ordre de priorité',
          content: (
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
              <p>Priorité absolue : <strong style={{ color: 'var(--text)' }}>maximise d'abord le pilier 3a</strong>, puis effectue des rachats LPP avec l'excédent de capacité fiscale.</p>
              <p>Dans le 3a, tu choisis ton allocation (99% actions, ~5-7%/an historique). Dans le LPP, c'est la caisse qui gère — taux minimum légal actuellement fixé à 1%/an. L'avantage fiscal est identique, mais le capital final diverge fortement.</p>
            </div>
          ),
        },
        {
          title: 'Contrainte à anticiper',
          content: (
            <Alert type="warn">
              <p className="font-semibold mb-1">Délai de blocage de 3 ans</p>
              <p style={{ color: 'var(--text-2)' }}>Si tu effectues un rachat LPP, ces fonds ne peuvent pas être retirés pour l'achat d'une résidence principale pendant 3 ans. En cas de retrait anticipé, tu devras restituer l'économie fiscale. Si tu envisages un achat immobilier à court terme, diffère les rachats.</p>
            </Alert>
          ),
        },
      ],
    },

    /* ── 6 : Coefficient / taux communal ──────────────────────────── */
    '6': {
      source: cc.taxURL,
      sections: [
        {
          title: `Impact du coefficient communal — ${cc.name}`,
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              {profile.canton === 'GE'
                ? "Genève n'a pas de coefficient communal — le taux cantonal est uniforme sur tout le territoire. Avantage : pas de variation selon la commune de résidence."
                : profile.canton === 'VD'
                ? "En Vaud, chaque commune applique un taux additionnel à l'impôt cantonal. L'écart entre les communes les moins et les plus chargées peut dépasser 4'000 CHF/an pour un même revenu."
                : profile.canton === 'NE'
                ? "À Neuchâtel, les communes appliquent un pourcentage de l'impôt cantonal. L'écart entre communes peut représenter 2'000–3'000 CHF/an sur un revenu moyen."
                : "En Valais, les 126 communes appliquent un coefficient multiplicateur à l'impôt cantonal de base. Pour un même revenu, l'écart peut dépasser 5'000 CHF/an."}
            </p>
          ),
        },
        {
          title: `Coefficients / taux principaux 2026 — ${cc.name}`,
          content: (
            <div className="rounded-xl overflow-hidden text-xs font-mono" style={{ border: '1px solid var(--border)' }}>
              {(profile.canton === 'VS'
                ? [['Zermatt', '110%', true], ['Verbier / Bagnes', '115%', true], ['Crans-Montana', '120%', true], ['Sion', '130%', false], ['Sierre', '135%', false], ['Martigny', '138%', false], ['Monthey', '145%', false]]
                : profile.canton === 'VD'
                ? [['Gland', '0.595', true], ['Nyon', '0.655', true], ['Morges', '0.680', true], ['Lausanne', '0.795', false], ['Renens', '0.795', false], ['Yverdon', '0.800', false], ['Payerne', '0.810', false]]
                : profile.canton === 'NE'
                ? [['Neuchâtel', '80%', true], ['La Chaux-de-Fonds', '86%', false], ['Le Locle', '91%', false], ['Boudry', '79%', true], ['Val-de-Travers', '88%', false]]
                : [['Genève', 'Taux unique', true], ['Pas de variation', 'par commune', true]]
              ).map(([c, k, low]) => (
                <div key={c as string} className="flex justify-between px-3 py-2"
                  style={{ borderBottom: '1px solid var(--border-soft)', color: (low as boolean) ? '#2E9E6B' : 'var(--text-2)' }}>
                  <span>{c as string}</span><span className="font-semibold">{k as string}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: 'Note importante',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              {cc.coefficientNote}
            </p>
          ),
        },
      ],
    },
    /* ── 7 : Formation continue ──────────────────────────────────────── */
    '7': {
      sections: [
        {
          title: 'Plafond 2026',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Depuis 2024, le plafond est passé de 3'000 à <strong style={{ color: 'var(--text)' }}>12'700 CHF/an</strong>. Condition : la formation doit être en lien direct avec ton activité professionnelle actuelle ou un développement dans le même domaine.
            </p>
          ),
        },
        {
          title: 'Ce qui est déductible',
          content: (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg p-3" style={{ background: '#EFFAF5', border: '1px solid #2E9E6B' }}>
                <p className="font-semibold mb-1.5" style={{ color: '#2E9E6B' }}>Déductible</p>
                {['Cours certifiants (CAS, MAS)', 'Formations techniques', 'Langues (usage pro)', 'Conférences professionnelles', 'Livres et abonnements pro'].map(i => <p key={i} className="py-0.5" style={{ color: 'var(--text-2)' }}>{i}</p>)}
              </div>
              <div className="rounded-lg p-3" style={{ background: '#FDF0F0', border: '1px solid #C94242' }}>
                <p className="font-semibold mb-1.5" style={{ color: '#C94242' }}>Non déductible</p>
                {['Reconversion totale (1er diplôme)', 'Hobbies personnels', 'Permis de conduire', 'Formations sans lien professionnel'].map(i => <p key={i} className="py-0.5" style={{ color: 'var(--text-2)' }}>{i}</p>)}
              </div>
            </div>
          ),
        },
        {
          title: 'Coût réel après déduction',
          content: (
            <Card accent>
              <Row label="Formation 5'000 CHF" value="CHF 5'000" />
              <Row label={`Économie fiscale (${rPct}%)`} value={`− CHF ${Math.round(5000 * marginalRate).toLocaleString('fr-CH')}`} accent />
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <Row label="Coût réel" value={`CHF ${(5000 - Math.round(5000 * marginalRate)).toLocaleString('fr-CH')}`} />
              </div>
            </Card>
          ),
        },
      ],
    },

    /* ── 8 : ETF capitalisant VWCE ───────────────────────────────────── */
    '8': {
      sections: [
        {
          title: 'Capitalisant vs Distribuant',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Un ETF <strong style={{ color: 'var(--text)' }}>capitalisant</strong> réinvestit automatiquement les dividendes. Un ETF distribuant les verse en cash. En Suisse, les dividendes reçus s'ajoutent à ton revenu imposable l'année de versement — pas les plus-values du capitalisant.
            </p>
          ),
        },
        {
          title: 'VWCE en détail',
          content: (
            <Card>
              <Row label="Nom complet" value="Vanguard FTSE All-World UCITS ETF" />
              <Row label="ISIN" value="IE00BK5BQT80" />
              <Row label="Domicile" value="Irlande (convention fiscale optimale)" />
              <Row label="TER (frais annuels)" value="0.22 %/an" />
              <Row label="Type" value="Capitalisant — 0 impôt sur dividendes" accent />
            </Card>
          ),
        },
        {
          title: 'Économie sur 100k CHF investis',
          content: (
            <Card accent>
              <Row label="Dividendes annuels estimés (~2%)" value="CHF 2'000" />
              <Row label="Impôt sur dividendes distribuant (25%)" value="CHF 500" />
              <Row label="Impôt avec VWCE capitalisant" value="CHF 0" accent />
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <Row label="Économie annuelle" value={`≈ CHF ${action.gain.toLocaleString('fr-CH')}`} accent />
              </div>
            </Card>
          ),
        },
        {
          title: 'Impôt anticipé à récupérer',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Sur les ETF suisses, l'État prélève 35% d'impôt anticipé sur les dividendes — récupérable uniquement en le déclarant. Les ETF domiciliés en Irlande (VWCE) ne sont pas soumis à cet impôt anticipé suisse.
            </p>
          ),
        },
      ],
    },

    /* ── 9 : Frais garde enfants ─────────────────────────────────────── */
    '9': {
      sections: [
        {
          title: 'Plafonds 2026',
          content: (
            <Card>
              <Row label="Valais (cantonal)" value={`CHF 3'060/enfant`} />
              <Row label="Fédéral (IFD)" value={`CHF 25'500/enfant`} />
              <Row label="Pour tes {children} enfant(s)" value={`CHF ${(3060 * children).toLocaleString('fr-CH')} + IFD`} accent />
            </Card>
          ),
        },
        {
          title: 'Ce qui est déductible',
          content: (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg p-3" style={{ background: '#EFFAF5', border: '1px solid #2E9E6B' }}>
                <p className="font-semibold mb-1.5" style={{ color: '#2E9E6B' }}>Déductible</p>
                {['Crèche agréée', 'Garderie', 'Parascolaire', 'Maman de jour agréée'].map(i => <p key={i} className="py-0.5" style={{ color: 'var(--text-2)' }}>{i}</p>)}
              </div>
              <div className="rounded-lg p-3" style={{ background: '#FDF0F0', border: '1px solid #C94242' }}>
                <p className="font-semibold mb-1.5" style={{ color: '#C94242' }}>Non déductible</p>
                {['Grands-parents', 'Baby-sitting occasionnel', 'Enfant > 14 ans', 'Parent non salarié'].map(i => <p key={i} className="py-0.5" style={{ color: 'var(--text-2)' }}>{i}</p>)}
              </div>
            </div>
          ),
        },
        {
          title: 'Condition clé',
          content: (
            <Alert type="warn">
              Les deux parents doivent exercer une activité lucrative ou être en formation pour que les frais de garde soient déductibles. Un parent au foyer exclut la déduction.
            </Alert>
          ),
        },
      ],
    },

    /* ── 10 : Frais médicaux ─────────────────────────────────────────── */
    '10': {
      sections: [
        {
          title: 'Règle du seuil 5%',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Seuls les frais médicaux <strong style={{ color: 'var(--text)' }}>non remboursés</strong> qui dépassent 5% du revenu net imposable sont déductibles. En dessous du seuil : aucune déduction possible.
            </p>
          ),
        },
        {
          title: 'Ton seuil 2026',
          content: (
            <Card accent>
              <Row label="Revenu annuel estimé" value={`CHF ${annualIncome.toLocaleString('fr-CH')}`} />
              <Row label="Seuil 5%" value={`CHF ${Math.round(annualIncome * 0.05).toLocaleString('fr-CH')}`} />
              <Row label="Frais au-delà = déductibles" value="→ réduction immédiate" accent />
            </Card>
          ),
        },
        {
          title: 'Frais éligibles',
          content: (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg p-3" style={{ background: '#EFFAF5', border: '1px solid #2E9E6B' }}>
                <p className="font-semibold mb-1.5" style={{ color: '#2E9E6B' }}>Déductible</p>
                {['Dentiste', 'Lunettes / lentilles', 'Médicaments sur ordonnance', 'Physio, ostéo', 'Appareils auditifs'].map(i => <p key={i} className="py-0.5" style={{ color: 'var(--text-2)' }}>{i}</p>)}
              </div>
              <div className="rounded-lg p-3" style={{ background: '#FDF0F0', border: '1px solid #C94242' }}>
                <p className="font-semibold mb-1.5" style={{ color: '#C94242' }}>Non déductible</p>
                {['Soins esthétiques', 'Vitamines sans ordonnance', 'Abonnement fitness', 'Remboursé par assurance'].map(i => <p key={i} className="py-0.5" style={{ color: 'var(--text-2)' }}>{i}</p>)}
              </div>
            </div>
          ),
        },
        {
          title: 'Stratégie',
          content: (
            <Alert type="ok">
              Si tu as des soins importants planifiés (orthodontie, lunettes progressives), concentre-les sur une seule année fiscale pour dépasser le seuil et maximiser la déduction.
            </Alert>
          ),
        },
      ],
    },

    /* ── 11 : Dons Zewo ──────────────────────────────────────────────── */
    '11': {
      source: 'https://www.zewo.ch/fr',
      sections: [
        {
          title: 'Condition principale',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Les dons sont déductibles uniquement si l'organisation bénéficiaire est reconnue d'utilité publique et exonérée d'impôt. En Suisse, le label <strong style={{ color: 'var(--text)' }}>Zewo</strong> est la référence — il garantit la transparence et l'affectation des fonds.
            </p>
          ),
        },
        {
          title: 'Plafond et calcul',
          content: (
            <Card accent>
              <Row label="Plafond déductible" value="20% du revenu net" />
              <Row label="Minimum requis" value="100 CHF/an (IFD)" />
              <Row label="Don 500 CHF × taux marginal" value={`CHF ${Math.round(500 * marginalRate).toLocaleString('fr-CH')} économisés`} accent />
            </Card>
          ),
        },
        {
          title: 'Organisations Zewo certifiées',
          content: (
            <div className="flex flex-wrap gap-2 text-xs">
              {['UNICEF', 'Croix-Rouge', 'Caritas', 'WWF', 'MSF', 'Greenpeace', 'Pro Infirmis', 'Terre des hommes'].map(o => (
                <span key={o} className="px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--bg-sidebar)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{o}</span>
              ))}
            </div>
          ),
        },
      ],
    },

    /* ── 12 : Cotisations syndicales ─────────────────────────────────── */
    '12': {
      sections: [
        {
          title: 'Principe',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Les cotisations à des syndicats, associations professionnelles ou ordres réduisent le revenu imposable sans justificatif complexe — une simple attestation annuelle suffit.
            </p>
          ),
        },
        {
          title: 'Ce qui est déductible',
          content: (
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
              {[['Syndicats', 'Unia, Syna, SSP, SIT, VPOD'], ['Associations pro', 'Chambres de commerce, ordres pro'], ['Non déductible', 'Clubs sportifs, associations de loisirs']].map(([l, v]) => (
                <div key={l} className="flex gap-3">
                  <span className="font-medium flex-shrink-0" style={{ color: 'var(--text)', width: '130px' }}>{l}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: 'Démarche',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Demande une attestation annuelle à ton syndicat ou association. Certains l'envoient automatiquement en janvier. Le montant figure sur ton certificat de salaire à la rubrique "Retenues".
            </p>
          ),
        },
      ],
    },

    /* ── 13 : Intérêts de dettes ─────────────────────────────────────── */
    '13': {
      sections: [
        {
          title: 'Principe',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Les intérêts payés sur tes dettes réduisent ton revenu imposable. Seuls les <strong style={{ color: 'var(--text)' }}>intérêts</strong> sont déductibles — pas le remboursement du capital.
            </p>
          ),
        },
        {
          title: 'Types de dettes',
          content: (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg p-3" style={{ background: '#EFFAF5', border: '1px solid #2E9E6B' }}>
                <p className="font-semibold mb-1.5" style={{ color: '#2E9E6B' }}>Déductible</p>
                {['Hypothèque', 'Crédit à la consommation', 'Découvert bancaire', 'Cartes de crédit'].map(i => <p key={i} className="py-0.5" style={{ color: 'var(--text-2)' }}>{i}</p>)}
              </div>
              <div className="rounded-lg p-3" style={{ background: '#FDF0F0', border: '1px solid #C94242' }}>
                <p className="font-semibold mb-1.5" style={{ color: '#C94242' }}>Non déductible</p>
                {['Leasing auto (salarié)', 'Capital remboursé', 'Frais de dossier'].map(i => <p key={i} className="py-0.5" style={{ color: 'var(--text-2)' }}>{i}</p>)}
              </div>
            </div>
          ),
        },
        {
          title: 'Plafond',
          content: (
            <Alert type="warn">
              Les intérêts déductibles sont limités aux revenus de la fortune plus 50'000 CHF. Ce plafond ne concerne en pratique que les situations avec des dettes élevées et peu de revenus financiers.
            </Alert>
          ),
        },
      ],
    },

    /* ── 14 : Frais gestion portefeuille ─────────────────────────────── */
    '14': {
      sections: [
        {
          title: 'Forfait automatique',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              L'administration fiscale accepte un forfait de <strong style={{ color: 'var(--text)' }}>1.5‰</strong> de la valeur vénale des titres au 31 décembre, sans justificatif. Ce forfait couvre les frais de courtage, de garde et de gestion.
            </p>
          ),
        },
        {
          title: 'Calcul selon ton portefeuille',
          content: (
            <Card>
              {[[10000, 15], [50000, 75], [100000, 150], [200000, 300]].map(([val, ded]) => (
                <Row key={val} label={`CHF ${val.toLocaleString('fr-CH')} investi`} value={`CHF ${ded} déduction`} />
              ))}
            </Card>
          ),
        },
        {
          title: 'Frais réels vs forfait',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Si tes frais réels documentés (relevés bancaires, confirmations de courtage) dépassent le forfait 1.5‰, opte pour les frais réels. Sinon, le forfait est plus simple et toujours accepté.
            </p>
          ),
        },
      ],
    },

    /* ── 15 : Primes assurances ──────────────────────────────────────── */
    '15': {
      sections: [
        {
          title: 'Forfait cantonal Valais 2026',
          content: (
            <Card>
              {isCouple
                ? <Row label="Couple (estimé)" value="CHF 5'200/an" />
                : <Row label="Célibataire (estimé)" value="CHF 2'600/an" />}
              {children > 0 && <Row label={`${children} enfant(s)`} value={`+ CHF ${(700 * children).toLocaleString('fr-CH')}`} />}
            </Card>
          ),
        },
        {
          title: 'Primes couvertes',
          content: (
            <div className="flex flex-wrap gap-2 text-xs">
              {['LAMal de base', 'Complémentaires (LCA)', 'RC ménage', 'Assurance ménage', 'Assurance vie'].map(p => (
                <span key={p} className="px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>{p}</span>
              ))}
            </div>
          ),
        },
        {
          title: 'Important',
          content: (
            <Alert type="warn">
              Si tu reçois des subsides LAMal, déduis le montant net (prime − subside). Certains logiciels de déclaration le calculent automatiquement si tu renseignes le subside reçu.
            </Alert>
          ),
        },
      ],
    },

    /* ── 16 : Rachat rétroactif 3a 2025 ─────────────────────────────── */
    '16': {
      sections: [
        {
          title: 'Nouvelle loi en vigueur dès 2026',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Depuis le 1er janvier 2026, il est possible de <strong style={{ color: 'var(--text)' }}>rattraper les années fiscales manquées</strong> en pilier 3a. En 2026, tu peux racheter l'année 2025 uniquement. Chaque année, une nouvelle lacune devient rachetable.
            </p>
          ),
        },
        {
          title: 'Conditions',
          content: (
            <Steps items={[
              `Avoir versé le plafond complet en 2026 (7'258 CHF) — le rachat s'effectue en plus`,
              'Avoir eu un revenu AVS soumis à cotisation en 2025',
              'Le plafond de rachat pour 2025 est de 7\'258 CHF maximum',
              'Un seul rachat par année lacunaire autorisé',
            ]} />
          ),
        },
        {
          title: 'Gain fiscal additionnel',
          content: (
            <Card accent>
              <Row label="Rachat 2025 (max)" value="CHF 7'258" />
              <Row label={`Économie fiscale (${rPct}%)`} value={`CHF ${action.gain.toLocaleString('fr-CH')}`} accent />
            </Card>
          ),
        },
        {
          title: 'À anticiper',
          content: (
            <Alert type="warn">
              Cette mesure est nouvelle — les prestataires 3a (VIAC, finpension) mettent à jour leurs plateformes progressivement. Contacte ton prestataire pour confirmer la procédure exacte avant d'effectuer le versement de rachat.
            </Alert>
          ),
        },
      ],
    },

    /* ── 17 : Franchise LAMal ────────────────────────────────────────── */
    '17': {
      sections: [
        {
          title: 'Logique de la franchise',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              La franchise est la part des coûts de santé que tu paies avant que l'assurance intervienne. Plus la franchise est élevée, plus la prime mensuelle est basse — et inversement.
            </p>
          ),
        },
        {
          title: 'Point d\'équilibre',
          content: (
            <Card>
              {[['Franchise 300', 'Prime élevée — pertinent si > 2\'500 CHF de soins/an'], ['Franchise 1\'000', 'Équilibre moyen'], ['Franchise 2\'500', 'Prime basse — pertinent si < 1\'400 CHF de soins/an']].map(([f, d]) => (
                <div key={f} className="py-1.5 text-sm">
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{f} : </span>
                  <span style={{ color: 'var(--text-2)' }}>{d}</span>
                </div>
              ))}
            </Card>
          ),
        },
        {
          title: 'Calcul pratique',
          content: (
            <div className="text-sm space-y-1" style={{ color: 'var(--text-2)' }}>
              <p>Économie en prime (franchise 300 → 2'500) : environ <strong style={{ color: 'var(--text)' }}>100-150 CHF/mois</strong>.</p>
              <p>Si tes dépenses annuelles de santé sont inférieures à 1'400 CHF, la franchise élevée est rentable.</p>
            </div>
          ),
        },
        {
          title: 'Deadline',
          content: (
            <Alert type="warn">
              La modification de franchise doit être communiquée à ta caisse avant le <strong>30 novembre</strong> pour être effective au 1er janvier suivant.
            </Alert>
          ),
        },
      ],
    },

    /* ── 18 : Modèle LAMal alternatif ───────────────────────────────── */
    '18': {
      sections: [
        {
          title: 'Les 4 modèles alternatifs',
          content: (
            <Card>
              {[['Médecin de famille', '−15 à 20%'], ['HMO', '−20 à 25%'], ['Télémédecine', '−15 à 20%'], ['Pharmacie', '−10%']].map(([m, r]) => (
                <Row key={m} label={m} value={r} accent />
              ))}
            </Card>
          ),
        },
        {
          title: 'Contrainte principale',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Avec ces modèles, tu dois contacter en premier ton médecin référent (ou la plateforme de télémédecine) avant toute consultation — sauf urgences, gynécologie et pédiatrie. Ce point est non négociable.
            </p>
          ),
        },
        {
          title: 'Simulation',
          content: (
            <Card accent>
              <Row label="Prime standard estimée" value={`CHF ${isCouple ? '900' : '450'}/mois`} />
              <Row label="Réduction HMO (−22%)" value={`− CHF ${isCouple ? '198' : '99'}/mois`} accent />
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <Row label="Économie annuelle" value={`≈ CHF ${action.gain.toLocaleString('fr-CH')}`} accent />
              </div>
            </Card>
          ),
        },
      ],
    },

    /* ── 19 : Cotisations partis politiques ─────────────────────────── */
    '19': {
      sections: [
        {
          title: 'Principe',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Les cotisations versées à un parti politique inscrit au registre fédéral ou représenté dans un parlement cantonal ou fédéral sont déductibles fiscalement.
            </p>
          ),
        },
        {
          title: 'Plafonds Valais 2026',
          content: (
            <Card>
              <Row label="Cantonal (Valais)" value={`jusqu'à CHF 20'930`} />
              <Row label="Fédéral (IFD)" value="jusqu'à CHF 10'400" />
            </Card>
          ),
        },
        {
          title: 'Démarche',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Demande une attestation de cotisation annuelle à la section locale de ton parti. Ce document indique le montant versé et doit être joint à la déclaration d'impôts.
            </p>
          ),
        },
      ],
    },

    /* ── 20 : Transports publics AG ─────────────────────────────────── */
    '20': {
      sections: [
        {
          title: 'Principe',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Les frais de transport domicile-travail sont déductibles. Tu choisis la méthode la plus avantageuse : kilomètres parcourus en voiture (0.70 CHF/km, max 3'000 CHF) ou montant exact de l'abonnement de transports publics.
            </p>
          ),
        },
        {
          title: 'Comparatif voiture vs AG',
          content: (
            <Card>
              <Row label="AG 2e classe 2025" value="CHF 3'860/an" />
              <Row label="Voiture max déductible" value="CHF 3'000/an" />
              <Row label="Avantage AG si distance > 22 km/j" value="→ choisir TP" accent />
            </Card>
          ),
        },
        {
          title: 'Télétravail',
          content: (
            <Alert type="warn">
              Les jours en télétravail ne donnent pas droit à la déduction transport. Si tu travailles 2 jours/semaine à domicile, réduis proportionnellement le montant déclaré (3 jours/5 = 60% de l'abonnement).
            </Alert>
          ),
        },
      ],
    },

    /* ── 21 : Intérêts hypothécaires ─────────────────────────────────── */
    '21': {
      sections: [
        {
          title: 'Déduction à 100%',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              L'intégralité des intérêts hypothécaires est déductible du revenu imposable. Seuls les intérêts sont concernés — pas le remboursement du capital (amortissement direct).
            </p>
          ),
        },
        {
          title: 'Simulation',
          content: (
            <Card accent>
              <Row label="Hypothèque 500'000 CHF à 2.5%" value="CHF 12'500 d'intérêts/an" />
              <Row label={`Économie fiscale (${rPct}%)`} value={`CHF ${Math.round(12500 * marginalRate).toLocaleString('fr-CH')}`} accent />
            </Card>
          ),
        },
        {
          title: 'Réforme 2029 — à anticiper',
          content: (
            <Alert type="err">
              <p className="font-semibold mb-1">Suppression prévue dès 2029</p>
              <p style={{ color: 'var(--text-2)' }}>La réforme de la valeur locative supprime la déduction des intérêts hypothécaires pour la résidence principale. Si tu envisages des rénovations ou des rachats LPP, 2026-2028 est la fenêtre optimale pour maximiser ces déductions.</p>
            </Alert>
          ),
        },
      ],
    },

    /* ── 22 : Forfait vs frais réels entretien ───────────────────────── */
    '22': {
      sections: [
        {
          title: 'Deux options chaque année',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Chaque année, tu choisis indépendamment la méthode la plus avantageuse. Le choix n'est pas figé — tu peux alterner selon les dépenses réelles de l'année.
            </p>
          ),
        },
        {
          title: 'Forfait',
          content: (
            <Card>
              <Row label="Bien < 10 ans" value="10% de la valeur locative" />
              <Row label="Bien ≥ 10 ans" value="20% de la valeur locative" />
              <Row label="Avantage" value="Aucun justificatif requis" accent />
            </Card>
          ),
        },
        {
          title: 'Frais réels',
          content: (
            <div className="flex flex-wrap gap-2 text-xs">
              {['Petites réparations', 'Peinture & papier peint', 'Entretien jardin', 'Assurance bâtiment', 'Ramonage & chauffage'].map(f => (
                <span key={f} className="px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--bg-sidebar)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{f}</span>
              ))}
            </div>
          ),
        },
        {
          title: 'Stratégie optimale',
          content: (
            <Alert type="ok">
              Années sans gros travaux → forfait (simple, sans justificatifs). Années avec rénovations importantes → compare les deux et opte pour les frais réels si ça dépasse le forfait.
            </Alert>
          ),
        },
      ],
    },

    /* ── 23 : Rénovations énergétiques ───────────────────────────────── */
    '23': {
      sections: [
        {
          title: 'Principe',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Les travaux qui améliorent l'efficacité énergétique du bien sont déductibles. Si le montant dépasse ton revenu imposable de l'année, tu peux l'<strong style={{ color: 'var(--text)' }}>étaler sur les 3 années suivantes</strong>.
            </p>
          ),
        },
        {
          title: 'Travaux éligibles',
          content: (
            <div className="flex flex-wrap gap-2 text-xs">
              {['Isolation façade', 'Triple vitrage', 'Pompe à chaleur', 'Panneaux solaires', 'Pellets / bois', 'VMC double flux', 'Borne EV'].map(t => (
                <span key={t} className="px-2.5 py-1 rounded-full"
                  style={{ background: '#EFFAF5', color: '#2E9E6B', border: '1px solid #A8DFC4' }}>{t}</span>
              ))}
            </div>
          ),
        },
        {
          title: 'Simulation',
          content: (
            <Card accent>
              <Row label="Travaux pompe à chaleur" value="CHF 30'000" />
              <Row label={`Économie fiscale (${rPct}%)`} value={`CHF ${Math.round(30000 * marginalRate).toLocaleString('fr-CH')}`} accent />
              <Row label="Possibilité d'étalement" value="Sur 3 ans si besoin" />
            </Card>
          ),
        },
        {
          title: 'Fenêtre 2026-2028',
          content: (
            <Alert type="err">
              La suppression des déductions liées à l'immeuble en 2029 rend cette période critique. C'est la dernière opportunité de déduire ces travaux. Planifie tes rénovations avant cette date.
            </Alert>
          ),
        },
      ],
    },

    /* ── 24 : Amortissement indirect 3a ─────────────────────────────── */
    '24': {
      sections: [
        {
          title: 'Principe du double avantage',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Au lieu de rembourser directement l'hypothèque (amortissement direct), tu verses dans un compte 3a qui sert de garantie. Résultat : tu déduites le versement 3a ET tu conserves les intérêts hypothécaires déductibles.
            </p>
          ),
        },
        {
          title: 'Comparaison des deux approches',
          content: (
            <div className="space-y-2 text-sm">
              <Card>
                <p className="font-semibold mb-1" style={{ color: '#C94242' }}>Amortissement direct</p>
                <p style={{ color: 'var(--text-2)' }}>Tu rembourses l'hypothèque → moins d'intérêts → moins de déduction. La dette diminue mais l'avantage fiscal aussi.</p>
              </Card>
              <Card>
                <p className="font-semibold mb-1" style={{ color: '#2E9E6B' }}>Amortissement indirect (3a)</p>
                <p style={{ color: 'var(--text-2)' }}>Tu verses dans le 3a → déduction fiscale immédiate + intérêts restent élevés et déductibles + capital 3a croît sans imposition annuelle.</p>
              </Card>
            </div>
          ),
        },
        {
          title: 'Contrainte',
          content: (
            <Alert type="warn">
              Le capital 3a reste bloqué jusqu'à la retraite (ou achat immobilier). Cette stratégie nécessite d'être coordinée avec ta banque et de disposer d'une réserve de liquidités suffisante pour les imprévus.
            </Alert>
          ),
        },
      ],
    },

    /* ── 25 : Valeur locative ────────────────────────────────────────── */
    '25': {
      sections: [
        {
          title: 'Ce que c\'est',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              La valeur locative est un revenu fictif ajouté à ton revenu imposable — il représente ce que tu "gagnes" en habitant ton propre logement plutôt que de le louer. Elle est calculée par l'administration fiscale cantonale.
            </p>
          ),
        },
        {
          title: 'Calcul approximatif',
          content: (
            <Card>
              <Row label="Valeur vénale du bien × 3%" value="≈ valeur locative annuelle" />
              <Row label="Contrepartie" value="Intérêts hypo + frais entretien déductibles" accent />
            </Card>
          ),
        },
        {
          title: 'Suppression en 2029',
          content: (
            <Alert type="ok">
              La réforme votée supprime l'obligation de déclarer la valeur locative dès 2029. En contrepartie, les déductions d'intérêts hypothécaires et d'entretien pour la résidence principale disparaissent également.
            </Alert>
          ),
        },
      ],
    },

    /* ── 26 : 3a indépendant ─────────────────────────────────────────── */
    '26': {
      sections: [
        {
          title: 'Plafond étendu sans 2e pilier',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Un indépendant sans caisse de pension peut verser jusqu'à <strong style={{ color: 'var(--text)' }}>20% du revenu net d'activité</strong> en pilier 3a, plafonné à 36'288 CHF — soit 5 fois le plafond d'un salarié.
            </p>
          ),
        },
        {
          title: 'Simulation',
          content: (
            <Card accent>
              <Row label="Revenu net d'activité" value={`CHF ${annualIncome.toLocaleString('fr-CH')}`} />
              <Row label="20% du revenu (max 36'288)" value={`CHF ${Math.min(36288, Math.round(annualIncome * 0.2)).toLocaleString('fr-CH')}`} />
              <Row label={`Économie fiscale (${rPct}%)`} value={`CHF ${action.gain.toLocaleString('fr-CH')}`} accent />
            </Card>
          ),
        },
        {
          title: 'Stratégie',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Si tu n'as pas de LPP obligatoire, maximiser le 3a est la priorité absolue avant tout autre investissement. Le rendement net après économie fiscale dépasse largement un placement standard.
            </p>
          ),
        },
      ],
    },

    /* ── 27 : Bureau à domicile ─────────────────────────────────────── */
    '27': {
      sections: [
        {
          title: 'Principe du prorata',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              La surface du bureau divisée par la surface totale du logement donne le pourcentage déductible du loyer (ou des frais d'hypothèque et charges pour un propriétaire).
            </p>
          ),
        },
        {
          title: 'Calcul',
          content: (
            <Card accent>
              <Row label="Surface bureau" value="16 m² (exemple)" />
              <Row label="Surface totale" value="80 m²" />
              <Row label="Prorata" value="20%" />
              <Row label="Loyer annuel 24'000 CHF × 20%" value="CHF 4'800 déductibles" accent />
            </Card>
          ),
        },
        {
          title: 'Preuves requises',
          content: (
            <div className="flex flex-wrap gap-2 text-xs">
              {['Plan de l\'appartement', 'Bail à loyer', 'Photos de la pièce', 'Démonstration usage exclusif pro'].map(p => (
                <span key={p} className="px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--bg-sidebar)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{p}</span>
              ))}
            </div>
          ),
        },
      ],
    },

    /* ── 28 : Véhicule professionnel ─────────────────────────────────── */
    '28': {
      sections: [
        {
          title: 'Deux méthodes au choix',
          content: (
            <div className="space-y-2 text-sm">
              <Card>
                <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Forfait kilométrique</p>
                <p style={{ color: 'var(--text-2)' }}>0.70 CHF × km professionnels (avec carnet de bord). Simple mais nécessite un suivi rigoureux des déplacements.</p>
              </Card>
              <Card>
                <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Frais réels</p>
                <p style={{ color: 'var(--text-2)' }}>(km pro / km totaux) × (essence + entretien + assurance + amortissement). Plus complexe mais souvent plus avantageux avec un véhicule récent.</p>
              </Card>
            </div>
          ),
        },
        {
          title: 'Leasing',
          content: (
            <Alert type="ok">
              Contrairement au salarié, l'indépendant peut déduire la part professionnelle des mensualités de leasing, ainsi que les intérêts du financement.
            </Alert>
          ),
        },
      ],
    },

    /* ── 29 : SaaS & fiduciaire ─────────────────────────────────────── */
    '29': {
      sections: [
        {
          title: 'Principe',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Tout coût engagé pour exercer ton activité indépendante est déductible à 100%. Il n'y a pas de plafond pour ces dépenses — à condition qu'elles soient justifiées professionnellement.
            </p>
          ),
        },
        {
          title: 'Catégories déductibles',
          content: (
            <div className="flex flex-wrap gap-2 text-xs">
              {['Office / Microsoft 365', 'Adobe Creative', 'CRM & outils pro', 'Domaine + hébergement', 'Comptabilité (Abacus, Banana)', 'Honoraires fiduciaire', 'Honoraires avocat / fiscaliste', 'Repas d\'affaires (50-100%)'].map(f => (
                <span key={f} className="px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>{f}</span>
              ))}
            </div>
          ),
        },
        {
          title: 'Repas d\'affaires',
          content: (
            <Alert type="warn">
              Les repas d'affaires avec clients sont déductibles à 50% (fédéral) ou 100% (cantonal selon accord). Conserve les reçus avec le nom des personnes présentes et l'objet de la discussion.
            </Alert>
          ),
        },
      ],
    },

    /* ── 30 : Cotisations AVS indépendant ────────────────────────────── */
    '30': {
      sections: [
        {
          title: 'Taux 2026',
          content: (
            <Card>
              <Row label="Taux AVS/AI/APG" value="10.1% du revenu net" />
              <Row label="Minimum annuel" value="CHF 514" />
              <Row label="Ces cotisations sont" value="déductibles du revenu imposable" accent />
            </Card>
          ),
        },
        {
          title: 'Double avantage',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Tes cotisations AVS réduisent ton revenu net d'activité (base de calcul de l'impôt) <em>et</em> te permettent de constituer des droits à la rente AVS. C'est une charge obligatoire qui est aussi un avantage fiscal.
            </p>
          ),
        },
        {
          title: 'Simulation',
          content: (
            <Card accent>
              <Row label={`Cotisation estimée (10.1% × CHF ${annualIncome.toLocaleString('fr-CH')})`} value={`CHF ${Math.round(annualIncome * 0.101).toLocaleString('fr-CH')}`} />
              <Row label={`Économie fiscale (${rPct}%)`} value={`CHF ${action.gain.toLocaleString('fr-CH')}`} accent />
            </Card>
          ),
        },
      ],
    },

    /* ── 31 : Permis B + conjoint C/CH ───────────────────────────────── */
    '31': {
      sections: [
        {
          title: 'Changement de statut fiscal',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Si tu es titulaire d'un permis B et que ton conjoint ou partenaire est titulaire d'un permis C ou de nationalité suisse, tu n'es <strong style={{ color: 'var(--text)' }}>plus soumis à l'impôt à la source</strong> — tu passes en taxation ordinaire avec déclaration classique.
            </p>
          ),
        },
        {
          title: 'Ce que ça change',
          content: (
            <div className="space-y-2 text-sm">
              {[
                ['Impôt à la source', 'Disparaît — tu verses des acomptes'],
                ['Déclaration', 'Obligatoire chaque année'],
                ['Déductions', 'Accès à TOUTES les déductions (3a, frais pro, etc.)'],
                ['Remboursement', 'Possible si trop perçu à la source'],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-3">
                  <span className="font-medium flex-shrink-0" style={{ color: 'var(--text)', width: '120px' }}>{l}</span>
                  <span style={{ color: 'var(--text-2)' }}>{v}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: 'Action immédiate',
          content: (
            <Alert type="warn">
              Informe ton employeur dès le 1er du mois suivant ton mariage ou changement de situation. L'impôt à la source sera arrêté à cette date et tu recevras les instructions pour les acomptes.
            </Alert>
          ),
        },
      ],
    },

    /* ── 32 : Bien locatif ───────────────────────────────────────────── */
    '32': {
      sections: [
        {
          title: 'Frais déductibles sans limite',
          content: (
            <div className="flex flex-wrap gap-2 text-xs">
              {['Entretien & réparations', 'Assurance bâtiment', 'Frais de gérance', 'Intérêts hypothécaires', 'Charges PPE', 'Frais de chauffage', 'Travaux de rénovation'].map(f => (
                <span key={f} className="px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>{f}</span>
              ))}
            </div>
          ),
        },
        {
          title: 'Impôt anticipé',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Les loyers perçus ne sont pas soumis à l'impôt anticipé de 35% (contrairement aux dividendes). Tu déclares les revenus locatifs bruts et déduis les frais — le solde net est ajouté à ton revenu imposable.
            </p>
          ),
        },
        {
          title: 'Simulation',
          content: (
            <Card accent>
              <Row label="Loyers annuels bruts" value="CHF 24'000" />
              <Row label="Frais déductibles (hypothèque + entretien)" value="− CHF 16'000" />
              <Row label="Revenu net imposable" value="CHF 8'000" />
              <Row label={`Impôt sur revenu net (${rPct}%)`} value={`CHF ${Math.round(8000 * marginalRate).toLocaleString('fr-CH')}`} accent />
            </Card>
          ),
        },
      ],
    },

    /* ── 33 : Impôt anticipé 35% ─────────────────────────────────────── */
    '33': {
      sections: [
        {
          title: 'Mécanisme',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              L'État suisse prélève automatiquement 35% à la source sur les dividendes d'actions suisses et les intérêts de comptes/obligations suisses. Ce montant est <strong style={{ color: 'var(--text)' }}>intégralement remboursé</strong> si tu le déclares dans ta déclaration d'impôts.
            </p>
          ),
        },
        {
          title: 'Condition de remboursement',
          content: (
            <Alert type="ok">
              Tu dois déclarer tous les revenus financiers (dividendes, intérêts) dans ta déclaration. Si tu omets de les déclarer, tu perds le droit au remboursement des 35% prélevés — ce qui reviendrait à payer une taxe définitive de 35%.
            </Alert>
          ),
        },
        {
          title: 'ETF irlandais — pas de prélèvement',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Les ETF domiciliés en Irlande (comme VWCE) ne sont pas soumis à l'impôt anticipé suisse. C'est l'une des raisons pour lesquelles les ETF irlandais sont préférés par les investisseurs suisses.
            </p>
          ),
        },
      ],
    },

    /* ── 34 : Frais bancaires ─────────────────────────────────────────── */
    '34': {
      sections: [
        {
          title: 'Deux options',
          content: (
            <div className="space-y-2 text-sm">
              <Card>
                <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Forfait 1.5‰ (recommandé)</p>
                <p style={{ color: 'var(--text-2)' }}>Automatiquement accepté sur la valeur du portefeuille au 31 décembre. Aucun justificatif requis.</p>
              </Card>
              <Card>
                <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Frais réels</p>
                <p style={{ color: 'var(--text-2)' }}>Courtage, frais de garde, droits de timbre documentés. À utiliser si tes frais réels dépassent le forfait.</p>
              </Card>
            </div>
          ),
        },
        {
          title: 'Exemples',
          content: (
            <Card>
              {[[10000, 15], [50000, 75], [100000, 150], [500000, 750]].map(([v, d]) => (
                <Row key={v} label={`CHF ${v.toLocaleString('fr-CH')} × 1.5‰`} value={`CHF ${d} déduction`} />
              ))}
            </Card>
          ),
        },
      ],
    },

    /* ── 35 : Déduction couple 2 revenus ─────────────────────────────── */
    '35': {
      sections: [
        {
          title: 'Principe IFD',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Pour l'impôt fédéral direct, les couples à deux revenus bénéficient d'une déduction égale au plus bas des deux revenus d'activité, plafonnée à <strong style={{ color: 'var(--text)' }}>13'900 CHF</strong>.
            </p>
          ),
        },
        {
          title: 'Calcul',
          content: (
            <Card accent>
              <Row label="Économie maximale IFD" value={`CHF ${Math.round(13900 * 0.08).toLocaleString('fr-CH')}`} accent />
              <Row label="Plafond de déduction" value="CHF 13'900" />
            </Card>
          ),
        },
        {
          title: 'Réforme à venir',
          content: (
            <Alert type="warn">
              L'imposition individuelle a été acceptée en votation en 2026 (54.23%). Elle remplacera à terme l'imposition conjointe. Consulte régulièrement les directives fiscales pour suivre l'entrée en vigueur.
            </Alert>
          ),
        },
      ],
    },

    /* ── 36 : Pilier 3b GE/FR ────────────────────────────────────────── */
    '36': {
      sections: [
        {
          title: 'Avantage cantonal exclusif',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Contrairement aux autres cantons, Genève et Fribourg permettent de déduire les primes d'assurance vie (pilier 3b) du revenu imposable cantonal. C'est un avantage fiscal uniquement disponible pour les résidents de ces cantons.
            </p>
          ),
        },
        {
          title: 'Plafond 2026',
          content: (
            <Card accent>
              <Row label="Genève" value="CHF 2'200/an" accent />
              <Row label="Fribourg" value="CHF 750/an" />
            </Card>
          ),
        },
        {
          title: 'Avantage vs 3a',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Le pilier 3b est plus flexible que le 3a : tu peux retirer les fonds à tout moment, sans attendre la retraite. En contrepartie, les plafonds de déduction sont bien inférieurs au 3a.
            </p>
          ),
        },
      ],
    },

    /* ── 37 : Pension alimentaire ─────────────────────────────────────── */
    '37': {
      sections: [
        {
          title: 'Déductibilité intégrale',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Les pensions alimentaires versées à un ex-conjoint sont <strong style={{ color: 'var(--text)' }}>intégralement déductibles</strong> chez le payeur, sans plafond. Elles sont en contrepartie imposables chez le bénéficiaire.
            </p>
          ),
        },
        {
          title: 'Simulation',
          content: (
            <Card accent>
              <Row label="Pension mensuelle" value="CHF 1'500" />
              <Row label="Déduction annuelle" value="CHF 18'000" />
              <Row label={`Économie fiscale (${rPct}%)`} value={`CHF ${Math.round(18000 * marginalRate).toLocaleString('fr-CH')}`} accent />
            </Card>
          ),
        },
        {
          title: 'Condition',
          content: (
            <Alert type="warn">
              La convention de divorce ou de séparation doit être homologuée par une autorité judiciaire. Un accord informel ne suffit pas pour rendre la déduction opposable à l'administration fiscale.
            </Alert>
          ),
        },
      ],
    },

    /* ── 38 : Personnes à charge ─────────────────────────────────────── */
    '38': {
      sections: [
        {
          title: 'Qui est concerné',
          content: (
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
              {[
                ['Enfants majeurs en formation', 'Sans revenu significatif, jusqu\'à 25 ans selon les cas'],
                ['Parents à charge', 'Si tu subviens à l\'essentiel de leurs besoins'],
                ['Autres proches', 'Selon justification et condition de revenu'],
              ].map(([l, d]) => (
                <div key={l} className="flex gap-3">
                  <span className="font-medium flex-shrink-0" style={{ color: 'var(--text)', minWidth: '160px' }}>{l}</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: 'Montant Valais',
          content: (
            <Card accent>
              <Row label="Déduction par personne à charge" value="≈ CHF 6'500" />
              <Row label={`Économie fiscale (${rPct}%)`} value={`CHF ${action.gain.toLocaleString('fr-CH')}`} accent />
            </Card>
          ),
        },
        {
          title: 'Justificatifs',
          content: (
            <div className="flex flex-wrap gap-2 text-xs">
              {['Attestation scolarité', 'Certificat de formation', 'Justificatifs de soutien financier', 'Relevés de versements'].map(j => (
                <span key={j} className="px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--bg-sidebar)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{j}</span>
              ))}
            </div>
          ),
        },
      ],
    },

    /* ── 39 : Étaler rachats LPP ─────────────────────────────────────── */
    '39': {
      sections: [
        {
          title: 'Pourquoi étaler plutôt que racheter d\'un coup',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              L'imposition est <strong style={{ color: 'var(--text)' }}>progressive</strong> en Suisse. En effectuant un rachat LPP de 60'000 CHF en une seule année, tu "brûles" une tranche d'imposition élevée. En étalant sur 3 ans à 20'000 CHF, tu restes dans des tranches inférieures.
            </p>
          ),
        },
        {
          title: 'Gain de l\'échelonnement',
          content: (
            <div className="space-y-2 text-sm">
              <Card>
                <p className="font-semibold mb-1" style={{ color: '#C94242' }}>Rachat unique 60'000 CHF</p>
                <p style={{ color: 'var(--text-2)' }}>Taux marginal élevé appliqué → économie fiscale réduite par la progressivité</p>
              </Card>
              <Card>
                <p className="font-semibold mb-1" style={{ color: '#2E9E6B' }}>3 × 20'000 CHF sur 3 ans</p>
                <p style={{ color: 'var(--text-2)' }}>Taux marginal plus bas chaque année → économie totale supérieure de ~19%</p>
              </Card>
            </div>
          ),
        },
        {
          title: 'Règle des 3 ans',
          content: (
            <Alert type="warn">
              Tout rachat LPP bloque les fonds pendant 3 ans pour un retrait en vue d'achat immobilier. Si tu envisages un achat dans les 3 ans, attends d'avoir finalisé la transaction avant de racheter.
            </Alert>
          ),
        },
      ],
    },

    /* ── 40 : 3-5 comptes 3a ─────────────────────────────────────────── */
    '40': {
      sections: [
        {
          title: 'Logique fiscale du retrait',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              À la retraite, les retraits 3a sont imposés à un taux réduit mais progressif — plus tu retires d'un coup, plus le taux est élevé. En fragmentant sur plusieurs comptes retirés sur des années différentes, tu restes systématiquement dans une tranche basse.
            </p>
          ),
        },
        {
          title: 'Simulation comparative',
          content: (
            <div className="space-y-2 text-sm">
              <Card>
                <p className="font-semibold mb-1" style={{ color: '#C94242' }}>1 compte — 200'000 CHF</p>
                <Row label="Taux d'imposition" value="~8%" />
                <Row label="Impôt total" value="CHF 16'000" />
              </Card>
              <Card>
                <p className="font-semibold mb-1" style={{ color: '#2E9E6B' }}>4 comptes — 4 × 50'000 CHF</p>
                <Row label="Taux d'imposition" value="~4% chaque retrait" />
                <Row label="Impôt total" value="CHF 8'000" accent />
                <Row label="Économie" value="CHF 8'000" accent />
              </Card>
            </div>
          ),
        },
        {
          title: 'Mise en place',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Ouvre 3 à 5 comptes 3a distincts (VIAC, finpension, Frankly ou autres). Répartis tes versements annuels entre eux. Il n'y a pas de minimum par compte — même 500 CHF/an suffisent pour en ouvrir un.
            </p>
          ),
        },
      ],
    },

    /* ── 41 : Intérêts dettes privées ────────────────────────────────── */
    '41': {
      sections: [
        {
          title: 'Principe',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Les intérêts de dettes privées (hors hypothèque) réduisent le revenu imposable. Seuls les intérêts sont concernés — pas les frais de dossier ni le capital remboursé.
            </p>
          ),
        },
        {
          title: 'Dettes concernées',
          content: (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg p-3" style={{ background: '#EFFAF5', border: '1px solid #2E9E6B' }}>
                <p className="font-semibold mb-1.5" style={{ color: '#2E9E6B' }}>Déductible</p>
                {['Crédit à la consommation', 'Découvert bancaire', 'Cartes de crédit (intérêts)'].map(i => <p key={i} className="py-0.5" style={{ color: 'var(--text-2)' }}>{i}</p>)}
              </div>
              <div className="rounded-lg p-3" style={{ background: '#FDF0F0', border: '1px solid #C94242' }}>
                <p className="font-semibold mb-1.5" style={{ color: '#C94242' }}>Non déductible</p>
                {['Leasing auto (salarié)', 'Capital remboursé', 'Frais de dossier'].map(i => <p key={i} className="py-0.5" style={{ color: 'var(--text-2)' }}>{i}</p>)}
              </div>
            </div>
          ),
        },
        {
          title: 'Plafond',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              La déduction totale des intérêts (y compris hypothèque) est plafonnée aux revenus de la fortune augmentés de 50'000 CHF. Ce plafond ne concerne en pratique que les situations patrimoniales complexes.
            </p>
          ),
        },
      ],
    },

    /* ── 42 : Frais déménagement professionnel ────────────────────────── */
    '42': {
      sections: [
        {
          title: 'Conditions de déductibilité',
          content: (
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Un déménagement est déductible s'il est <strong style={{ color: 'var(--text)' }}>causé directement</strong> par un changement d'emploi ou une mutation professionnelle. Le lien de causalité entre le déménagement et l'activité professionnelle doit être démontrable.
            </p>
          ),
        },
        {
          title: 'Frais éligibles',
          content: (
            <div className="flex flex-wrap gap-2 text-xs">
              {['Société de déménagement', 'Location camion', 'Pénalités résiliation anticipée bail', 'Frais de recherche logement'].map(f => (
                <span key={f} className="px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>{f}</span>
              ))}
            </div>
          ),
        },
        {
          title: 'Justificatifs',
          content: (
            <div className="flex flex-wrap gap-2 text-xs">
              {['Contrat du nouvel employeur (date d\'entrée)', 'Factures du déménageur', 'Preuve de la distance avant/après', 'Lettre de résiliation bail'].map(j => (
                <span key={j} className="px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--bg-sidebar)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{j}</span>
              ))}
            </div>
          ),
        },
      ],
    },

  };

  /* ── Fallback générique ───────────────────────────────────────────── */
  const fallback: Explanation = {
    sections: [
      {
        title: 'Pourquoi cette action',
        content: (
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            {action.why || `Cette action peut générer jusqu'à CHF ${action.gain.toLocaleString('fr-CH')} d'économies fiscales selon ton profil.`}
          </p>
        ),
      },
      {
        title: 'Impact estimé',
        content: (
          <Card accent>
            <Row label="Économie estimée" value={`CHF ${action.gain.toLocaleString('fr-CH')}`} accent />
          </Card>
        ),
      },
    ],
  };

  return explanations[action.id] ?? fallback;
}
