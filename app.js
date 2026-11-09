/* ============================================================================
   Simulateur du revenu universel d’existence (RUE) — application
   Port fidèle de deux classeurs Excel. Les références entre crochets, ex. [SIMULATEUR!F56],
   renvoient aux cellules d’origine. Les formules sont reproduites à l’identique, y compris
   leurs particularités ; les endroits suspects sont marqués « ⚠ KONTROLLI ».

   Fichiers : index.html (structure), styles.css (apparence), translations.js (textes FR/ET), app.js (ce fichier).
   Sections : 1. Corrections suggérées  2. Calcul « Et vous ? »  3. Calcul « Pour la société »
              4. État et cas types  5. Outils d’affichage  6. Blocs HTML  7. Rendu  8. Événements et démarrage
   ============================================================================ */


/* ============================================================================
   1. CORRECTIONS SUGGÉRÉES
   Par défaut, les calculs reproduisent l’Excel à l’identique. Mettre APPLY_SUGGESTED_FIXES à true
   (ou un seul interrupteur) applique les corrections proposées. Les noms servent aussi de clés
   de traduction (translations.js) pour l’affichage des cases à cocher.
   ============================================================================ */
const APPLY_SUGGESTED_FIXES = false;
const SUGGESTED_FIXES = {
  retiredCoefficientPerson2: APPLY_SUGGESTED_FIXES,       // coefficient 0,75 → 0,66 (personne 2, taxe sur actifs nets)
  retiredContributionPerson2: APPLY_SUGGESTED_FIXES,      // le 0,66 ne s’applique qu’à la pension (cotisation de la personne 2)
  progressivityDecilesTwoAndThree: APPLY_SUGGESTED_FIXES, // progressivité aussi pour les déciles 2 et 3 (onglet société)
  decileBasicIncomeFollowsRates: APPLY_SUGGESTED_FIXES    // le RUE par décile suit les montants du RUE saisis (onglet société)
};


/* ============================================================================
   2. CALCUL « ET VOUS ? » (feuilles « ET VOUS » + « SIMULATEUR » du second classeur)
   ============================================================================ */

/**
 * Taux de cotisation (ou de taxe sur le patrimoine) d’une personne, avec progressivité optionnelle :
 * si la base de calcul est sous le seuil, le taux maximal est réduit proportionnellement.
 * [SIMULATEUR!C56:C59]
 */
function progressiveRate(person, isRetired, maxRate, isProgressive, threshold, retiredCoefficient) {
  const base = isRetired
    ? retiredCoefficient * person.grossIncome + person.wealthIncomeGross
    : person.grossIncome + person.wealthIncomeGross;
  return isProgressive && base < threshold ? maxRate * (base / threshold) : maxRate;
}

/**
 * Compare le revenu disponible actuel d’un foyer (1 ou 2 personnes + enfants) à celui qu’il aurait avec le RUE.
 *
 * @param {object} input  basicIncomeByAge [0-14, 14-18, 18-25, 25+, 65+], contributionRate, wealthTaxRate,
 *                        contributionProgressivity, wealthTaxProgressivity, children [0-14, 14-18, 18-25],
 *                        person1, person2 (situation : "youngAdult" | "adult" | "retired" | "" = absente)
 * @param {object} fixes  interrupteurs de SUGGESTED_FIXES
 * @returns {object} currentIncome, incomeWithBasicIncome, gain, gainRatio, householdBasicIncome,
 *                   totalContribution, withdrawalRate (tous par mois, en €)
 */
