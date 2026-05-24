import { useState, useMemo } from 'react';

// ── Data ──────────────────────────────────────────────────────────────────────
interface Term {
  term: string;
  category: string;
  short: string;
  detail: string;
  tip?: string;
  source?: { label: string; url: string };
}

const TERMS: Term[] = [
  {
    term: 'IFD',
    category: 'Fédéral',
    short: 'Impôt fédéral direct — prélevé par la Confédération',
    detail: "L'IFD est un impôt sur le revenu perçu par la Confédération suisse. Son barème est progressif (0% à 11.5%) et identique dans toute la Suisse. Il s'ajoute aux impôts cantonaux et communaux.",
    tip: 'Déductible de votre revenu imposable cantonal — optimiser l\'IFD réduit aussi la base cantonale.',
    source: { label: 'estv.admin.ch — Impôt fédéral direct', url: 'https://www.estv.admin.ch/fr/impot-federal-direct' },
  },
  {
    term: 'ICC',
    category: 'Cantonal',
    short: 'Impôt cantonal et communal — varie selon canton et commune',
    detail: "L'ICC regroupe l'impôt cantonal (fixé par chaque canton) et l'impôt communal (un coefficient multiplié sur l'impôt cantonal). C'est souvent la part la plus lourde de votre charge fiscale totale.",
    tip: 'VS Sion : coeff. communal 1.30 — une déduction de 10 000 CHF économise ~1 500 CHF d\'impôt.',
  },
  {
    term: 'Pilier 3a',
    category: 'Prévoyance',
    short: 'Épargne retraite privée déductible — max 7 258 CHF/an (2026)',
    detail: "Le pilier 3a est un compte d'épargne retraite lié. Chaque franc versé est déductible de votre revenu imposable. Les gains (dividendes, intérêts) ne sont pas imposés annuellement. À la retraite, le capital est imposé séparément à un taux réduit.",
    tip: 'Ouvrez plusieurs comptes 3a (max. 5) pour étaler les retraits et minimiser l\'impôt à la sortie.',
    source: { label: 'admin.ch — Déductions maximales pilier 3a 2026', url: 'https://www.admin.ch/fr/newnsb/xgRMirCsezICX4rtof9Lm' },
  },
  {
    term: 'Pilier 3b',
    category: 'Prévoyance',
    short: 'Épargne libre — pas de déduction fiscale directe',
    detail: 'Le pilier 3b est une épargne non liée (compte épargne, actions, assurance-vie). Contrairement au 3a, les versements ne sont pas déductibles. Certains cantons offrent des déductions partielles sur les primes d\'assurance-vie.',
    tip: 'Valeur surtout pour les montants au-delà du plafond 3a ou pour une flexibilité de retrait totale.',
  },
  {
    term: 'Pilier 2 (LPP)',
    category: 'Prévoyance',
    short: 'Prévoyance professionnelle obligatoire — déductible automatiquement',
    detail: "Le pilier 2 (Loi sur la Prévoyance Professionnelle) est géré par votre employeur. Les cotisations sont automatiquement déduites du salaire brut avant calcul de l'impôt à la source. Vous pouvez faire des rachats volontaires très avantageux fiscalement.",
    tip: 'Un rachat LPP est intégralement déductible. Sur un revenu à 30% de taux marginal, 20 000 CHF de rachat = 6 000 CHF d\'économie.',
    source: { label: 'bsv.admin.ch — LPP', url: 'https://www.bsv.admin.ch/bsv/fr/home/assurances-sociales/bv.html' },
  },
  {
    term: 'Rachat LPP',
    category: 'Prévoyance',
    short: 'Versement volontaire dans la caisse de pension — déductible à 100%',
    detail: 'Si votre avoir LPP est inférieur au maximum légal, vous pouvez "racheter" des années de cotisation manquantes. Ce montant est entièrement déductible du revenu imposable. Le certificat de caisse de pension indique votre capacité de rachat.',
    tip: 'Stratégie optimale : échelonner les rachats sur 3–5 ans pour rester dans des tranches marginales élevées.',
  },
  {
    term: 'Impôt à la source',
    category: 'Salariés étrangers',
    short: 'Impôt prélevé directement sur le salaire — permis B/G/L',
    detail: "Les résidents étrangers avec permis B (revenu <120 000 CHF) paient l'impôt à la source : l'employeur retient directement le montant calculé selon des barèmes. Depuis 2021, ils peuvent demander une rectification ordinaire pour faire valoir des déductions supplémentaires.",
    tip: 'Déposez une demande de rectification avant le 31 mars N+1 pour récupérer l\'excédent payé.',
  },
  {
    term: 'Rectification ordinaire',
    category: 'Salariés étrangers',
    short: 'Correction de l\'impôt à la source via déclaration complémentaire',
    detail: "Les contribuables imposés à la source peuvent demander une taxation ordinaire ultérieure pour déduire des frais non pris en compte (3a, frais pro, dons, frais médicaux…). Obligatoire si revenu >120 000 CHF ou patrimoine significatif.",
    tip: 'Demande en ligne via le portail cantonal avant fin mars — récupération moyenne : 500–2 000 CHF/an.',
    source: { label: 'vs.ch — Taxation ordinaire ultérieure (TOU)', url: 'https://www.vs.ch/web/scc/tou-2025' },
  },
  {
    term: 'Revenu imposable',
    category: 'Base',
    short: 'Revenu brut moins toutes les déductions autorisées',
    detail: 'C\'est la base sur laquelle l\'impôt est calculé. Revenu imposable = Revenu brut − cotisations sociales − frais professionnels − déductions personnelles (3a, dons, frais médicaux, intérêts dettes…). Plus il est bas, moins vous payez.',
    tip: 'Chaque déduction de 1 000 CHF économise entre 150 et 400 CHF selon votre taux marginal.',
  },
  {
    term: 'Taux marginal',
    category: 'Base',
    short: 'Taux appliqué au dernier franc gagné — le plus utile pour calculer une économie',
    detail: "Dans un barème progressif, chaque tranche de revenu est taxée à un taux différent. Le taux marginal est celui de votre tranche la plus haute. C'est le taux à utiliser pour calculer l'économie fiscale d'une déduction.",
    tip: 'Ex : taux marginal 28% → déduire 7 258 CHF de 3a = économie de ~2 032 CHF.',
  },
  {
    term: 'Taux effectif',
    category: 'Base',
    short: 'Impôt total divisé par revenu imposable — taux réel moyen',
    detail: 'Le taux effectif est le pourcentage réel d\'impôt payé sur l\'ensemble de vos revenus. Il est toujours inférieur au taux marginal. Utile pour comparer la charge fiscale entre cantons ou situations.',
    tip: 'Pour un revenu de 80k CHF à Sion : taux effectif ~11%, taux marginal ~20%.',
  },
  {
    term: 'Déduction forfaitaire',
    category: 'Déductions',
    short: 'Montant fixe déductible sans justificatif — accordée automatiquement',
    detail: 'Certaines déductions sont accordées forfaitairement sans avoir à prouver les dépenses réelles. Ex : frais de repas (15 CHF/jour), frais de transport (jusqu\'à 3 000 CHF), frais professionnels divers (3% du salaire net).',
    tip: 'Toujours réclamer les forfaits même si vous ne pensez pas atteindre le montant — aucun risque.',
  },
  {
    term: 'Frais professionnels',
    category: 'Déductions',
    short: 'Dépenses liées au travail déductibles — transport, repas, formation',
    detail: 'Les frais engagés pour exercer votre activité professionnelle sont déductibles : transport domicile-travail (forfait ou réel), repas (15 CHF/jour si pas de cantine), formation continue, matériel professionnel, télétravail (forfait annuel).',
    tip: 'Un trajet de 10 km aller-retour en voiture = ~1 400 CHF de déduction annuelle (0.70 CHF/km).',
  },
  {
    term: 'LAMal',
    category: 'Assurances',
    short: 'Assurance maladie obligatoire — prime partiellement déductible',
    detail: "La LAMal (Loi sur l'Assurance MALadie) est l'assurance maladie de base obligatoire. Les primes sont partiellement déductibles (forfait cantonal). Des subsides cantonaux existent pour les revenus modestes — souvent non réclamés.",
    tip: 'Choisir une franchise de 2 500 CHF si vous êtes en bonne santé = économie de ~600–900 CHF/an sur la prime.',
  },
  {
    term: 'Subside LAMal',
    category: 'Assurances',
    short: 'Aide cantonale pour réduire la prime maladie — souvent non réclamée',
    detail: 'Chaque canton finance des subsides pour réduire la charge de la prime LAMal pour les revenus faibles à moyens. Les seuils varient selon canton et situation familiale. En Valais, l\'attribution est souvent automatique ; en Vaud, une demande est requise.',
    tip: 'VS: vérifiez votre notification AVS fin février. VD: demande sur vd.ch/sam avant le 30 septembre.',
  },
  {
    term: 'Franchise LAMal',
    category: 'Assurances',
    short: 'Montant à charge avant remboursement — de 300 à 2 500 CHF',
    detail: 'La franchise est la part des frais médicaux que vous payez avant que l\'assurance ne prenne le relais. Une franchise élevée = prime moins chère. La franchise ordinaire annuelle est de 300 CHF ; vous pouvez choisir jusqu\'à 2 500 CHF.',
    tip: 'Si vos frais médicaux annuels sont inférieurs à 2 500 CHF, la franchise maximale est financièrement avantageuse.',
  },
  {
    term: 'LPP',
    category: 'Prévoyance',
    short: 'Loi sur la Prévoyance Professionnelle — le pilier 2 obligatoire',
    detail: "La LPP définit la prévoyance professionnelle obligatoire pour les salariés. L'employeur et l'employé cotisent chacun. Le capital accumulé finance la rente de retraite, d'invalidité ou de survivants. Les cotisations sont déduites automatiquement du salaire brut.",
  },
  {
    term: 'AVS',
    category: 'Base',
    short: 'Assurance Vieillesse et Survivants — 1er pilier, cotisation 8.7%',
    detail: "L'AVS est le 1er pilier de la prévoyance suisse. Les cotisations (8.7% du salaire brut, moitié employeur/employé) sont automatiquement déduites. Elles réduisent le revenu net imposable. La rente AVS maximale est de 2 450 CHF/mois (2026).",
  },
  {
    term: 'Certificat de salaire',
    category: 'Documents',
    short: 'Document annuel de l\'employeur récapitulant salaire et déductions',
    detail: 'Le certificat de salaire (formulaire 11) est remis par l\'employeur avant le 31 janvier. Il indique le salaire brut, les cotisations sociales, le remboursement de frais, les avantages en nature. C\'est la base de votre déclaration fiscale.',
    tip: 'Vérifiez que les cases B (repas) et G (frais effectifs) sont correctement remplies — erreurs fréquentes.',
  },
  {
    term: 'Déclaration fiscale',
    category: 'Documents',
    short: 'Formulaire annuel de déclaration des revenus et fortune',
    detail: 'La déclaration fiscale annuelle (délai: 31 mars, prorogeable) liste vos revenus, fortune et déductions. Pour les imposés à la source avec revenu <120k, elle est optionnelle mais souvent avantageuse. Déposée en ligne via le portail cantonal.',
    tip: 'En Valais: e-déc.ch. En Vaud: vaudtax.vd.ch. Délai prorogeable gratuitement sur demande.',
  },
  {
    term: 'Fortune imposable',
    category: 'Base',
    short: 'Valeur nette des actifs taxée annuellement — dettes déductibles',
    detail: 'L\'impôt sur la fortune porte sur la valeur nette de vos actifs (comptes, titres, immobilier, voitures de valeur…) moins vos dettes. Chaque canton fixe son propre barème. Les avoirs 3a et LPP sont exclus.',
    tip: 'Les dettes hypothécaires et prêts sont entièrement déductibles de la fortune imposable.',
  },
  {
    term: 'Valeur locative',
    category: 'Immobilier',
    short: 'Revenu fictif imposé pour les propriétaires occupants',
    detail: 'Les propriétaires qui habitent leur bien doivent déclarer une "valeur locative" — un loyer fictif estimé par l\'État — comme revenu imposable. En contrepartie, ils peuvent déduire les intérêts hypothécaires et les frais d\'entretien.',
    tip: 'Débat politique en cours : suppression possible de la valeur locative dans les prochaines années.',
  },
  {
    term: 'Intérêts hypothécaires',
    category: 'Immobilier',
    short: 'Intérêts d\'un prêt immobilier — intégralement déductibles',
    detail: 'Les intérêts que vous payez sur votre hypothèque sont déductibles de votre revenu imposable (mais pas l\'amortissement du capital). C\'est souvent la déduction la plus importante pour les propriétaires.',
    tip: 'Stratégie : ne pas amortir l\'hypothèque trop vite si votre taux marginal est élevé — l\'économie fiscale peut dépasser le coût des intérêts.',
  },
  {
    term: 'Frais d\'entretien',
    category: 'Immobilier',
    short: 'Travaux de conservation du bien immobilier — déductibles',
    detail: 'Les dépenses pour maintenir la valeur d\'un bien immobilier (réparations, rénovations sans plus-value) sont déductibles. Choix entre déduction forfaitaire (10–20% de la valeur locative) ou frais effectifs si supérieurs.',
    tip: 'Travaux de rénovation énergétique = double avantage : déductibles fiscalement ET subventions cantonales disponibles.',
  },
  {
    term: 'Dons et libéralités',
    category: 'Déductions',
    short: 'Dons à des ONG reconnues — déductibles dès 100 CHF',
    detail: 'Les dons à des organisations d\'utilité publique reconnues (exonérées d\'impôt) sont déductibles entre 100 CHF et 20% du revenu net. La liste des organisations éligibles est publiée par chaque administration cantonale.',
    tip: 'Regroupez vos dons sur une seule année pour dépasser le seuil minimum et maximiser la déduction.',
  },
  {
    term: 'Frais médicaux',
    category: 'Déductions',
    short: 'Frais de santé non remboursés — déductibles au-delà d\'un seuil',
    detail: 'Les frais médicaux non couverts par l\'assurance (franchise, quote-part, lunettes, dentiste…) sont déductibles dans la mesure où ils dépassent 5% du revenu net. La franchise et la quote-part annuelle (max 700 CHF adulte) comptent.',
    tip: 'Conservez toutes vos factures médicales — un bon dentiste en novembre peut créer une déduction significative.',
  },
  {
    term: 'Déduction pour enfants',
    category: 'Famille',
    short: 'Abattement par enfant à charge — réduit l\'impôt directement',
    detail: 'Pour chaque enfant de moins de 18 ans (ou en formation jusqu\'à 25 ans), une déduction est accordée sur le revenu imposable. Montants 2026 : IFD = 6 700 CHF/enfant, cantonaux variables (VS ~12 000 CHF). En couple imposé à la source : code H au lieu de B.',
    tip: 'N\'oubliez pas de mettre à jour votre code de barème source après chaque naissance.',
  },
  {
    term: 'Frais de garde',
    category: 'Famille',
    short: 'Crèche, garderie, parascolaire — déductibles jusqu\'à 25 100 CHF/an (IFD)',
    detail: 'Les frais de garde d\'enfants de moins de 14 ans par des tiers (crèche, garderie, baby-sitter) sont déductibles. Plafond IFD : 25 100 CHF (2026). Les cantons ont leurs propres limites.',
    tip: 'Gardez toutes les factures de garde — les reçus des parents de jour suffisent comme justificatif.',
  },
  {
    term: 'Barème impôt source',
    category: 'Salariés étrangers',
    short: 'Code lettre déterminant le taux prélevé sur le salaire',
    detail: 'Le barème source détermine le taux de retenue appliqué par l\'employeur. Les codes principaux : A (célibataire, double gain), B (couple, seul revenu), C (couple, double revenu), H (parent seul). Mal renseigné = surpaiement d\'impôt.',
    tip: 'Vérifiez votre code sur votre fiche de salaire — une erreur de barème peut coûter plusieurs centaines de CHF par mois.',
  },
  {
    term: 'Péréquation fiscale',
    category: 'Fédéral',
    short: 'Mécanisme de redistribution entre cantons riches et pauvres',
    detail: 'La péréquation financière (RPT) redistribue des ressources des cantons à fort potentiel fiscal (ZH, ZG, BS) vers les cantons plus pauvres (VS, FR, JU). Elle explique en partie pourquoi les taux d\'imposition varient selon les cantons.',
  },
  {
    term: 'Optimisation fiscale',
    category: 'Base',
    short: 'Utilisation légale de toutes les déductions pour réduire l\'impôt',
    detail: 'L\'optimisation fiscale consiste à utiliser légalement toutes les déductions, abattements et stratégies permis par la loi pour minimiser sa charge fiscale. Différente de l\'évasion fiscale (légale) et de la fraude fiscale (illégale).',
    tip: 'En Suisse, l\'optimisation fiscale est un droit — l\'Administration fédérale des contributions ne peut pas la contester si les déductions sont légitimes.',
  },
  {
    term: 'AFC',
    category: 'Fédéral',
    short: 'Administration fédérale des contributions — l\'autorité fiscale fédérale',
    detail: 'L\'AFC (estv.admin.ch) est l\'autorité fiscale fédérale suisse. Elle publie les barèmes officiels de l\'IFD, les circulaires fiscales, et supervise l\'impôt anticipé et les droits de timbre. Source de référence pour toutes les données fiscales fédérales.',
  },
  {
    term: 'Service cantonal des contributions',
    category: 'Cantonal',
    short: 'Autorité fiscale cantonale — gère ICC et déclarations',
    detail: 'Chaque canton dispose de son service fiscal. VS: scc.vs.ch — VD: vd.ch/dfi — GE: ge.ch/contributions — NE: ne.ch/impots. C\'est là que vous déposez votre déclaration, demandez une prorogation de délai, ou contestez une taxation.',
    tip: 'La plupart des services cantonaux proposent des permanences téléphoniques gratuites pour les questions simples.',
  },
  {
    term: 'Taxation définitive',
    category: 'Documents',
    short: 'Décision fiscale finale après traitement de votre déclaration',
    detail: 'Après traitement de votre déclaration, l\'administration émet une taxation définitive (décision de taxation). Vous avez 30 jours pour faire opposition si vous n\'êtes pas d\'accord. Sans opposition, la taxation devient définitive et exécutoire.',
    tip: 'Lisez attentivement votre taxation — vérifiez que toutes vos déductions ont été acceptées.',
  },
  {
    term: 'Opposition fiscale',
    category: 'Documents',
    short: 'Recours contre une taxation jugée incorrecte — délai 30 jours',
    detail: 'Si vous contestez votre taxation définitive (déductions refusées, revenu surévalué…), vous pouvez déposer une opposition dans les 30 jours suivant la notification. C\'est gratuit et peut être fait par écrit ou en ligne.',
    tip: 'Une opposition bien motivée avec pièces justificatives est acceptée dans ~60% des cas selon les statistiques cantonales.',
  },
];

