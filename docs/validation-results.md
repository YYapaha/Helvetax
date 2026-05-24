# Validation Helvetax — Calculateurs officiels AFC 2026

> **Généré le 24.05.2026** via `npx vite-node scripts/validate-against-official.ts`
>
> Ce document compare les résultats produits par Helvetax avec les calculateurs officiels.
> La colonne **Officiel (CHF)** est à remplir manuellement en suivant les instructions §3.

---

## 1. Résultats Helvetax (IS — impôt à la source sur revenu brut)

Les valeurs ci-dessous proviennent du script. Le taux IS AFC s'applique directement au **revenu brut** mensuel (barème ESTV/AFC officiel 2026).

### 1.1 Impôt sur le revenu (IS total = IFD + cantonal + communal chef-lieu)

| ID | Situation | Revenu brut/an | Barème | IFD CHF | Cantonal CHF | **IS total CHF** | T.Marg | T.Eff |
|----|-----------|---------------|--------|---------|-------------|-----------------|--------|-------|
| VS-01 | VS · Célibataire | 60 000 | A0N | 392 | 4 036 | **4 428** | 17.14% | 7.38% |
| VS-02 | VS · Célibataire | 80 000 | A0N | 844 | 7 284 | **8 128** | 21.50% | 10.16% |
| VS-03 | VS · Célibataire | 100 000 | A0N | 1 554 | 10 876 | **12 430** | 26.57% | 12.43% |
| VS-04 | VS · Célibataire | 150 000 | A0N | 4 555 | 22 160 | **26 715** | 38.95% | 17.81% |
| VS-05 | VS · Couple 1 rev. | 120 000 | C0N | 1 768 | 15 824 | **17 592** | 26.76% | 14.66% |
| VS-06 | VS · Couple 2 rev. (total) | 150 000 | B0N | 3 187 | 13 298 | **16 485** | 26.09% | 10.99% |
| VS-07 | VS · Couple 1 rev. · 2 enf. | 120 000 | C2N | 1 768 | 11 708 | **13 476** | 25.75% | 11.23% |
| VS-08 | VS · Célibataire | 80 000 | A0N | 844 | 7 284 | **8 128** | 21.50% | 10.16% |
| VS-09 | VS · Couple 1 rev. | 150 000 | C0N | 3 187 | 23 048 | **26 235** | 34.10% | 17.49% |
| VD-01 | VD · Célibataire | 80 000 | A0N | 844 | 8 796 | **9 640** | 16.91% | 12.05% |
| VD-02 | VD · Célibataire | 100 000 | A0N | 1 554 | 12 236 | **13 790** | 26.92% | 13.79% |
| VD-03 | VD · Couple 1 rev. | 150 000 | C0N | 3 187 | 22 238 | **25 425** | 30.54% | 16.95% |
| VD-04 | VD · Couple 2 rev. · 2 enf. | 150 000 | B2N | 3 187 | 12 293 | **15 480** | 20.89% | 10.32% |
| VD-05 | VD · Couple 1 rev. | 150 000 | C0N | 3 187 | 22 238 | **25 425** | 30.54% | 16.95% |
| GE-01 | GE · Célibataire | 80 000 | A0N | 844 | 8 004 | **8 848** | 24.83% | 11.06% |
| GE-02 | GE · Célibataire | 120 000 | A0N | 2 610 | 16 062 | **18 672** | 21.61% | 15.56% |
| GE-03 | GE · Couple 2 rev. (total) | 200 000 | B0N | 7 128 | 24 312 | **31 440** | 35.82% | 15.72% |
| GE-04 | GE · Célibataire | 120 000 | A0N | 2 610 | 16 062 | **18 672** | 21.61% | 15.56% |
| NE-01 | NE · Célibataire | 80 000 | A0N | 844 | 10 252 | **11 096** | 19.54% | 13.87% |
| NE-02 | NE · Célibataire | 100 000 | A0N | 1 554 | 14 276 | **15 830** | 29.97% | 15.83% |
| NE-03 | NE · Couple 1 rev. · 1 enf. | 120 000 | C1N | 1 768 | 16 472 | **18 240** | 24.88% | 15.20% |
| NE-04 | NE · Couple 2 rev. (total) | 160 000 | B0N | 3 785 | 21 799 | **25 584** | 28.87% | 15.99% |

### 1.2 Impôt sur la fortune (barème cantonal + communal chef-lieu)