function calculateHouseholdBudget(input, fixes = SUGGESTED_FIXES) {
  const ages = input.basicIncomeByAge;
  const people = [input.person1, input.person2];
  const [person1, person2] = people;
  const isRetired = people.map(person => person.situation === "retired");                 // [E29, E30]

  // RUE des personnes [F29, F30] et des enfants [F32] ; total du foyer [F52]
  const basicIncomePerPerson = people.map(person =>
    (person.situation === "youngAdult" ? ages[2] : 0) +
    (person.situation === "adult" ? ages[3] : 0) +
    (person.situation === "retired" ? ages[4] : 0));
  const [children0to14, children14to18, children18to25] = input.children;
  const childrenBasicIncome = children0to14 * ages[0] + children14to18 * ages[1] + children18to25 * ages[2];
  const householdBasicIncome = basicIncomePerPerson[0] + basicIncomePerPerson[1] + childrenBasicIncome;

  // Net d’activité [ET VOUS!F46, G46] = brut × 0,9 (retraité·e) ou × 0,79 (corrigé par l’auteur). Champ vide = formule d’origine.
  const netActivityIncome = people.map((person, i) =>
    person.netIncome == null ? person.grossIncome * (isRetired[i] ? 0.9 : 0.79) : person.netIncome);

  // Revenu disponible actuel [F49]
  const currentIncome = people.reduce((total, person, i) =>
    total + netActivityIncome[i] + person.wealthIncomeNet + person.socialBenefits + person.familyBenefits
          - person.incomeTax - person.wealthTax - person.healthInsurance, 0);

  // Revenu net d’activité et du patrimoine après la cotisation actuelle de 20 % (0,8 codé en dur), pension à 66 % [F53]
  const netIncomeAfterFixedContribution = people.reduce((total, person, i) =>
    total + (isRetired[i]
      ? 0.8 * (0.66 * person.grossIncome + person.wealthIncomeGross)
      : 0.8 * (person.grossIncome + person.wealthIncomeGross)), 0);

  // Taux de cotisation [C56, C57] (seuil 1 800 €) et de taxe sur les actifs nets [C58, C59] (seuil 3 000 €)
  const contributionRate1 = progressiveRate(person1, isRetired[0], input.contributionRate, input.contributionProgressivity, 1800, 0.66);
  const contributionRate2 = progressiveRate(person2, isRetired[1], input.contributionRate, input.contributionProgressivity, 1800, 0.66);
  const wealthTaxRate1 = progressiveRate(person1, isRetired[0], input.wealthTaxRate, input.wealthTaxProgressivity, 3000, 0.66);
  // ⚠ KONTROLLI : [C59] utilise 0,75 alors que C56–C58 utilisent 0,66. Correction : 0,66 (retiredCoefficientPerson2).
  const wealthTaxRate2 = progressiveRate(person2, isRetired[1], input.wealthTaxRate, input.wealthTaxProgressivity, 3000,
                                         fixes.retiredCoefficientPerson2 ? 0.66 : 0.75);

  const contribution1 = isRetired[0]
    ? contributionRate1 * (0.66 * person1.grossIncome + person1.wealthIncomeGross)          // [F56]
    : contributionRate1 * (person1.grossIncome + person1.wealthIncomeGross);
  // ⚠ KONTROLLI : [F57] écrit C57*0,66*(brut+patrimoine) : le 0,66 s’applique aussi aux revenus du patrimoine,
  //   contrairement à F56. Correction : C57*(0,66*brut+patrimoine) (retiredContributionPerson2).
  let contribution2;
  if (!isRetired[1]) contribution2 = contributionRate2 * (person2.grossIncome + person2.wealthIncomeGross);
  else if (fixes.retiredContributionPerson2) contribution2 = contributionRate2 * (0.66 * person2.grossIncome + person2.wealthIncomeGross);
  else contribution2 = contributionRate2 * 0.66 * (person2.grossIncome + person2.wealthIncomeGross);

  const wealthTaxMonthly1 = wealthTaxRate1 * person1.netWealth / 12;                       // [F58]
  const wealthTaxMonthly2 = wealthTaxRate2 * person2.netWealth / 12;                       // [F59]
  const totalContribution = contribution1 + contribution2 + wealthTaxMonthly1 + wealthTaxMonthly2;   // [F60]

  // Taux de prélèvement [F61] = prélèvement total / revenus nets d’activité et du patrimoine [F53] (corrigé par l’auteur).
  const withdrawalRate = netIncomeAfterFixedContribution ? totalContribution / netIncomeAfterFixedContribution : null;

  const incomeWithBasicIncome = householdBasicIncome + netIncomeAfterFixedContribution - totalContribution;  // [F62]
  const gain = incomeWithBasicIncome - currentIncome;                                       // [O31]
  return {
    currentIncome, incomeWithBasicIncome, gain,
    gainRatio: currentIncome ? gain / currentIncome : null,
    householdBasicIncome, totalContribution, withdrawalRate
  };
}


/* ============================================================================
   3. CALCUL « POUR LA SOCIÉTÉ » (feuilles « 3 COMPOSITION » et « 4 BILAN » du premier classeur)
   Données INSEE codées en dur dans l’Excel : reprises telles quelles (11 groupes : 9 déciles + 99,9 % + 0,1 %).
   ============================================================================ */
const SOCIETY_DATA = {
  equivalenceScale: [1.1, 1.15, 1.21, 1.34, 1.46, 1.59, 1.69, 1.82, 1.9, 2, 2],                      // [BILAN!E7:O7] unités de consommation
  householdSharePercent: [10, 10, 10, 10, 10, 10, 10, 10, 10, 9.9, 0.1],                              // [BILAN!E8:O8] part des ménages
  netWealth: [4500, 14000, 35000, 110000, 180000, 250000, 340000, 490000, 750000, 2000000, 10000000],  // [BILAN!E9:O9]
  grossIncome: [138, 1075, 1675, 2435, 3140, 4000, 4900, 6150, 8112, 14500, 105000],                   // [BILAN!E13:O13]
  socialBenefits: [700, 500, 400, 300, 250, 200, 120, 80, 65, 40, 0],                                  // [BILAN!E17:O17]
  incomeTax: [0, 0, 0, 20, 30, 50, 100, 200, 550, 2000, 25000],                                        // [BILAN!E18:O18]
  basicIncomePerUnit: [1145, 1181, 1191, 1225, 1268, 1305, 1310, 1320, 1341, 1350, 1350],                 // [COMPOSITION!K35:K45] RUE par UC et par décile : valeurs FIXES de l’Excel corrigé
  typicalHouseholdWeight: [3, 19, 14, 25, 10, 10, 5, 9, 4, 1],                                         // [COMPOSITION!C17:C27] poids des foyers-types
  typicalHouseholdUnits: [1, 1, 1, 1.5, 1.8, 2.1, 2.6, 1.8, 1.5, 2.1],                                 // [COMPOSITION!I17:I27]
  referenceBasicIncomePerUnit: 1287.049399198932,                                                      // [COMPOSITION!K29] avec le RUE 300/500/1100 € (référence de ces valeurs fixes)
  householdCount: 31e6                                                                                 // 31 millions de ménages, en dur
};

