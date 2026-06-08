/**
 * Client HTTP pour l'API Laravel / Sanctum.
 * Gère le token Bearer en localStorage et formate les erreurs.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
const TOKEN_KEY = 'archive_token';

// ── Token helpers ────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, t);
}

export function clearToken(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

export function hasToken(): boolean {
  return !!getToken();
}

// ── Requête générique ────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data.message as string) || 'Erreur réseau',
      data.errors as Record<string, string[]> | undefined
    );
  }

  return data as T;
}

// ── Types réponse ────────────────────────────────────────────────────────────

export interface ApiService {
  id:   string;
  name: string;
  direction_id: string | null;
}

export interface ApiUser {
  id: string;
  nom: string;
  prenom: string;
  name: string;
  email: string;
  telephone: string;
  adresse: string;
  service: string;
  direction: string;
  statut_matrimoniale: string;
  carte: string;
  initials: string;
  role: 'chef' | 'admin' | 'saisisseur' | 'consultant';
  color: string;
  status: 'actif' | 'inactif';
  rights: Record<string, boolean>;
  last_login_at: string | null;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export const api = {

  auth: {
    /** Connexion → retourne token + user */
    login: (email: string, password: string) =>
      request<{ token: string; user: ApiUser }>('POST', '/auth/login', { email, password }),

    /** Déconnexion (révoque le token côté serveur) */
    logout: () =>
      request<{ message: string }>('POST', '/auth/logout'),

    /** Récupère le profil de l'utilisateur connecté */
    me: () =>
      request<{ user: ApiUser }>('GET', '/auth/me'),

    /** Demande de réinitialisation par email */
    forgotPassword: (email: string) =>
      request<{ message: string; reset_token?: string; reset_email?: string }>(
        'POST', '/auth/forgot-password', { email }
      ),

    /** Réinitialisation avec token */
    resetPassword: (token: string, email: string, password: string, passwordConfirmation: string) =>
      request<{ message: string }>(
        'POST', '/auth/reset-password',
        { token, email, password, password_confirmation: passwordConfirmation }
      ),

    /** Changement de mot de passe (utilisateur connecté) */
    changePassword: (currentPassword: string, password: string, passwordConfirmation: string) =>
      request<{ message: string }>(
        'PUT', '/auth/change-password',
        { current_password: currentPassword, password, password_confirmation: passwordConfirmation }
      ),
  },

  settings: {
    listDirections: () =>
      request<{ directions: { id: string; nom_direction: string }[] }>('GET', '/settings/directions'),

    createDirection: (nom_direction: string) =>
      request<{ direction: { id: string; nom_direction: string }; message: string }>('POST', '/settings/directions', { nom_direction }),

    updateDirection: (id: string, nom_direction: string) =>
      request<{ direction: { id: string; nom_direction: string }; message: string }>('PUT', `/settings/directions/${id}`, { nom_direction }),

    deleteDirection: (id: string) =>
      request<{ message: string }>('DELETE', `/settings/directions/${id}`),

    listSeries: () =>
      request<{ series: { id: string; nom_serie: string; sous_series: { id: string; libelle_sous_serie: string }[] }[] }>('GET', '/settings/series'),

    createSerie: (nom_serie: string) =>
      request<{ serie: { id: string; nom_serie: string; sous_series: [] }; message: string }>('POST', '/settings/series', { nom_serie }),

    updateSerie: (id: string, nom_serie: string) =>
      request<{ serie: { id: string; nom_serie: string }; message: string }>('PUT', `/settings/series/${id}`, { nom_serie }),

    deleteSerie: (id: string) =>
      request<{ message: string }>('DELETE', `/settings/series/${id}`),

    listSousSeries: () =>
      request<{ sous_series: { id: string; libelle_sous_serie: string; id_serie: string }[] }>('GET', '/settings/sous-series'),

    createSousSerie: (libelle_sous_serie: string, id_serie: string) =>
      request<{ sous_serie: { id: string; libelle_sous_serie: string; id_serie: string }; message: string }>('POST', '/settings/sous-series', { libelle_sous_serie, id_serie }),

    updateSousSerie: (id: string, libelle_sous_serie: string, id_serie: string) =>
      request<{ sous_serie: { id: string; libelle_sous_serie: string; id_serie: string }; message: string }>('PUT', `/settings/sous-series/${id}`, { libelle_sous_serie, id_serie }),

    deleteSousSerie: (id: string) =>
      request<{ message: string }>('DELETE', `/settings/sous-series/${id}`),

    // ── Services ──────────────────────────────────────────────────────────
    listServices: () =>
      request<{ services: { id: string; name: string }[] }>('GET', '/settings/services'),

    createService: (name: string) =>
      request<{ service: { id: string; name: string }; message: string }>('POST', '/settings/services', { name }),

    updateService: (id: string, name: string) =>
      request<{ service: { id: string; name: string }; message: string }>('PUT', `/settings/services/${id}`, { name }),

    deleteService: (id: string) =>
      request<{ message: string }>('DELETE', `/settings/services/${id}`),

  },

  archives: {
    /**
     * Upload d'un fichier scanné (multipart) avec suivi de progression.
     * Utilise XHR pour accéder aux événements de progression.
     */
    upload: (
      file: File,
      onProgress?: (pct: number) => void
    ): Promise<{ temp_id: string; ext: string; original_name: string; size_mb: number; mime_type: string; pages: number }> => {
      return new Promise((resolve, reject) => {
        const xhr  = new XMLHttpRequest();
        const form = new FormData();
        form.append('file', file);

        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
          });
        }

        xhr.addEventListener('load', () => {
          let data: Record<string, unknown> = {};
          try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data as never);
          } else {
            reject(new ApiError(xhr.status, (data.message as string) || 'Erreur upload', data.errors as never));
          }
        });

        xhr.addEventListener('error', () => reject(new ApiError(0, 'Erreur réseau')));

        const token = getToken();
        xhr.open('POST', `${API_BASE}/archives/upload`);
        xhr.setRequestHeader('Accept', 'application/json');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(form);
      });
    },

    /** Liste / recherche des archives */
    list: (params?: {
      q?: string;
      types?: string[];
      statuses?: string[];
      service?: string;
      format?: string;
      from?: string;
      to?: string;
      sort?: string;
      user_id?: string;
      per_page?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params?.q)        qs.set('q', params.q);
      if (params?.service)  qs.set('service', params.service);
      if (params?.format)   qs.set('format', params.format);
      if (params?.from)     qs.set('from', params.from);
      if (params?.to)       qs.set('to', params.to);
      if (params?.sort)     qs.set('sort', params.sort);
      if (params?.user_id)  qs.set('user_id', params.user_id);
      if (params?.per_page) qs.set('per_page', String(params.per_page));
      params?.types?.forEach(t    => qs.append('types[]', t));
      params?.statuses?.forEach(s => qs.append('statuses[]', s));
      const suffix = qs.toString() ? '?' + qs.toString() : '';
      return request<{ archives: import('./types').Doc[]; total: number }>(
        'GET', `/archives${suffix}`
      );
    },

    /** Crée une archive (fiche d'indexation + fichier) */
    create: (data: {
      title: string; service: string;
      cote?: string;
      status?: string; format?: string; date: string;
      direction?: string; serie?: string; sous_serie?: string; emplacement?: string;
      pages?: number; restricted?: boolean;
      keywords?: string[]; description?: string;
      temp_id?: string; original_name?: string; draft?: boolean;
    }) => request<{ archive: import('./types').Doc; message: string }>('POST', '/archives', data),

    /** Récupère une archive par son ID */
    get: (id: string) =>
      request<{ archive: import('./types').Doc }>('GET', `/archives/${id}`),

    /** Met à jour une archive */
    update: (id: string, data: {
      title?: string; cote?: string; sub?: string; service?: string;
      status?: string; format?: string; date?: string;
      pages?: number; restricted?: boolean;
      keywords?: string[]; description?: string;
      emplacement?: string; serie?: string; sous_serie?: string; direction?: string;
      temp_id?: string; original_name?: string;
    }) => request<{ archive: import('./types').Doc; message: string }>('PUT', `/archives/${id}`, data),

    /** Supprime une archive (chef) */
    delete: (id: string) =>
      request<{ message: string }>('DELETE', `/archives/${id}`),

    /** Enregistre une vue (incrémente compteur + audit) */
    recordView: (id: string) =>
      request<{ views: number }>('POST', `/archives/${id}/view`),

    /** Archives liées (même type) */
    related: (id: string) =>
      request<{ archives: import('./types').Doc[] }>('GET', `/archives/${id}/related`),

    /** URL de téléchargement */
    downloadUrl: (id: string) => `${API_BASE}/archives/${id}/download`,
    saveUrl: (id: string) => `${API_BASE}/archives/${id}/download?save=1`,
  },

  users: {
    /** Liste tous les utilisateurs (chef uniquement) */
    list: (params?: { role?: string; status?: string; q?: string }) => {
      const qs = params ? '?' + new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as Record<string, string>
      ).toString() : '';
      return request<{ users: ApiUser[] }>('GET', `/users${qs}`);
    },

    /** Crée un nouvel utilisateur */
    create: (data: Omit<ApiUser, 'id' | 'last_login_at' | 'carte'> & { password: string }) =>
      request<{ user: ApiUser; message: string }>('POST', '/users', data),

    /** Met à jour un utilisateur */
    update: (id: string, data: Partial<ApiUser> & { password?: string }) =>
      request<{ user: ApiUser; message: string }>('PUT', `/users/${id}`, data),

    /** Désactive un utilisateur */
    deactivate: (id: string) =>
      request<{ message: string }>('DELETE', `/users/${id}`),

    /** Supprime définitivement un utilisateur */
    deleteUser: (id: string) =>
      request<{ message: string }>('DELETE', `/users/${id}/force`),

    /** Réactive un utilisateur */
    activate: (id: string) =>
      request<{ user: ApiUser; message: string }>('POST', `/users/${id}/activate`),

    /** Télécharge une carte d'identité pour un utilisateur */
    uploadCarte: async (id: string, file: File): Promise<{ carte_url: string; message: string }> => {
      const token = getToken();
      const formData = new FormData();
      formData.append('carte', file);

      const res = await fetch(`${API_BASE}/users/${id}/carte`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      let data: Record<string, unknown>;
      try { data = await res.json(); } catch { data = {}; }

      if (!res.ok) {
        throw new ApiError(res.status, (data.message as string) || 'Erreur téléchargement carte');
      }

      return data as { carte_url: string; message: string };
    },
  },

  historiques: {
    list: (params?: {
      type?: string;
      user_id?: string;
      q?: string;
      page?: number;
      per_page?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params?.type) qs.set('type', params.type);
      if (params?.user_id) qs.set('user_id', params.user_id);
      if (params?.q) qs.set('q', params.q);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.per_page) qs.set('per_page', String(params.per_page));
      const suffix = qs.toString() ? '?' + qs.toString() : '';
      return request<{
        historiques: import('./types').HistoriqueEntry[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
      }>('GET', `/historiques${suffix}`);
    },
  },

  dashboard: {
    stats: () =>
      request<import('./types').DashboardStats>('GET', '/dashboard/stats'),
  },

  demandes: {
    list: (params?: { type?: string; per_page?: number; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.type) qs.set('type', params.type);
      if (params?.per_page) qs.set('per_page', String(params.per_page));
      if (params?.page) qs.set('page', String(params.page));
      const suffix = qs.toString() ? '?' + qs.toString() : '';
      return request<{
        demandes: import('./types').DemandeEntry[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
      }>('GET', `/demandes${suffix}`);
    },
    create: (idDocument: string) =>
      request<{ demande: import('./types').DemandeEntry; message: string }>('POST', '/demandes', { id_document: idDocument }),
    check: (idDocument: string) =>
      request<{ can_download: boolean; statut: string | null; demande_id?: number }>('GET', `/demandes/check?id_document=${idDocument}`),
    approve: (id: number) =>
      request<{ demande: import('./types').DemandeEntry; message: string }>('PUT', `/demandes/${id}/approve`),
    reject: (id: number) =>
      request<{ demande: import('./types').DemandeEntry; message: string }>('PUT', `/demandes/${id}/reject`),
  },
};
