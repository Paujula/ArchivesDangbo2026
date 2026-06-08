"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";
import { ROLES } from "@/lib/data";
import { api, ApiError } from "@/lib/api";
import type { AppCtx, User } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#0c6e4a", "#3c5d76", "#c98a16", "#6a4d8c", "#b0563f", "#2f7d6b", "#8c5a3c", "#456a8a"];

function makeInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p[0][0] + (p[1] ? p[1][0] : (p[0][1] || ""))).toUpperCase();
}

function makeInitialsFromParts(prenom: string, nom: string): string {
  return ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || '?';
}

function RoleTag({ role }: { role: string }) {
  const R = ROLES[role as keyof typeof ROLES];
  if (!R) return null;
  const tone = role === "chef" || role === "admin" ? "green" : role === "saisisseur" ? "gold" : "slate";
  return <Badge tone={tone} dot={R.dot}>{R.name}</Badge>;
}

// ── Type draft ────────────────────────────────────────────────────────────────

type DraftUser = User & { email: string; password?: string };

// ── Composant principal ───────────────────────────────────────────────────────

export default function Users({ ctx }: { ctx: AppCtx }) {
  const [allUsers,   setAllUsers]   = useState<User[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [draft,      setDraft]     = useState<DraftUser | null>(null);
  const [isNew,      setIsNew]     = useState(false);
  const [saving,     setSaving]    = useState(false);
  const [carteFile,  setCarteFile] = useState<File | null>(null);
  const [cartePrev,  setCartePrev] = useState<string | null>(null);
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [filter,    setFilter]    = useState("tous");


  const isAdmin = ctx.role === "chef" || ctx.role === "admin";
  const directionNames = ctx.directions;

  // ── Chargement initial depuis l'API ───────────────────────────────────────

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { users } = await api.users.list();
      // Convertir ApiUser → User (format frontend)
      setAllUsers(users.map(u => ({
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
        last:     u.last_login_at
          ? formatRelative(u.last_login_at)
          : "Jamais connecté",
      })));
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger les utilisateurs." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin, loadUsers]);

  // ── Accès refusé (non-chef) ───────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="content-pad">
        <div className="card card-pad" style={{ maxWidth: 560, margin: "60px auto", textAlign: "center", padding: 40 }}>
          <div className="s-ico" style={{ margin: "0 auto 18px", width: 60, height: 60, background: "var(--danger-soft)", color: "var(--danger-deep)" }}>
            <Icon name="lock" size={28} />
          </div>
          <h1 style={{ fontSize: 21 }}>Accès restreint</h1>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.5 }}>
            La gestion des utilisateurs et des droits est réservée au profil{" "}
            <strong>Administrateur / Archiviste Chef</strong>. Votre rôle actuel est{" "}
            <strong>{ROLES[ctx.role]?.name ?? ctx.role}</strong>.
          </p>
          <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => ctx.navigate("dashboard")}>
            <Icon name="chevronLeft" size={16} />Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // ── Helpers draft ─────────────────────────────────────────────────────────

  const patchDraft = (patch: Partial<DraftUser>) => {
    setDraft(d => d ? { ...d, ...patch } : d);
    setErrors({});
  };

  const toggleDraftRight = (t: string) =>
    setDraft(d => d ? { ...d, rights: { ...d.rights, [t]: !d.rights[t] } } : d);

  const blankRights = () => Object.fromEntries(directionNames.map(t => [t, false]));

  // ── Ouverture drawer ──────────────────────────────────────────────────────

  const openNew = () => {
    setIsNew(true);
    setErrors({});
    setCarteFile(null);
    setCartePrev(null);
    setDraft({
      id: "", nom: "", prenom: "", name: "", email: "", password: "",
      telephone: "", adresse: "", service: "",
      direction: "", statut_matrimoniale: "", carte: "",
      role: "consultant",
      color: AVATAR_COLORS[allUsers.length % AVATAR_COLORS.length],
      status: "actif",
      last: "Jamais connecté",
      initials: "+",
      rights: { ...blankRights() },
    });
  };

  const openEdit = (u: User) => {
    setIsNew(false);
    setErrors({});
    setCarteFile(null);
    setCartePrev(null);
    setDraft({ ...u, email: u.email || "", password: "", rights: { ...u.rights } });
  };

  // ── Toggle statut (depuis la table) ──────────────────────────────────────

  const toggleStatus = async (u: User) => {
    const wasActif = u.status === "actif";
    // Optimistic update
    setAllUsers(us => us.map(x => x.id === u.id ? { ...x, status: wasActif ? "inactif" : "actif" } : x));
    try {
      if (wasActif) {
        await api.users.deactivate(u.id);
      } else {
        await api.users.activate(u.id);
      }
      ctx.toast({
        title: wasActif ? "Compte désactivé" : "Compte réactivé",
        body: `${u.name} est maintenant ${wasActif ? "inactif" : "actif"}.`,
      });
    } catch (e) {
      // Rollback
      setAllUsers(us => us.map(x => x.id === u.id ? { ...x, status: u.status } : x));
      ctx.toast({ tone: "danger", title: "Erreur", body: e instanceof ApiError ? e.message : "Erreur réseau." });
    }
  };

  // ── Sauvegarde (créer / modifier) ─────────────────────────────────────────

  const save = async () => {
    if (!draft) return;

    const e: Record<string, string> = {};
    if (!draft.nom.trim())             e.nom              = "Le nom est obligatoire.";
    if (!draft.prenom.trim())          e.prenom           = "Le prénom est obligatoire.";
    if (!draft.email.trim())           e.email            = "L'adresse e-mail est obligatoire.";
    if (isNew && !draft.password?.trim()) e.password      = "Le mot de passe est obligatoire.";
    if (isNew && (draft.password?.length ?? 0) < 8) e.password = "8 caractères minimum.";
    if (!draft.telephone.trim())       e.telephone        = "Le téléphone est obligatoire.";
    if (!draft.adresse.trim())         e.adresse          = "L'adresse est obligatoire.";
    if (!draft.service)                e.service          = "Le service est obligatoire.";
    if (!draft.direction)              e.direction        = "La direction est obligatoire.";
    if (!draft.statut_matrimoniale)    e.statut_matrimoniale = "La situation matrimoniale est obligatoire.";
    if (isNew && !carteFile)           e.carte            = "La carte d'identité est obligatoire.";
    setErrors(e);
    if (Object.keys(e).length) {
      ctx.toast({ tone: "danger", title: "Champs manquants", body: "Veuillez corriger les champs en rouge." });
      return;
    }

    setSaving(true);
    try {
      const rights = draft.role === "chef" || draft.role === "admin"
        ? Object.fromEntries(directionNames.map(t => [t, true]))
        : draft.rights;

      if (isNew) {
        const displayName = `${draft.prenom.trim()} ${draft.nom.trim()}`;
        const { user } = await api.users.create({
          nom:      draft.nom.trim(),
          prenom:   draft.prenom.trim(),
          name:     displayName,
          email:    draft.email.trim(),
          password: draft.password!,
          role:     draft.role,
          telephone: draft.telephone,
          adresse:  draft.adresse,
          service:  draft.service,
          direction: draft.direction,
          statut_matrimoniale: draft.statut_matrimoniale,
          color:    draft.color,
          initials: makeInitialsFromParts(draft.prenom, draft.nom),
          status:   draft.status,
          rights,
        });

        // Upload carte si un fichier a été sélectionné
        if (carteFile) {
          try {
            const { carte_url } = await api.users.uploadCarte(user.id, carteFile);
            user.carte = carte_url;
          } catch {
            ctx.toast({ tone: "warning", title: "Carte non téléchargée", body: "L'utilisateur a été créé mais la carte n'a pas pu être téléchargée." });
          }
        }

        setAllUsers(us => [...us, {
          id:       user.id,
          nom:      user.nom,
          prenom:   user.prenom,
          name:     user.name,
          email:    user.email,
          telephone: user.telephone,
          adresse:  user.adresse,
          service:  user.service,
          direction: user.direction,
          statut_matrimoniale: user.statut_matrimoniale,
          carte:    user.carte,
          initials: user.initials,
          role:     user.role,
          color:    user.color,
          status:   user.status,
          rights:   user.rights,
          last:     "Jamais connecté",
        }]);
        ctx.toast({ title: "Agent créé", body: `${displayName} a été ajouté avec le rôle ${ROLES[draft.role].name}.` });

      } else {
        const payload: Record<string, unknown> = {
          nom:      draft.nom.trim(),
          prenom:   draft.prenom.trim(),
          email:    draft.email.trim(),
          role:     draft.role,
          telephone: draft.telephone,
          adresse:  draft.adresse,
          service:  draft.service,
          direction: draft.direction,
          statut_matrimoniale: draft.statut_matrimoniale,
          color:    draft.color,
          status:   draft.status,
          rights,
        };
        if (draft.password?.trim()) payload.password = draft.password;

        const displayName = `${draft.prenom.trim()} ${draft.nom.trim()}`;
        const { user } = await api.users.update(draft.id, payload);

        // Upload carte si un nouveau fichier a été sélectionné
        let carteUrl = user.carte;
        if (carteFile) {
          try {
            const result = await api.users.uploadCarte(user.id, carteFile);
            carteUrl = result.carte_url;
          } catch {
            ctx.toast({ tone: "warning", title: "Carte non téléchargée", body: "Les informations ont été mises à jour mais la carte n'a pas pu être téléchargée." });
          }
        }
        setAllUsers(us => us.map(x => x.id === user.id ? {
          ...x,
          nom:      user.nom,
          prenom:   user.prenom,
          name:     user.name,
          email:    user.email,
          telephone: user.telephone,
          adresse:  user.adresse,
          service:  user.service,
          direction: user.direction,
          statut_matrimoniale: user.statut_matrimoniale,
          carte:    carteUrl,
          initials: user.initials,
          role:     user.role,
          color:    user.color,
          status:   user.status,
          rights:   user.rights,
        } : x));
        ctx.toast({ title: "Agent mis à jour", body: `Les informations de ${displayName} ont été enregistrées.` });
      }

      setDraft(null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(err.errors).forEach(([k, v]) => { mapped[k] = v[0]; });
          setErrors(mapped);
        }
        ctx.toast({ tone: "danger", title: "Erreur", body: err.message });
      } else {
        ctx.toast({ tone: "danger", title: "Erreur réseau", body: "Impossible de contacter le serveur." });
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Révoquer accès (désactiver depuis le drawer) ──────────────────────────

  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteUser = async () => {
    if (!draft || isNew) return;
    setSaving(true);
    try {
      await api.users.deleteUser(draft.id);
      setAllUsers(us => us.filter(x => x.id !== draft.id));
      ctx.toast({ tone: "danger", title: "Utilisateur supprimé", body: `${draft.prenom ? `${draft.prenom} ${draft.nom}` : draft.name} a été supprimé définitivement.` });
      setDraft(null);
      setConfirmDelete(false);
    } catch (e) {
      ctx.toast({ tone: "danger", title: "Erreur", body: e instanceof ApiError ? e.message : "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  };

  const revokeAccess = async () => {
    if (!draft || isNew) return;
    setSaving(true);
    try {
      await api.users.deactivate(draft.id);
      setAllUsers(us => us.map(x => x.id === draft.id ? { ...x, status: "inactif" } : x));
      ctx.toast({ tone: "danger", title: "Accès révoqué", body: `${draft.prenom ? `${draft.prenom} ${draft.nom}` : draft.name} ne peut plus se connecter.` });
      setDraft(null);
    } catch (e) {
      ctx.toast({ tone: "danger", title: "Erreur", body: e instanceof ApiError ? e.message : "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  };

  // ── Filtrage ──────────────────────────────────────────────────────────────

  const shown = allUsers.filter(u => (filter === "tous" || u.role === filter) && (ctx.role !== "chef" || u.role !== "admin"));

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="content-pad" style={{ maxWidth: 1340 }}>
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Administration · {allUsers.length} agents</div>
          <h1>Utilisateurs et Droits d&apos;accès</h1>
          <div className="ph-sub">Gérez les rôles et les autorisations par typologie d&apos;archive pour chaque service.</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} />Ajouter un agent
        </button>
      </div>

      <div className="row between center wrap gap-3" style={{ marginBottom: 14 }}>
        <div className="seg">
          {([["tous", "Tous"], ["admin", "Administrateurs"], ["chef", "Archivistes Chefs"], ["saisisseur", "Saisisseurs"], ["consultant", "Consultants"]] as const).map(([k, l]) => (
            <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
              {l}
              <span className="muted-3 mono" style={{ marginLeft: 6, fontSize: 10.5 }}>
                {k === "tous" ? allUsers.length : allUsers.filter(u => u.role === k).length}
              </span>
            </button>
          ))}
        </div>
        <div className="row gap-2 center muted-3" style={{ fontSize: 11.5 }}>
          <Icon name="info" size={14} />Les modifications de droits sont appliquées immédiatement.
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div className="sk" style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 12px", background: "var(--primary-soft)" }} />
            <div className="muted" style={{ fontSize: 13 }}>Chargement des utilisateurs…</div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th style={{ width: 170 }}>Rôle</th>
                  <th style={{ width: 180 }}>Service affecté</th>
                  <th style={{ width: 230 }}>Droits par direction</th>
                  <th style={{ width: 110 }}>Statut</th>
                  <th style={{ width: 70 }}>Carte</th>
                  <th style={{ width: 130 }}>Dern. connexion</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {shown.map(u => {
                  const granted = directionNames.filter(t => u.rights[t]).length;
                  return (
                    <tr key={u.id} style={{ cursor: "pointer" }} onClick={() => openEdit(u)}>
                      <td>
                        <div className="row gap-3 center">
                          <Avatar name={u.prenom ? `${u.prenom} ${u.nom}` : u.name} initials={u.initials} color={u.color} size={34} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{u.prenom ? `${u.prenom} ${u.nom}` : u.name}</div>
                            <div className="muted-3 mono" style={{ fontSize: 11 }}>{u.email}</div>
                          </div>

                        </div>
                      </td>
                      <td><RoleTag role={u.role} /></td>
                      <td><span style={{ fontSize: 12.5 }}>{u.service}</span></td>
                      <td>
                        {u.role === "chef" || u.role === "admin" ? (
                          <span className="badge badge-green">
                            <Icon name="shieldCheck" size={12} />Accès total
                          </span>
                        ) : (
                          <div className="row gap-2 center wrap">
                            {directionNames.map((t, i) => (
                              <span key={t} className="tip" data-tip={t} style={{
                                width: 9, height: 9, borderRadius: 2,
                                background: u.rights[t] ? AVATAR_COLORS[i % AVATAR_COLORS.length] : "var(--border-strong)",
                                opacity: u.rights[t] ? 1 : .55,
                              }} />
                            ))}
                            <span className="muted-3 mono" style={{ fontSize: 11, marginLeft: 2 }}>
                              {granted}/{directionNames.length}
                            </span>
                          </div>
                        )}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="row gap-2 center" onClick={() => toggleStatus(u)}>
                          <span className="dot" style={{
                            width: 7, height: 7, borderRadius: "50%",
                            background: u.status === "actif" ? "var(--primary)" : "var(--text-3)",
                          }} />
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: u.status === "actif" ? "var(--primary-strong)" : "var(--text-3)" }}>
                            {u.status === "actif" ? "Actif" : "Inactif"}
                          </span>
                        </button>
                      </td>
                      <td>
                        {u.carte ? (
                          <div className="tip" data-tip="Ouvrir la carte d'identité" onClick={e => { e.stopPropagation(); window.open(u.carte, '_blank'); }} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 28, height: 20, borderRadius: 3, overflow: "hidden", border: "1px solid var(--border)", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {u.carte.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                                <img src={u.carte} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <Icon name="file" size={13} style={{ color: "var(--text-3)" }} />
                              )}
                            </div>
                            <span className="muted-3 mono" style={{ fontSize: 10 }}>Voir</span>
                          </div>
                        ) : (
                          <span className="muted-3" style={{ fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td><span className="muted mono" style={{ fontSize: 11.5 }}>{u.last}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="row gap-1 center">
                          <button className="ra-btn tip" data-tip="Modifier" onClick={() => openEdit(u)}>
                            <Icon name="settings" size={16} />
                          </button>
                          {u.status === "actif" && (
                            <button className="ra-btn tip" data-tip="Révoquer l'accès" style={{ color: "var(--danger-deep)" }} onClick={() => toggleStatus(u)}>
                              <Icon name="x" size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Drawer création / édition ─────────────────────────────────── */}
      {draft && (
        <>
          <div className="drawer-overlay" onClick={() => setDraft(null)} />
          <div className="drawer">
              <div className="row between center" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div className="row gap-3 center">
                <Avatar
                  name={draft.prenom ? `${draft.prenom} ${draft.nom}` : (draft.name || "Nouvel agent")}
                  initials={draft.prenom ? makeInitialsFromParts(draft.prenom, draft.nom) : (draft.name ? makeInitials(draft.name) : "+")}
                  color={draft.color}
                  size={40}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{isNew ? "Nouvel agent" : (draft.prenom ? `${draft.prenom} ${draft.nom}` : draft.name)}</div>
                  <div className="muted-3 mono" style={{ fontSize: 11 }}>
                    {isNew ? "Création de compte" : draft.email}
                  </div>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setDraft(null)}><Icon name="x" size={18} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

              {/* Prénom */}
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Prénom <span className="req">*</span></label>
                <input
                  className={`input ${errors.prenom ? "error" : ""}`}
                  placeholder="ex : Rachelle"
                  value={draft.prenom}
                  onChange={e => {
                    const v = e.target.value;
                    patchDraft({
                      prenom: v,
                      email: isNew
                        ? (v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]+/g, "").trim() + "." + draft.nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]+/g, "").trim() + "@dangbo.bj").replace(/\.\./g, ".")
                        : draft.email,
                    });
                  }}
                />
                {errors.prenom && <div className="err-msg"><Icon name="alert" size={13} />{errors.prenom}</div>}
              </div>

              {/* Nom */}
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Nom <span className="req">*</span></label>
                <input
                  className={`input ${errors.nom ? "error" : ""}`}
                  placeholder="ex : Akplogan"
                  value={draft.nom}
                  onChange={e => {
                    const v = e.target.value;
                    patchDraft({
                      nom: v,
                      email: isNew
                        ? (draft.prenom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]+/g, "").trim() + "." + v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]+/g, "").trim() + "@dangbo.bj").replace(/\.\./g, ".")
                        : draft.email,
                    });
                  }}
                />
                {errors.nom && <div className="err-msg"><Icon name="alert" size={13} />{errors.nom}</div>}
              </div>

              {/* Email */}
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Adresse e-mail <span className="req">*</span></label>
                <input
                  className={`input ${errors.email ? "error" : ""}`}
                  placeholder="prenom.nom@dangbo.bj"
                  value={draft.email}
                  onChange={e => patchDraft({ email: e.target.value })}
                />
                {errors.email && <div className="err-msg"><Icon name="alert" size={13} />{errors.email}</div>}
              </div>

              {/* Mot de passe (création uniquement ou changement optionnel) */}
              <div className="field" style={{ marginBottom: 18 }}>
                <label>
                  {isNew ? <>Mot de passe <span className="req">*</span></> : "Nouveau mot de passe (optionnel)"}
                </label>
                <input
                  type="password"
                  className={`input ${errors.password ? "error" : ""}`}
                  placeholder={isNew ? "8 caractères minimum" : "Laisser vide pour ne pas modifier"}
                  value={draft.password ?? ""}
                  onChange={e => patchDraft({ password: e.target.value })}
                />
                {errors.password && <div className="err-msg"><Icon name="alert" size={13} />{errors.password}</div>}
              </div>

              {/* Couleur avatar */}
              <div className="field" style={{ marginBottom: 18 }}>
                <label>Couleur de l&apos;avatar</label>
                <div className="row gap-2 wrap">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => patchDraft({ color: c })} style={{
                      width: 26, height: 26, borderRadius: "50%", background: c,
                      border: draft.color === c ? "2.5px solid var(--text)" : "2.5px solid transparent",
                      outline: draft.color === c ? "1px solid var(--text)" : "none",
                    }} />
                  ))}
                </div>
              </div>

              <div className="hr" style={{ marginBottom: 18 }} />

              {/* Rôle */}
              <div className="field" style={{ marginBottom: 18 }}>
                <label>Rôle</label>
                <select className="select" value={draft.role}
                  onChange={e => patchDraft({ role: e.target.value as User["role"] })}>
                  {([
                    ...(ctx.role === "admin" ? [["admin", "Administrateur"] as const] : []),
                    ...(ctx.role === "admin" ? [["chef", "Archiviste Chef"] as const] : []),
                    ["saisisseur", "Agent Saisisseur / Numériseur"] as const,
                    ["consultant", "Agent Consultant"] as const,
                  ]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <div className="hint">{ROLES[draft.role]?.desc}</div>
              </div>

              {/* Service */}
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Service affecté <span className="req">*</span></label>
                <select className={`select ${errors.service ? "error" : ""}`} value={draft.service}
                  onChange={e => patchDraft({ service: e.target.value })}>
                  <option value="">— Sélectionner —</option>
                  {ctx.services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.service && <div className="err-msg"><Icon name="alert" size={13} />{errors.service}</div>}
              </div>

              {/* Téléphone */}
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Téléphone <span className="req">*</span></label>
                <input
                  className={`input ${errors.telephone ? "error" : ""}`}
                  placeholder="ex : 01 23 45 67 89"
                  value={draft.telephone}
                  onChange={e => patchDraft({ telephone: e.target.value })}
                />
                {errors.telephone && <div className="err-msg"><Icon name="alert" size={13} />{errors.telephone}</div>}
              </div>

              {/* Adresse */}
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Adresse <span className="req">*</span></label>
                <input
                  className={`input ${errors.adresse ? "error" : ""}`}
                  placeholder="ex : Dangbo centre"
                  value={draft.adresse}
                  onChange={e => patchDraft({ adresse: e.target.value })}
                />
                {errors.adresse && <div className="err-msg"><Icon name="alert" size={13} />{errors.adresse}</div>}
              </div>

              {/* Direction */}
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Direction <span className="req">*</span></label>
                <select className={`select ${errors.direction ? "error" : ""}`} value={draft.direction}
                  onChange={e => patchDraft({ direction: e.target.value })}>
                  <option value="">— Sélectionner —</option>
                  {ctx.directions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.direction && <div className="err-msg"><Icon name="alert" size={13} />{errors.direction}</div>}
              </div>

              {/* Statut matrimonial */}
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Situation matrimoniale <span className="req">*</span></label>
                <select className={`select ${errors.statut_matrimoniale ? "error" : ""}`} value={draft.statut_matrimoniale}
                  onChange={e => patchDraft({ statut_matrimoniale: e.target.value })}>
                  <option value="">— Sélectionner —</option>
                  <option value="Célibataire">Célibataire</option>
                  <option value="Marié(e)">Marié(e)</option>
                  <option value="Divorcé(e)">Divorcé(e)</option>
                  <option value="Veuf/Veuve">Veuf/Veuve</option>
                </select>
                {errors.statut_matrimoniale && <div className="err-msg"><Icon name="alert" size={13} />{errors.statut_matrimoniale}</div>}
              </div>

              {/* Carte (fichier) */}
              <div className="field" style={{ marginBottom: 22 }}>
                <label>Carte d&apos;identité <span className="req">*</span></label>
                <div className="row gap-3 center wrap">
                  {(cartePrev || (draft.carte && !carteFile)) && (
                    <div style={{ position: "relative", width: 80, height: 80, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0 }}>
                      <img src={cartePrev || draft.carte} alt="Carte" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <label className={`btn btn-ghost btn-sm ${errors.carte ? "error" : ""}`} style={{ cursor: "pointer", borderColor: errors.carte ? "var(--danger)" : undefined }}>
                    <Icon name="upload" size={15} />{(cartePrev || draft.carte) ? "Changer la carte" : "Télécharger une carte"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          ctx.toast({ tone: "danger", title: "Fichier trop volumineux", body: "La taille max est de 5 Mo." });
                          return;
                        }
                        setCarteFile(file);
                        setCartePrev(URL.createObjectURL(file));
                        setErrors(p => { const n = { ...p }; delete n.carte; return n; });
                      }}
                    />
                  </label>
                  {(cartePrev || draft.carte) && (
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-deep)" }} onClick={() => { setCarteFile(null); setCartePrev(null); }}>
                      <Icon name="trash" size={14} />Retirer
                    </button>
                  )}
                </div>
                {errors.carte && <div className="err-msg"><Icon name="alert" size={13} />{errors.carte}</div>}
                <div className="hint" style={{ marginTop: 6 }}>Formats acceptés : JPG, PNG, PDF, DOC, DOCX — max 5 Mo</div>
              </div>

              <div className="hr" style={{ marginBottom: 18 }} />

              {/* Droits par direction */}
              <div className="row gap-2 center" style={{ marginBottom: 4 }}>
                <Icon name="shield" size={16} className="muted" />
                <strong style={{ fontSize: 13.5 }}>Accès par direction</strong>
              </div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
                Activez les directions que cet agent peut rechercher et consulter.
              </div>

              {draft.role === "chef" || draft.role === "admin" ? (
                <div className="row gap-2 center" style={{ padding: "14px 16px", background: "var(--primary-tint)", borderRadius: "var(--r-md)", border: "1px solid var(--primary-soft)" }}>
                  <Icon name="shieldCheck" size={18} style={{ color: "var(--primary)" }} />
                  <span style={{ fontSize: 12.5, color: "var(--primary-strong)", fontWeight: 600 }}>
                    Accès total à toutes les directions (rôle administrateur).
                  </span>
                </div>
              ) : (
                <div className="col gap-2">
                  {directionNames.map((t, i) => (
                    <div key={t} className="row between center" style={{
                      padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                      background: draft.rights[t] ? "var(--surface-2)" : "var(--surface)",
                    }}>
                      <div className="row gap-3 center">
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: AVATAR_COLORS[i % AVATAR_COLORS.length] }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div>
                          <div className="muted-3" style={{ fontSize: 11 }}>Direction</div>
                        </div>
                      </div>
                      <Switch on={!!draft.rights[t]} onClick={() => toggleDraftRight(t)} />
                    </div>
                  ))}
                </div>
              )}

              <div className="hr" style={{ margin: "22px 0 18px" }} />

              {/* Statut compte */}
              <div className="row between center" style={{ padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Compte actif</div>
                  <div className="muted-3" style={{ fontSize: 11 }}>Autorise la connexion de l&apos;agent</div>
                </div>
                <Switch
                  on={draft.status === "actif"}
                  onClick={() => patchDraft({ status: draft.status === "actif" ? "inactif" : "actif" })}
                />
              </div>
            </div>

            {/* Footer drawer */}
            <div className="row between center gap-3" style={{ padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
              {isNew ? (
                <button className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>Annuler</button>
              ) : (
                <div className="row gap-2">
                  {confirmDelete ? (
                    <div className="row gap-2 center">
                      <span style={{ fontSize: 12, color: "var(--danger-deep)", fontWeight: 600 }}>Confirmer ?</span>
                      <button className="btn btn-sm" style={{ background: "var(--danger-deep)", color: "#fff" }} onClick={deleteUser} disabled={saving}>
                        {saving ? "Suppression…" : "Oui, supprimer"}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Annuler</button>
                    </div>
                  ) : (
                    <>
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-deep)" }} onClick={() => setConfirmDelete(true)}>
                        <Icon name="trash" size={15} />Supprimer définitivement
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-deep)" }} onClick={revokeAccess} disabled={saving}>
                        <Icon name="x" size={15} />Révoquer l&apos;accès
                      </button>
                    </>
                  )}
                </div>
              )}
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                {saving
                  ? "Enregistrement…"
                  : <><Icon name={isNew ? "plus" : "check"} size={15} />{isNew ? "Créer l'agent" : "Enregistrer"}</>}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

// ── Helper date relative ──────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "il y a quelques secondes";
  if (mins < 60)  return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `il y a ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "hier";
  if (days < 30)  return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}