/**
 * Calcule, pour 11 groupes de niveau de vie, le revenu avec et sans RUE, puis le solde moyen par ménage.
 *
 * @param {object} input  basicIncomeByAge, contributionRate, wealthTaxRate, contributionProgressivity,
 *                        wealthTaxProgressivity, familyContribution (€ / an), vatContribution (€ / an)
 * @param {object} fixes  interrupteurs de SUGGESTED_FIXES
 * @returns {object} *ByDecile (tableaux de 11 valeurs), moyennes, monthlyBalance, richestContribution…
 */
function calculateSocietyBalance(input, fixes = SUGGESTED_FIXES) {
  const data = SOCIETY_DATA;
  const ages = input.basicIncomeByAge;
  const weightedAverage = values => values.reduce((total, value, i) => total + value * data.householdSharePercent[i], 0) / 100;

  // RUE par foyer-type [COMPOSITION!D17:D27].
  // ⚠ KONTROLLI : « couple sans enfant » [D20] = C11+C12 (25+ et 65+) alors que les autres couples utilisent 2*C11.
  //   Sans effet tant que « 25 ans et plus » = « 65 ans et plus » (1100 € / 1100 €) ; correction : 2*C11.
  const typicalHouseholdBasicIncome = [
    ages[2], ages[3], ages[4], ages[3] + ages[4],
    2 * ages[3] + ages[0], 2 * ages[3] + 2 * ages[0], 2 * ages[3] + 2 * ages[0] + ages[1],
    ages[3] + ages[0] + ages[1], 2 * ages[3], 2 * ages[3] + 2 * ages[0]
  ];
  const sumProduct = (values, weights) => values.reduce((total, value, i) => total + value * weights[i], 0);
  const basicIncomePerUnit = sumProduct(typicalHouseholdBasicIncome, data.typicalHouseholdWeight)
                           / sumProduct(data.typicalHouseholdUnits, data.typicalHouseholdWeight);            // [K29]
  // ⚠ KONTROLLI : dans l’Excel corrigé, [COMPOSITION!K35:K45] sont des valeurs FIXES (avant : revenu par UC × K29/L29).
  //   Le RUE par décile ne réagit donc plus aux montants du RUE saisis. Correction : mettre ces valeurs à l’échelle de
  //   K29 / K29 de référence (decileBasicIncomeFollowsRates) — identique à l’Excel tant que le RUE vaut 300/500/1100 €.
  const scaleFactor = fixes.decileBasicIncomeFollowsRates ? basicIncomePerUnit / data.referenceBasicIncomePerUnit : 1;
  const basicIncomeByDecile = data.basicIncomePerUnit.map((perUnit, i) => perUnit * scaleFactor * data.equivalenceScale[i]);   // [BILAN!E27:O27]

  const currentIncomeByDecile = [], netAfterFixedContribution = [], contributionByDecile = [], wealthTaxByDecile = [];
  const newIncomeByDecile = [], gainByDecile = [], gainRatioByDecile = [];
  for (let i = 0; i < 11; i++) {
    const gross = data.grossIncome[i], wealth = data.netWealth[i];
    currentIncomeByDecile[i] = gross - 0.12 * gross - 0.097 * gross + data.socialBenefits[i] - data.incomeTax[i];  // [E21] cot. 12 % + CSG 9,7 %
    netAfterFixedContribution[i] = gross - 0.2 * gross;                                                          // [E26] cot. 20 % [C25]
    wealthTaxByDecile[i] = i <= 4 && input.wealthTaxProgressivity
      ? wealth * input.wealthTaxRate * gross / (3000 * 12)
      : input.wealthTaxRate * wealth / 12;                                                                       // [E29:O29]

    // ⚠ KONTROLLI : [F28, G28] testent PRESENTATION!D19 et E19, cellules VIDES → la progressivité n’agit que sur
    //   le 1er décile. Correction : appliquer C19 aussi aux déciles 2 et 3 (progressivityDecilesTwoAndThree).
    // [E28] : la référence parasite « +E18 » a été supprimée par l’auteur.
    const isProgressive = i === 0 || (fixes.progressivityDecilesTwoAndThree && i < 3) ? input.contributionProgressivity : false;
    if (i <= 2) {
      contributionByDecile[i] = isProgressive ? gross * input.contributionRate * gross / 1800 : input.contributionRate * gross;
    } else if (i <= 6) {
      contributionByDecile[i] = input.contributionRate * gross;                                                  // [H28:K28]
    } else {
      const cap = 0.55 * (netAfterFixedContribution[i] + basicIncomeByDecile[i]);                               // [L28:O28] plafond 55 %
      contributionByDecile[i] = input.contributionRate * gross + input.wealthTaxRate * wealth / 12 > cap
        ? cap - wealthTaxByDecile[i]
        : input.contributionRate * gross;
    }
    newIncomeByDecile[i] = netAfterFixedContribution[i] - contributionByDecile[i] - wealthTaxByDecile[i] + basicIncomeByDecile[i];  // [E32]
    gainByDecile[i] = newIncomeByDecile[i] - currentIncomeByDecile[i];                                          // [E33]
    gainRatioByDecile[i] = gainByDecile[i] / currentIncomeByDecile[i];                                          // [E34]
  }

  const averageBasicIncome = weightedAverage(basicIncomeByDecile);
  const averageContribution = weightedAverage(contributionByDecile);
  const averageWealthTax = weightedAverage(wealthTaxByDecile);
  // ⚠ KONTROLLI : signe de [D31] = prélèvement − RUE, à l’inverse de [E31:O31] = RUE − prélèvement. Reproduit tel quel ; D38 en dépend.
  const averageBalanceBeforeOtherFunding = averageContribution + averageWealthTax - averageBasicIncome;        // [D31]
  const monthlyBalance = averageBalanceBeforeOtherFunding
    + input.familyContribution / (12 * data.householdCount)                                                    // [D35]
    + input.vatContribution / (12 * data.householdCount);                                                      // [D36]
  const richestContribution = -(gainByDecile[9] * 12 * 0.099 * data.householdCount
                              + gainByDecile[10] * 12 * 0.001 * data.householdCount);                          // [PRESENTATION!C33]
  return {
    basicIncomeByDecile, currentIncomeByDecile, newIncomeByDecile, gainByDecile, gainRatioByDecile,
    averageBasicIncome,
    averageCurrentIncome: weightedAverage(currentIncomeByDecile),
    averageNewIncome: weightedAverage(netAfterFixedContribution) - averageContribution - averageWealthTax + averageBasicIncome,
    monthlyBalance, balanceRatio: monthlyBalance / averageBasicIncome,
    richestContribution, richestContributionRatio: richestContribution / (averageBasicIncome * 12 * data.householdCount)
  };
}


