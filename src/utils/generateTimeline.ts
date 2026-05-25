import type { UserProfile } from '../types';
import { getCantonConfig } from './cantonConfig';
import { calculateWealthTax } from './wealthTax';

export type EventType = 'critical' | 'warning' | 'positive' | 'info';

export interface TimelineEvent {
  id: string;
  title: string;
  detail?: string;
  type: EventType;
  day?: number;        // day of month if specific deadline
  actionId?: string;  // linked action ID
}

export interface TimelineMonth {
  month: number;       // 1-12
  name: string;
  events: TimelineEvent[];
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function generateTimeline(profile: UserProfile): TimelineMonth[] {
  const cc      = getCantonConfig(profile.canton);
  const isOwner = profile.housing === 'owner' || profile.housing === 'owner_rental';
  const isSelf  = profile.activity === 'self' || profile.activity === 'both';
  const isCouple = profile.situation === 'couple';
  const isPermitB   = profile.permit === 'B';
  const useTOU      = profile.useTOU === true;
  const income      = Number(profile.income) || 0;
  const annualIncome = income * 12;
  const has3a       = profile.has3a === 'yes';

  // Seuil IS : au-dessus = déclaration obligatoire ; en-dessous = TOU facultative
  const seuil        = cc.seuilDeclarationIS;
  const fmtSeuil     = seuil.toLocaleString('fr-CH');
  const isAboveSeuil = isPermitB && annualIncome >= seuil;

  // Impôt sur la fortune
  const fortune      = Number(profile.fortune) || 0;
  const hasFortune   = fortune > 0;
  const wealthTax    = hasFortune ? calculateWealthTax(fortune, profile.canton, profile.situation) : null;
  const wtAmount     = wealthTax?.taxAmountTotal ?? 0;
  const wtFmt        = wtAmount > 0 ? `~${Math.round(wtAmount).toLocaleString('fr-CH')} CHF/an` : 'sous le seuil d\'exonération';
  const fortuneFmt   = fortune.toLocaleString('fr-CH');

  // All events keyed by month (1=Jan ... 12=Dec)
  const raw: Array<{ month: number; event: TimelineEvent; show?: boolean }> = [

    /* ── Janvier ─────────────────────────────────────────────────────── */
    { month: 1, event: { id: 'jan-1', title: 'Programmer versements 3a mensuels', detail: `Ordre permanent de ${Math.round(7258 / 12)} CHF/mois dès maintenant`, type: 'positive', actionId: '1' } },
    { month: 1, event: { id: 'jan-2', title: 'Demander attestation rachat LPP', detail: 'Contacter ta caisse de pension pour connaître ta lacune rachetable', type: 'info', actionId: '5' }, show: annualIncome > 70000 },
    { month: 1, event: { id: 'jan-3', title: 'Recevoir relevé annuel bancaire', detail: 'Intérêts et frais de gestion — à conserver pour la déclaration', type: 'info', actionId: '34' } },
    { month: 1, event: { id: 'jan-4', title: 'Attestation intérêts hypothécaires', detail: 'Ta banque envoie le relevé annuel — conserver pour avril', type: 'info', actionId: '21' }, show: isOwner },
    { month: 1, event: { id: 'jan-5', title: 'Planifier acomptes AVS Q1', detail: 'Paiement avant fin mars', type: 'warning', actionId: '30' }, show: isSelf },

    /* ── Février ─────────────────────────────────────────────────────── */
    { month: 2, event: { id: 'fev-1', title: 'Recevoir le certificat de salaire 2025', detail: 'Ton employeur doit l\'envoyer avant fin février', type: 'info' } },
    { month: 2, event: { id: 'fev-2', title: 'Recevoir attestations 3a 2025', detail: 'VIAC / finpension envoie les attestations — à joindre à la déclaration', type: 'positive', actionId: '1' }, show: has3a },
    { month: 2, event: { id: 'fev-3', title: `Vérifier subsides LAMal ${cc.name}`, detail: cc.subsidesInfo, type: 'positive', actionId: '3' }, show: annualIncome < 90000 },
    { month: 2, event: { id: 'fev-4', title: 'Préparer la comptabilité 2025', detail: 'Rassembler toutes les factures et charges de l\'année', type: 'warning' }, show: isSelf },

    /* ── Mars ────────────────────────────────────────────────────────── */
    // Déclaration OBLIGATOIRE si revenu annuel ≥ seuil IS (120k VS/VD/NE · 500k GE)
    { month: cc.touMonth, event: { id: 'tou-mandatory', title: `DEADLINE : Déclaration obligatoire IS — ${cc.touLabel}`, detail: `Ton revenu (${annualIncome.toLocaleString('fr-CH')} CHF/an) dépasse le seuil de ${fmtSeuil} CHF → déclaration ordinaire obligatoire. À remettre au ${cc.taxAuthority}.`, type: 'critical', day: cc.touDay }, show: isAboveSeuil },
    // TOU CHOISIE (useTOU actif) : traiter comme une deadline critique
    { month: cc.touMonth, event: { id: 'tou-engaged', title: `DEADLINE : Dépôt déclaration TOU — ${cc.touLabel}`, detail: `Tu as choisi la TOU : dépose ta déclaration ordinaire avant le ${cc.touLabel} pour déduire ton 3a, tes frais pro et autres charges réelles. À remettre au ${cc.taxAuthority}.`, type: 'critical', day: cc.touDay }, show: isPermitB && !isAboveSeuil && useTOU },
    // TOU FACULTATIVE si revenu annuel < seuil IS — recommandée si déductions importantes (et TOU non encore choisie)
    { month: cc.touMonth, event: { id: 'tou-1', title: `TOU facultative — à demander avant ${cc.touLabel}`, detail: `En dessous du seuil de ${fmtSeuil} CHF/an, tu restes imposé à la source. TOU recommandée si 3a, frais pro ou dons importants. Gain typique : 500–3\'000 CHF.`, type: 'warning', day: cc.touDay }, show: isPermitB && !isAboveSeuil && !useTOU },
    { month: 3, event: { id: 'mar-2', title: 'Rassembler factures médicales 2025', detail: 'Frais non remboursés > 5% du revenu net', type: 'info', actionId: '10' } },
    { month: 3, event: { id: 'mar-3', title: 'Rassembler factures crèche / garderie', detail: 'Tous les reçus de l\'année pour la déduction enfants', type: 'info', actionId: '9' }, show: Number(profile.children) > 0 },
    { month: 3, event: { id: 'mar-4', title: 'Rassembler factures formation continue', detail: 'Certificats et factures liés à l\'activité professionnelle', type: 'info', actionId: '7' } },
    { month: 3, event: { id: 'mar-5', title: 'Rassembler factures travaux immobiliers', detail: 'Entretien, rénovations, amortissements pour avril', type: 'info', actionId: '22' }, show: isOwner },
    { month: 3, event: { id: 'mar-6', title: 'Payer acomptes AVS Q1', detail: 'Paiement avant fin mars', type: 'warning', actionId: '30' }, show: isSelf },

    /* ── Avril ───────────────────────────────────────────────────────── */
    // Déclaration ordinaire : permis C/CH toujours · permis B si revenu ≥ seuil IS OU si TOU choisie
    { month: cc.declarationMonth, event: { id: 'decl-1', title: `DEADLINE : Déclaration d'impôts — ${cc.declarationLabel}`, detail: cc.declarationExtension, type: 'critical', day: cc.declarationDay }, show: !isPermitB || isAboveSeuil || useTOU },
    { month: 4, event: { id: 'avr-2', title: 'Déduire frais professionnels', detail: 'Transport (0.70 CHF/km ou TP) + repas 3\'200 CHF forfait', type: 'warning', actionId: '2' } },
    { month: 4, event: { id: 'avr-3', title: 'Récupérer impôt anticipé 35%', detail: 'Déclarer dividendes et intérêts suisses pour récupérer les 35%', type: 'positive', actionId: '33' } },
    { month: 4, event: { id: 'avr-4', title: 'Déduire dons et cotisations syndicales', detail: 'Joindre attestations organisations Zewo', type: 'info', actionId: '11' } },
    { month: 4, event: { id: 'avr-5', title: 'Déduire intérêts de dettes', detail: 'Hypothèque, crédit conso, cartes de crédit', type: 'info', actionId: '13' } },
    { month: 4, event: { id: 'avr-6', title: 'Choisir forfait vs frais réels entretien', detail: 'Comparer les deux options selon tes travaux de l\'année', type: 'warning', actionId: '22' }, show: isOwner },
    { month: 4, event: { id: 'avr-7', title: 'Déclarer revenus et toutes charges pro', detail: 'Indépendant : déclaration complète avec justificatifs', type: 'warning' }, show: isSelf },
    { month: 4, event: { id: 'avr-8', title: 'Déduire frais garde d\'enfants', detail: 'Crèche, garderie, parascolaire — plafonné à 3\'060 CHF cantonal', type: 'info', actionId: '9' }, show: Number(profile.children) > 0 },

    /* ── Mai ─────────────────────────────────────────────────────────── */
    { month: 5, event: { id: 'mai-1', title: 'Vérifier les acomptes d\'impôts 2026', detail: 'Contrôler les bulletins d\'acompte reçus — ajuster si revenu a changé', type: 'warning' } },
    { month: 5, event: { id: 'mai-2', title: 'Bilan des actions du S1', detail: 'Quelles actions as-tu réalisées ? Lesquelles restent à faire avant juin ?', type: 'positive' } },
    { month: 5, event: { id: 'mai-3', title: 'Vérifier remboursement impôt anticipé 35%', detail: 'Si tu as déclaré en avril, l\'avoir fiscal devrait être crédité vers mai-juin', type: 'positive', actionId: '33' } },
    { month: 5, event: { id: 'mai-4', title: 'Notification de taxation permis B', detail: 'La commune envoie souvent la décision de taxation en mai — vérifier et contester si nécessaire', type: 'info' }, show: isPermitB },

    /* ── Juin ────────────────────────────────────────────────────────── */
    { month: 6, event: { id: 'jui-1', title: 'Payer acomptes AVS Q2', detail: 'Paiement avant fin juin', type: 'warning', actionId: '30' }, show: isSelf },
    { month: 6, event: { id: 'jui-2', title: 'Mi-année : bilan versements 3a', detail: `Vérifie que tu es sur la trajectoire des 7'258 CHF annuels`, type: 'positive', actionId: '1' } },

    /* ── Juillet ─────────────────────────────────────────────────────── */
    { month: 7, event: { id: 'jul-1', title: 'Planifier formation continue H2', detail: 'Inscrire les cours avant la fin d\'année pour la déduction 2026', type: 'info', actionId: '7' } },

    /* ── Août ───────────────────────────────────────────────────────── */
    { month: 8, event: { id: 'aou-1', title: 'Bilan fiscal mi-S2 — faire le point', detail: 'Revoir les actions non réalisées et planifier la rentrée fiscale d\'automne', type: 'positive' } },
    { month: 8, event: { id: 'aou-2', title: 'Vérifier l\'avancement des versements 3a', detail: `Objectif : ${Math.round(7258 * 8 / 12).toLocaleString('fr-CH')} CHF versés à fin août`, type: 'info', actionId: '1' }, show: has3a },
    { month: 8, event: { id: 'aou-3', title: 'Planifier les acomptes AVS Q3', detail: 'Paiement avant fin septembre — anticiper dès août', type: 'warning', actionId: '30' }, show: isSelf },

    /* ── Septembre ───────────────────────────────────────────────────── */
    { month: 9, event: { id: 'sep-1', title: 'Primes LAMal 2027 publiées — comparer', detail: 'Utiliser priminfo.admin.ch pour comparer caisses et modèles', type: 'warning', actionId: '4' } },
    { month: 9, event: { id: 'sep-2', title: 'Calculer franchise optimale 2027', detail: 'Comparer tes dépenses de santé réelles vs économie en prime', type: 'info', actionId: '17' } },
    { month: 9, event: { id: 'sep-3', title: 'Payer acomptes AVS Q3', detail: 'Paiement avant fin septembre', type: 'warning', actionId: '30' }, show: isSelf },
    { month: 9, event: { id: 'sep-4', title: 'Planifier rénovations énergétiques', detail: 'Avant la réforme 2029 qui supprime la déduction', type: 'warning', actionId: '23' }, show: isOwner },

    /* ── Octobre ─────────────────────────────────────────────────────── */
    { month: 10, event: { id: 'oct-1', title: 'Décider caisse LAMal 2027', detail: 'Choisir la moins chère — résiliation avant 30 novembre', type: 'warning', actionId: '4' } },
    { month: 10, event: { id: 'oct-2', title: 'Choisir modèle LAMal alternatif', detail: 'HMO, médecin de famille, télémédecine — jusqu\'à −25%', type: 'info', actionId: '18' } },
    { month: 10, event: { id: 'oct-3', title: 'Optimiser la franchise 2027', detail: 'Comparer 300 vs 2\'500 CHF selon usage médical réel', type: 'info', actionId: '17' } },
    { month: 10, event: { id: 'oct-4', title: 'Estimer les frais médicaux de l\'année', detail: 'Vérifier si tu dépasses le seuil de 5% du revenu net', type: 'info', actionId: '10' } },

    /* ── Novembre ────────────────────────────────────────────────────── */
    { month: 11, event: { id: 'nov-1', title: 'DEADLINE : Résiliation LAMal avant 30 nov', detail: 'Lettre recommandée à l\'ancienne caisse — effet 1er janvier 2027', type: 'critical', actionId: '4' , day: 30} },
    { month: 11, event: { id: 'nov-2', title: 'DEADLINE : Changement de franchise avant 30 nov', detail: 'Communiquer à ta caisse actuelle — deadline absolue', type: 'critical', actionId: '17' , day: 30} },
    { month: 11, event: { id: 'nov-3', title: 'Payer acomptes AVS Q4', detail: 'Paiement avant fin décembre', type: 'warning', actionId: '30' }, show: isSelf },
    { month: 11, event: { id: 'nov-4', title: 'Vérifier les rachats LPP planifiés', detail: 'Dernier moment pour planifier le versement de décembre', type: 'info', actionId: '39' }, show: annualIncome > 70000 },

    /* ── Fortune : déclaration conjointe (même deadline que la déclaration revenus) ── */
    { month: cc.declarationMonth, event: {
      id: 'fortune-decl',
      title: `Déclarer l'impôt sur la fortune — ${cc.declarationLabel}`,
      detail: `Fortune nette ${fortuneFmt} CHF → impôt estimé ${wtFmt}. La fortune se déclare en même temps que les revenus (même formulaire).`,
      type: 'warning',
      day: cc.declarationDay,
    }, show: hasFortune && (!isPermitB || isAboveSeuil || useTOU) },

    /* ── Fortune : acompte (si impôt > 300 CHF) ── */
    { month: 5, event: {
      id: 'fortune-acompte',
      title: `Vérifier l'acompte impôt sur la fortune`,
      detail: `Impôt fortune estimé à ${wtFmt}. Si l'acompte envoyé par le canton ne l'intègre pas, contacter le service des contributions.`,
      type: 'info',
    }, show: hasFortune && wtAmount > 300 },

    /* ── Décembre ────────────────────────────────────────────────────── */
    { month: 12, event: { id: 'dec-1', title: 'DEADLINE : Maxer le 3a avant 31 décembre', detail: `Verser le solde jusqu'aux 7'258 CHF — deadline absolue`, type: 'critical', actionId: '1' , day: 31} },
    { month: 12, event: { id: 'dec-2', title: 'DEADLINE : Rachat rétroactif 3a 2025', detail: 'Rattraper la lacune 2025 — uniquement en 2026', type: 'critical', actionId: '16' , day: 31}, show: has3a && annualIncome > 50000 },
    { month: 12, event: { id: 'dec-3', title: 'Faire les dons d\'utilité publique', detail: 'Organisations Zewo certifiées — avant minuit le 31.12', type: 'warning', actionId: '11' , day: 31} },
    { month: 12, event: { id: 'dec-4', title: 'Effectuer rachats LPP planifiés', detail: 'Dernier délai pour la déduction fiscale 2026', type: 'critical', actionId: '5' , day: 31}, show: annualIncome > 70000 },
    { month: 12, event: { id: 'dec-5', title: 'Dernier versement 3a indépendant', detail: `Jusqu'à 36'288 CHF — profiter du plafond étendu`, type: 'critical', actionId: '26' }, show: isSelf },
    { month: 12, event: { id: 'dec-6', title: 'Bilan annuel — préparer 2027', detail: 'Évaluer les actions non réalisées et planifier le calendrier 2027', type: 'positive' } },
    { month: 12, event: { id: 'dec-7', title: 'Planifier travaux immobiliers', detail: "Décider si facturer avant ou après le 31.12 selon l'année fiscale optimale", type: 'info', actionId: '22' }, show: isOwner },
    { month: 12, event: { id: 'dec-8', title: 'Déduction couple 2 revenus — vérifier IFD', detail: 'Contrôler que la déduction est bien appliquée dans la déclaration', type: 'info', actionId: '35' }, show: isCouple },
  ];

  // Build months array (only months that have at least one visible event)
  const monthMap = new Map<number, TimelineEvent[]>();
  for (const { month, event, show } of raw) {
    if (show === false) continue;
    if (!monthMap.has(month)) monthMap.set(month, []);
    monthMap.get(month)!.push(event);
  }

  const result: TimelineMonth[] = [];
  for (let m = 1; m <= 12; m++) {
    const events = monthMap.get(m);
    if (events && events.length > 0) {
      result.push({ month: m, name: MONTHS[m - 1], events });
    }
  }
  return result;
}
