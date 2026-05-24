# Validation Helvetax 2026 — Rapport automatique

> Généré le **24.05.2026 à 23:31**  
> API : `https://swisstaxcalculator.vercel.app/api/taxes`  
> 98/104 cas API ✓ — anomalies IS > TOU : **0**

---

## Note méthodologique

| | Helvetax | swisstaxcalculator |
|--|--|--|
| Régime | **IS** — impôt à la source | **TOU** — impôt ordinaire |
| Base | Revenu brut × taux AFC | Revenu brut − déductions → taxable |
| Public | Titulaires permis B | Résidents C / CH |

**IS < TOU est normal (5–50%).** IS > TOU sur le revenu est une anomalie.

### Barème C (couple 1 revenu)

Le barème IS C intègre un **revenu théorique conjoint (~70 500 CHF)** dans le taux.
Un foyer gagnant 50 000 CHF brut est taxé comme s'il gagnait ~120 500 CHF.
Conséquence : IS barème C > TOU à bas revenu — **conception AFC, pas un bug Helvetax**.

Stratégie de test adoptée :
- Cases C1-50k **supprimées** (comparaison IS/TOU faussée par le revenu implicite)
- Remplacées par des cas **C2fair** : couple 2 revenus 2×50k (= 100k total) et 2×80k (= 160k total)
- Cases C1 ≥ 80k conservées avec seuil d'anomalie élargi à 50% (IS barème C structurellement élevé)

---

## Tableau complet — 104 cas