/* ============================================================================
   4. ÉTAT DE L’APPLICATION ET CAS TYPES
   ============================================================================ */

/** Revenu net vide ("") = formule d’origine : brut × 0,79, ou × 0,9 pour un·e retraité·e. */
function firstPerson(overrides = {}) {
  return { situation: "adult", grossIncome: 0, netIncome: "", netWealth: 0, wealthIncomeGross: 0, wealthIncomeNet: 0,
           socialBenefits: 0, familyBenefits: 0, incomeTax: 0, wealthTax: 0, healthInsurance: 0, ...overrides };
}
/** Personne 2 : situation "" = personne absente du foyer. */
function secondPerson(overrides = {}) {
  return firstPerson({ situation: "", ...overrides });
}

const NO_CHILDREN = [0, 0, 0];

/** Cas types : feuilles « 5 SMIC », « 6 MAMAN SOLO », « 7 RETRAITE » du premier classeur, exprimées comme situations de foyer. */
const PRESET_HOUSEHOLDS = [
  { group: "minimumWage", label: { fr: "Au RSA, sans emploi", et: "RSA-l, töötu" },
    person1: firstPerson({ socialBenefits: 863 }), person2: secondPerson(),
    children: NO_CHILDREN, povertyThreshold: 1280 },
  { group: "minimumWage", label: { fr: "Mi-temps (901 € brut)", et: "Osaline (901 € bruto)" },
    person1: firstPerson({ grossIncome: 901, socialBenefits: 470 }), person2: secondPerson(),
    children: NO_CHILDREN, povertyThreshold: 1280 },
  { group: "minimumWage", label: { fr: "4 jours – 28 h (1 442 € brut)", et: "4 päeva – 28 h (1442 € bruto)" },
    person1: firstPerson({ grossIncome: 1442, socialBenefits: 290 }), person2: secondPerson(),
    children: NO_CHILDREN, povertyThreshold: 1280 },
  { group: "minimumWage", label: { fr: "Plein temps – 35 h (1 802 € brut)", et: "Täistööaeg – 35 h (1802 € bruto)" },
    person1: firstPerson({ grossIncome: 1802, socialBenefits: 250 }), person2: secondPerson(),
    children: NO_CHILDREN, povertyThreshold: 1280 },
  { group: "singleMother", label: { fr: "Sans emploi", et: "Töötu" },
    person1: firstPerson({ socialBenefits: 2250 }), person2: secondPerson(),
    children: [1, 2, 0], povertyThreshold: 2950 },
  { group: "singleMother", label: { fr: "Mi-temps (901 € brut)", et: "Osaline (901 € bruto)" },
    person1: firstPerson({ grossIncome: 901, socialBenefits: 1916 }), person2: secondPerson(),
    children: [1, 2, 0], povertyThreshold: 2950 },
  { group: "singleMother", label: { fr: "Plein temps (1 802 € brut)", et: "Täistööaeg (1802 € bruto)" },
    person1: firstPerson({ grossIncome: 1802, socialBenefits: 1680 }), person2: secondPerson(),
    children: [1, 2, 0], povertyThreshold: 2950 },
  { group: "retired", label: { fr: "Seul·e, sans pension (ASPA)", et: "Üksi, pensioni ei ole (ASPA)" },
    person1: firstPerson({ situation: "retired", socialBenefits: 1034, healthInsurance: 125 }), person2: secondPerson(),
    children: NO_CHILDREN, povertyThreshold: 1280 },
  { group: "retired", label: { fr: "Seul·e, pension 1 660 € + patrimoine 150 000 €", et: "Üksi, pension 1660 € + vara 150 000 €" },
    person1: firstPerson({ situation: "retired", grossIncome: 1660, netWealth: 150000, healthInsurance: 125 }), person2: secondPerson(),
    children: NO_CHILDREN, povertyThreshold: 1280 },
  { group: "retired", label: { fr: "Couple : une pension de 1 100 €, l’autre sans", et: "Paar: üks pension 1100 €, teisel puudub" },
    person1: firstPerson({ situation: "retired", grossIncome: 1100, socialBenefits: 615, healthInsurance: 125 }), person2: secondPerson({ situation: "retired" }),
    children: NO_CHILDREN, povertyThreshold: 1920 },
  { group: "retired", label: { fr: "Couple : deux pensions de 1 100 € (2 SMIC)", et: "Paar: kaks pensioni 1100 € (2 alampalka)" },
    person1: firstPerson({ situation: "retired", grossIncome: 1100, healthInsurance: 125 }), person2: secondPerson({ situation: "retired", grossIncome: 1100, healthInsurance: 125 }),
    children: NO_CHILDREN, povertyThreshold: 1920 },
  { group: "retired", label: { fr: "Couple : 2 × 2 000 € + patrimoine 150 000 €", et: "Paar: 2 × 2000 € + vara 150 000 €" },
    person1: firstPerson({ situation: "retired", grossIncome: 2000, netWealth: 150000, incomeTax: 100, healthInsurance: 125 }), person2: secondPerson({ situation: "retired", grossIncome: 2000, healthInsurance: 125 }),
    children: NO_CHILDREN, povertyThreshold: 1920 }
];

