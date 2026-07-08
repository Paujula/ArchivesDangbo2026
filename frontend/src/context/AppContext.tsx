"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import type { Role, User, Doc, Toast, Route, AppCtx, SerieItem, SousSerieItem, RapportDocument } from "@/lib/types";
import { api, setToken, clearToken, hasToken, type ApiUser } from "@/lib/api";
import { formatRelative } from "@/lib/utils";

// ── Conversion ApiUser → User (type frontend) ────────────────────────────────

export function apiUserToUser(u: ApiUser): User {
  return {
    id:       u.id,
    nom:      u.nom,
    prenom:   u.prenom,
    name:     u.name,
    email:    u.email,
    telephone: u.telephone,
    adresse:  u.adresse,
    service:  u.service,
    direction: u.direction,
    statut_matrimoniale: u.statut_matrimoniale,
    carte:    u.carte,
    initials: u.initials,
    role:     u.role,
    color:    u.color,
    status:   u.status,
    rights:   u.rights,
    last:     u.last_login_at ? formatRelative(u.last_login_at) : 'Jamais connecté',
  };
}

// ── Utilisateur vide par défaut (pendant le chargement) ─────────────────────

const EMPTY_USER: User = {
  id: '', nom: '', prenom: '', name: '', email: '',
  telephone: '', adresse: '', service: '', direction: '',
  statut_matrimoniale: '', carte: '',
  initials: '?', role: 'consultant',
  color: '#868f82', status: 'actif', rights: {}, last: '',
};

// ── Permissions par rôle ─────────────────────────────────────────────────────

function firstRoute(role: Role): Route {
  return ALLOWED_ROUTES[role][0];
}

const ALLOWED_ROUTES: Record<Role, Route[]> = {
  admin:      ['dashboard', 'search', 'ingest', 'viewer', 'users', 'settings', 'historique', 'corbeille', 'rapport'],
  chef:       ['dashboard', 'search', 'ingest', 'viewer', 'users', 'settings', 'documents', 'demandes', 'corbeille', 'rapport'],
  saisisseur: ['dashboard', 'search', 'ingest', 'viewer', 'my-documents', 'demandes'],
  consultant: ['dashboard', 'search', 'viewer', 'demandes'],
};

// ── Interface du contexte ─────────────────────────────────────────────────────

interface AppState {
  authed:      boolean;
  authLoading: boolean;   // vrai pendant la vérification initiale du token
  role:        Role;
  route:       Route;
  activeDoc:   Doc | null;
  viewerTab:   string;
  lastList:    Route;
  toasts:      Toast[];

  collapsed:   boolean;
  services:    string[];
  serviceDirections: Record<string, string>;
  directions:  string[];
  emplacements: string[];
  series:      SerieItem[];
  sousSeries:  SousSerieItem[];
  userMenuOpen:   boolean;
  roleMenuOpen:   boolean;
  changePwOpen:   boolean;