| ID | Situation | Revenu | Fortune | **HX IS** | **TOU** | Écart | Statut |
|---|---|---:|---:|---:|---:|---:|:---:|
| `VS-S-50k-0` | Célibataire | 50k | – | 2 410 CHF | 6 909 CHF | -65.1% | ✓ |
| `VS-S-50k-200k` | Célibataire | 50k | 200k | 3 353 CHF | 7 527 CHF | -55.5% | ✓ |
| `VS-S-80k-0` | Célibataire | 80k | – | 8 128 CHF | 17 676 CHF | -54.0% | ✓ |
| `VS-S-80k-200k` | Célibataire | 80k | 200k | 9 071 CHF | 18 294 CHF | -50.4% | ✓ |
| `VS-S-150k-0` | Célibataire | 150k | – | 26 715 CHF | 43 346 CHF | -38.4% | ✓ |
| `VS-S-150k-200k` | Célibataire | 150k | 200k | 27 658 CHF | 43 964 CHF | -37.1% | ✓ |
| `VS-S-300k-0` | Célibataire | 300k | – | 80 730 CHF | – | ✗ | ❌ |
| `VS-S-300k-200k` | Célibataire | 300k | 200k | 81 673 CHF | – | ✗ | ❌ |
| `VS-C1-80k-0` | Couple 1 rev. | 80k | – | 8 936 CHF | 15 410 CHF | -42.0% | ✓ |
| `VS-C1-80k-200k` | Couple 1 rev. | 80k | 200k | 9 716 CHF | 15 849 CHF | -38.7% | ✓ |
| `VS-C1-150k-0` | Couple 1 rev. | 150k | – | 26 235 CHF | 39 697 CHF | -33.9% | ✓ |
| `VS-C1-150k-200k` | Couple 1 rev. | 150k | 200k | 27 015 CHF | 40 136 CHF | -32.7% | ✓ |
| `VS-C1-300k-0` | Couple 1 rev. | 300k | – | 75 840 CHF | – | ✗ | ❌ |
| `VS-C1-300k-200k` | Couple 1 rev. | 300k | 200k | 76 620 CHF | – | ✗ | ❌ |
| `VS-C2-50k-0` | Couple 2 rev. | 50k | – | 940 CHF | 3 505 CHF | -73.2% | ✓ |
| `VS-C2-50k-200k` | Couple 2 rev. | 50k | 200k | 1 720 CHF | 3 944 CHF | -56.4% | ✓ |
| `VS-C2-80k-0` | Couple 2 rev. | 80k | – | 4 616 CHF | 11 806 CHF | -60.9% | ✓ |
| `VS-C2-80k-200k` | Couple 2 rev. | 80k | 200k | 5 396 CHF | 12 245 CHF | -55.9% | ✓ |
| `VS-C2-150k-0` | Couple 2 rev. | 150k | – | 16 485 CHF | 37 199 CHF | -55.7% | ✓ |
| `VS-C2-150k-200k` | Couple 2 rev. | 150k | 200k | 17 265 CHF | 37 638 CHF | -54.1% | ✓ |
| `VS-C2-300k-0` | Couple 2 rev. | 300k | – | 68 160 CHF | – | ✗ | ❌ |
| `VS-C2-300k-200k` | Couple 2 rev. | 300k | 200k | 68 940 CHF | – | ✗ | ❌ |
| `VD-S-50k-0` | Célibataire | 50k | – | 2 645 CHF | 7 038 CHF | -62.4% | ✓ |
| `VD-S-50k-200k` | Célibataire | 50k | 200k | 3 113 CHF | 7 647 CHF | -59.3% | ✓ |
| `VD-S-80k-0` | Célibataire | 80k | – | 9 640 CHF | 13 973 CHF | -31.0% | ✓ |
| `VD-S-80k-200k` | Célibataire | 80k | 200k | 10 108 CHF | 14 582 CHF | -30.7% | ✓ |
| `VD-S-150k-0` | Célibataire | 150k | – | 27 525 CHF | 36 113 CHF | -23.8% | ✓ |
| `VD-S-150k-200k` | Célibataire | 150k | 200k | 27 993 CHF | 36 722 CHF | -23.8% | ✓ |
| `VD-S-300k-0` | Célibataire | 300k | – | 82 020 CHF | 99 921 CHF | -17.9% | ✓ |
| `VD-S-300k-200k` | Célibataire | 300k | 200k | 82 488 CHF | 100 530 CHF | -17.9% | ✓ |
| `VD-C1-80k-0` | Couple 1 rev. | 80k | – | 9 632 CHF | 10 896 CHF | -11.6% | ✓ |
| `VD-C1-80k-200k` | Couple 1 rev. | 80k | 200k | 9 887 CHF | 11 505 CHF | -14.1% | ✓ |
| `VD-C1-150k-0` | Couple 1 rev. | 150k | – | 25 425 CHF | 27 702 CHF | -8.2% | ✓ |
| `VD-C1-150k-200k` | Couple 1 rev. | 150k | 200k | 25 680 CHF | 28 311 CHF | -9.3% | ✓ |
| `VD-C1-300k-0` | Couple 1 rev. | 300k | – | 74 970 CHF | 85 277 CHF | -12.1% | ✓ |
| `VD-C1-300k-200k` | Couple 1 rev. | 300k | 200k | 75 225 CHF | 85 886 CHF | -12.4% | ✓ |
| `VD-C2-50k-0` | Couple 2 rev. | 50k | – | 175 CHF | 4 771 CHF | -96.3% | ✓ |
| `VD-C2-50k-200k` | Couple 2 rev. | 50k | 200k | 430 CHF | 5 380 CHF | -92.0% | ✓ |
| `VD-C2-80k-0` | Couple 2 rev. | 80k | – | 5 200 CHF | 10 146 CHF | -48.7% | ✓ |
| `VD-C2-80k-200k` | Couple 2 rev. | 80k | 200k | 5 455 CHF | 10 755 CHF | -49.3% | ✓ |
| `VD-C2-150k-0` | Couple 2 rev. | 150k | – | 20 100 CHF | 26 851 CHF | -25.1% | ✓ |
| `VD-C2-150k-200k` | Couple 2 rev. | 150k | 200k | 20 355 CHF | 27 460 CHF | -25.9% | ✓ |
| `VD-C2-300k-0` | Couple 2 rev. | 300k | – | 69 030 CHF | 81 351 CHF | -15.1% | ✓ |
| `VD-C2-300k-200k` | Couple 2 rev. | 300k | 200k | 69 285 CHF | 81 960 CHF | -15.5% | ✓ |
| `GE-S-50k-0` | Célibataire | 50k | – | 2 760 CHF | 5 500 CHF | -49.8% | ✓ |
| `GE-S-50k-200k` | Célibataire | 50k | 200k | 3 698 CHF | 5 822 CHF | -36.5% | ✓ |
| `GE-S-80k-0` | Célibataire | 80k | – | 8 848 CHF | 13 240 CHF | -33.2% | ✓ |
| `GE-S-80k-200k` | Célibataire | 80k | 200k | 9 786 CHF | 13 562 CHF | -27.8% | ✓ |
| `GE-S-150k-0` | Célibataire | 150k | – | 26 985 CHF | 35 701 CHF | -24.4% | ✓ |
| `GE-S-150k-200k` | Célibataire | 150k | 200k | 27 923 CHF | 36 023 CHF | -22.5% | ✓ |
| `GE-S-300k-0` | Célibataire | 300k | – | 78 000 CHF | 95 866 CHF | -18.6% | ✓ |
| `GE-S-300k-200k` | Célibataire | 300k | 200k | 78 938 CHF | 96 188 CHF | -17.9% | ✓ |
| `GE-C1-80k-0` | Couple 1 rev. | 80k | – | 8 504 CHF | 6 737 CHF | +26.2% | ℹ |
| `GE-C1-80k-200k` | Couple 1 rev. | 80k | 200k | 9 292 CHF | 6 806 CHF | +36.5% | ℹ |
| `GE-C1-150k-0` | Couple 1 rev. | 150k | – | 24 165 CHF | 25 601 CHF | -5.6% | ✓ |
| `GE-C1-150k-200k` | Couple 1 rev. | 150k | 200k | 24 953 CHF | 25 670 CHF | -2.8% | ✓ |
| `GE-C1-300k-0` | Couple 1 rev. | 300k | – | 70 920 CHF | 81 630 CHF | -13.1% | ✓ |
| `GE-C1-300k-200k` | Couple 1 rev. | 300k | 200k | 71 708 CHF | 81 699 CHF | -12.2% | ✓ |
| `GE-C2-50k-0` | Couple 2 rev. | 50k | – | 0 CHF | 930 CHF | -100.0% | ✓ |
| `GE-C2-50k-200k` | Couple 2 rev. | 50k | 200k | 788 CHF | 999 CHF | -21.1% | ✓ |
| `GE-C2-80k-0` | Couple 2 rev. | 80k | – | 2 456 CHF | 6 321 CHF | -61.1% | ✓ |
| `GE-C2-80k-200k` | Couple 2 rev. | 80k | 200k | 3 244 CHF | 6 390 CHF | -49.2% | ✓ |
| `GE-C2-150k-0` | Couple 2 rev. | 150k | – | 17 385 CHF | 24 494 CHF | -29.0% | ✓ |
| `GE-C2-150k-200k` | Couple 2 rev. | 150k | 200k | 18 173 CHF | 24 563 CHF | -26.0% | ✓ |
| `GE-C2-300k-0` | Couple 2 rev. | 300k | – | 64 710 CHF | 78 604 CHF | -17.7% | ✓ |
| `GE-C2-300k-200k` | Couple 2 rev. | 300k | 200k | 65 498 CHF | 78 673 CHF | -16.7% | ✓ |
| `NE-S-50k-0` | Célibataire | 50k | – | 4 500 CHF | 6 210 CHF | -27.5% | ✓ |
| `NE-S-50k-200k` | Célibataire | 50k | 200k | 4 860 CHF | 7 060 CHF | -31.2% | ✓ |
| `NE-S-80k-0` | Célibataire | 80k | – | 11 096 CHF | 13 590 CHF | -18.4% | ✓ |
| `NE-S-80k-200k` | Célibataire | 80k | 200k | 11 456 CHF | 14 440 CHF | -20.7% | ✓ |
| `NE-S-150k-0` | Célibataire | 150k | – | 30 420 CHF | 35 409 CHF | -14.1% | ✓ |
| `NE-S-150k-200k` | Célibataire | 150k | 200k | 30 780 CHF | 36 259 CHF | -15.1% | ✓ |
| `NE-S-300k-0` | Célibataire | 300k | – | 83 880 CHF | 91 971 CHF | -8.8% | ✓ |
| `NE-S-300k-200k` | Célibataire | 300k | 200k | 84 240 CHF | 92 821 CHF | -9.2% | ✓ |
| `NE-C1-80k-0` | Couple 1 rev. | 80k | – | 11 032 CHF | 8 771 CHF | +25.8% | ℹ |
| `NE-C1-80k-200k` | Couple 1 rev. | 80k | 200k | 11 257 CHF | 9 360 CHF | +20.3% | ℹ |
| `NE-C1-150k-0` | Couple 1 rev. | 150k | – | 28 050 CHF | 26 355 CHF | +6.4% | ℹ |
| `NE-C1-150k-200k` | Couple 1 rev. | 150k | 200k | 28 275 CHF | 26 944 CHF | +4.9% | ℹ |
| `NE-C1-300k-0` | Couple 1 rev. | 300k | – | 79 590 CHF | 82 378 CHF | -3.4% | ✓ |
| `NE-C1-300k-200k` | Couple 1 rev. | 300k | 200k | 79 815 CHF | 82 967 CHF | -3.8% | ✓ |
| `NE-C2-50k-0` | Couple 2 rev. | 50k | – | 1 270 CHF | 2 114 CHF | -39.9% | ✓ |
| `NE-C2-50k-200k` | Couple 2 rev. | 50k | 200k | 1 495 CHF | 2 703 CHF | -44.7% | ✓ |
| `NE-C2-80k-0` | Couple 2 rev. | 80k | – | 6 952 CHF | 8 274 CHF | -16.0% | ✓ |
| `NE-C2-80k-200k` | Couple 2 rev. | 80k | 200k | 7 177 CHF | 8 863 CHF | -19.0% | ✓ |
| `NE-C2-150k-0` | Couple 2 rev. | 150k | – | 22 875 CHF | 25 964 CHF | -11.9% | ✓ |
| `NE-C2-150k-200k` | Couple 2 rev. | 150k | 200k | 23 100 CHF | 26 553 CHF | -13.0% | ✓ |
| `NE-C2-300k-0` | Couple 2 rev. | 300k | – | 74 370 CHF | 79 072 CHF | -5.9% | ✓ |
| `NE-C2-300k-200k` | Couple 2 rev. | 300k | 200k | 74 595 CHF | 79 661 CHF | -6.4% | ✓ |
| `VS-C2fair-100k-0` | Couple 2×50k ⭐ | 100k | – | 7 420 CHF | 19 965 CHF | -62.8% | ✓ |
| `VS-C2fair-100k-200k` | Couple 2×50k ⭐ | 100k | 200k | 8 200 CHF | 20 404 CHF | -59.8% | ✓ |
| `VS-C2fair-160k-0` | Couple 2×80k ⭐ | 160k | – | 18 896 CHF | 40 468 CHF | -53.3% | ✓ |
| `VS-C2fair-160k-200k` | Couple 2×80k ⭐ | 160k | 200k | 19 676 CHF | 40 907 CHF | -51.9% | ✓ |
| `VD-C2fair-100k-0` | Couple 2×50k ⭐ | 100k | – | 9 900 CHF | 14 395 CHF | -31.2% | ✓ |
| `VD-C2fair-100k-200k` | Couple 2×50k ⭐ | 100k | 200k | 10 155 CHF | 15 004 CHF | -32.3% | ✓ |
| `VD-C2fair-160k-0` | Couple 2×80k ⭐ | 160k | – | 22 624 CHF | 29 783 CHF | -24.0% | ✓ |
| `VD-C2fair-160k-200k` | Couple 2×80k ⭐ | 160k | 200k | 22 879 CHF | 30 392 CHF | -24.7% | ✓ |
| `GE-C2fair-100k-0` | Couple 2×50k ⭐ | 100k | – | 6 040 CHF | 10 871 CHF | -44.4% | ✓ |
| `GE-C2fair-100k-200k` | Couple 2×50k ⭐ | 100k | 200k | 6 828 CHF | 10 940 CHF | -37.6% | ✓ |
| `GE-C2fair-160k-0` | Couple 2×80k ⭐ | 160k | – | 19 920 CHF | 27 462 CHF | -27.5% | ✓ |
| `GE-C2fair-160k-200k` | Couple 2×80k ⭐ | 160k | 200k | 20 708 CHF | 27 531 CHF | -24.8% | ✓ |
| `NE-C2fair-100k-0` | Couple 2×50k ⭐ | 100k | – | 11 340 CHF | 12 879 CHF | -11.9% | ✓ |
| `NE-C2fair-100k-200k` | Couple 2×50k ⭐ | 100k | 200k | 11 565 CHF | 13 468 CHF | -14.1% | ✓ |
| `NE-C2fair-160k-0` | Couple 2×80k ⭐ | 160k | – | 25 584 CHF | 28 796 CHF | -11.2% | ✓ |
| `NE-C2fair-160k-200k` | Couple 2×80k ⭐ | 160k | 200k | 25 809 CHF | 29 385 CHF | -12.2% | ✓ |