const state = {
  language: "fr",
  activeTab: "household",                 // "household" (« Et vous ? ») | "society" (« Pour la société »)
  presetIndex: "",                        // index dans PRESET_HOUSEHOLDS ("" = situation personnalisée)
  povertyThreshold: 0,                    // seuil de pauvreté du cas type choisi (0 = aucun)
  basicIncomeByAge: [330, 550, 1100, 1100, 1100],
  contributionRatePercent: 28,
  contributionProgressivity: false,
  wealthTaxRatePercent: 1.5,
  wealthTaxProgressivity: false,
  children: [0, 0, 0],
  person1: firstPerson({ grossIncome: 1802, socialBenefits: 250 }),
  person2: secondPerson(),
  familyContributionBillions: 60,         // cotisations A.F., milliards € / an
  vatBillions: 50                         // TVA − réduction de cotisations, milliards € / an
};

const PERSON_FIELDS = ["grossIncome", "netIncome", "netWealth", "wealthIncomeGross", "wealthIncomeNet",
                       "socialBenefits", "familyBenefits", "incomeTax", "wealthTax", "healthInsurance"];
const DECILE_LABELS = ["0–10 %", "10–20 %", "20–30 %", "30–40 %", "40–50 %", "50–60 %", "60–70 %", "70–80 %", "80–90 %", "90–99,9 %", "99,9–100 %"];


/* ============================================================================
   5. OUTILS D’AFFICHAGE
   ============================================================================ */
const queryOne = selector => document.querySelector(selector);

/** Texte traduit dans la langue courante ; « [clé] » si la traduction manque (aide au débogage). */
function translate(key) {
  const text = TRANSLATIONS[state.language][key];
  return text === undefined ? `[${key}]` : text;
}

