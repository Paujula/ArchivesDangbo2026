export type Role = "chef" | "saisisseur" | "consultant" | "admin";

export interface User {
  id: string;
  nom: string;
  prenom: string;
  name: string;
  initials: string;
  role: Role;
  service: string;
  direction: string;
  telephone: string;
  adresse: string;
  statut_matrimoniale: string;
  carte: string;
  color: string;
  status: "actif" | "inactif";
  last: string;
  email?: string;
  rights: Record<string, boolean>;
}

export interface DocLog {
  user: string;
  action: string;
  when: string;
}

export interface Doc {
  id: string;
  cote: string;
  title: string;
  type: string;
  sub: string;
  date: string;
  service: string;
  status: string;
  format: string;
  pages: number;
  size: string;
  by: string;
  at: string;
  views: number;
  restricted: boolean;
  kw: string[];
  log: DocLog[];
  serie?: string;
  sous_serie?: string;
  direction?: string;
  emplacement?: string;
  created_at?: string;
  description?: string;
  file?: string;
  original_name?: string;
  indexed_by?: string;
}

export interface ActivityItem {
  who: string;
  ini: string;
  color: string;
  action: string;
  target: string;
  meta: string;
  when: string;
  type: string;
}

export interface StorageStatus {
  label: string;
  gb: number;
  badge: string;
}

export interface ConservationInfo {
  badge: string;
  desc: string;
}

export interface RoleInfo {
  name: string;
  short: string;
  dot: string;
  desc: string;
}

export interface Toast {
  id: number;
  tone?: string;
  title: string;
  body?: string;
}

export interface HistoriqueEntry {
  id: number;
  action: string;
  type: string;
  details: string;
  date_action: string;
  user: { id: string; name: string; prenom: string; initials: string; color: string; carte: string } | null;
  document: { id: string; title: string; cote: string; original_name: string } | null;
}

export interface DashboardStats {
  total_documents: number;
  documents_this_week: number;
  total_users: number;
  active_users: number;
  total_views: number;
  recent_activity: {
    id: number;
    action: string;
    type: string;
    details: string;
    date_action: string;
    user: { name: string; initials: string; color: string } | null;
  }[];
  series_distribution: { label: string; count: number }[];
  service_distribution: { label: string; count: number }[];
  direction_distribution: { label: string; count: number }[];
}

export type Route = "dashboard" | "search" | "ingest" | "viewer" | "users" | "settings" | "documents" | "historique" | "demandes" | "my-documents" | "rapport" | "corbeille";

export interface RapportDocument {
  id: string;
  cote: string;
  title: string;
  description: string;
  date: string;
  created_at: string;
  status: string;
  service: string;
  serie: string;
  sous_serie: string;
  direction: string;
  file: string;
  original_name: string;
  creator: { id: string; name: string; prenom: string; email: string } | null;
  indexed_by: string;
}

export interface DemandeEntry {
  id: number;
  objet: string;
  type: string;
  statut: string;
  date_demande: string;
  document: { id: string; title: string; cote: string; keywords?: string[]; description?: string; original_name?: string; file?: string } | null;
  utilisateur: { id: string; name: string; prenom: string } | null;
  traite_par: { id: string; name: string; prenom: string } | null;
}

export interface SerieItem {
  id: string;
  nom_serie: string;
  sous_series: { id: string; libelle_sous_serie: string }[];
}

export interface SousSerieItem {
  id: string;
  libelle_sous_serie: string;
  id_serie: string;
}

export interface AppCtx {
  role: Role;
  user: User;
  navigate: (r: Route) => void;
  openDoc: (d: Doc, tab?: string) => void;
  denyAccess: (d: Doc) => void;
  canAccess: (d: Doc) => boolean;
  canEdit: (d: Doc) => boolean;
  toast: (t: Omit<Toast, "id">) => void;
  activeDoc: Doc | null;
  viewerTab: string;
  lastList: Route;
  searchQ: string;
  searchDocs: Doc[];
  searchTotal: number;
  searchSort: string;
  hasSearched: boolean;
  setSearch: (q: string, docs: Doc[], total: number, sort: string) => void;
  clearSearch: () => void;
  services: string[];
  serviceDirections: Record<string, string>;
  directions: string[];
  emplacements: string[];
  series: SerieItem[];
  sousSeries: SousSerieItem[];
  cfg: {
    addService: (n: string, directionName: string) => void;
    renameService: (o: string, n: string) => void;
    removeService: (n: string) => void;
    addSousSerie: (l: string, idSerie: string) => void;
    updateSousSerie: (id: string, l: string, idSerie: string) => void;
    removeSousSerie: (id: string) => void;
    addSerie: (nom: string) => void;
    updateSerie: (id: string, nom: string) => void;
    removeSerie: (id: string) => void;
    addDirection: (n: string) => void;
    renameDirection: (o: string, n: string) => void;
    removeDirection: (n: string) => void;
    addEmplacement: (n: string) => void;
    renameEmplacement: (o: string, n: string) => void;
    removeEmplacement: (n: string) => void;
  };
  refreshActiveDoc: () => Promise<void>;
  editOnOpen: boolean;
  setEditOnOpen: (v: boolean) => void;
  corbeilleView: boolean;
  setCorbeilleView: (v: boolean) => void;
  rapportDocs: RapportDocument[];
  rapportTotal: number;
  rapportDate: string;
  rapportSearched: boolean;
  setRapportState: (date: string, docs: RapportDocument[], total: number) => void;
  clearRapportState: () => void;
}