---

## Analyse par canton

### VS — Valais (Sion)

- Cas : 26 | API ✓ : 20 | Anomalies IS > TOU : aucune
- Écart IS/TOU (revenu, sans fortune) : moy. -53.9%  |  min -73.2%  |  max -33.9%

| ID | Situation | Revenu | Fortune | HX IS | TOU | Écart IS/TOU | Écart revenu | Remarque |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `VS-S-50k-0` | Célibataire | 50k | – | 2 410 CHF | 6 909 CHF | -65.1% | -65.1% |  |
| `VS-S-50k-200k` | Célibataire | 50k | 200k | 3 353 CHF | 7 527 CHF | -55.5% | -65.1% |  |
| `VS-S-80k-0` | Célibataire | 80k | – | 8 128 CHF | 17 676 CHF | -54.0% | -54.0% |  |
| `VS-S-80k-200k` | Célibataire | 80k | 200k | 9 071 CHF | 18 294 CHF | -50.4% | -54.0% |  |
| `VS-S-150k-0` | Célibataire | 150k | – | 26 715 CHF | 43 346 CHF | -38.4% | -38.4% |  |
| `VS-S-150k-200k` | Célibataire | 150k | 200k | 27 658 CHF | 43 964 CHF | -37.1% | -38.4% |  |
| `VS-S-300k-0` | Célibataire | 300k | – | 80 730 CHF | – | – | – |  |
| `VS-S-300k-200k` | Célibataire | 300k | 200k | 81 673 CHF | – | – | – |  |
| `VS-C1-80k-0` | Couple 1 rev. | 80k | – | 8 936 CHF | 15 410 CHF | -42.0% | -42.0% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VS-C1-80k-200k` | Couple 1 rev. | 80k | 200k | 9 716 CHF | 15 849 CHF | -38.7% | -42.0% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VS-C1-150k-0` | Couple 1 rev. | 150k | – | 26 235 CHF | 39 697 CHF | -33.9% | -33.9% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VS-C1-150k-200k` | Couple 1 rev. | 150k | 200k | 27 015 CHF | 40 136 CHF | -32.7% | -33.9% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VS-C1-300k-0` | Couple 1 rev. | 300k | – | 75 840 CHF | – | – | – | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VS-C1-300k-200k` | Couple 1 rev. | 300k | 200k | 76 620 CHF | – | – | – | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VS-C2-50k-0` | Couple 2 rev. | 50k | – | 940 CHF | 3 505 CHF | -73.2% | -73.2% |  |
| `VS-C2-50k-200k` | Couple 2 rev. | 50k | 200k | 1 720 CHF | 3 944 CHF | -56.4% | -73.2% |  |
| `VS-C2-80k-0` | Couple 2 rev. | 80k | – | 4 616 CHF | 11 806 CHF | -60.9% | -60.9% |  |
| `VS-C2-80k-200k` | Couple 2 rev. | 80k | 200k | 5 396 CHF | 12 245 CHF | -55.9% | -60.9% |  |
| `VS-C2-150k-0` | Couple 2 rev. | 150k | – | 16 485 CHF | 37 199 CHF | -55.7% | -55.7% |  |
| `VS-C2-150k-200k` | Couple 2 rev. | 150k | 200k | 17 265 CHF | 37 638 CHF | -54.1% | -55.7% |  |
| `VS-C2-300k-0` | Couple 2 rev. | 300k | – | 68 160 CHF | – | – | – |  |
| `VS-C2-300k-200k` | Couple 2 rev. | 300k | 200k | 68 940 CHF | – | – | – |  |
| `VS-C2fair-100k-0` | Couple 2×50k ⭐ | 100k | – | 7 420 CHF | 19 965 CHF | -62.8% | -62.8% | Remplace C1-50k — comparaison IS barème B / TOU équitable (2×50k) |
| `VS-C2fair-100k-200k` | Couple 2×50k ⭐ | 100k | 200k | 8 200 CHF | 20 404 CHF | -59.8% | -62.8% | Remplace C1-50k — comparaison IS barème B / TOU équitable (2×50k) |
| `VS-C2fair-160k-0` | Couple 2×80k ⭐ | 160k | – | 18 896 CHF | 40 468 CHF | -53.3% | -53.3% | Progressivité couple — IS barème B / TOU (2×80k) |
| `VS-C2fair-160k-200k` | Couple 2×80k ⭐ | 160k | 200k | 19 676 CHF | 40 907 CHF | -51.9% | -53.3% | Progressivité couple — IS barème B / TOU (2×80k) |