| ID | Situation | Fortune nette | Abattement | Fortune imposable | T.Marg (‰) | T.Eff (‰) | **Total fortune CHF** | Plafonné ? |
|----|-----------|--------------|------------|-------------------|-----------|----------|----------------------|------------|
| VS-08 | VS · Célibataire | 500 000 | 25 000 | 475 000 | 6.00‰ | 6.60‰ | **3 283** | Non |
| VS-09 | VS · Couple 1 rev. | 1 000 000 | 50 000 | 950 000 | 6.50‰ | 7.30‰ | **7 296** | Non |
| VD-04 | VD · Couple (2 rev.) | 300 000 | 118 800 | 181 200 | 2.50‰ | 2.20‰ | **651** | Non |
| VD-05 | VD · Couple 1 rev. | 1 000 000 | 118 800 | 881 200 | 3.00‰ | 4.20‰ | **4 187** | Non |
| GE-04 | GE · Célibataire | 1 000 000 | 25 000 | 975 000 | 8.00‰ | 7.00‰ | **7 038** | Non |
| NE-03 | NE · Couple 1 rev. | 200 000 | 100 000 | 100 000 | 1.50‰ | 1.10‰ | **225** | Non |
| NE-04 | NE · Couple 2 rev. | 500 000 | 100 000 | 400 000 | 2.00‰ | 2.50‰ | **1 260** | Non |

> **Note VD :** Le plafond 10‰ (art. 52 LICD-VD) n'a pas été déclenché sur ces cas types.
> Il s'active à partir de ~3.3M CHF de fortune nette pour un couple à Lausanne.

---

## 2. Tableau de comparaison — À compléter manuellement

Remplir la colonne **Officiel (CHF)** avec les résultats du calculateur officiel correspondant,
puis calculer l'écart. Priorité aux cas VS (référence principale du projet).

### Priorité haute — Valais (AFC swisstaxcalculator.estv.admin.ch)

> Paramètres AFC : Année **2026** · Commune **Sion** · Confession non précisée (exclure impôt ecclésiastique)

| ID | Situation | Brut/an | Barème | **Helvetax IS (CHF)** | **Officiel IS (CHF)** | **Écart (%)** | Commentaire |
|----|-----------|---------|--------|-----------------------|-----------------------|---------------|-------------|
| VS-01 | Célibataire | 60 000 | A0N | 4 428 | _À remplir_ | – | |
| VS-02 | Célibataire | 80 000 | A0N | 8 128 | _À remplir_ | – | |
| VS-03 | Célibataire | 100 000 | A0N | 12 430 | _À remplir_ | – | |
| VS-04 | Célibataire | 150 000 | A0N | 26 715 | _À remplir_ | – | |
| VS-05 | Couple 1 rev. | 120 000 | C0N | 17 592 | _À remplir_ | – | |
| VS-06 | Couple 2 rev. | 150 000 | B0N | 16 485 | _À remplir_ | – | ¹ |
| VS-07 | Couple 1 rev. · 2 enf. | 120 000 | C2N | 13 476 | _À remplir_ | – | |

> ¹ Barème B (couple 2 revenus) : entrer le revenu TOTAL du ménage dans le calculateur AFC.

### Priorité haute — Neuchâtel (AFC swisstaxcalculator.estv.admin.ch)

> Paramètres AFC : Année **2026** · Commune **Neuchâtel**

| ID | Situation | Brut/an | Barème | **Helvetax IS (CHF)** | **Officiel IS (CHF)** | **Écart (%)** | Commentaire |
|----|-----------|---------|--------|-----------------------|-----------------------|---------------|-------------|
| NE-01 | Célibataire | 80 000 | A0N | 11 096 | _À remplir_ | – | |
| NE-02 | Célibataire | 100 000 | A0N | 15 830 | _À remplir_ | – | |
| NE-03 | Couple 1 rev. · 1 enf. | 120 000 | C1N | 18 240 | _À remplir_ | – | |

### Priorité normale — Vaud (calculette VD)

> **Important :** La calculette VD demande le **revenu imposable**, pas le brut.
> Conversion : revenu imposable ≈ brut × 0.80 (forfait 20% déductions standard).
>
> - VD-01 (80k brut) → saisir **64 000 CHF** de revenu imposable
> - VD-02 (100k brut) → saisir **80 000 CHF** de revenu imposable
> - VD-03 (150k brut) → saisir **120 000 CHF** de revenu imposable

| ID | Situation | Brut/an | Revenu imposable à saisir | **Helvetax IS (CHF)** | **Officiel IS (CHF)** | **Écart (%)** | Commentaire |
|----|-----------|---------|--------------------------|----------------------|-----------------------|---------------|-------------|
| VD-01 | Célibataire | 80 000 | ~64 000 | 9 640 | _À remplir_ | – | |
| VD-02 | Célibataire | 100 000 | ~80 000 | 13 790 | _À remplir_ | – | |
| VD-03 | Couple 1 rev. | 150 000 | ~120 000 | 25 425 | _À remplir_ | – | |

### Priorité normale — Genève (calculette GE)

> Le calculateur GE accepte le revenu brut directement pour le calcul IS.

| ID | Situation | Brut/an | Barème | **Helvetax IS (CHF)** | **Officiel IS (CHF)** | **Écart (%)** | Commentaire |
|----|-----------|---------|--------|-----------------------|-----------------------|---------------|-------------|
| GE-01 | Célibataire | 80 000 | A0N | 8 848 | _À remplir_ | – | |
| GE-02 | Célibataire | 120 000 | A0N | 18 672 | _À remplir_ | – | |
| GE-03 | Couple 2 rev. | 200 000 | B0N | 31 440 | _À remplir_ | – | |

