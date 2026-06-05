import type { User, Doc, ActivityItem, StorageStatus, ConservationInfo, RoleInfo } from "./types";

export const CONSERVATION: Record<string, ConservationInfo> = {
  "Courante":      { badge: "green",  desc: "Usage quotidien" },
  "Intermédiaire": { badge: "gold",   desc: "Historique récent stocké" },
  "Définitive":    { badge: "slate",  desc: "Valeur historique permanente" },
};

export const FORMATS: string[] = ["Registre relié", "Feuille volante", "Plan grand format"];

const ALL_SERIES = ["État Civil", "Urbanisme", "Courriers", "Comptabilité"];
function rights(arr: string[]): Record<string, boolean> {
  const o: Record<string, boolean> = {};
  ALL_SERIES.forEach(t => o[t] = arr.includes(t));
  return o;
}

export const USERS: User[] = [
  { id: "u1", nom: "DONOU", prenom: "Archille", name: "Archille DONOU", telephone: "01 23 45 67 01", adresse: "Dangbo centre", service: "Secrétariat Général", direction: "Cabinet", statut_matrimoniale: "Marié(e)", carte: "C-000001", initials: "AD", role: "admin", color: "#0c6e4a", status: "actif",   last: "il y a 4 min",   rights: rights(ALL_SERIES) },
  { id: "u2", nom: "GONZALLO", prenom: "Raissa", name: "Raissa GONZALLO", telephone: "01 23 45 67 02", adresse: "Dangbo centre", service: "Secrétariat Général", direction: "Cabinet", statut_matrimoniale: "Marié(e)", carte: "C-000002", initials: "RG", role: "chef", color: "#0c6e4a", status: "actif",   last: "il y a 5 min",  rights: rights(ALL_SERIES) },
  { id: "u3", nom: "Boko", prenom: "Louis", name: "Louis Boko", telephone: "01 23 45 67 03", adresse: "Kessounou", service: "Urbanisme & Foncier", direction: "Direction des Services Techniques", statut_matrimoniale: "Marié(e)", carte: "C-000003", initials: "LB", role: "consultant", color: "#6a4d8c", status: "actif",   last: "il y a 1 h",     rights: rights(["Urbanisme", "Courriers"]) },
  { id: "u4", nom: "KPONOU", prenom: "Chancelle", name: "Chancelle KPONOU", telephone: "01 23 45 67 04", adresse: "Dangbo", service: "État Civil", direction: "Direction des Services Techniques", statut_matrimoniale: "Célibataire", carte: "C-000004", initials: "CK", role: "saisisseur", color: "#3c5d76", status: "actif",   last: "il y a 1 h",     rights: rights(["État Civil", "Courriers"]) },
  { id: "u5", nom: "Zinsou", prenom: "Bénédicta", name: "Bénédicta Zinsou", telephone: "01 23 45 67 05", adresse: "Dèkin", service: "Affaires Sociales", direction: "Direction des Affaires Sociales", statut_matrimoniale: "Divorcé(e)", carte: "C-000005", initials: "BZ", role: "consultant", color: "#b0563f", status: "actif",   last: "hier",            rights: rights(["Courriers"]) },
  { id: "u6", nom: "Adjovi", prenom: "Gérard", name: "Gérard Adjovi", telephone: "01 23 45 67 06", adresse: "Zounguè", service: "Services Financiers", direction: "Direction des Services Financiers", statut_matrimoniale: "Marié(e)", carte: "C-000006", initials: "GA", role: "saisisseur", color: "#2f7d6b", status: "inactif", last: "il y a 9 j",     rights: rights(["Comptabilité", "Courriers"]) },
  { id: "u7", nom: "Sodjinou", prenom: "Florine", name: "Florine Sodjinou", telephone: "01 23 45 67 07", adresse: "Dangbo centre", service: "État Civil", direction: "Direction des Services Techniques", statut_matrimoniale: "Célibataire", carte: "C-000007", initials: "FS", role: "consultant", color: "#8c5a3c", status: "actif",   last: "il y a 35 min",  rights: rights(["État Civil", "Courriers"]) },
  { id: "u8", nom: "Dossou", prenom: "Innocent", name: "Innocent Dossou", telephone: "01 23 45 67 08", adresse: "Gbéko", service: "Affaires Domaniales", direction: "Cabinet", statut_matrimoniale: "Marié(e)", carte: "C-000008", initials: "ID", role: "chef",       color: "#456a8a", status: "actif",   last: "il y a 3 h",     rights: rights(ALL_SERIES) },
];

function hist(entries: [string, string, string][]): { user: string; action: string; when: string }[] {
  return entries.map(e => ({ user: e[0], action: e[1], when: e[2] }));
}