/** Nombre formaté selon la langue, avec `decimals` décimales ; « – » si ce n’est pas un nombre. */
function formatNumber(value, decimals = 0) {
  return isFinite(value)
    ? Number(value).toLocaleString(state.language === "fr" ? "fr-FR" : "et-EE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : "–";
}

/** Pourcentage signé, ex. « +21,7 % », à partir d’un ratio (0,217). */
function formatSignedPercent(ratio) {
  return (ratio >= 0 ? "+" : "") + formatNumber(ratio * 100, 1) + " %";
}

/** Convertit les champs saisis (texte) d’une personne en nombres ; netIncome vide → null (= formule automatique d’origine). */
function toNumericPerson(person) {
  const numeric = Object.fromEntries(Object.entries(person).map(([key, value]) =>
    [key, key === "situation" ? value : Number(value) || 0]));
  numeric.netIncome = person.netIncome === "" ? null : Number(person.netIncome) || 0;
  return numeric;
}

/** Paramètres communs (RUE, taux, progressivité) au format attendu par les fonctions de calcul. */
function getSharedInput() {
  return {
    basicIncomeByAge: state.basicIncomeByAge.map(Number),
    contributionRate: state.contributionRatePercent / 100,
    wealthTaxRate: state.wealthTaxRatePercent / 100,
    contributionProgressivity: state.contributionProgressivity,
    wealthTaxProgressivity: state.wealthTaxProgressivity
  };
}


/* ============================================================================
   6. BLOCS HTML (chaînes de caractères insérées dans la page)
   ============================================================================ */
function numberInputHtml(fieldPath, value, step = 1, placeholder = "") {
  return `<input type="number" step="${step}" data-field="${fieldPath}" value="${value}" placeholder="${placeholder}">`;
}
function labeledFieldHtml(labelKey, controlHtml) {
  return `<label>${translate(labelKey)}${controlHtml}</label>`;
}
function checkboxRowHtml(attribute, name, isChecked, labelKey, extraStyle = "") {
  return `<label class="checkbox-row"${extraStyle}><input type="checkbox" ${attribute}="${name}" ${isChecked ? "checked" : ""}>${translate(labelKey)}</label>`;
}

/** Liste déroulante des cas types, regroupés par catégorie. */
function presetSelectHtml() {
  const optionsOfGroup = group => PRESET_HOUSEHOLDS.map((preset, i) => preset.group === group
    ? `<option value="${i}" ${state.presetIndex === String(i) ? "selected" : ""}>${preset.label[state.language]}</option>` : "").join("");
  const groups = [["minimumWage", "presetGroupMinimumWage"], ["singleMother", "presetGroupSingleMother"], ["retired", "presetGroupRetired"]];
  return `<div class="card household-only"><h2>${translate("presetTitle")}</h2><select data-preset><option value="">${translate("presetCustom")}</option>`
    + groups.map(([group, labelKey]) => `<optgroup label="${translate(labelKey)}">${optionsOfGroup(group)}</optgroup>`).join("")
    + `</select></div>`;
}

function basicIncomeCardHtml() {
  const fields = [0, 1, 2, 3, 4].map(i => labeledFieldHtml("ageGroup" + i, numberInputHtml("basicIncomeByAge." + i, state.basicIncomeByAge[i]))).join("");
  return `<div class="card"><h2>${translate("basicIncomeTitle")}</h2><div class="field-grid">${fields}</div></div>`;
}

function ratesCardHtml() {
  return `<div class="card"><h2>${translate("ratesTitle")}</h2><div class="field-grid">`
    + labeledFieldHtml("contributionRate", numberInputHtml("contributionRatePercent", state.contributionRatePercent, 0.1))
    + labeledFieldHtml("netWealthTax", numberInputHtml("wealthTaxRatePercent", state.wealthTaxRatePercent, 0.1))
    + checkboxRowHtml("data-field", "contributionProgressivity", state.contributionProgressivity, "progressivityContribution")
    + checkboxRowHtml("data-field", "wealthTaxProgressivity", state.wealthTaxProgressivity, "progressivityWealthTax")
    + `</div></div>`;
}

function childrenCardHtml() {
  const fields = [0, 1, 2].map(i => labeledFieldHtml("childrenAge" + i, numberInputHtml("children." + i, state.children[i]))).join("");
  return `<div class="card household-only"><h2>${translate("householdTitle")}</h2><div class="field-grid">${fields}</div></div>`;
}

/** Carte de saisie d’une personne ("person1" ou "person2") : situation + revenus, patrimoine, aides, impôts. */
function personCardHtml(personKey) {
  const person = state[personKey];
  const situations = ["youngAdult", "adult", "retired"].concat(personKey === "person2" ? [""] : []);
  const options = situations.map(situation =>
    `<option value="${situation}" ${person.situation === situation ? "selected" : ""}>${translate(situation ? "situation_" + situation : "situation_none")}</option>`).join("");
  const fields = PERSON_FIELDS.map(field => labeledFieldHtml(field, numberInputHtml(
    `${personKey}.${field}`, person[field], 1, field === "netIncome" ? translate("autoNetIncome") : ""))).join("");
  return `<div class="card household-only"><h2>${translate(personKey)}</h2><div class="field-grid">`
    + labeledFieldHtml("situation", `<select data-field="${personKey}.situation">${options}</select>`) + fields + `</div></div>`;
}

/** Cases à cocher des « points à vérifier » du classeur d’origine (corrections suggérées). */
function fixesCardHtml() {
  return `<div class="card household-only"><details><summary>${translate("fixesTitle")}</summary><p><small>${translate("fixesNote")}</small></p>`
    + ["retiredCoefficientPerson2", "retiredContributionPerson2"]
        .map(fix => checkboxRowHtml("data-fix", fix, SUGGESTED_FIXES[fix], fix)).join("")
    + `</details></div>`;
}

/** Saisies propres à l’onglet « Pour la société » : financement hors cotisations et correction des déciles 2-3. */
function societyInputsHtml() {
  return `<div class="card society-only"><h2>${translate("societyInputsTitle")}</h2><div class="field-grid">`
    + labeledFieldHtml("familyContributionLabel", numberInputHtml("familyContributionBillions", state.familyContributionBillions))
    + labeledFieldHtml("vatLabel", numberInputHtml("vatBillions", state.vatBillions))
    + checkboxRowHtml("data-fix", "progressivityDecilesTwoAndThree", SUGGESTED_FIXES.progressivityDecilesTwoAndThree,
                      "progressivityDecilesTwoAndThree", ' style="grid-column:1/-1"')
    + checkboxRowHtml("data-fix", "decileBasicIncomeFollowsRates", SUGGESTED_FIXES.decileBasicIncomeFollowsRates,
                      "decileBasicIncomeFollowsRates", ' style="grid-column:1/-1"')
    + `</div><p><small>${translate("societyNote")}</small></p></div>`;
}


/* ============================================================================
   7. RENDU
   ============================================================================ */

/** Redessine toute la page (formulaire, résultats, onglets, charte) ; à appeler après un changement de langue ou de cas type. */
function renderPage() {
  document.documentElement.lang = state.language;
  queryOne("#page-title").textContent = translate("pageTitle");
  document.querySelectorAll(".language-switch button").forEach(button =>
    button.classList.toggle("is-active", button.dataset.language === state.language));
  queryOne("#input-panel").innerHTML = presetSelectHtml() + basicIncomeCardHtml() + ratesCardHtml() + childrenCardHtml()
    + `<h2 class="household-only section-title">${translate("incomeTitle")}</h2>` + personCardHtml("person1") + personCardHtml("person2")
    + fixesCardHtml() + societyInputsHtml();
  renderResults();
  renderTabs();
  renderCharter();
}

/** Redessine les deux panneaux de résultats (appelé à chaque saisie, sans toucher au formulaire). */
function renderResults() {
  renderHouseholdResult();
  renderSocietyResult();
}

/** Résultat « Et vous ? » : revenu actuel vs avec RUE, gain, RUE du foyer, contribution, taux, seuil de pauvreté. */
function renderHouseholdResult() {
  const result = calculateHouseholdBudget({
    ...getSharedInput(),
    children: state.children.map(Number),
    person1: toNumericPerson(state.person1),
    person2: toNumericPerson(state.person2)
  });
  const maxIncome = Math.max(result.currentIncome, result.incomeWithBasicIncome, 1);
  const gainClass = result.gain >= 0 ? "positive" : "negative";
  const povertyRow = state.povertyThreshold
    ? `<div class="result-row"><span>${translate("povertyThreshold")} : ${formatNumber(state.povertyThreshold, 0)} €</span>`
      + `<b class="${result.incomeWithBasicIncome >= state.povertyThreshold ? "positive" : "negative"}">${translate(result.incomeWithBasicIncome >= state.povertyThreshold ? "aboveThreshold" : "belowThreshold")}</b></div>`
    : "";
  queryOne("#household-result").innerHTML = `<h2>${translate("householdResultTitle")}</h2>
    <div>${translate("currentIncome")}<div class="income-bar is-current" style="width:${Math.max(0, result.currentIncome / maxIncome * 100)}%"></div><b>${formatNumber(result.currentIncome, 2)} €</b> ${translate("perMonth")}</div>
    <div>${translate("incomeWithBasicIncome")}<div class="income-bar" style="width:${Math.max(0, result.incomeWithBasicIncome / maxIncome * 100)}%"></div><b>${formatNumber(result.incomeWithBasicIncome, 2)} €</b> ${translate("perMonth")}</div>
    <div class="headline-gain ${gainClass}">${result.gain >= 0 ? "+" : ""}${formatNumber(result.gain, 2)} € <small>${result.gainRatio === null ? "" : "(" + formatSignedPercent(result.gainRatio) + ")"}</small></div>
    <div class="result-row"><span>${translate("householdBasicIncome")}</span><span>${formatNumber(result.householdBasicIncome, 2)} €</span></div>
    <div class="result-row"><span>${translate("yourContribution")}</span><span>${formatNumber(result.totalContribution, 2)} €</span></div>
    <div class="result-row"><span>${translate("withdrawalRate")}</span><span>${result.withdrawalRate === null ? "–" : formatNumber(result.withdrawalRate * 100, 1) + " %"}</span></div>` + povertyRow;
}

/** Résultat « Pour la société » : revenu moyen, solde mensuel et annuel, contribution des plus riches, gain par décile. */
function renderSocietyResult() {
  const result = calculateSocietyBalance({
    ...getSharedInput(),
    familyContribution: state.familyContributionBillions * 1e9,
    vatContribution: state.vatBillions * 1e9
  });
  const balanceClass = result.monthlyBalance >= 0 ? "positive" : "negative";
  const maxAbsGain = Math.max(...result.gainRatioByDecile.map(Math.abs), 0.01);
  const decileRows = result.gainRatioByDecile.map((gainRatio, i) => `<div class="decile-line"><span>${DECILE_LABELS[i]}</span><span>${formatNumber(result.currentIncomeByDecile[i], 0)} → ${formatNumber(result.newIncomeByDecile[i], 0)} €</span><b class="${gainRatio >= 0 ? "positive" : "negative"}">${formatSignedPercent(gainRatio)}</b></div>
    <div class="decile-bar"><i style="width:${Math.max(1, Math.abs(gainRatio) / maxAbsGain * 100)}%;background:var(${gainRatio >= 0 ? "--color-positive" : "--color-negative"})"></i></div>`).join("");
  queryOne("#society-result").innerHTML = `<h2>${translate("societyResultTitle")}</h2>
    <div class="result-row"><span>${translate("averageHouseholdNet")}</span><span>${formatNumber(result.averageCurrentIncome, 0)} → <b>${formatNumber(result.averageNewIncome, 0)} €</b></span></div>
    <div class="result-row"><span>${translate("monthlyBalance")}</span><b class="${balanceClass}">${formatNumber(result.monthlyBalance, 2)} €</b></div>
    <div class="result-row"><span>${translate("balancePercent")}</span><span>${formatSignedPercent(result.balanceRatio)}</span></div>
    <div class="result-row"><span>${translate("annualBalance")}</span><b class="${balanceClass}">${formatNumber(result.monthlyBalance * 12 * SOCIETY_DATA.householdCount / 1e9, 2)} Md€</b></div>
    <div class="result-row"><span>${translate("richestContribution")}</span><span>${formatNumber(result.richestContribution / 1e9, 1)} Md€ (${formatNumber(result.richestContributionRatio * 100, 1)} % AUE)</span></div>
    <div class="context-note"><b>${translate("stateBudgetTitle")}</b><div class="decile-line"><span>${translate("stateBudgetRevenue")}</span><span>100 Md€</span></div><div class="decile-line"><span>${translate("stateBudgetSpending")}</span><span>100 Md€</span></div><small>${translate("stateBudgetNote")}</small></div>
    <h2 class="section-title">${translate("decileTitle")}</h2>` + decileRows;
}

/** Barre d’onglets « Et vous ? » / « Pour la société » ; l’onglet actif est aussi inscrit sur <body data-tab>. */
function renderTabs() {
  document.body.dataset.tab = state.activeTab;
  queryOne("#tab-bar").innerHTML = [["household", "tabHousehold"], ["society", "tabSociety"]].map(([tab, labelKey]) =>
    `<button data-tab="${tab}" class="${state.activeTab === tab ? "is-active" : ""}">${translate(labelKey)}</button>`).join("");
}

/** Charte du MFRB (pied de page, 7 principes). */
function renderCharter() {
  queryOne("#charter").innerHTML = `<h2>${translate("charterTitle")}</h2><ol>`
    + [1, 2, 3, 4, 5, 6, 7].map(i => `<li>${translate("charterPrinciple" + i)}</li>`).join("") + "</ol>";
}


/* ============================================================================
   8. ÉVÉNEMENTS ET DÉMARRAGE
   ============================================================================ */

/** Oublie le cas type choisi (dès que l’on modifie le foyer à la main). */
function resetPreset() {
  state.presetIndex = "";
  state.povertyThreshold = 0;
  const select = queryOne("[data-preset]");
  if (select) select.value = "";
}

/** Charge un cas type dans le formulaire ; "" = situation personnalisée (ne change rien). */
function loadPreset(index) {
  if (index === "") { state.presetIndex = ""; state.povertyThreshold = 0; return; }
  const preset = PRESET_HOUSEHOLDS[Number(index)];
  state.presetIndex = index;
  state.person1 = { ...preset.person1 };
  state.person2 = { ...preset.person2 };
  state.children = [...preset.children];
  state.povertyThreshold = preset.povertyThreshold;
  renderPage();
}

/** Saisie dans un champ : le chemin « clé » ou « clé.indice » (data-field) désigne la valeur à modifier dans `state`. */
function handleFieldInput(event) {
  const fieldPath = event.target.dataset.field;
  if (!fieldPath) return;
  if (/^(person1|person2|children)/.test(fieldPath)) resetPreset();
  const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
  const [key, subKey] = fieldPath.split(".");
  if (subKey === undefined) state[key] = value; else state[key][subKey] = value;
  renderResults();
}

/** Liste des cas types ou case « point à vérifier » cochée / décochée. */
function handleControlChange(event) {
  if (event.target.dataset.preset !== undefined) loadPreset(event.target.value);
  if (event.target.dataset.fix) {
    SUGGESTED_FIXES[event.target.dataset.fix] = event.target.checked;
    renderResults();
  }
}

/** Clic sur le sélecteur de langue (FR / ET). */
function handleLanguageClick(event) {
  if (event.target.dataset.language) { state.language = event.target.dataset.language; renderPage(); }
}

/** Clic sur un onglet. */
function handleTabClick(event) {
  if (event.target.dataset.tab) { state.activeTab = event.target.dataset.tab; renderTabs(); }
}

function bindEvents() {
  document.addEventListener("input", handleFieldInput);
  document.addEventListener("change", handleControlChange);
  document.addEventListener("click", handleTabClick);
  queryOne(".language-switch").addEventListener("click", handleLanguageClick);
}

function init() {
  bindEvents();
  renderPage();
}

init();
