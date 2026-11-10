# Simulateur du revenu universel d’existence (RUE) / Eksistentsi põhisissetuleku (RUE) simulaator

**[Eesti keeles](#eesti-keeles)** · **[En français](#en-français)**

---

## Eesti keeles

### Mis see on

Veebirakendus, mis teisendab Prantsusmaa kodanikupalga aktivistide kaks Exceli kalkulaatorit (manustatud pptx-i "Et vous ? Que FERIEZ-VOUS ?") brauseris töötavaks simulaatoriks. Serverit, andmebaasi ega paigaldust pole vaja.

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

### Exceli loogika

Kood järgib Exceli valemeid **täpselt** ning iga valemi juures on Exceli lahtriviide, nt `[SIMULATEUR!F56]`. Sees on autori kõik parandused (failid `ET_VOUS_corrigé1.xlsx` ja `Simulateur_corrigé_2.xlsx`):

- maksukoormus = kogusissemakse / tegevus- ja varatulu neto (`F60/F53`);
- neto tegevustulu = bruto × 0,9 pensionäril, muidu × 0,79, mõlemal isikul automaatselt (lahter jäetakse tühjaks; soovi korral saab käsitsi üle kirjutada);
- isiku 2 koefitsient 0,66 (C59) ja 0,66 ainult pensionile (F57, sama mis F56);
- detsiilide RUE järgib sisestatud RUE summasid (`K35:K45` = põhiväärtus × K29 / J29);
- sissemaksu progressiivsus kehtib detsiilidel 1–3 (F28, G28), parasiitviide `+E18` on eemaldatud.

Koodis on `⚠ KONTROLLI` märgitud veel kaks Exceli eripära, mida autor pole kommenteerinud ja mis on reprodutseeritud sellisena nagu need on: detsiili keskmise lahtri D31 märk on vastupidine veergudele E31:O31 ning "paar ilma lasteta" (D20) kasutab 25+ ja 65+ summat (mõju puudub, kuni need on võrdsed).

### Kontroll

Arvutusi on testitud Exceli väärtuste vastu:

- ühiskonna leht: kõik 11 detsiili, keskmised, saldo (−32,52 €/kuu) ja rikkaima 10% panus (27,54 miljardit €) vs `Simulateur_corrigé_2.xlsx`;
- kodumajapidamise leht: kaks mitmekesist juhtumit (sh pensionär isik 2 varaga, progressiivsus sees ja väljas), mille Exceli tulemused on arvutatud uuesti LibreOffice'is faili `ET_VOUS_corrigé1.xlsx` põhjal;
- kõik 12 näidisjuhtumit lehtedelt SMIC, MAMAN SOLO ja RETRAITE;
- liidese lihtne kontroll (mõlemad keeled, kõik näidisjuhtumid, mõlemad vahelehed, puuduvaid tõlkeid pole).

Testid on tehtud Node.js-is. **Liidest ei ole päris brauseris läbi proovitud**, seega tasub paigutust ja mobiilivaadet ise üle vaadata.

### Piirangud

- Andmed (detsiilide tulu, vara, toetused, maksud; 31 miljonit leibkonda) on Exceli INSEE-põhised ja kodeeritud otse faili. Neid ei uuendata.
- Exceli graafikute asemel on lihtsad tulbad.
- Näidisjuhtumid kasutavad Exceli esimese faili parameetreid (300/500/1100 €, 27%, 1%). Rakenduse vaikeparameetrid (330/550/1100 €, 28%, 1,5%) on teisest failist, seega tulemused erinevad veidi, kui parameetreid ei muuda.
- Tõlked on tehtud ilma emakeelse kontrollita ja väärivad pealelugemist.

---

## En français

### De quoi s’agit-il ?

Une application web qui transforme les deux calculateurs Excel du mouvement pour le revenu de base (intégrés dans le fichier pptx « Et vous ? Que FERIEZ-VOUS ? ») en un simulateur fonctionnant dans le navigateur. Aucun serveur, aucune base de données, aucune installation.

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

### Logique d’Excel

Le code reproduit les formules Excel **à l’identique**. Chaque formule est accompagnée de la référence de cellule d’origine, ex. `[SIMULATEUR!F56]`. Toutes les corrections de l’auteur sont intégrées (fichiers `ET_VOUS_corrigé1.xlsx` et `Simulateur_corrigé_2.xlsx`) :

- taux de prélèvement = prélèvement total / revenus nets d’activité et du patrimoine (`F60/F53`) ;
- net d’activité = brut × 0,9 pour un·e retraité·e, sinon × 0,79, automatique pour les deux personnes (champ laissé vide ; on peut le saisir à la main pour le remplacer) ;
- coefficient 0,66 pour la personne 2 (C59) et 0,66 appliqué seulement à la pension (F57, identique à F56) ;
- le RUE par décile suit les montants du RUE saisis (`K35:K45` = valeur de base × K29 / J29) ;
- la progressivité de la cotisation s’applique aux déciles 1 à 3 (F28, G28) ; la référence parasite `+E18` est supprimée.

Deux particularités d’Excel, non commentées par l’auteur, sont signalées par `⚠ KONTROLLI` dans le code et reproduites telles quelles : le signe de la cellule moyenne D31 est inversé par rapport aux colonnes E31:O31, et le « couple sans enfant » (D20) additionne les montants 25+ et 65+ (sans effet tant qu’ils sont égaux).

### Vérification

Les calculs ont été testés contre les valeurs d’Excel :

- onglet société : les 11 déciles, les moyennes, le solde (−32,52 €/mois) et la contribution des 10 % les plus riches (27,54 milliards €) comparés à `Simulateur_corrigé_2.xlsx` ;
- onglet foyer : deux cas variés (dont une personne 2 retraitée avec patrimoine, progressivité activée et désactivée), dont les résultats Excel ont été recalculés dans LibreOffice à partir de `ET_VOUS_corrigé1.xlsx` ;
- les 12 cas types des feuilles SMIC, MAMAN SOLO et RETRAITE ;
- un contrôle simple de l’interface (les deux langues, tous les cas types, les deux onglets, aucune traduction manquante).

Les tests ont été exécutés sous Node.js. **L’interface n’a pas été essayée dans un vrai navigateur** : il convient de vérifier soi-même la mise en page et l’affichage mobile.

### Limites

- Les données (revenus par décile, patrimoine, aides, impôts ; 31 millions de ménages) proviennent de l’Excel (INSEE) et sont codées en dur. Elles ne sont pas mises à jour.
- Les graphiques d’Excel sont remplacés par de simples barres.
- Les cas types utilisent les paramètres du premier classeur Excel (300/500/1100 €, 27 %, 1 %). Les paramètres par défaut de l’application (330/550/1100 €, 28 %, 1,5 %) viennent du second classeur : les résultats diffèrent donc légèrement tant qu’on ne modifie pas les paramètres.
- Les traductions n’ont pas été relues par un·e locuteur·rice natif·ve.