export const DOCS: Doc[] = [
  { id: "d1",  ref: "DGB-EC-2024-1187", cote: "", title: "Registre des naissances — Arrondissement de Hozin",
    type: "État Civil", sub: "Naissance", date: "2024-12-02", service: "État Civil", status: "Courante",
    format: "Registre relié", pages: 214, size: 48.2, by: "Rachelle Akplogan", at: "il y a 18 min", views: 23, restricted: false,
    kw: ["naissance", "Hozin", "2024", "registre"],
    log: hist([["Rachelle Akplogan","Indexation créée","02/12/2024 · 09:14"],["Maoudo Djossou","Validation","02/12/2024 · 11:02"],["Florine Sodjinou","Consultation","aujourd'hui · 08:40"]]) },

  { id: "d2",  ref: "DGB-URB-2024-0412", cote: "", title: "Permis de construire — Lot 38, Dèkin-Hounhouè",
    type: "Urbanisme", sub: "Permis de construire", date: "2024-11-21", service: "Urbanisme & Foncier", status: "Courante",
    format: "Plan grand format", pages: 9, size: 22.7, by: "Sylvain Hounkpè", at: "il y a 1 h", views: 11, restricted: false,
    kw: ["permis", "Dèkin", "lot 38", "construction"],
    log: hist([["Sylvain Hounkpè","Indexation créée","21/11/2024 · 14:31"],["A. Tossou-Wémé","Consultation","hier · 16:10"]]) },

  { id: "d3",  ref: "DGB-CRR-2024-2890", cote: "", title: "Courrier arrivé — Préfecture de l'Ouémé / Subvention FADeC",
    type: "Courriers", sub: "Arrivé", date: "2024-12-05", service: "Secrétariat Général", status: "Courante",
    format: "Feuille volante", pages: 3, size: 1.4, by: "Maoudo Djossou", at: "il y a 2 h", views: 7, restricted: false,
    kw: ["FADeC", "préfecture", "subvention", "courrier"],
    log: hist([["Maoudo Djossou","Indexation créée","05/12/2024 · 10:02"]]) },

  { id: "d4",  ref: "DGB-EC-1998-0034", cote: "", title: "Registre des mariages — Dangbo Centre (1998)",
    type: "État Civil", sub: "Mariage", date: "1998-06-30", service: "État Civil", status: "Définitive",
    format: "Registre relié", pages: 156, size: 61.0, by: "Rachelle Akplogan", at: "hier", views: 41, restricted: false,
    kw: ["mariage", "1998", "Dangbo", "patrimoine"],
    log: hist([["Rachelle Akplogan","Numérisation","14/10/2024 · 09:00"],["Maoudo Djossou","Validation","15/10/2024 · 10:20"],["Florine Sodjinou","Consultation","hier · 14:22"],["Maoudo Djossou","Téléchargement","hier · 15:00"]]) },

  { id: "d5",  ref: "DGB-CPT-2024-0077", cote: "", title: "Délibération budgétaire — Exercice 2025 (Projet)",
    type: "Comptabilité", sub: "Délibération budgétaire", date: "2024-11-28", service: "Services Financiers", status: "Courante",
    format: "Feuille volante", pages: 18, size: 4.1, by: "Gérard Adjovi", at: "il y a 3 j", views: 5, restricted: true,
    kw: ["budget", "2025", "délibération", "conseil"],
    log: hist([["Gérard Adjovi","Indexation créée","28/11/2024 · 16:45"],["Innocent Dossou","Consultation","il y a 2 j · 09:10"]]) },

  { id: "d6",  ref: "DGB-URB-2023-0301", cote: "", title: "Plan de lotissement — Zone Gbéko Nord",
    type: "Urbanisme", sub: "Lotissement", date: "2023-09-12", service: "Urbanisme & Foncier", status: "Intermédiaire",
    format: "Plan grand format", pages: 6, size: 84.5, by: "Sylvain Hounkpè", at: "il y a 5 j", views: 19, restricted: false,
    kw: ["lotissement", "Gbéko", "plan", "foncier"],
    log: hist([["Sylvain Hounkpè","Numérisation","12/09/2023 · 11:00"],["A. Tossou-Wémé","Consultation","il y a 5 j · 10:33"]]) },

  { id: "d7",  ref: "DGB-EC-2024-1190", cote: "", title: "Registre des décès — Arrondissement de Kessounou",
    type: "État Civil", sub: "Décès", date: "2024-12-01", service: "État Civil", status: "Courante",
    format: "Registre relié", pages: 88, size: 19.3, by: "Rachelle Akplogan", at: "il y a 6 j", views: 9, restricted: false,
    kw: ["décès", "Kessounou", "registre", "2024"],
    log: hist([["Rachelle Akplogan","Indexation créée","01/12/2024 · 08:50"],["Maoudo Djossou","Validation","01/12/2024 · 13:15"]]) },

  { id: "d8",  ref: "DGB-CRR-2024-2855", cote: "", title: "Courrier départ — Demande d'appui ANCB",
    type: "Courriers", sub: "Départ", date: "2024-11-18", service: "Secrétariat Général", status: "Courante",
    format: "Feuille volante", pages: 2, size: 0.9, by: "Maoudo Djossou", at: "il y a 7 j", views: 4, restricted: false,
    kw: ["ANCB", "courrier", "départ", "appui"],
    log: hist([["Maoudo Djossou","Indexation créée","18/11/2024 · 15:20"]]) },

  { id: "d9",  ref: "DGB-CPT-2023-0210", cote: "", title: "Mandat de paiement — Travaux voirie Zounguè",
    type: "Comptabilité", sub: "Mandat", date: "2023-12-04", service: "Services Financiers", status: "Intermédiaire",
    format: "Feuille volante", pages: 5, size: 2.2, by: "Gérard Adjovi", at: "il y a 9 j", views: 6, restricted: true,
    kw: ["mandat", "voirie", "Zounguè", "paiement"],
    log: hist([["Gérard Adjovi","Numérisation","04/12/2023 · 10:40"],["Innocent Dossou","Validation","05/12/2023 · 09:00"]]) },

  { id: "d10", ref: "DGB-URB-2024-0420", cote: "", title: "Certificat d'urbanisme — Parcelle 112, Hêtin-Houédomey",
    type: "Urbanisme", sub: "Certificat d'urbanisme", date: "2024-12-03", service: "Urbanisme & Foncier", status: "Courante",
    format: "Feuille volante", pages: 4, size: 1.8, by: "Sylvain Hounkpè", at: "il y a 10 j", views: 3, restricted: false,
    kw: ["certificat", "urbanisme", "parcelle 112"],
    log: hist([["Sylvain Hounkpè","Indexation créée","03/12/2024 · 11:55"]]) },

  { id: "d11", ref: "DGB-EC-2002-0012", cote: "", title: "Registre des naissances — Dangbo Centre (2002)",
    type: "État Civil", sub: "Naissance", date: "2002-03-15", service: "État Civil", status: "Définitive",
    format: "Registre relié", pages: 198, size: 70.4, by: "Florine Sodjinou", at: "il y a 12 j", views: 33, restricted: false,
    kw: ["naissance", "2002", "patrimoine", "registre"],
    log: hist([["Florine Sodjinou","Numérisation","20/10/2024 · 09:30"],["Maoudo Djossou","Validation","21/10/2024 · 14:00"]]) },

  { id: "d12", ref: "DGB-CRR-2024-2901", cote: "", title: "Courrier arrivé — Ministère de la Décentralisation",
    type: "Courriers", sub: "Arrivé", date: "2024-12-06", service: "Secrétariat Général", status: "Courante",
    format: "Feuille volante", pages: 6, size: 2.6, by: "Maoudo Djossou", at: "il y a 13 j", views: 8, restricted: false,
    kw: ["ministère", "décentralisation", "courrier"],
    log: hist([["Maoudo Djossou","Indexation créée","06/12/2024 · 09:05"]]) },

  { id: "d13", ref: "DGB-CPT-2024-0081", cote: "", title: "Titre de recette — Taxe de marché Dangbo",
    type: "Comptabilité", sub: "Titre de recette", date: "2024-10-30", service: "Services Financiers", status: "Courante",
    format: "Feuille volante", pages: 2, size: 0.7, by: "Gérard Adjovi", at: "il y a 15 j", views: 2, restricted: true,
    kw: ["recette", "taxe", "marché"],
    log: hist([["Gérard Adjovi","Indexation créée","30/10/2024 · 16:00"]]) },

  { id: "d14", ref: "DGB-URB-2022-0188", cote: "", title: "Plan de lotissement — Extension Dangbo Sud",
    type: "Urbanisme", sub: "Lotissement", date: "2022-05-19", service: "Urbanisme & Foncier", status: "Définitive",
    format: "Plan grand format", pages: 12, size: 110.2, by: "Sylvain Hounkpè", at: "il y a 18 j", views: 27, restricted: false,
    kw: ["lotissement", "extension", "Dangbo Sud", "plan"],
    log: hist([["Sylvain Hounkpè","Numérisation","19/05/2024 · 10:00"],["Innocent Dossou","Validation","20/05/2024 · 11:30"]]) },

  { id: "d15", ref: "DGB-EC-2024-1201", cote: "", title: "Registre des mariages — Arrondissement de Dèkin",
    type: "État Civil", sub: "Mariage", date: "2024-11-09", service: "État Civil", status: "Courante",
    format: "Registre relié", pages: 102, size: 33.6, by: "Rachelle Akplogan", at: "il y a 20 j", views: 14, restricted: false,
    kw: ["mariage", "Dèkin", "2024"],
    log: hist([["Rachelle Akplogan","Indexation créée","09/11/2024 · 10:25"],["Maoudo Djossou","Validation","10/11/2024 · 09:00"]]) },

  { id: "d16", ref: "DGB-CRR-2024-2810", cote: "", title: "Courrier départ — Convocation conseil communal",
    type: "Courriers", sub: "Départ", date: "2024-10-22", service: "Secrétariat Général", status: "Courante",
    format: "Feuille volante", pages: 1, size: 0.4, by: "Maoudo Djossou", at: "il y a 22 j", views: 12, restricted: false,
    kw: ["convocation", "conseil", "communal"],
    log: hist([["Maoudo Djossou","Indexation créée","22/10/2024 · 08:15"]]) },
];