  // Auth
  login:  (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Navigation & state
  setRole:           (r: Role) => void;
  navigate:          (r: Route) => void;
  openDoc:           (d: Doc, tab?: string) => void;
  denyAccess:        (d: Doc) => void;
  canAccess:         (d: Doc) => boolean;
  canEdit:           (d: Doc) => boolean;
  toast:             (t: Omit<Toast, 'id'>) => void;

  setCollapsed:      (c: boolean | ((prev: boolean) => boolean)) => void;
  setUserMenuOpen:   (o: boolean) => void;
  setRoleMenuOpen:   (o: boolean) => void;
  setChangePwOpen:   (o: boolean) => void;

  editOnOpen:    boolean;
  setEditOnOpen: (v: boolean) => void;
  corbeilleView: boolean;
  setCorbeilleView: (v: boolean) => void;
  rapportDocs:   RapportDocument[];
  rapportTotal:  number;
  rapportDate:   string;
  rapportSearched: boolean;
  setRapportState: (date: string, docs: RapportDocument[], total: number) => void;
  clearRapportState: () => void;
  cfg:       AppCtx['cfg'];
  user:      User;
  ctx:       AppCtx;
}

const AppContext = createContext<AppState | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authed,      setAuthed]      = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user,        setUser]        = useState<User>(EMPTY_USER);
  const [role,        setRoleState]   = useState<Role>('chef');
  const [route,       setRoute]       = useState<Route>('search');
  const [activeDoc,   setActiveDoc]   = useState<Doc | null>(null);
  const [viewerTab,   setViewerTab]   = useState('meta');
  const [lastList,    setLastList]    = useState<Route>('search');
  const [editOnOpen,      setEditOnOpen]      = useState(false);
  const [corbeilleView,   setCorbeilleView]    = useState(false);
  const [searchQ,       setSearchQ]       = useState('');
  const [searchDocs,    setSearchDocs]     = useState<Doc[]>([]);
  const [searchTotal,   setSearchTotal]    = useState(0);
  const [searchSort,    setSearchSort]     = useState('recent');
  const [hasSearched,   setHasSearched]    = useState(false);
  const [rapportDocs,   setRapportDocs]     = useState<RapportDocument[]>([]);
  const [rapportTotal,  setRapportTotal]    = useState(0);
  const [rapportDate,   setRapportDate]     = useState('');
  const [rapportSearched, setRapportSearched] = useState(false);
  const [toasts,      setToasts]      = useState<Toast[]>([]);

  const [collapsed,   setCollapsed]   = useState(false);
  const [services,    setServices]    = useState<string[]>([]);
  const [serviceDirections, setServiceDirections] = useState<Record<string, string>>({});
  const [directions,  setDirections]  = useState<string[]>([]);
  const [emplacements, setEmplacements] = useState<string[]>([]);
  const [series,      setSeries]      = useState<SerieItem[]>([]);
  const [sousSeries,  setSousSeries]  = useState<SousSerieItem[]>([]);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [roleMenuOpen,  setRoleMenuOpen]  = useState(false);
  const [changePwOpen,  setChangePwOpen]  = useState(false);
  const tid = useRef(0);

  // ── Refs pour la correspondance nom → UUID ────────────────────────────────
  // Nécessaires pour passer les IDs aux endpoints DELETE/PUT

  const serviceIdsRef = useRef<Map<string, string>>(new Map()); // nom service → UUID
  const serviceDirectionRef = useRef<Map<string, string>>(new Map()); // nom service → nom direction
  const sousSerieIdsRef = useRef<Map<string, string>>(new Map()); // libelle_sous_serie → UUID
  const serieIdsRef     = useRef<Map<string, string>>(new Map()); // nom_serie → UUID
  const directionIdsRef = useRef<Map<string, string>>(new Map()); // nom_direction → UUID
  const emplacementIdsRef = useRef<Map<string, string>>(new Map()); // nom_emplacement → UUID

  // ── Chargement de la nomenclature depuis l'API ────────────────────────────

  const loadNomenclature = useCallback(async () => {
    try {
      const [{ services: svcList }, { series: serieList }, { sous_series: ssList }, { directions: dirList }, { emplacements: emplList }] = await Promise.all([
        api.settings.listServices(),
        api.settings.listSeries(),
        api.settings.listSousSeries(),
        api.settings.listDirections(),
        api.settings.listEmplacements(),
      ]);

      // Reconstruire serviceIdsRef + état
      const svcMap = new Map<string, string>();
      const svcDirMap = new Map<string, string>();
      const svcNames: string[] = [];
      for (const s of svcList) {
        svcMap.set(s.name, s.id);
        svcDirMap.set(s.name, s.direction?.nom_direction ?? '');
        svcNames.push(s.name);
      }
      serviceIdsRef.current = svcMap;
      serviceDirectionRef.current = svcDirMap;
      setServices(svcNames);
      setServiceDirections(Object.fromEntries(svcDirMap));

      // Directions
      const dirMap = new Map<string, string>();
      for (const d of dirList) {
        dirMap.set(d.nom_direction, d.id);
      }
      directionIdsRef.current = dirMap;
      setDirections(dirList.map((d: { nom_direction: string }) => d.nom_direction));

      // Emplacements
      const emplMap = new Map<string, string>();
      for (const e of emplList) {
        emplMap.set(e.nom_emplacement, e.id);
      }
      emplacementIdsRef.current = emplMap;
      setEmplacements(emplList.map((e: { nom_emplacement: string }) => e.nom_emplacement));

      // Reconstruire sousSerieIdsRef + état
      const ssMap = new Map<string, string>();
      for (const s of ssList) {
        ssMap.set(s.libelle_sous_serie, s.id);
      }
      sousSerieIdsRef.current = ssMap;
      setSousSeries(ssList);

      // Reconstruire serieIdsRef + état
      const srMap = new Map<string, string>();
      for (const s of serieList) {
        srMap.set(s.nom_serie, s.id);
      }
      serieIdsRef.current = srMap;
      setSeries(serieList);
    } catch {
      // Échec silencieux : l'état local reste intact
    }
  }, []);

  // ── Vérification token au démarrage ────────────────────────────────────────

  useEffect(() => {
    if (!hasToken()) {
      setAuthLoading(false);
      return;
    }

    (async () => {
      try {
        const { user: apiUser } = await api.auth.me();
        const u = apiUserToUser(apiUser);
        setUser(u);
        setRoleState(u.role);
        setAuthed(true);
        await loadNomenclature();
      } catch {
        clearToken();
      } finally {
        setAuthLoading(false);
      }
    })();
  }, [loadNomenclature]);

  // ── Persistance de la route (survit au F5) ──────────────────────────────

  useEffect(() => {
    if (authed) {
      const saved = sessionStorage.getItem('route') as Route | null;
      if (saved && ALLOWED_ROUTES[role].includes(saved)) {
        setRoute(saved);
      }
    }
  }, [authed]);

  // ── Redirection si route non autorisée après changement de rôle ──────────

  useEffect(() => {
    if (authed && !ALLOWED_ROUTES[role].includes(route)) {
      setRoute(firstRoute(role));
    }
  }, [role, authed]);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: apiUser } = await api.auth.login(email, password);
    setToken(token);
    const u = apiUserToUser(apiUser);
    setUser(u);
    setRoleState(u.role);
    try { sessionStorage.removeItem('route'); } catch { /* ignorer */ }
    setAuthed(true);
    setRoute(firstRoute(u.role));
    clearSearch();
    clearRapportState();
    loadNomenclature(); // pas d'await : se charge en arrière-plan
  }, [loadNomenclature]);

  const logout = useCallback(async () => {
    try { await api.auth.logout(); } catch { /* ignorer les erreurs réseau */ }
    clearToken();
    try { sessionStorage.removeItem('route'); } catch { /* ignorer */ }
    setUserMenuOpen(false);
    setAuthed(false);
    setUser(EMPTY_USER);
    setRoleState('chef');
    setRoute('search');
    clearSearch();
    clearRapportState();
    setActiveDoc(null);
    setViewerTab('meta');
    // Vider la nomenclature et les refs
    setServices([]);
    setServiceDirections({});
    setDirections([]);
    setEmplacements([]);
    setSeries([]);
    setSousSeries([]);
      serviceIdsRef.current = new Map();
      serviceDirectionRef.current = new Map();
      sousSerieIdsRef.current = new Map();
    serieIdsRef.current     = new Map();
    directionIdsRef.current = new Map();
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────

  const navigate = useCallback((r: Route) => {
    setRoute(r);
    try { sessionStorage.setItem('route', r); } catch { /* ignorer */ }
    document.querySelector('.content')?.scrollTo(0, 0);
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
  }, []);

  // ── Rafraîchir le document actif ───────────────────────────────────────────

  const refreshActiveDoc = useCallback(async () => {
    if (!activeDoc) return;
    try {
      const { archive } = await api.archives.get(activeDoc.id);
      setActiveDoc(archive);
    } catch {
      // silencieux
    }
  }, [activeDoc]);

  // ── Accès documents ───────────────────────────────────────────────────────

  const canAccess = useCallback((d: Doc) => {
    if (role === 'chef' || role === 'admin') return true;
    if (d.restricted && user.service !== d.service) return false;
    if (role === 'consultant') return !!user.rights[d.direction || ''];
    return true;
  }, [role, user]);

  const canEdit = useCallback((d: Doc) => {
    if (role === 'chef' || role === 'admin') return true;
    if (role === 'saisisseur') return d.by === user.name;
    return false;
  }, [role, user]);

  const openDoc = useCallback((d: Doc, tab = 'meta') => {
    setCorbeilleView(false);
    setActiveDoc(d);
    setViewerTab(tab);
    setLastList(route === 'viewer' ? lastList : route);
    setRoute('viewer');
  }, [route, lastList]);

  const denyAccess = useCallback((_d: Doc) => {
    toast({ tone: 'danger', title: 'Accès refusé', body: 'Document hors de votre périmètre d\'autorisation. Tentative journalisée.' });
  }, []);

  // ── Recherche persistante ──────────────────────────────────────────────────

  const setSearch = useCallback((q: string, docs: Doc[], total: number, sort: string) => {
    setSearchQ(q);
    setSearchDocs(docs);
    setSearchTotal(total);
    setSearchSort(sort);
    setHasSearched(true);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQ('');
    setSearchDocs([]);
    setSearchTotal(0);
    setSearchSort('recent');
    setHasSearched(false);
  }, []);

  // ── Rapport persistant ─────────────────────────────────────────────────────

  const setRapportState = useCallback((date: string, docs: RapportDocument[], total: number) => {
    setRapportDate(date);
    setRapportDocs(docs);
    setRapportTotal(total);
    setRapportSearched(true);
  }, []);

  const clearRapportState = useCallback(() => {
    setRapportDate('');
    setRapportDocs([]);
    setRapportTotal(0);
    setRapportSearched(false);
  }, []);

  // ── Toasts ────────────────────────────────────────────────────────────────

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++tid.current;
    setToasts(ts => [...ts, { id, ...t }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4200);
  }, []);

  // ── Configuration nomenclature (avec intégration API) ────────────────────
  // Pattern : mise à jour optimiste → appel API → rollback + toast si erreur

  const cfg: AppCtx['cfg'] = {

    // ── Services ──────────────────────────────────────────────────────────

    addService: (n, directionName) => {
      if (!directionName) return;
      const directionId = directionIdsRef.current.get(directionName);
      if (!directionId) return;
      setServices(s => s.includes(n) ? s : [...s, n]);
      serviceDirectionRef.current.set(n, directionName);
      api.settings.createService(n, directionId)
        .then(({ service }) => {
          serviceIdsRef.current.set(service.name, service.id);
        })
        .catch((err) => {
          setServices(s => s.filter(x => x !== n));
          serviceDirectionRef.current.delete(n);
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de créer le service.' });
        });
    },

    renameService: (o, n) => {
      const id = serviceIdsRef.current.get(o);
      if (!id) return;
      // Optimiste
      setServices(s => s.map(x => x === o ? n : x));
      serviceIdsRef.current.delete(o);
      serviceIdsRef.current.set(n, id);
      api.settings.updateService(id, n)
        .catch((err) => {
          // Rollback
          setServices(s => s.map(x => x === n ? o : x));
          serviceIdsRef.current.delete(n);
          serviceIdsRef.current.set(o, id);
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de renommer le service.' });
        });
    },

    removeService: (n) => {
      const id = serviceIdsRef.current.get(n);
      if (!id) return;
      // Optimiste
      setServices(s => s.filter(x => x !== n));
      serviceIdsRef.current.delete(n);
      api.settings.deleteService(id)
        .catch((err) => {
          // Rollback
          setServices(s => [...s, n]);
          serviceIdsRef.current.set(n, id);
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de supprimer le service.' });
        });
    },

    // ── Sous-séries ───────────────────────────────────────────────────────

    addSousSerie: (l, idSerie) => {
      if (sousSeries.some(s => s.libelle_sous_serie === l)) return;
      api.settings.createSousSerie(l, idSerie)
        .then(({ sous_serie }) => {
          setSousSeries(ss => [...ss, sous_serie]);
          sousSerieIdsRef.current.set(sous_serie.libelle_sous_serie, sous_serie.id);
          toast({ title: 'Sous-série créée', body: l });
        })
        .catch((err) => {
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de créer la sous-série.' });
        });
    },

    updateSousSerie: (id, l, idSerie) => {
      const prev = sousSeries.find(s => s.id === id);
      if (!prev) return;
      setSousSeries(ss => ss.map(s => s.id === id ? { ...s, libelle_sous_serie: l, id_serie: idSerie } : s));
      sousSerieIdsRef.current.delete(prev.libelle_sous_serie);
      sousSerieIdsRef.current.set(l, id);
      api.settings.updateSousSerie(id, l, idSerie)
        .catch((err) => {
          setSousSeries(ss => ss.map(s => s.id === id ? { ...s, libelle_sous_serie: prev.libelle_sous_serie, id_serie: prev.id_serie } : s));
          sousSerieIdsRef.current.delete(l);
          sousSerieIdsRef.current.set(prev.libelle_sous_serie, id);
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de modifier la sous-série.' });
        });
    },

    removeSousSerie: (id) => {
      const prev = sousSeries.find(s => s.id === id);
      if (!prev) return;
      setSousSeries(ss => ss.filter(s => s.id !== id));
      sousSerieIdsRef.current.delete(prev.libelle_sous_serie);
      api.settings.deleteSousSerie(id)
        .catch((err) => {
          setSousSeries(ss => [...ss, prev]);
          sousSerieIdsRef.current.set(prev.libelle_sous_serie, id);
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de supprimer la sous-série.' });
        });
    },

    // ── Séries ────────────────────────────────────────────────────────────

    addSerie: (nom) => {
      if (serieIdsRef.current.has(nom)) return;
      api.settings.createSerie(nom)
        .then(({ serie }) => {
          setSeries(sr => [...sr, serie]);
          serieIdsRef.current.set(nom, serie.id);
          toast({ title: 'Série créée', body: nom });
        })
        .catch((err) => {
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de créer la série.' });
        });
    },

    updateSerie: (id, nom) => {
      const prev = series.find(s => s.id === id);
      if (!prev) return;
      setSeries(sr => sr.map(s => s.id === id ? { ...s, nom_serie: nom } : s));
      serieIdsRef.current.delete(prev.nom_serie);
      serieIdsRef.current.set(nom, id);
      api.settings.updateSerie(id, nom)
        .catch((err) => {
          setSeries(sr => sr.map(s => s.id === id ? prev : s));
          serieIdsRef.current.delete(nom);
          serieIdsRef.current.set(prev.nom_serie, id);
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de modifier la série.' });
        });
    },

    removeSerie: (id) => {
      const prev = series.find(s => s.id === id);
      if (!prev) return;
      setSeries(sr => sr.filter(s => s.id !== id));
      serieIdsRef.current.delete(prev.nom_serie);
      api.settings.deleteSerie(id)
        .catch((err) => {
          setSeries(sr => [...sr, prev]);
          serieIdsRef.current.set(prev.nom_serie, id);
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de supprimer la série.' });
        });
    },

    // ── Emplacements ─────────────────────────────────────────────────────

    addEmplacement: (n) => {
      setEmplacements(s => s.includes(n) ? s : [...s, n]);
      api.settings.createEmplacement(n)
        .then(({ emplacement }) => {
          emplacementIdsRef.current.set(emplacement.nom_emplacement, emplacement.id);
        })
        .catch((err) => {
          setEmplacements(s => s.filter(x => x !== n));
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de créer l\'emplacement.' });
        });
    },

    renameEmplacement: (o, n) => {
      const id = emplacementIdsRef.current.get(o);
      if (!id) return;
      setEmplacements(s => s.map(x => x === o ? n : x));
      emplacementIdsRef.current.delete(o);
      emplacementIdsRef.current.set(n, id);
      api.settings.updateEmplacement(id, n)
        .catch((err) => {
          setEmplacements(s => s.map(x => x === n ? o : x));
          emplacementIdsRef.current.delete(n);
          emplacementIdsRef.current.set(o, id);
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de renommer l\'emplacement.' });
        });
    },

    removeEmplacement: (n) => {
      const id = emplacementIdsRef.current.get(n);
      if (!id) return;
      setEmplacements(s => s.filter(x => x !== n));
      emplacementIdsRef.current.delete(n);
      api.settings.deleteEmplacement(id)
        .catch((err) => {
          setEmplacements(s => [...s, n]);
          emplacementIdsRef.current.set(n, id);
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de supprimer l\'emplacement.' });
        });
    },

    // ── Directions ────────────────────────────────────────────────────────

    addDirection: (n) => {
      setDirections(s => s.includes(n) ? s : [...s, n]);
      api.settings.createDirection(n)
        .then(({ direction }) => {
          directionIdsRef.current.set(direction.nom_direction, direction.id);
        })
        .catch((err) => {
          setDirections(s => s.filter(x => x !== n));
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de créer la direction.' });
        });
    },

    renameDirection: (o, n) => {
      const id = directionIdsRef.current.get(o);
      if (!id) return;
      setDirections(s => s.map(x => x === o ? n : x));
      directionIdsRef.current.delete(o);
      directionIdsRef.current.set(n, id);
      api.settings.updateDirection(id, n)
        .catch((err) => {
          setDirections(s => s.map(x => x === n ? o : x));
          directionIdsRef.current.delete(n);
          directionIdsRef.current.set(o, id);
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de renommer la direction.' });
        });
    },

    removeDirection: (n) => {
      const id = directionIdsRef.current.get(n);
      if (!id) return;
      setDirections(s => s.filter(x => x !== n));
      directionIdsRef.current.delete(n);
      api.settings.deleteDirection(id)
        .catch((err) => {
          setDirections(s => [...s, n]);
          directionIdsRef.current.set(n, id);
          toast({ tone: 'danger', title: 'Erreur', body: err?.message ?? 'Impossible de supprimer la direction.' });
        });
    },
  };

  // ── ctx (passé aux écrans) ────────────────────────────────────────────────

  const ctx: AppCtx = {
    role, user, navigate, openDoc, denyAccess, canAccess, canEdit, toast,
    activeDoc, viewerTab, lastList: lastList as Route,
    searchQ, searchDocs, searchTotal, searchSort, hasSearched, setSearch, clearSearch,
    editOnOpen, setEditOnOpen,
    corbeilleView, setCorbeilleView,
    rapportDocs, rapportTotal, rapportDate, rapportSearched, setRapportState, clearRapportState,
    services, serviceDirections, directions, emplacements, series, sousSeries, cfg,
    refreshActiveDoc,
  };

  const value: AppState = {
    authed, authLoading, role, route, activeDoc, viewerTab,
    lastList: lastList as Route, toasts,
    collapsed, services, serviceDirections, directions, emplacements, series, sousSeries,
    userMenuOpen, roleMenuOpen, changePwOpen,
    login, logout, setRole, navigate, openDoc, denyAccess, canAccess, canEdit, toast,
    setCollapsed, setUserMenuOpen, setRoleMenuOpen, setChangePwOpen,
    editOnOpen, setEditOnOpen,
    corbeilleView, setCorbeilleView,
    rapportDocs, rapportTotal, rapportDate, rapportSearched, setRapportState, clearRapportState,
    cfg, user, ctx,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