// ── Catégories ────────────────────────────────────────────────────────────────
const CATEGORY_ORDER = ['Base', 'Fédéral', 'Cantonal', 'Prévoyance', 'Déductions', 'Assurances', 'Immobilier', 'Famille', 'Documents', 'Salariés étrangers'];
const CATEGORIES = ['Tous', ...CATEGORY_ORDER.filter((c) => TERMS.some((t) => t.category === c))];

const CAT_COLORS: Record<string, string> = {
  'Fédéral':           'var(--accent)',
  'Cantonal':          '#4f8ef7',
  'Prévoyance':        '#a78bfa',
  'Salariés étrangers':'#f59e0b',
  'Base':              '#22c55e',
  'Déductions':        '#06b6d4',
  'Assurances':        '#ec4899',
  'Immobilier':        '#14b8a6',
  'Famille':           '#f97316',
  'Documents':         '#84cc16',
};
function catColor(c: string) { return CAT_COLORS[c] ?? 'var(--text-3)'; }

// ── TermCard ──────────────────────────────────────────────────────────────────
function TermCard({ t }: { t: Term }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen((v) => !v)}
      style={{
        padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
        background: 'var(--bg-card)', border: `1px solid ${open ? catColor(t.category) : 'var(--border)'}`,
        transition: 'border-color 150ms',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
            background: `${catColor(t.category)}22`, color: catColor(t.category),
            fontWeight: 600, letterSpacing: '0.04em',
          }}>{t.category}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{t.term}</span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
        >
          <path d="M2 5l5 5 5-5" />
        </svg>
      </div>

      {/* Short */}
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.4 }}>{t.short}</p>

      {/* Detail */}
      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{t.detail}</p>
          {t.tip && (
            <div style={{
              marginTop: 10, padding: '10px 12px', borderRadius: 10,
              background: 'rgba(201,100,66,0.08)',
              borderLeft: '3px solid var(--accent)',
            }}>
              <p style={{ fontSize: 12, color: 'var(--accent)', lineHeight: 1.5 }}>
                💡 {t.tip}
              </p>
            </div>
          )}
          {t.source && (
            <a
              href={t.source.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: 'var(--text-3)', textDecoration: 'none' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M4.5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V6.5M7 1h3m0 0v3m0-3L4.5 6.5" />
              </svg>
              {t.source.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export function LexiqueTab() {
  const [search, setSearch]   = useState('');
  const [activeCat, setActiveCat] = useState('Tous');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return TERMS.filter((t) => {
      const matchCat  = activeCat === 'Tous' || t.category === activeCat;
      const matchText = !q || t.term.toLowerCase().includes(q) || t.short.toLowerCase().includes(q) || t.detail.toLowerCase().includes(q);
      return matchCat && matchText;
    });
  }, [search, activeCat]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Barre de recherche */}
      <div style={{ position: 'relative' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-3)" strokeWidth="1.6" strokeLinecap="round"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="7" cy="7" r="5" /><path d="M12 12l2 2" />
        </svg>
        <input
          type="text"
          aria-label="Rechercher un terme fiscal"
          placeholder="Rechercher un terme…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '11px 14px 11px 36px', borderRadius: 12, fontSize: 14,
            background: 'var(--bg-card)', border: '1.5px solid var(--border)',
            color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        />
      </div>

      {/* Filtres catégorie */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              fontWeight: activeCat === cat ? 600 : 400,
              background: activeCat === cat ? `${catColor(cat)}22` : 'var(--bg-card)',
              color:      activeCat === cat ? catColor(cat) : 'var(--text-3)',
              border:     `1px solid ${activeCat === cat ? catColor(cat) : 'var(--border)'}`,
              transition: 'all 150ms',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Compteur */}
      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
        {filtered.length} terme{filtered.length !== 1 ? 's' : ''}
        {search || activeCat !== 'Tous' ? ` — ${TERMS.length} au total` : ''}
      </p>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 14 }}>
          {search
            ? <>Aucun terme ne correspond à�<em>{search}</em>�. Essayez un autre mot-clé.</>
            : 'Aucun terme dans cette catégorie.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((t) => <TermCard key={t.term} t={t} />)}
        </div>
      )}
    </div>
  );
}