export const ACTIVITY: ActivityItem[] = [
  { who: "Rachelle Akplogan", ini: "RA", color: "#3c5d76", action: "a indexé", target: "5 registres d'état civil", meta: "Arr. de Hozin", when: "il y a 18 min", type: "État Civil" },
  { who: "Maoudo Djossou",    ini: "MD", color: "#0c6e4a", action: "a validé la numérisation de", target: "DGB-EC-2024-1187", meta: "Registre des naissances", when: "il y a 22 min", type: "validation" },
  { who: "Sylvain Hounkpè",   ini: "SH", color: "#c98a16", action: "a téléversé", target: "Permis de construire · Lot 38", meta: "Plan grand format · 22,7 Mo", when: "il y a 1 h", type: "Urbanisme" },
  { who: "A. Tossou-Wémé",    ini: "AT", color: "#6a4d8c", action: "a consulté", target: "DGB-URB-2023-0301", meta: "Plan de lotissement Gbéko", when: "il y a 2 h", type: "consultation" },
  { who: "Gérard Adjovi",     ini: "GA", color: "#2f7d6b", action: "a enregistré un brouillon", target: "Délibération budgétaire 2025", meta: "Service financier", when: "il y a 3 j", type: "Comptabilité" },
  { who: "Bénédicta Zinsou",  ini: "BZ", color: "#b0563f", action: "accès refusé sur", target: "DGB-CPT-2024-0077", meta: "Document hors service", when: "il y a 3 j", type: "refus" },
];

