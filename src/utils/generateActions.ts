import type { UserProfile, Action } from '../types';
import { getMarginalRate } from './taxBrackets';
import { cleanNumber } from './numberUtils';

export function generateActions(profile: UserProfile): Action[] {
  const actions: Action[] = [];
  const isCouple = profile.situation === 'couple';
  const income = cleanNumber(profile.income);
  const annualIncome = income * 12;
  const canton = profile.canton;
  const children = cleanNumber(profile.children);

  const { marginalRate } = getMarginalRate(annualIncome, canton, profile.situation ?? 'single');

  // ACTION 1: 3a Pilier
  const pillar3aMax = 7258;
  const pillar3aCount = isCouple ? 2 : 1;
  const pillar3aGain = Math.round(pillar3aMax * pillar3aCount * marginalRate);

  actions.push({
    id: '1',
    titre: profile.has3a === 'no'
      ? `Ouvrir ${pillar3aCount} pilier(s) 3a et maxer (${(pillar3aMax * pillar3aCount).toLocaleString()} CHF/an)`
      : `Maxer ${pillar3aCount} pilier(s) 3a (${(pillar3aMax * pillar3aCount).toLocaleString()} CHF/an)`,
    category: '3a',
    priority: 'high',
    gain: pillar3aGain,
    guide: profile.has3a === 'no'
      ? `1. Va sur viac.ch ou finpension.ch\n2. Ouvre ${pillar3aCount} compte(s) ${pillar3aCount > 1 ? 'séparés' : ''}\n3. Choisis stratégie 99% actions\n4. Programme ${Math.round(pillar3aMax / 12)} CHF/mois\n5. Versement avant 31 décembre`
      : `1. Vérifie ton solde versé en 2026\n2. Calcule le restant à verser\n3. Programme un ordre permanent\n4. ⚠️ Deadline: 31 décembre 2026\n5. Conserve l'attestation`,
    why: 'Les piliers 3a offrent une déduction fiscale immédiate et un rendement sans impôt sur les dividendes.',
    checklist: ['Créer un compte 3a', 'Configurer versements mensuels', 'Vérifier date limite'],
  });

  // ACTION 2: Frais professionnels
  const transportGain = Math.round(3000 * marginalRate * (isCouple ? 2 : 1));
  const mealsGain = Math.round(3200 * marginalRate * (isCouple ? 2 : 1));
  const totalProGain = transportGain + mealsGain;

  actions.push({
    id: '2',
    titre: 'Réclamer frais professionnels (transport + repas)',
    category: 'Frais pro',
    priority: 'high',
    gain: totalProGain,
    guide: `Transport:\n- Voiture: distance × 0.70 CHF/km (max 3000 CHF)\n- Vélo: 700 CHF/an\n- TP: montant exact abonnement\n\nRepas:\n- 15 CHF/jour sans cantine (max 3200 CHF)\n- Aucun justificatif`,
    why: 'Les frais professionnels sont des déductions automatiques qui réduisent ton impôt de manière significative.',
    checklist: ['Calculer frais transport', 'Documenter jours de travail', 'Déclarer repas'],
  });

  // ACTION 3: LAMal subsides — seuil variable par canton (pas de seuil fédéral uniforme)
  const subsidyGain = children > 0 ? 3000 + (children * 500) : 2000;
  const subsidesGuide: Record<string, string> = {
    VS: `Valais: attribution automatique si éligible\n1. Va sur avsvalais.ch\n2. Le versement est automatique si tu es dans les seuils VS — vérifie ta notification fin février\n3. Si rien reçu, contacte ta commune ou l'AVS Valais directement`,
    VD: `Vaud: démarche obligatoire avant le 30 septembre\n1. Va sur vd.ch/sam (Service de l'assurance maladie)\n2. Crée un compte MyUniLogin si besoin\n3. Remplis la demande en ligne (revenus N-1)\n4. Délai impératif: 30 septembre pour l'année suivante\n5. Subsides crédités directement sur ta prime`,
    GE: `Genève: pas de coefficient communal (taux uniforme cantonal)\n1. Va sur ge.ch/spc (Service des prestations complémentaires)\n2. Utilise le calculateur en ligne pour estimer ton droit\n3. Fais la demande en ligne ou par courrier\n4. Réévaluation annuelle automatique si déjà bénéficiaire`,
    NE: `Neuchâtel: attribution largement automatique\n1. Si ton revenu est dans les seuils NE, tu reçois les subsides sans démarche\n2. Sinon, va sur ne.ch/OAS (Office des assurances sociales)\n3. Joins tes derniers justificatifs de revenus\n4. Délai: avant fin octobre pour l'année suivante`,
  };
  actions.push({
    id: '3',
    titre: `Vérifier subsides LAMal ${canton}`,
    category: 'LAMal',
    priority: 'high',
    gain: subsidyGain,
    guide: subsidesGuide[canton] ?? subsidesGuide['VS'],
    why: `Les subsides LAMal dépendent du canton — chacun fixe ses propres seuils de revenu. En ${canton}, la démarche et les conditions sont spécifiques. Économie possible: 1'000 à 5'000 CHF/an.`,
    checklist: ["Vérifier les seuils de ton canton", "Suivre la démarche canton-spécifique ci-dessus", "Confirmer réception ou validation"],
  });

  // ACTION 4: Comparaison primes LAMal
  const lamalGain = isCouple ? 400 : 250;
  actions.push({
    id: '4',
    titre: 'Comparer primes LAMal 2027',
    category: 'LAMal',
    priority: 'medium',
    gain: lamalGain,
    guide: `1. Va sur priminfo.admin.ch en septembre\n2. Compare modèles: standard, médecin de famille, HMO\n3. Essaie franchise: 300 → 2500 CHF\n4. Envoie résiliation recommandée avant 30 novembre\n5. Changement effectif 1er janvier 2027`,
    why: 'Les primes peuvent baisser de 10-30% en changeant de caisse sans perdre de prestations.',
    checklist: ['Consulter priminfo.admin.ch', 'Comparer 3 offres', 'Envoyer résiliation'],
  });

  // ACTION 5: LPP rachat
  if (annualIncome > 70000) {
    const lppGain = Math.round(20000 * marginalRate);
    actions.push({
      id: '5',
      titre: 'Demander attestation rachat 2e pilier (LPP)',
      category: 'LPP',
      priority: 'medium',
      gain: lppGain,
      guide: `1. Contacte ta caisse de pension\n2. Demande "attestation de rachat LPP"\n3. Reçois montant maximum rachetable\n4. Étale sur 3-5 ans (optimal)\n5. ⚠️ 3 ans lock-up si tu achètes ta résidence`,
      why: 'Le rachat LPP peut dégager plusieurs milliers CHF de déduction fiscale.',
      checklist: ['Contacter caisse de pension', 'Obtenir attestation', 'Planifier échelonnement'],
    });
  }

  // ACTION 6: Coefficient fiscal communal (Valais)
  if (canton === 'VS') {
    actions.push({
      id: '6',
      titre: 'Vérifier coefficient fiscal de ta commune Valais',
      category: 'Autres',
      priority: 'low',
      gain: 1500,
      guide: `Coefficients 2026 (source vs.ch):\n- Zermatt: 110%\n- Sion: 130%\n- Sierre: 135%\n- Monthey: 145%\n\nÉconomie possible: 5-8% sur impôt cantonal`,
      why: 'Déménager vers une commune avec coefficient bas peut économiser jusqu\'à 1000+ CHF/an.',
      checklist: ['Consulter liste communes', 'Calculer impact', 'Si déménagement prévu'],
    });
  }

  // ACTION 7: Formation continue
  actions.push({
    id: '7',
    titre: 'Réclamer frais formation continue',
    category: 'Frais pro',
    priority: 'medium',
    gain: Math.round(5000 * marginalRate),
    guide: `Plafonds 2026:\n- Cantonal Valais: 12550 CHF/an\n- Fédéral: 12700 CHF/an\n\n✅ Déductible: cours, certifications, MBA, langues\n❌ Non déductible: 1er diplôme, hobbies\n\nJoins tous les certificats`,
    why: 'Les frais de formation sont totalement déductibles s\'ils sont professionnels.',
    checklist: ['Rassembler factures', 'Documenter lien professionnel', 'Inclure certificats'],
  });

  // ACTION 8: ETF capitalisant VWCE
  actions.push({
    id: '8',
    titre: 'Utiliser ETF capitalisant (VWCE) pour éviter impôt dividendes',
    category: 'Investissement',
    priority: 'high',
    gain: 400,
    guide: `ETF recommandé: VWCE (Vanguard FTSE All-World)\nISIN: IE00BK5BQT80\n\n💡 Avantages:\n- Capitalisant = 0 impôt annuel dividendes\n- TER 0.22%/an (très bas)\n- Domicile Irlande (fiscalité optimale)\n\nÉconomie vs distribuant: ~400 CHF/an sur 100k CHF investis`,
    why: 'Les ETF capitalisants évitent l\'imposition annuelle des dividendes, maximisant la croissance composée.',
    checklist: ['Comprendre capitalisant vs distribuant', 'Ouvrir compte broker', 'Investir progressivement'],
  });

  // ACTION 9: Frais garde enfants
  if (children > 0) {
    const gardeCantonalGain = Math.round(3060 * children * marginalRate);
    const gardeFedGain = Math.round(10000 * children * 0.08);
    actions.push({
      id: '9',
      titre: 'Réclamer frais garde d\'enfants',
      category: 'Enfants',
      priority: 'high',
      gain: gardeCantonalGain + gardeFedGain,
      guide: `Plafonds 2026:\n- Cantonal Valais: 3060 CHF/enfant\n- Fédéral: 25500 CHF/enfant\n\n✅ Déductible: crèche, garderie, parascolaire\n❌ Non déductible: grands-parents, baby-sitting occasionnel\n\nConditions: enfant < 14 ans, les 2 parents travaillent`,
      why: 'Les frais de garde sont totalement déductibles et peuvent représenter une économie importante.',
      checklist: ['Rassembler factures', 'Documenter lien travail', 'Vérifier plafonds'],
    });
  }

  // ACTION 10: Frais médicaux
  const medicalThreshold = Math.round(annualIncome * 0.05);
  actions.push({
    id: '10',
    titre: 'Déduire frais médicaux non remboursés (>5% du revenu net)',
    category: 'Santé',
    priority: 'medium',
    gain: Math.round(2000 * marginalRate),
    guide: `Règle: déductible si > 5% du revenu net\nTon seuil: ~${medicalThreshold.toLocaleString()} CHF/an\n\n✅ Déductible: dentiste, lunettes, lentilles, pharma\n❌ Non: soins esthétiques, vitamines libres\n\n💡 Astuce: concentrer soins sur 1 année`,
    why: 'Les frais médicaux excédant 5% du revenu sont déductibles.',
    checklist: ['Rassembler reçus', 'Calculer dépassement seuil', 'Conserver factures 5 ans'],
  });

  // ACTION 11: Dons
  const donationGain = Math.round(500 * marginalRate);
  actions.push({
    id: '11',
    titre: 'Déduire dons à organisations utilité publique (Zewo)',
    category: 'Dons',
    priority: 'low',
    gain: donationGain,
    guide: `Plafonds: 20% du revenu net\n\n✅ Organisations Zewo certifiées:\n- UNICEF, Croix-Rouge, Caritas\n- WWF, Greenpeace\n- Médecins Sans Frontières\n\nVérifie: zewo.ch/fr`,
    why: 'Les dons à organisations certifiées offrent une déduction fiscale.',
    checklist: ['Vérifier label Zewo', 'Demander attestation', 'Inclure dans déclaration'],
  });

  // ACTION 12: Syndicats/associations pro
  actions.push({
    id: '12',
    titre: 'Déduire cotisations syndicales/associations pro',
    category: 'Frais pro',
    priority: 'low',
    gain: Math.round(500 * marginalRate),
    guide: `✅ Déductibles: syndicats, associations pro, ordres professionnels\n\nExemples: Unia, Syna, Chambres de commerce\n\nDemande attestation annuelle au syndicat`,
    why: 'Les cotisations syndicales et professionnelles sont déductibles.',
    checklist: ['Obtenir attestation', 'Vérifier montant annual', 'Inclure dans déclaration'],
  });

  // ACTION 13: Intérêts de dettes
  actions.push({
    id: '13',
    titre: 'Déduire intérêts de dettes (hypothèque, crédit conso, cartes)',
    category: 'Dettes',
    priority: 'medium',
    gain: Math.round(2000 * marginalRate),
    guide: `✅ Déductibles: hypothèque, crédits conso, cartes, découvert\n❌ Non: leasing auto pour salarié, capital remboursé\n\nJustificatifs: attestations bancaires`,
    why: 'Les intérêts de dettes réduisent directement ton impôt.',
    checklist: ['Obtenir relevé intérêts', 'Documenter dettes', 'Conserver attestations'],
  });

  // ACTION 14: Frais gestion portefeuille
  actions.push({
    id: '14',
    titre: 'Déduire frais gestion portefeuille titres (forfait 1.5‰)',
    category: 'Investissement',
    priority: 'low',
    gain: 100,
    guide: `Forfait automatique: 1.5‰ de la valeur des titres\n\nExemples:\n- 10000 CHF → 15 CHF déduction\n- 50000 CHF → 75 CHF déduction\n- 100000 CHF → 150 CHF déduction\n\nAucun justificatif requis`,
    why: 'Le forfait 1.5‰ est automatiquement déductible pour tout portefeuille.',
    checklist: ['Déterminer valeur au 31 décembre', 'Appliquer forfait 1.5‰', 'Déclarer'],
  });

  // ACTION 15: Primes assurances
  actions.push({
    id: '15',
    titre: 'Déduire primes assurances (LAMal, vie, RC)',
    category: 'Assurances',
    priority: 'medium',
    gain: Math.round(2500 * marginalRate * (isCouple ? 1.5 : 1)),
    guide: `Forfait Valais 2026 (estimé):\n${isCouple ? '- Couple: ~5200 CHF\n' : '- Célibataire: ~2600 CHF\n'}- Par enfant: +700 CHF\n\n✅ Couvert: LAMal de base, complémentaires, RC, ménage\n\nAutomatique dans déclarations en ligne`,
    why: 'Les primes d\'assurance maladie et responsabilité civile sont déductibles.',
    checklist: ['Vérifier montants forfait', 'Soustraire subsides LAMal', 'Vérifier déclaration'],
  });

  // ACTION 16: Rachat rétroactif 3a 2025 (NOUVEAU 2026)
  if (profile.has3a === 'yes' && annualIncome > 50000) {
    actions.push({
      id: '16',
      titre: 'Rachat rétroactif 3a — jusqu\'à 10 ans (dès 2026)',
      category: '3a',
      priority: 'medium',
      gain: Math.round(7258 * marginalRate),
      guide: `Depuis le 1er janvier 2026, tu peux racheter les lacunes 3a des 10 dernières années.\n\nConditions:\n1. Maxer 3a de l'année en cours (7'258 CHF) d'abord\n2. Avoir eu un revenu AVS chaque année rachetée\n3. Plafond par année de rattrapage: 7'258 CHF\n4. Un seul versement de rattrapage par an\n5. Avant 31 décembre de l'année en cours\n\nExemple: En 2026, tu peux rattraper 2025, 2024, 2023... jusqu'à 2016.`,
      why: 'Loi entrée en vigueur le 1er janvier 2026 — tu peux rattraper jusqu\'à 10 ans de lacunes 3a, chacune déductible du revenu imposable.',
      checklist: ['Identifier les années avec lacune 3a (max 10 ans)', 'Maxer 3a 2026 en premier', 'Effectuer versement de rattrapage avant 31.12'],
    });
  }

  // ACTION 17: Franchise LAMal optimisée
  actions.push({
    id: '17',
    titre: 'Optimiser franchise LAMal selon ton usage médical',
    category: 'LAMal',
    priority: 'low',
    gain: 600,
    guide: `Franchises adultes: 300, 500, 1000, 1500, 2000, 2500 CHF\n\nSi < 1000 CHF soins/an → franchise 2500\nSi > 2500 CHF soins/an → franchise 300\n\nBreak-even: ~1400 CHF de soins/an\n\nDeadline: 30 novembre pour changement 2027`,
    why: 'Adapter la franchise à son usage médical peut économiser 1000+ CHF/an.',
    checklist: ['Calculer dépenses santé année passée', 'Comparer primes 2 scénarios', 'Choisir moins cher'],
  });

  // ACTION 18: Modèle LAMal alternatif
  actions.push({
    id: '18',
    titre: 'Choisir modèle LAMal alternatif (-15-25%)',
    category: 'LAMal',
    priority: 'medium',
    gain: 800,
    guide: `Modèles: Médecin de famille (-15-20%), HMO (-20-25%), Télémédecine (-15-20%), Pharmacie (-10%)\n\nAccès direct: Urgences, Gynéco, Pédiatre, Ophtalmologue (selon caisses)\n\nÉconomie typique: 450 CHF/mois × 22% = 1188 CHF/an`,
    why: 'Les modèles alternatifs offrent des réductions significatives sur les primes.',
    checklist: ['Comparer modèles disponibles', 'Tester HMO nearest', 'Décider avant 30.11'],
  });

  // ACTION 19: Cotisations partis politiques
  actions.push({
    id: '19',
    titre: 'Déduire cotisations partis politiques',
    category: 'Dons',
    priority: 'low',
    gain: Math.round(500 * marginalRate),
    guide: `Plafonds Valais:\n- Cantonal: jusqu'à 20'930 CHF\n- Fédéral: 10'400 CHF/an\n\nConditions: Parti inscrit registre fédéral OU représenté au parlement\n\nDéductible: cotisations officielles + dons au parti`,
    why: 'Les cotisations aux partis politiques sont fiscalement déductibles.',
    checklist: ['Obtenir attestation parti', 'Vérifier montant cotisation', 'Inclure dans déclaration'],
  });

  // ACTION 20: Abonnement transports publics
  actions.push({
    id: '20',
    titre: 'Déduire abonnement transports publics (CFF, AG, Mobilis)',
    category: 'Frais pro',
    priority: 'low',
    gain: Math.round(3860 * marginalRate),
    guide: `AG 2e classe: 3860 CHF/an (2025)\n\nVoiture: km × 220 × 0.70 CHF (max 3000 CHF)\nAG: 3860 CHF (fixe)\n\nSeuil: > 22 km/jour = AG plus avantageux`,
    why: 'L\'abonnement transport public offre un avantage fiscal stable.',
    checklist: ['Garder facture/preuve achat', 'Déduire montant exact', 'Conserver 5 ans'],
  });

  // ACTION 21: Intérêts hypothécaires (propriétaire)
  const isOwner = profile.housing === 'owner' || profile.housing === 'owner_rental';
  if (isOwner) {
    actions.push({
      id: '21',
      titre: '🏠 Déduire intérêts hypothécaires (100% déductibles)',
      category: 'Propriétaire',
      priority: 'high',
      gain: Math.round(8000 * marginalRate),
      guide: `100% des intérêts hypothécaires sont déductibles\nSEULEMENT les intérêts — pas le capital\n\nExemple: Hypothèque 500'000 à 2.5% = 12'500 CHF intérêts\nÉconomie fiscale (~20%): ~2'500 CHF/an\n\n⚠️ Réforme 2029: déduction disparaît pour résidence principale`,
      why: 'Les intérêts hypothécaires sont 100% déductibles jusqu\'en 2029.',
      checklist: ['Obtenir attestation annuelle banque', 'Documenter bien immobilier', 'Déclarer intérêts'],
    });

    // ACTION 22: Forfait vs frais réels entretien
    actions.push({
      id: '22',
      titre: '🔧 Choisir forfait vs frais réels entretien (optimiser)',
      category: 'Propriétaire',
      priority: 'high',
      gain: Math.round(5000 * marginalRate),
      guide: `Forfait: < 10 ans = 10% valeur locative, ≥ 10 ans = 20%\nFrais réels: petites réparations, assurance, entretien jardin\n\nStratégie: Années sans gros travaux = forfait\nAnnées avec travaux = compare les deux`,
      why: 'Choisir entre forfait et frais réels chaque année optimise les déductions.',
      checklist: ['Estimé valeur locative', 'Rassembler factures travaux', 'Comparer les deux options'],
    });

    // ACTION 23: Rénovations énergétiques
    actions.push({
      id: '23',
      titre: '⚡ Rénovations énergétiques (déductibles + échelonnables 3 ans)',
      category: 'Propriétaire',
      priority: 'high',
      gain: Math.round(15000 * marginalRate),
      guide: `Déductibles: Isolation, fenêtres triple vitrage, solaires, pompe chaleur, pellets, ventilation, borne EV\n\n💡 Étalable sur 3 ans si coût > revenu imposable\n\n⚠️ Réforme 2029: dernière chance avant suppression !`,
      why: 'Les rénovations énergétiques sont déductibles et échelonnables avant 2029.',
      checklist: ['Planifier rénovations avant 2029', 'Obtenir devis', 'Étaler si besoin'],
    });

    // ACTION 24: Amortissement indirect 3a
    actions.push({
      id: '24',
      titre: '🏧 Amortissement indirect via 3a (stratégie hypothèque)',
      category: 'Propriétaire',
      priority: 'medium',
      gain: Math.round(7258 * marginalRate),
      guide: `Verser dans 3a au lieu d'amortir hypothèque directement\nDouble avantage: déduction 3a + intérêts restent déductibles\n\n⚠️ Fonds 3a bloqués jusqu'à 65 ans\nPlanifier avec conseiller bancaire`,
      why: 'Cette stratégie offre une double réduction fiscale.',
      checklist: ['Consulter conseiller bancaire', 'Planifier stratégie', 'Verser dans 3a régulièrement'],
    });

    // ACTION 25: Valeur locative (Valais/Vaud/Genève)
    if (canton === 'VS' || canton === 'VD' || canton === 'GE') {
      actions.push({
        id: '25',
        titre: '🏠 Valeur locative — déclarer correctement (jusqu\'en 2028)',
        category: 'Propriétaire',
        priority: 'medium',
        gain: 0,
        guide: `Obligation jusqu'en 2028: déclarer valeur locative (revenu fictif)\n\nCalcul: Valeur vénale × 3% ≈ valeur locative annuelle\n\nMais tu déduis: intérêts hypothèques + frais entretien\n→ Effet net souvent négatif\n\n🔑 Supprimée en 2029 !`,
        why: 'La valeur locative est obligatoire jusqu\'en 2028 mais sera supprimée.',
        checklist: ['Demander attestation service impôts', 'Déduire frais', 'Approche fin 2028'],
      });
    }
  }

  // ACTION 26-30: Actions pour indépendants
  const isSelf = profile.activity === 'self' || profile.activity === 'both';
  if (isSelf) {
    const selfIncome = isSelf ? annualIncome : annualIncome * 0.3;
    const pillar3aSelf = Math.round(Math.min(36288, selfIncome * 0.20));

    actions.push({
      id: '26',
      titre: `🚀 3a INDÉPENDANT: jusqu'à 36'288 CHF/an déductibles`,
      category: '3a',
      priority: 'high',
      gain: Math.round(pillar3aSelf * marginalRate),
      guide: `Sans 2e pilier: jusqu'à 20% du revenu net, max 36'288 CHF\nAvec 2e pilier: 7'258 CHF (comme salarié)\n\nAvantage indépendant: +3'684 CHF/an potentiel`,
      why: 'Les indépendants sans LPP peuvent verser 5x plus en 3a.',
      checklist: ['Calculer 20% du revenu net', 'Ouvrir 3a VIAC/finpension', 'Maxer avant 31.12'],
    });

    actions.push({
      id: '27',
      titre: '🏠 Bureau à domicile (déduction prorata surface)',
      category: 'Indépendant',
      priority: 'medium',
      gain: Math.round(3600 * marginalRate),
      guide: `(Surface bureau / Surface totale) × Loyer annuel\n\nExemple: 80m² total, 16m² bureau (20%), loyer 2000/mois\n→ Déduction: 20% × 24'000 = 4'800 CHF/an\n\nProuves: plan appart, bail, photos pièce`,
      why: 'Le bureau à domicile est partiellement déductible au prorata.',
      checklist: ['Mesurer surface bureau', 'Calculer pourcentage', 'Rassembler preuves'],
    });

    actions.push({
      id: '28',
      titre: '🚗 Véhicule professionnel (km ou frais réels)',
      category: 'Indépendant',
      priority: 'medium',
      gain: Math.round(5000 * marginalRate),
      guide: `Forfait: 0.70 CHF/km (avec carnet bord)\nFrais réels: (km pro / km totaux) × (essence + entretien + assurance + amort.)\n\nLeasing: part intérêts déductible (différent du salarié!)`,
      why: 'Les véhicules professionnels offrent deux méthodes de déduction.',
      checklist: ['Tenir carnet de bord', 'Calculer km pro', 'Choisir meilleure méthode'],
    });

    actions.push({
      id: '29',
      titre: '💻 Abonnements SaaS, logiciels et honoraires fiduciaire',
      category: 'Indépendant',
      priority: 'medium',
      gain: Math.round(3000 * marginalRate),
      guide: `Entièrement déductibles:\n- Logiciels Office, Adobe, CRM, comptabilité\n- Domaine + hébergement web\n- Honoraires fiduciaire (comptable, fiscaliste)\n\n50-100% repas d'affaires`,
      why: 'Tous les coûts logiciels et conseils sont 100% déductibles.',
      checklist: ['Rassembler factures SaaS', 'Obtenir quittance fiduciaire', 'Garder 5 ans'],
    });

    actions.push({
      id: '30',
      titre: '🏥 Cotisations AVS indépendant (~10.1% revenu net)',
      category: 'Indépendant',
      priority: 'high',
      gain: Math.round(selfIncome * 0.101 * marginalRate),
      guide: `Taux 2026: 10.1% du revenu net (revenu ≥ 58'800 CHF)\nMinimum: 514 CHF/an\n\nBonne nouvelle: DÉDUCTIBLES de ton revenu imposable\nÉconomie (~22%): ~1'778 CHF/an`,
      why: 'Les cotisations AVS indépendant sont déductibles de ton revenu.',
      checklist: ['Payer acomptes trimestriels', 'Obtenir attestation annuelle', 'Déduire dans déclaration'],
    });
  }

  // ACTION 31: Permis B + Conjoint C
  if (profile.permit === 'B' && profile.conjoint_permit === 'c_ch') {
    actions.push({
      id: '31',
      titre: '🎉 Permis B + conjoint C: tu es en TAXATION ORDINAIRE !',
      category: 'Permis & Résidence',
      priority: 'high',
      gain: Math.round(annualIncome * 0.03),
      guide: `Tu passes automatiquement en taxation ordinaire\n→ Plus d'impôt à la source\n→ Déclaration classique\n→ Accès à TOUTES les déductions\n\nInforme ton employeur du changement dès le 1er du mois suivant`,
      why: 'Le mariage avec un conjoint C/Suisse change ton statut fiscal favorable.',
      checklist: ['Informer employeur', 'Préparer acomptes impôts', 'Faire déclaration'],
    });
  }

  // ACTION 32: Bien locatif
  const hasRental = profile.housing === 'owner_rental';
  if (hasRental) {
    actions.push({
      id: '32',
      titre: '🏘️ Bien locatif: déduire tous les frais de gestion',
      category: 'Propriétaire',
      priority: 'high',
      gain: Math.round(8000 * marginalRate),
      guide: `Déductibles sans limite:\n- Entretien & réparations\n- Assurance bâtiment\n- Frais gérance\n- Intérêts hypothécaires (part locatif)\n- Charges PPE\n\nPas d'impôt anticipé 35% sur revenus locatifs`,
      why: 'Tous les frais immobiliers sont déductibles des revenus locatifs.',
      checklist: ['Rassembler factures entretien', 'Documenter charges', 'Déduire intégralement'],
    });
  }

  // ACTION 33: Impôt anticipé 35%
  actions.push({
    id: '33',
    titre: '💰 Récupérer impôt anticipé 35% (dividendes et intérêts)',
    category: 'Investissement',
    priority: 'medium',
    gain: Math.round(annualIncome * 0.001 * 0.35),
    guide: `État prélève 35% à source sur:\n- Dividendes actions suisses\n- Intérêts comptes/obligations suisses\n\nTU RÉCUPÈRES TOUT en déclarant\n\nETF irlandais (VWCE) = pas de prélèvement suisse !`,
    why: 'L\'impôt anticipé est récupérable en déclarant correctement.',
    checklist: ['Déclarer tous revenus financiers', 'Garder attestations banque', 'Récupérer remboursement'],
  });

  // ACTION 34: Frais bancaires
  actions.push({
    id: '34',
    titre: '🏦 Déduire frais bancaires (souvent oublié!)',
    category: 'Investissement',
    priority: 'low',
    gain: Math.round(300 * marginalRate),
    guide: `Option 1: Frais réels (relevé annuel banque)\nOption 2: Forfait 1.5‰ portefeuille\n\nExemple: 50'000 CHF × 1.5‰ = 75 CHF déduction\nExemple: 100'000 CHF × 1.5‰ = 150 CHF déduction`,
    why: 'Le forfait 1.5‰ est automatiquement déductible.',
    checklist: ['Calculer valeur portefeuille 31.12', 'Appliquer 1.5‰', 'Déclarer dans section Titres'],
  });

  // ACTION 35: Déduction couple 2 revenus
  if (isCouple) {
    actions.push({
      id: '35',
      titre: '👫 Déduction couple à deux revenus (IFD)',
      category: 'Famille',
      priority: 'medium',
      gain: Math.round(13900 * 0.08),
      guide: `IFD: Déduction = le PLUS BAS des 2 revenus d'activité\nPlafonné à 13'900 CHF\n→ Économie max IFD: ~1'112 CHF/an\n\n⚠️ Imposition individuelle votée 2026 (54.23%)\nChangera pour futures années`,
      why: 'Les couples à deux revenus bénéficient d\'une déduction spéciale.',
      checklist: ['Renseigner revenus 2 conjoints', 'Vérifier auto-calcul', 'Valider dans déclaration'],
    });
  }

  // ACTION 36: Pilier 3b (GE/FR)
  if (canton === 'GE' || canton === 'FR') {
    const pillar3bMax = canton === 'GE' ? 2200 : 750;
    actions.push({
      id: '36',
      titre: `🏦 Pilier 3b déductible (spécifique ${canton === 'GE' ? 'Genève' : 'Fribourg'}!)`,
      category: '3a',
      priority: 'medium',
      gain: Math.round(pillar3bMax * marginalRate),
      guide: `Avantage exclusif ${canton === 'GE' ? 'GENEVOIS' : 'FRIBOURGEOIS'} !\n\nPlafond 2026 ${canton === 'GE' ? 'Genève' : 'Fribourg'}: ${pillar3bMax} CHF\n\nAssurance vie flexible — retrait quand tu veux\n(contrairement au 3a bloqué jusqu'à 65 ans)`,
      why: 'Seuls Genève et Fribourg offrent une déduction pour le 3b.',
      checklist: ['Contacter BCG/BCF', 'Ouvrir assurance 3b', 'Maxer avant 31.12'],
    });
  }

  // ACTION 37: Pension alimentaire versée
  actions.push({
    id: '37',
    titre: '👨‍👧 Pension alimentaire versée (déductible chez payeur)',
    category: 'Famille',
    priority: 'medium',
    gain: Math.round(12000 * marginalRate),
    guide: `Si tu verses pension alimentaire:\n✅ DÉDUCTIBLE intégralement (pas de plafond)\n\nExemple: 1500 CHF/mois → 18'000 CHF/an\nÉconomie (~20%): ~3'600 CHF/an\n\n⚠️ Convention homologuée requise`,
    why: 'La pension alimentaire est 100% déductible chez le payeur.',
    checklist: ['Obtenir convention homologuée', 'Documenter versements', 'Joindre attestation'],
  });

  // ACTION 38: Personnes à charge
  if (children > 0 || annualIncome > 60000) {
    actions.push({
      id: '38',
      titre: '👴 Déduction personnes à charge (enfants majeurs, parents)',
      category: 'Famille',
      priority: 'low',
      gain: Math.round(6500 * marginalRate),
      guide: `Enfants mineurs: déjà automatiques\nEnfants majeurs en formation: si sans revenu significatif\nParents à charge: si tu subviens à besoins\n\nValais: ~6'500 CHF/personne`,
      why: 'Les personnes à charge ouvrent des déductions supplémentaires.',
      checklist: ['Attestation scolarité enfants', 'Justificatifs soutien parents', 'Relevé versements'],
    });
  }

  // ACTION 39: Étaler rachats LPP
  if (annualIncome > 70000) {
    actions.push({
      id: '39',
      titre: '📅 Stratégie: étaler les rachats LPP sur 3-5 ans',
      category: 'LPP',
      priority: 'medium',
      gain: Math.round(20000 * marginalRate),
      guide: `Échelonner plutôt que racheter d'un coup\n→ Casse la progression fiscale\n→ Économie +19% potentiel\n\n⚠️ Règle 3 ans: pas de retrait capital pendant 3 ans`,
      why: 'L\'échelonnement des rachats LPP réduit la taxation progressive.',
      checklist: ['Demander attestation LPP', 'Planifier étalement', 'Effectuer premiers rachats'],
    });
  }

  // ACTION 40: Plusieurs comptes 3a
  actions.push({
    id: '40',
    titre: '🏦 Ouvrir 3-5 comptes 3a séparés (optimiser le retrait)',
    category: '3a',
    priority: 'medium',
    gain: Math.round(5000 * marginalRate * 0.5),
    guide: `Lors du retrait à la retraite, l'impôt est PROGRESSIF\nPlus tu retires d'un coup, plus le taux est élevé\n\n❌ 1 compte: 200'000 CHF → taux 8% → 16'000 CHF impôt\n✅ 4 comptes: 50'000 CHF/an → taux 4% → 8'000 CHF total\n→ Économie: 8'000 CHF!`,
    why: 'Plusieurs comptes réduisent la taxation progressive au retrait.',
    checklist: ['Ouvrir 3-5 comptes VIAC/finpension', 'Répartir versements', 'Planifier retrait'],
  });

  // ACTION 41: Intérêts dettes privées
  actions.push({
    id: '41',
    titre: '💳 Intérêts dettes privées (crédit, cartes, découvert)',
    category: 'Dettes',
    priority: 'low',
    gain: Math.round(1000 * marginalRate),
    guide: `Déductibles: intérêts hypothèque, crédit conso, découvert, cartes\nNon déductible (salarié): leasing auto\n\nPlafond: Revenu fortune + 50'000 CHF`,
    why: 'Les intérêts de dettes privées réduisent le revenu imposable.',
    checklist: ['Obtenir relevé annuel intérêts', 'Documenter dettes', 'Déclarer dans section Dettes'],
  });

  // ACTION 42: Frais déménagement pro
  actions.push({
    id: '42',
    titre: '📦 Frais déménagement pour raisons professionnelles',
    category: 'Frais pro',
    priority: 'low',
    gain: Math.round(3000 * marginalRate),
    guide: `Si déménagement causé par changement d'emploi:\n✅ Déductibles: déménageur, camion, résiliation bail\n\n⚠️ Justification requise: contrat nouvel emploi + distance\n\nEconomie: 500-800 CHF`,
    why: 'Les frais de déménagement professionnel sont déductibles.',
    checklist: ['Contrat nouvel employeur', 'Factures déménageur', 'Preuve distance avant/après'],
  });
  return actions;
}