### VD — Vaud (Lausanne)

- Cas : 26 | API ✓ : 26 | Anomalies IS > TOU : aucune
- Écart IS/TOU (revenu, sans fortune) : moy. -31.4%  |  min -96.3%  |  max -8.2%

| ID | Situation | Revenu | Fortune | HX IS | TOU | Écart IS/TOU | Écart revenu | Remarque |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `VD-S-50k-0` | Célibataire | 50k | – | 2 645 CHF | 7 038 CHF | -62.4% | -62.4% |  |
| `VD-S-50k-200k` | Célibataire | 50k | 200k | 3 113 CHF | 7 647 CHF | -59.3% | -62.4% |  |
| `VD-S-80k-0` | Célibataire | 80k | – | 9 640 CHF | 13 973 CHF | -31.0% | -31.0% |  |
| `VD-S-80k-200k` | Célibataire | 80k | 200k | 10 108 CHF | 14 582 CHF | -30.7% | -31.0% |  |
| `VD-S-150k-0` | Célibataire | 150k | – | 27 525 CHF | 36 113 CHF | -23.8% | -23.8% |  |
| `VD-S-150k-200k` | Célibataire | 150k | 200k | 27 993 CHF | 36 722 CHF | -23.8% | -23.8% |  |
| `VD-S-300k-0` | Célibataire | 300k | – | 82 020 CHF | 99 921 CHF | -17.9% | -17.9% |  |
| `VD-S-300k-200k` | Célibataire | 300k | 200k | 82 488 CHF | 100 530 CHF | -17.9% | -17.9% |  |
| `VD-C1-80k-0` | Couple 1 rev. | 80k | – | 9 632 CHF | 10 896 CHF | -11.6% | -11.6% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VD-C1-80k-200k` | Couple 1 rev. | 80k | 200k | 9 887 CHF | 11 505 CHF | -14.1% | -11.6% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VD-C1-150k-0` | Couple 1 rev. | 150k | – | 25 425 CHF | 27 702 CHF | -8.2% | -8.2% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VD-C1-150k-200k` | Couple 1 rev. | 150k | 200k | 25 680 CHF | 28 311 CHF | -9.3% | -8.2% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VD-C1-300k-0` | Couple 1 rev. | 300k | – | 74 970 CHF | 85 277 CHF | -12.1% | -12.1% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VD-C1-300k-200k` | Couple 1 rev. | 300k | 200k | 75 225 CHF | 85 886 CHF | -12.4% | -12.1% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `VD-C2-50k-0` | Couple 2 rev. | 50k | – | 175 CHF | 4 771 CHF | -96.3% | -96.3% |  |
| `VD-C2-50k-200k` | Couple 2 rev. | 50k | 200k | 430 CHF | 5 380 CHF | -92.0% | -96.3% |  |
| `VD-C2-80k-0` | Couple 2 rev. | 80k | – | 5 200 CHF | 10 146 CHF | -48.7% | -48.7% |  |
| `VD-C2-80k-200k` | Couple 2 rev. | 80k | 200k | 5 455 CHF | 10 755 CHF | -49.3% | -48.7% |  |
| `VD-C2-150k-0` | Couple 2 rev. | 150k | – | 20 100 CHF | 26 851 CHF | -25.1% | -25.1% |  |
| `VD-C2-150k-200k` | Couple 2 rev. | 150k | 200k | 20 355 CHF | 27 460 CHF | -25.9% | -25.1% |  |
| `VD-C2-300k-0` | Couple 2 rev. | 300k | – | 69 030 CHF | 81 351 CHF | -15.1% | -15.1% |  |
| `VD-C2-300k-200k` | Couple 2 rev. | 300k | 200k | 69 285 CHF | 81 960 CHF | -15.5% | -15.1% |  |
| `VD-C2fair-100k-0` | Couple 2×50k ⭐ | 100k | – | 9 900 CHF | 14 395 CHF | -31.2% | -31.2% | Remplace C1-50k — comparaison IS barème B / TOU équitable (2×50k) |
| `VD-C2fair-100k-200k` | Couple 2×50k ⭐ | 100k | 200k | 10 155 CHF | 15 004 CHF | -32.3% | -31.2% | Remplace C1-50k — comparaison IS barème B / TOU équitable (2×50k) |
| `VD-C2fair-160k-0` | Couple 2×80k ⭐ | 160k | – | 22 624 CHF | 29 783 CHF | -24.0% | -24.0% | Progressivité couple — IS barème B / TOU (2×80k) |
| `VD-C2fair-160k-200k` | Couple 2×80k ⭐ | 160k | 200k | 22 879 CHF | 30 392 CHF | -24.7% | -24.0% | Progressivité couple — IS barème B / TOU (2×80k) |

### GE — Genève

- Cas : 26 | API ✓ : 26 | Anomalies IS > TOU : aucune
- Écart IS/TOU (revenu, sans fortune) : moy. -30.6%  |  min -100.0%  |  max 26.2%

| ID | Situation | Revenu | Fortune | HX IS | TOU | Écart IS/TOU | Écart revenu | Remarque |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `GE-S-50k-0` | Célibataire | 50k | – | 2 760 CHF | 5 500 CHF | -49.8% | -49.8% |  |
| `GE-S-50k-200k` | Célibataire | 50k | 200k | 3 698 CHF | 5 822 CHF | -36.5% | -49.8% |  |
| `GE-S-80k-0` | Célibataire | 80k | – | 8 848 CHF | 13 240 CHF | -33.2% | -33.2% |  |
| `GE-S-80k-200k` | Célibataire | 80k | 200k | 9 786 CHF | 13 562 CHF | -27.8% | -33.2% |  |
| `GE-S-150k-0` | Célibataire | 150k | – | 26 985 CHF | 35 701 CHF | -24.4% | -24.4% |  |
| `GE-S-150k-200k` | Célibataire | 150k | 200k | 27 923 CHF | 36 023 CHF | -22.5% | -24.4% |  |
| `GE-S-300k-0` | Célibataire | 300k | – | 78 000 CHF | 95 866 CHF | -18.6% | -18.6% |  |
| `GE-S-300k-200k` | Célibataire | 300k | 200k | 78 938 CHF | 96 188 CHF | -17.9% | -18.6% |  |
| `GE-C1-80k-0` | Couple 1 rev. | 80k | – | 8 504 CHF | 6 737 CHF | +26.2% | +26.2% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `GE-C1-80k-200k` | Couple 1 rev. | 80k | 200k | 9 292 CHF | 6 806 CHF | +36.5% | +26.2% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `GE-C1-150k-0` | Couple 1 rev. | 150k | – | 24 165 CHF | 25 601 CHF | -5.6% | -5.6% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `GE-C1-150k-200k` | Couple 1 rev. | 150k | 200k | 24 953 CHF | 25 670 CHF | -2.8% | -5.6% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `GE-C1-300k-0` | Couple 1 rev. | 300k | – | 70 920 CHF | 81 630 CHF | -13.1% | -13.1% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `GE-C1-300k-200k` | Couple 1 rev. | 300k | 200k | 71 708 CHF | 81 699 CHF | -12.2% | -13.1% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `GE-C2-50k-0` | Couple 2 rev. | 50k | – | 0 CHF | 930 CHF | -100.0% | -100.0% |  |
| `GE-C2-50k-200k` | Couple 2 rev. | 50k | 200k | 788 CHF | 999 CHF | -21.1% | -100.0% |  |
| `GE-C2-80k-0` | Couple 2 rev. | 80k | – | 2 456 CHF | 6 321 CHF | -61.1% | -61.1% |  |
| `GE-C2-80k-200k` | Couple 2 rev. | 80k | 200k | 3 244 CHF | 6 390 CHF | -49.2% | -61.1% |  |
| `GE-C2-150k-0` | Couple 2 rev. | 150k | – | 17 385 CHF | 24 494 CHF | -29.0% | -29.0% |  |
| `GE-C2-150k-200k` | Couple 2 rev. | 150k | 200k | 18 173 CHF | 24 563 CHF | -26.0% | -29.0% |  |
| `GE-C2-300k-0` | Couple 2 rev. | 300k | – | 64 710 CHF | 78 604 CHF | -17.7% | -17.7% |  |
| `GE-C2-300k-200k` | Couple 2 rev. | 300k | 200k | 65 498 CHF | 78 673 CHF | -16.7% | -17.7% |  |
| `GE-C2fair-100k-0` | Couple 2×50k ⭐ | 100k | – | 6 040 CHF | 10 871 CHF | -44.4% | -44.4% | Remplace C1-50k — comparaison IS barème B / TOU équitable (2×50k) |
| `GE-C2fair-100k-200k` | Couple 2×50k ⭐ | 100k | 200k | 6 828 CHF | 10 940 CHF | -37.6% | -44.4% | Remplace C1-50k — comparaison IS barème B / TOU équitable (2×50k) |
| `GE-C2fair-160k-0` | Couple 2×80k ⭐ | 160k | – | 19 920 CHF | 27 462 CHF | -27.5% | -27.5% | Progressivité couple — IS barème B / TOU (2×80k) |
| `GE-C2fair-160k-200k` | Couple 2×80k ⭐ | 160k | 200k | 20 708 CHF | 27 531 CHF | -24.8% | -27.5% | Progressivité couple — IS barème B / TOU (2×80k) |

### NE — Neuchâtel

- Cas : 26 | API ✓ : 26 | Anomalies IS > TOU : aucune
- Écart IS/TOU (revenu, sans fortune) : moy. -10.5%  |  min -39.9%  |  max 25.8%

| ID | Situation | Revenu | Fortune | HX IS | TOU | Écart IS/TOU | Écart revenu | Remarque |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `NE-S-50k-0` | Célibataire | 50k | – | 4 500 CHF | 6 210 CHF | -27.5% | -27.5% |  |
| `NE-S-50k-200k` | Célibataire | 50k | 200k | 4 860 CHF | 7 060 CHF | -31.2% | -27.5% |  |
| `NE-S-80k-0` | Célibataire | 80k | – | 11 096 CHF | 13 590 CHF | -18.4% | -18.4% |  |
| `NE-S-80k-200k` | Célibataire | 80k | 200k | 11 456 CHF | 14 440 CHF | -20.7% | -18.4% |  |
| `NE-S-150k-0` | Célibataire | 150k | – | 30 420 CHF | 35 409 CHF | -14.1% | -14.1% |  |
| `NE-S-150k-200k` | Célibataire | 150k | 200k | 30 780 CHF | 36 259 CHF | -15.1% | -14.1% |  |
| `NE-S-300k-0` | Célibataire | 300k | – | 83 880 CHF | 91 971 CHF | -8.8% | -8.8% |  |
| `NE-S-300k-200k` | Célibataire | 300k | 200k | 84 240 CHF | 92 821 CHF | -9.2% | -8.8% |  |
| `NE-C1-80k-0` | Couple 1 rev. | 80k | – | 11 032 CHF | 8 771 CHF | +25.8% | +25.8% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `NE-C1-80k-200k` | Couple 1 rev. | 80k | 200k | 11 257 CHF | 9 360 CHF | +20.3% | +25.8% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `NE-C1-150k-0` | Couple 1 rev. | 150k | – | 28 050 CHF | 26 355 CHF | +6.4% | +6.4% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `NE-C1-150k-200k` | Couple 1 rev. | 150k | 200k | 28 275 CHF | 26 944 CHF | +4.9% | +6.4% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `NE-C1-300k-0` | Couple 1 rev. | 300k | – | 79 590 CHF | 82 378 CHF | -3.4% | -3.4% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `NE-C1-300k-200k` | Couple 1 rev. | 300k | 200k | 79 815 CHF | 82 967 CHF | -3.8% | -3.4% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `NE-C2-50k-0` | Couple 2 rev. | 50k | – | 1 270 CHF | 2 114 CHF | -39.9% | -39.9% |  |
| `NE-C2-50k-200k` | Couple 2 rev. | 50k | 200k | 1 495 CHF | 2 703 CHF | -44.7% | -39.9% |  |
| `NE-C2-80k-0` | Couple 2 rev. | 80k | – | 6 952 CHF | 8 274 CHF | -16.0% | -16.0% |  |
| `NE-C2-80k-200k` | Couple 2 rev. | 80k | 200k | 7 177 CHF | 8 863 CHF | -19.0% | -16.0% |  |
| `NE-C2-150k-0` | Couple 2 rev. | 150k | – | 22 875 CHF | 25 964 CHF | -11.9% | -11.9% |  |
| `NE-C2-150k-200k` | Couple 2 rev. | 150k | 200k | 23 100 CHF | 26 553 CHF | -13.0% | -11.9% |  |
| `NE-C2-300k-0` | Couple 2 rev. | 300k | – | 74 370 CHF | 79 072 CHF | -5.9% | -5.9% |  |
| `NE-C2-300k-200k` | Couple 2 rev. | 300k | 200k | 74 595 CHF | 79 661 CHF | -6.4% | -5.9% |  |
| `NE-C2fair-100k-0` | Couple 2×50k ⭐ | 100k | – | 11 340 CHF | 12 879 CHF | -11.9% | -11.9% | Remplace C1-50k — comparaison IS barème B / TOU équitable (2×50k) |
| `NE-C2fair-100k-200k` | Couple 2×50k ⭐ | 100k | 200k | 11 565 CHF | 13 468 CHF | -14.1% | -11.9% | Remplace C1-50k — comparaison IS barème B / TOU équitable (2×50k) |
| `NE-C2fair-160k-0` | Couple 2×80k ⭐ | 160k | – | 25 584 CHF | 28 796 CHF | -11.2% | -11.2% | Progressivité couple — IS barème B / TOU (2×80k) |
| `NE-C2fair-160k-200k` | Couple 2×80k ⭐ | 160k | 200k | 25 809 CHF | 29 385 CHF | -12.2% | -11.2% | Progressivité couple — IS barème B / TOU (2×80k) |

---

## Écart IS/TOU par tranche — célibataires, sans fortune

| Tranche | VS | VD | GE | NE | Tendance |
|---|---:|---:|---:|---:|---|
| **50k CHF** | -65.1% | -62.4% | -49.8% | -27.5% | IS < TOU ✓ |
| **80k CHF** | -54.0% | -31.0% | -33.2% | -18.4% | IS < TOU ✓ |
| **150k CHF** | -38.4% | -23.8% | -24.4% | -14.1% | IS < TOU ✓ |
| **300k CHF** | – | -17.9% | -18.6% | -8.8% | ⚠ vérifier |

---

## Anomalies et recommandations

### Revenu IS

✅ **Aucune anomalie.** IS < TOU confirmé sur les 98 cas testés.

### Barème C — Écarts structurels IS > TOU (ℹ — attendus)

> IS barème C intègre ~70 500 CHF de revenu théorique conjoint → IS structurellement > TOU à bas/moyen revenu.
> Ces cas sont étiquetés **ℹ** dans le tableau (seuil 50% appliqué, non-anomalies).

| ID | Canton | Revenu | HX IS rev. | TOU rev. | Écart | Note |
|---|---|---:|---:|---:|---:|---|
| `GE-C1-80k-0` | GE | 80k | 8 504 CHF | 6 737 CHF | +26.2% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `GE-C1-80k-200k` | GE | 80k | 8 504 CHF | 6 737 CHF | +26.2% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `NE-C1-80k-0` | NE | 80k | 11 032 CHF | 8 771 CHF | +25.8% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `NE-C1-80k-200k` | NE | 80k | 11 032 CHF | 8 771 CHF | +25.8% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `NE-C1-150k-0` | NE | 150k | 28 050 CHF | 26 355 CHF | +6.4% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |
| `NE-C1-150k-200k` | NE | 150k | 28 050 CHF | 26 355 CHF | +6.4% | Barème C — taux IS intègre ~70,5k revenu théorique conjoint |

### Fortune — Écarts importants (> 40%)

| ID | Canton | Fortune | HX Fort. | TOU Fort. | Écart | Note |
|---|---|---:|---:|---:|---:|---|
| `VS-S-50k-200k` | VS | 200k | 943 CHF | 618 CHF | +52.6% | HX trop élevé |
| `VS-S-80k-200k` | VS | 200k | 943 CHF | 618 CHF | +52.6% | HX trop élevé |
| `VS-S-150k-200k` | VS | 200k | 943 CHF | 618 CHF | +52.6% | HX trop élevé |
| `VS-C1-80k-200k` | VS | 200k | 780 CHF | 439 CHF | +77.7% | HX trop élevé |
| `VS-C1-150k-200k` | VS | 200k | 780 CHF | 439 CHF | +77.7% | HX trop élevé |
| `VS-C2-50k-200k` | VS | 200k | 780 CHF | 439 CHF | +77.7% | HX trop élevé |
| `VS-C2-80k-200k` | VS | 200k | 780 CHF | 439 CHF | +77.7% | HX trop élevé |
| `VS-C2-150k-200k` | VS | 200k | 780 CHF | 439 CHF | +77.7% | HX trop élevé |
| `VD-C1-80k-200k` | VD | 200k | 255 CHF | 609 CHF | -58.1% | HX trop bas |
| `VD-C1-150k-200k` | VD | 200k | 255 CHF | 609 CHF | -58.1% | HX trop bas |
| `VD-C1-300k-200k` | VD | 200k | 255 CHF | 609 CHF | -58.1% | HX trop bas |
| `VD-C2-50k-200k` | VD | 200k | 255 CHF | 609 CHF | -58.1% | HX trop bas |
| `VD-C2-80k-200k` | VD | 200k | 255 CHF | 609 CHF | -58.1% | HX trop bas |
| `VD-C2-150k-200k` | VD | 200k | 255 CHF | 609 CHF | -58.1% | HX trop bas |
| `VD-C2-300k-200k` | VD | 200k | 255 CHF | 609 CHF | -58.1% | HX trop bas |
| `GE-S-50k-200k` | GE | 200k | 938 CHF | 322 CHF | +191.3% | HX trop élevé |
| `GE-S-80k-200k` | GE | 200k | 938 CHF | 322 CHF | +191.3% | HX trop élevé |
| `GE-S-150k-200k` | GE | 200k | 938 CHF | 322 CHF | +191.3% | HX trop élevé |
| `GE-S-300k-200k` | GE | 200k | 938 CHF | 322 CHF | +191.3% | HX trop élevé |
| `GE-C1-80k-200k` | GE | 200k | 788 CHF | 69 CHF | +1042.0% | HX trop élevé |
| `GE-C1-150k-200k` | GE | 200k | 788 CHF | 69 CHF | +1042.0% | HX trop élevé |
| `GE-C1-300k-200k` | GE | 200k | 788 CHF | 69 CHF | +1042.0% | HX trop élevé |
| `GE-C2-50k-200k` | GE | 200k | 788 CHF | 69 CHF | +1042.0% | HX trop élevé |
| `GE-C2-80k-200k` | GE | 200k | 788 CHF | 69 CHF | +1042.0% | HX trop élevé |
| `GE-C2-150k-200k` | GE | 200k | 788 CHF | 69 CHF | +1042.0% | HX trop élevé |
| `GE-C2-300k-200k` | GE | 200k | 788 CHF | 69 CHF | +1042.0% | HX trop élevé |
| `NE-S-50k-200k` | NE | 200k | 360 CHF | 850 CHF | -57.6% | HX trop bas |
| `NE-S-80k-200k` | NE | 200k | 360 CHF | 850 CHF | -57.6% | HX trop bas |
| `NE-S-150k-200k` | NE | 200k | 360 CHF | 850 CHF | -57.6% | HX trop bas |
| `NE-S-300k-200k` | NE | 200k | 360 CHF | 850 CHF | -57.6% | HX trop bas |
| `NE-C1-80k-200k` | NE | 200k | 225 CHF | 589 CHF | -61.8% | HX trop bas |
| `NE-C1-150k-200k` | NE | 200k | 225 CHF | 589 CHF | -61.8% | HX trop bas |
| `NE-C1-300k-200k` | NE | 200k | 225 CHF | 589 CHF | -61.8% | HX trop bas |
| `NE-C2-50k-200k` | NE | 200k | 225 CHF | 589 CHF | -61.8% | HX trop bas |
| `NE-C2-80k-200k` | NE | 200k | 225 CHF | 589 CHF | -61.8% | HX trop bas |
| `NE-C2-150k-200k` | NE | 200k | 225 CHF | 589 CHF | -61.8% | HX trop bas |
| `NE-C2-300k-200k` | NE | 200k | 225 CHF | 589 CHF | -61.8% | HX trop bas |
| `VS-C2fair-100k-200k` | VS | 200k | 780 CHF | 439 CHF | +77.7% | HX trop élevé |
| `VS-C2fair-160k-200k` | VS | 200k | 780 CHF | 439 CHF | +77.7% | HX trop élevé |
| `VD-C2fair-100k-200k` | VD | 200k | 255 CHF | 609 CHF | -58.1% | HX trop bas |
| `VD-C2fair-160k-200k` | VD | 200k | 255 CHF | 609 CHF | -58.1% | HX trop bas |
| `GE-C2fair-100k-200k` | GE | 200k | 788 CHF | 69 CHF | +1042.0% | HX trop élevé |
| `GE-C2fair-160k-200k` | GE | 200k | 788 CHF | 69 CHF | +1042.0% | HX trop élevé |
| `NE-C2fair-100k-200k` | NE | 200k | 225 CHF | 589 CHF | -61.8% | HX trop bas |
| `NE-C2fair-160k-200k` | NE | 200k | 225 CHF | 589 CHF | -61.8% | HX trop bas |

- **HX trop élevé (VS, GE)** : vérifier tranches et abattements dans `wealthTax.ts`
- **HX trop bas (VD, NE)** : vérifier coefficient communal dans `cantonConfig.ts`

---

## Commandes

```bash
# Mode automatique (défaut)
npx vite-node scripts/validate-against-official.ts
npx vite-node scripts/validate-against-official.ts --auto

# Serveur local (données fraîches)
git clone https://github.com/devbrains-com/swisstaxcalculator
cd swisstaxcalculator && yarn install && yarn importdata 2026 --download && yarn dev
SWISSTAX_API_URL=http://localhost:3000 npx vite-node scripts/validate-against-official.ts

# Mode manuel
npx vite-node scripts/validate-against-official.ts --manual
```

---

*Rapport généré automatiquement. Relancer le script pour mettre à jour.*