export const STORAGE = {
  used: 342,
  total: 1024,
  byStatus: [
    { label: "Courante",      gb: 121, badge: "green" },
    { label: "Intermédiaire", gb: 96,  badge: "gold" },
    { label: "Définitive",    gb: 125, badge: "slate" },
  ] as StorageStatus[],
};

export const SERIE_DIST = [
  { label: "État Civil", count: 11240 },
  { label: "Urbanisme", count: 6820 },
  { label: "Courriers", count: 4510 },
  { label: "Comptabilité", count: 2249 },
];

export const SERIE_DOT: Record<string, string> = {
  "État Civil": "#0c6e4a",
  "Urbanisme": "#3c5d76",
  "Courriers": "#c98a16",
  "Comptabilité": "#6a4d8c",
};

export const ROLES: Record<string, RoleInfo> = {
  admin:      { name: "Administrateur",    short: "Super Admin",   dot: "#0c6e4a", desc: "Gère l'ensemble du système : configuration, validation, gestion des utilisateurs et suppression." },
  chef:       { name: "Archiviste Chef",  short: "Archiviste",    dot: "#0c6e4a", desc: "Accès total : configuration, validation, gestion des utilisateurs et suppression." },
  saisisseur: { name: "Agent Saisisseur", short: "Numériseur",    dot: "#c98a16", desc: "Téléverse les scans, remplit les fiches d'indexation et modifie ses propres saisies." },
  consultant: { name: "Agent Consultant", short: "Consultation",  dot: "#3c5d76", desc: "Recherche et consulte uniquement les documents autorisés pour son service." },
};

export const BADGE_DOT: Record<string, string> = {
  green: "#0c6e4a",
  gold: "#c98a16",
  slate: "#3c5d76",
  violet: "#6a4d8c",
  danger: "#c1322b",
  neutral: "#868f82",
};

export const DEMO_ACCOUNTS = [
  { email: "donou@gmail.com",              password: "Dangbo2026", role: "admin" as const,       uid: "u1" },
  { email: "raissa.gonzallo@dangbo.bj",    password: "Dangbo2026", role: "chef" as const,        uid: "u2" },
  { email: "kponou.chancelle@dangbo.bj",   password: "Dangbo2026", role: "saisisseur" as const,  uid: "u4" },
  { email: "boko.louis@dangbo.bj",         password: "Dangbo2026", role: "consultant" as const,  uid: "u3" },
];