---

## 3. Procédure de validation manuelle

### VS et NE — Swiss Tax Calculator AFC

1. Ouvrir : `https://swisstaxcalculator.estv.admin.ch`
2. Sélectionner **Année 2026**
3. Choisir le canton et la commune (Sion pour VS, Neuchâtel pour NE)
4. Saisir le salaire mensuel brut = **revenu annuel ÷ 12**
5. Sélectionner la situation :
   - Barème **A** → célibataire
   - Barème **B** → couple, deux revenus (saisir le revenu total du ménage)
   - Barème **C** → couple, un seul revenu
6. Saisir le nombre d'enfants
7. Relever l'impôt IS annuel = taux affiché × revenu brut annuel
8. Reporter dans la colonne **Officiel IS (CHF)** ci-dessus

### VD — Calculette cantonale Vaud

1. Ouvrir : `https://www.vd.ch/themes/etat-droit-finances/impots/impots-pour-les-individus/calculer-mes-impots`
2. Saisir le **revenu imposable** (≈ brut × 0.80, voir tableau §2)
3. Commune : **Lausanne**
4. Relever l'impôt cantonal + fédéral total

> La calculette VD cible le régime ordinaire (TOU). Pour un permis B resté en IS,
> comparer avec le calcul VD IS disponible sur la même page ou via l'employeur.

### GE — Calculette cantonale Genève

1. Ouvrir : `https://www.ge.ch/calculer-mes-impots`
2. Saisir le revenu brut mensuel
3. Sélectionner la situation (A/B/C)
4. Commune : **Genève** (coefficent uniforme, pas de choix)
5. Relever l'IS annuel

---

## 4. Analyse des écarts — Observations préliminaires

### 4.1 Écart avec les valeurs de référence CLAUDE.md

Les valeurs de référence documentées dans `CLAUDE.md` pour VS · Sion · célibataire
**ne correspondent pas** aux résultats actuels du moteur IS :

| Revenu | Ref. CLAUDE.md | Helvetax IS actuel | Différence |
|--------|---------------|-------------------|------------|
| 60 000 | ~5 500 CHF (15%) | 4 428 CHF (7.38%) | −19% |
| 80 000 | ~9 000 CHF (19.9%) | 8 128 CHF (10.16%) | −10% |
| 100 000 | ~14 500 CHF (26.1%) | 12 430 CHF (12.43%) | −14% |
| 150 000 | ~28 000 CHF (28.3%) | 26 715 CHF (17.81%) | −5% |

**Hypothèse la plus probable :** les valeurs CLAUDE.md ont été calculées avec
`revenuImposable = brut × 0.80` appliqué comme base d'imposition (régime ordinaire),
alors que le moteur actuel applique le taux IS AFC directement au **revenu brut**
(comportement correct pour l'impôt à la source).

**Conséquence :** les valeurs de référence CLAUDE.md sont à mettre à jour une fois
la validation officielle effectuée (§2).

### 4.2 Hypothèse à vérifier

Si le calculateur AFC pour VS · Sion · célibataire · 80k brut retourne ~8 128 CHF,
les valeurs Helvetax sont correctes et les références CLAUDE.md sont obsolètes.

Si le calculateur AFC retourne ~9 000 CHF, il faudra investiguer pourquoi le taux
dans `fiscalData2026.json` diffère du résultat attendu.

### 4.3 Seuil d'alerte

Tout écart > 5% entre Helvetax et le calculateur officiel déclenche une investigation :
- Vérifier le code barème utilisé (A/B/C + nombre d'enfants)
- Vérifier la commune de référence
- Vérifier si l'impôt ecclésiastique est inclus ou exclu dans le résultat officiel
- Vérifier si la date d'entrée en vigueur du barème est bien 2026

---

## 5. Configuration vérifiée — Coefficients communaux

Les coefficients utilisés pour la fortune sont documentés dans `src/utils/cantonConfig.ts` :

| Canton | Chef-lieu | Coefficient communal fortune | Source |
|--------|-----------|------------------------------|--------|
| VS | Sion | 1.30 | vs.ch 2026 |
| VD | Lausanne | 1.795 (impôt communal = 79.5% du cantonal) | LICD-VD art. 50 |
| GE | Genève | 1.00 (taux uniforme, communal inclus dans barème) | LIPP-GE art. 56 |
| NE | Neuchâtel | 1.80 (impôt communal = 80% du cantonal) | LCdir-NE |

> **Nota bene :** Pour le revenu IS, le coefficient communal est **intégré directement
> dans les tarifs AFC** (`fiscalData2026.json`). Il n'est pas appliqué séparément.

---

## 6. Commandes utiles

```bash
# Relancer le script de validation
npx vite-node scripts/validate-against-official.ts

# Vérification TypeScript (ne couvre pas scripts/)
npx tsc --noEmit

# Tests unitaires
npx vitest run
```

---

*Dernière mise à jour : 24.05.2026 — Résultats Helvetax pré-remplis, colonnes "Officiel" en attente de validation manuelle.*
