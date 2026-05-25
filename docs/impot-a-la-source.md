# Impôt à la source (IS) vs Taxation ordinaire ultérieure (TOU)

> Document technique destiné aux développeurs et aux contributeurs du projet Helvetax.

---

## Concepts clés

### Impôt à la source (IS)

L'impôt à la source est un prélèvement direct effectué par l'employeur sur le salaire mensuel brut.  
Il s'applique aux personnes **sans domicile fiscal suisse** et à ceux qui n'ont pas encore le statut de résident ordinaire.

**Public cible dans Helvetax :** titulaires du **permis B** (permis de séjour) sans domicile en Suisse.

**Calcul :**
```
Impôt IS = revenu mensuel brut × taux AFC officiel
```

Le taux AFC (Administration fédérale des contributions) est publié chaque année dans les barèmes officiels. Il intègre en une seule valeur :
- L'impôt fédéral direct (IFD)
- L'impôt cantonal
- L'impôt communal (chef-lieu de référence)

En Helvetax, les taux IS sont chargés depuis `src/data/fiscalData2026.json` et accédés via `src/utils/afcTariffs.ts`.

---

### Taxation ordinaire ultérieure (TOU)

La TOU permet à un contribuable imposé à la source de **demander une déclaration ordinaire**, comme un résident suisse ou titulaire du permis C.

Le contribuable peut alors faire valoir l'ensemble de ses déductions réelles :

| Déduction | Référence légale | Montant 2026 |
|-----------|-----------------|-------------|
| Frais professionnels forfait | LIFD art. 26 | 3 % du brut, min 2 200, max 4 000 CHF |
| Pilier 3a | OPP3 art. 7 | 7 258 CHF/an (salarié) |
| Cotisations AVS/LPP/AC | LIFD art. 33 | Total cotisations employé |
| Primes LAMal (partielles) | LIFD art. 33 | ~2 700–3 500 CHF selon canton |
| Dons aux organisations d'utilité publique | LIFD art. 33a | jusqu'à 20 % du revenu |
| Frais de garde d'enfants | LIFD art. 33 al. 3 | max 25 400 CHF |

**Résultat :** l'impôt TOU est calculé sur le **revenu imposable net** (revenu brut − déductions), généralement **inférieur** à l'IS calculé sur le brut.

---

## Quand la TOU s'applique-t-elle ?

### TOU obligatoire

La TOU est **obligatoire** quand le revenu brut annuel dépasse le seuil cantonal :

| Canton | Seuil (CHF/an) | Référence |
|--------|----------------|-----------|
| VS, VD, NE | 120 000 | art. 99a LIFD |
| GE | 500 000 | art. 33 RIPS-GE (exception cantonale) |

En Helvetax : champ `seuilDeclarationIS` dans `src/utils/cantonConfig.ts`.

### TOU facultative (en dessous du seuil)

Même en dessous du seuil, le contribuable peut **demander** la TOU si ses déductions sont suffisamment importantes.

**Règle pratique :** la TOU est avantageuse si :
```
IS(revenu_brut) > TOU(revenu_brut − déductions)
```

Avec un pilier 3a à 7 258 CHF, l'avantage TOU est typiquement de **500 à 2 000 CHF/an** selon le revenu et le canton.

---

## Implémentation dans Helvetax

### Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `src/utils/calculateTax.ts` | Sélecteur IS/TOU — fonction principale `calculateTax()` |
| `src/utils/taxBrackets.ts` | Moteur IS — `getMarginalRate()` (barèmes AFC officiels) |
| `src/utils/afcTariffs.ts` | Accès aux taux IS AFC depuis `fiscalData2026.json` |
| `src/utils/cantonConfig.ts` | Seuils IS et config cantonaux |
| `src/types/index.ts` | `UserProfile.useTOU` (boolean, défaut false) |
| `src/stores/profileStore.ts` | Persistance `useTOU` dans localStorage |
| `src/App.tsx` | Toggle IS/TOU dans l'onboarding (permis B uniquement) |
| `src/utils/generateTimeline.ts` | Événements TOU dans le calendrier fiscal |

### Interface `TaxResult` (calculateTax.ts)

```typescript
interface TaxResult extends TaxBreakdown {
  regime:     'IS' | 'TOU';
  touSaving:  number | null;    // économie IS → TOU en CHF
  deductions: TOUDeductionBreakdown | null;
}
```

### Modèle de calcul TOU (approximation)

Helvetax n'intègre pas les barèmes progressifs ordinaires cantonaux (données non publiques en format machine). La TOU est **approximée** en appliquant les taux IS AFC au revenu imposable réduit :

```
TOU_estimé ≈ IS(revenu_brut − déductions)
```

**Erreur typique :** ±5–15 % par rapport à l'impôt TOU réel.  
**Direction :** toujours correcte — si TOU < IS selon Helvetax, la TOU est rentable.

Pour une simulation plus précise, l'utilisateur doit utiliser l'outil officiel de son canton ou le calculateur ESTV.

---

## Logique du toggle dans l'interface

```
permit === 'B'
  ├── useTOU = false (défaut)  →  mode IS  →  getMarginalRate(brut)
  └── useTOU = true            →  mode TOU →  getMarginalRate(brut − déductions)

permit === 'C' | 'CH'
  └── calcul ordinaire (IS non applicable, useTOU ignoré)
```

Dans la timeline fiscale (`generateTimeline.ts`) :
- `useTOU = false` + revenu < seuil → événement **"TOU facultative"** (type `warning`)
- `useTOU = true`  + revenu < seuil → événement **"DEADLINE : Dépôt déclaration TOU"** (type `critical`)
- revenu ≥ seuil (tous cas) → événement **"Déclaration obligatoire IS"** (type `critical`)

---

## Tests

Les tests sont dans `src/utils/calculateTax.test.ts` et couvrent :
- Calcul IS vs TOU pour célibataire 80k (tous cantons)
- Déductions estimées (frais pro, pilier 3a)
- Seuil obligatoire / facultatif par canton
- Exception genevoise (seuil 500 000 CHF)
- Permis C/CH : `useTOU` ignoré
- Couple barème B en TOU

Pour lancer :
```bash
node node_modules/vitest/vitest.mjs run src/utils/calculateTax.test.ts
```

---

## Références légales

- **LIFD art. 83–100** : Impôt à la source (personnes physiques)
- **LIFD art. 99a** : Taxation ordinaire ultérieure sur demande (seuil 120 000 CHF)
- **LIFD art. 26, 33** : Déductions ordinaires
- **OPP3 art. 7** : Déduction pilier 3a (7 258 CHF/an pour salariés 2026)
- **RIPS-GE art. 33** : Exception genevoise (seuil 500 000 CHF)
- **Circulaire AFC n° 45** : Modalités de la TOU

---

*Dernière mise à jour : 2026-05-25 — Helvetax v0.0.0*
