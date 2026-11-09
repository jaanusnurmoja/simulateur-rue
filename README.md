# Simulateur du revenu universel d’existence (RUE) / Eksistentsi põhisissetuleku (RUE) simulaator

**[Eesti keeles](#eesti-keeles)** · **[En français](#en-français)**

---

## Eesti keeles

### Mis see on

Veebirakendus, mis teisendab Prantsusmaa kodanikupalga aktivistide kaks Exceli kalkulaatorit (manustatud pptx-i "Et vous ? Que FERIEZ-VOUS ?") brauseris töötavaks simulaatoriks. Serverit, andmebaasi ega paigaldust pole vaja. Excelite autor: Guy Valette (Prantsusmaa, https://guyvaletteparis.wordpress.com/)

Rakendusel on kaks vahelehte:

- **Et vous ?** (kodumajapidamine): sisestate oma leibkonna (kuni kaks täiskasvanut ja lapsed), tulud, vara, toetused ja maksud. Tulemuseks on praegune ja RUE-ga käepärane tulu, kasu, sissemakse ja maksukoormus. Valmis näidisjuhtumid (alampalk, üksikema, pensionärid) täidavad vormi ühe klikiga ja näitavad ka vaesuspiiri.
- **Pour la société** (ühiskond): keskmise leibkonna tulu, kuu- ja aastasaldo (ülejääk või puudujääk), rikkaima 10% panus ning kasu või kaotus detsiilide kaupa.

RUE summad ja sissemaksumäärad on mõlemal lehel ühised. Liides on vaikimisi prantsuse keeles, ET-nupp lülitab eesti keelde.

### Failid

| Fail | Sisu |
|---|---|
| `index.html` | Lehe struktuur |
| `styles.css` | Kõik stiilid (hele ja tume teema) |
| `translations.js` | Kõik FR/ET tekstid. Uue keele lisamiseks kopeerida üks plokk ja tõlkida väärtused |
| `app.js` | Loogika: arvutused, andmed, joonistamine, sündmused (kaheksa nummerdatud jaotist, funktsioonidel kommentaarid) |

### Paigaldamine

Laadige **kõik neli faili samasse kausta** veebikeskkonda ja avage `index.html`. Võib avada ka arvutis topeltklõpsuga. Internetiühendust, PHP-d ega MySQL-i ei ole vaja. Faili `translations.js` peab olema enne `app.js` (nii on `index.html`-is juba).

### Vaikeväärtuste muutmine

Failis `app.js`, jaotises "4. État de l’application" (`const state`): RUE summad (330/550/1100/1100/1100 €), sissemakse 28%, netovara maks 1,5%, peretoetuste sissemakse 60 miljardit €, käibemaks 50 miljardit €, vaikimisi leibkond. Kõiki neid saab ka lehel muuta.

### Exceli loogika ja "kahtlased kohad"

Kood järgib Exceli valemeid **täpselt** (ka nende eripärasid) ning iga valemi juures on Exceli lahtriviide, nt `[SIMULATEUR!F56]`. Kohad, mis näivad vead olevat, on märgitud kommentaariga `⚠ KONTROLLI`. Parandus on valmis, aga **vaikimisi välja lülitatud**, et tulemused klapiksid Exceliga. Sisselülitamiseks:

- kõik korraga: `APPLY_SUGGESTED_FIXES = true` (`app.js` algus), või
- ükshaaval: lehel märkeruudud ("Points à vérifier" ja vahelehe "Pour la société" sisendid), või `SUGGESTED_FIXES` objekt.

Praegused neli parandusvõimalust:

| Nimi | Mida muudab |
|---|---|
| `retiredCoefficientPerson2` | Isik 2: koefitsient 0,66 asemel 0,75 (netovara maks, pensionär; lahter C59) |
| `retiredContributionPerson2` | Isik 2: 0,66 rakendub ainult pensionile, mitte varatulule (lahter F57) |
| `progressivityDecilesTwoAndThree` | Sissemaksu progressiivsus ka detsiilidele 2 ja 3 (lahtrid D19/E19 on Excelis tühjad) |
| `decileBasicIncomeFollowsRates` | Detsiilide RUE järgib sisestatud RUE summasid (vt allpool) |

### Lahtised küsimused autorile

1. **C59 ja F57** on parandatud Exceli failides muutmata, kuigi autor märkis need vastustes parandatuks või selgitas. Kas tahtis ta neid ka muuta?
2. **COMPOSITION K35:K45** on parandatud Excelis fikseeritud numbrid (1145…1350). Seetõttu **ei mõjuta RUE summade muutmine ühiskonna lehe tulemusi**. Kui see pole tahtlik, tuleks `decileBasicIncomeFollowsRates` vaikimisi sisse lülitada. Kui RUE on 300/500/1100 €, annab see täpselt Exceli väärtused.

### Kontroll

Arvutusi on testitud Exceli salvestatud väärtuste vastu: parandatud BILAN-i leht (saldo −29,10 €/kuu, rikkaima 10% panus 27,54 miljardit €, detsiilide kaupa), parandatud ET VOUS juhtum ja kõik 12 näidisjuhtumit lehtedelt SMIC, MAMAN SOLO ja RETRAITE. Testid on tehtud Node.js-is. 

**Liidest ei ole päris brauseris läbi proovitud**, seega tasub paigutust ja mobiilivaadet ise üle vaadata. NB! See on Claude.ai sõnum.

**Liidest on võimalik päris brauseris töötamas näha https://kodanikupalk.ee/varia/calcfrance**

### Piirangud

- Andmed (detsiilide tulu, vara, toetused, maksud; 31 miljonit leibkonda) on Exceli INSEE-põhised ja kodeeritud otse faili. Neid ei uuendata.
- Exceli graafikute asemel on lihtsad tulbad.
- Näidisjuhtumid kasutavad Exceli esimese faili parameetreid (300/500/1100 €, 27%, 1%). Rakenduse vaikeparameetrid (330/550/1100 €, 28%, 1,5%) on teisest failist, seega tulemused erinevad veidi, kui parameetreid ei muuda.
- Tõlked on tehtud ilma emakeelse kontrollita ja väärivad pealelugemist.

---

## En français

### De quoi s’agit-il ?

Une application web qui transforme les deux calculateurs Excel du mouvement pour le revenu de base (intégrés dans le fichier pptx « Et vous ? Que FERIEZ-VOUS ? ») en un simulateur fonctionnant dans le navigateur. Aucun serveur, aucune base de données, aucune installation. L'auteur des calculateurs Exccel: Guy Valette (France, https://guyvaletteparis.wordpress.com/)

L’application comporte deux onglets :

- **Et vous ?** (le foyer) : vous saisissez votre foyer (jusqu’à deux adultes et des enfants), vos revenus, patrimoine, aides et impôts. Le résultat compare votre revenu disponible actuel et celui avec le RUE, avec le gain, votre contribution et le taux de prélèvement. Des cas types (SMIC, mère seule, retraité·e·s) remplissent le formulaire en un clic et affichent aussi le seuil de pauvreté.
- **Pour la société** : revenu net du ménage moyen, solde mensuel et annuel (excédent ou déficit), contribution des 10 % les plus riches, gain ou perte par décile.

Les montants du RUE et les taux de contribution sont communs aux deux onglets. L’interface est en français par défaut ; le bouton ET passe à l’estonien.

### Fichiers

| Fichier | Contenu |
|---|---|
| `index.html` | Structure de la page |
| `styles.css` | Tous les styles (thèmes clair et sombre) |
| `translations.js` | Tous les textes FR/ET. Pour ajouter une langue : copier un bloc et traduire les valeurs |
| `app.js` | Logique : calculs, données, affichage, événements (huit sections numérotées, fonctions commentées) |

### Installation

Déposez **les quatre fichiers dans le même dossier** de votre hébergement web et ouvrez `index.html`. On peut aussi l’ouvrir en local par double-clic. Aucune connexion internet, ni PHP, ni MySQL n’est nécessaire. `translations.js` doit être chargé avant `app.js` (c’est déjà le cas dans `index.html`).

### Modifier les valeurs par défaut

Dans `app.js`, section « 4. État de l’application » (`const state`) : montants du RUE (330/550/1100/1100/1100 €), cotisation de 28 %, taxe sur les actifs nets de 1,5 %, cotisations A.F. de 60 milliards €, TVA de 50 milliards €, foyer par défaut. Tous ces paramètres sont aussi modifiables dans la page.

### Logique d’Excel et « points à vérifier »

Le code reproduit les formules Excel **à l’identique** (y compris leurs particularités). Chaque formule est accompagnée de la référence de cellule d’origine, ex. `[SIMULATEUR!F56]`. Les endroits qui semblent être des erreurs sont signalés par un commentaire `⚠ KONTROLLI`. Une correction est prête, mais **désactivée par défaut**, pour que les résultats concordent avec Excel. Pour l’activer :

- toutes à la fois : `APPLY_SUGGESTED_FIXES = true` (début de `app.js`), ou
- une par une : cases à cocher dans la page (« Points à vérifier » et saisies de l’onglet « Pour la société »), ou objet `SUGGESTED_FIXES`.

Les quatre corrections disponibles :

| Nom | Effet |
|---|---|
| `retiredCoefficientPerson2` | Personne 2 : coefficient 0,66 au lieu de 0,75 (taxe sur actifs nets, retraité·e ; cellule C59) |
| `retiredContributionPerson2` | Personne 2 : le 0,66 ne s’applique qu’à la pension, pas aux revenus du patrimoine (cellule F57) |
| `progressivityDecilesTwoAndThree` | Progressivité de la cotisation aussi pour les déciles 2 et 3 (cellules D19/E19 vides dans Excel) |
| `decileBasicIncomeFollowsRates` | Le RUE par décile suit les montants du RUE saisis (voir ci-dessous) |

### Questions ouvertes pour l’auteur

1. **C59 et F57** sont inchangés dans les fichiers Excel corrigés, alors que l’auteur les a indiqués comme corrigés ou expliqués dans sa réponse. Souhaitait-il aussi les modifier ?
2. **COMPOSITION K35:K45** sont, dans l’Excel corrigé, des valeurs fixes (1145…1350). **Modifier les montants du RUE n’a donc plus aucun effet sur l’onglet société.** Si ce n’est pas voulu, il faudrait activer `decileBasicIncomeFollowsRates` par défaut. Pour un RUE de 300/500/1100 €, les valeurs sont strictement celles d’Excel.

### Vérification

Les calculs ont été testés contre les valeurs enregistrées dans Excel : la feuille BILAN corrigée (solde de −29,10 €/mois, contribution des 10 % les plus riches de 27,54 milliards €, valeurs par décile), le cas ET VOUS corrigé et les 12 cas types des feuilles SMIC, MAMAN SOLO et RETRAITE. Les tests ont été exécutés sous Node.js. 

**L’interface n’a pas été essayée dans un vrai navigateur** : il convient de vérifier soi-même la mise en page et l’affichage mobile. (NB! C'est le message de Claude.ai)

**On peut le voir foncionner à: https://kodanikupalk.ee/varia/calcfrance** 

### Limites

- Les données (revenus par décile, patrimoine, aides, impôts ; 31 millions de ménages) proviennent de l’Excel (INSEE) et sont codées en dur. Elles ne sont pas mises à jour.
- Les graphiques d’Excel sont remplacés par de simples barres.
- Les cas types utilisent les paramètres du premier classeur Excel (300/500/1100 €, 27 %, 1 %). Les paramètres par défaut de l’application (330/550/1100 €, 28 %, 1,5 %) viennent du second classeur : les résultats diffèrent donc légèrement tant qu’on ne modifie pas les paramètres.
- Les traductions n’ont pas été relues par un·e locuteur·rice natif·ve.
