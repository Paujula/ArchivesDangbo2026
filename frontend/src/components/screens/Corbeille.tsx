"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import ConsultModal from "@/components/ui/ConsultModal";
import { api } from "@/lib/api";

const STORAGE_HOST = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, '');

function carteUrl(url: string): string {
  return url.startsWith('http') ? url : `${STORAGE_HOST}${url}`;
}
import type { AppCtx, Doc } from "@/lib/types";

type Tab = "documents" | "utilisateurs";

export default function Corbeille({ ctx }: { ctx: AppCtx }) {
  const [tab, setTab] = useState<Tab>("documents");

  return (
    <div className="content-pad" style={{ maxWidth: 1400 }}>
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Administration</div>
          <h1>Corbeille</h1>
          <div className="ph-sub">Documents et utilisateurs supprimés du système.</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${tab === "documents" ? "active" : ""}`} onClick={() => setTab("documents")}
          style={tab === "documents" ? { background: "#dbeafe", color: "#1e40af" } : {}}>
          <Icon name="file" size={15} /> Documents
        </button>
        <button className={`tab ${tab === "utilisateurs" ? "active" : ""}`} onClick={() => setTab("utilisateurs")}
          style={tab === "utilisateurs" ? { background: "#dcfce7", color: "#166534" } : {}}>
          <Icon name="users" size={15} /> Utilisateurs
        </button>
      </div>

      {tab === "documents" ? <DocumentsTab ctx={ctx} /> : <UtilisateursTab ctx={ctx} />}
    </div>
  );
}

function DocumentsTab({ ctx }: { ctx: AppCtx }) {
  const [docs, setDocs] = useState<Awaited<ReturnType<typeof api.archives.deleted>>['documents']>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [consultDoc, setConsultDoc] = useState<Doc | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await api.archives.deleted({ page: p, per_page: 30 });
      setDocs(res.documents);
      setTotal(res.total);
      setPage(res.current_page);
      setLastPage(res.last_page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger les documents supprimés." });
    } finally {
      setLoading(false);
    }
  }, [ctx]);

  useEffect(() => { load(1); }, [load]);

  const allSelected = docs.length > 0 && selected.size === docs.length;

  const toggleAll = () => {
    if (allSelected) { setSelected(new Set()); return; }
    setSelected(new Set(docs.map(d => d.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleRestore = async (id: string) => {
    if (!confirm("Voulez-vous vraiment restaurer ce document\u00a0?")) {
      ctx.toast({ tone: "info", title: "Annulé", body: "Restauration annulée." });
      return;
    }
    setRestoring(id);
    try {
      await api.archives.restore(id);
      ctx.toast({ tone: "success", title: "Restauré", body: "Document restauré." });
      load(page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de restaurer le document." });
    } finally {
      setRestoring(null);
    }
  };

  const handleForceDelete = async () => {
    if (selected.size === 0) return;
    const msg = selected.size === 1
      ? "Voulez-vous vraiment supprimer ce document\u00a0?"
      : `Voulez-vous vraiment supprimer ces ${selected.size} documents\u00a0?`;
    if (!confirm(msg)) return;
    try {
      await api.archives.batchForceDelete([...selected]);
      ctx.toast({ tone: "success", title: "Supprimé", body: `${selected.size} document(s) supprimé(s) définitivement.` });
      load(page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de supprimer les documents." });
    }
  };

  const pageNumbers: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(lastPage, page + 2); i++) pageNumbers.push(i);

  return (
    <>
      {selected.size > 0 && (
        <div className="row between center" style={{ marginBottom: 12, padding: "8px 14px", background: "#fef2f2", borderRadius: "var(--r-md)", border: "1px solid #fecaca" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#991b1b" }}>{selected.size} document{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}</span>
          <button className="btn btn-sm" style={{ background: "#dc2626", color: "#fff" }} onClick={handleForceDelete}>
            <Icon name="trash" size={14} /> Supprimer définitivement
          </button>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div className="sk" style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 12px", background: "var(--primary-soft)" }} />
            <div className="muted" style={{ fontSize: 13 }}>Chargement…</div>
          </div>
        ) : docs.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }} className="muted-3">
            <Icon name="trash" size={30} style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-2)" }}>Aucun document dans la corbeille</div>
          </div>
        ) : (
          <div className="tbl-wrap" style={{ overflowX: "auto" }}>
            <table className="tbl tbl-sm" style={{ minWidth: 950 }}>
              <thead>
                <tr>
                  <th style={{ width: 36, textAlign: "center" }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer" }} />
                  </th>
                  <th style={{ width: 130 }}>Date suppression</th>
                  <th style={{ width: 150 }}>Supprimé par</th>
                  <th style={{ width: 90 }}>Cote</th>
                  <th>Titre</th>
                  <th style={{ width: 90, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id}>
                    <td style={{ textAlign: "center" }}>
                      <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleOne(d.id)} style={{ cursor: "pointer" }} />
                    </td>
                    <td><span className="mono" style={{ fontSize: 11 }}>{new Date(d.deleted_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></td>
                    <td>
                      {d.deleter
                        ? <span style={{ fontSize: 12, fontWeight: 500 }}>{d.deleter.prenom} {d.deleter.name}</span>
                        : <span className="muted-3">—</span>}
                    </td>
                    <td><span className="mono" style={{ fontSize: 12 }}>{d.cote}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        <span>{d.titre}</span>
                      </div>
                      <div className="muted-3" style={{ fontSize: 11 }}>{d.service}{d.service && d.direction ? " · " : ""}{d.direction}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="row" style={{ gap: 4, justifyContent: "center" }}>
                        <button className="ra-btn tip" data-tip="Restaurer"
                          disabled={restoring === d.id}
                          onClick={() => handleRestore(d.id)}>
                          <Icon name="refresh" size={16} />
                        </button>
                        <button className="ra-btn tip" data-tip="Consulter"
                          onClick={() => setConsultDoc({
                            id: d.id, title: d.titre, cote: d.cote, description: d.analyse,
                            service: d.service, direction: d.direction, serie: d.serie,
                            sous_serie: d.sous_serie, emplacement: d.emplacement,
                            status: d.statut, format: d.format, date: d.date_enregistrement,
                            pages: d.pages, restricted: d.restricted,
                            views: 0, by: '',
                            original_name: d.original_name, file: d.fichier,
                          } as Doc)}>
                          <Icon name="eye" size={16} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {lastPage > 1 && (
          <div className="row center gap-2" style={{ padding: "14px 18px", borderTop: "1px solid var(--border)" }}>
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => load(page - 1)}>
              <Icon name="chevronLeft" size={14} />Précédent
            </button>
            {pageNumbers.map(p => (
              <button key={p} className={`btn btn-ghost btn-sm${p === page ? " active-page" : ""}`}
                style={p === page ? { background: "var(--primary)", color: "#fff" } : {}}
                onClick={() => load(p)}>
                {p}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" disabled={page >= lastPage} onClick={() => load(page + 1)}>
              Suivant<Icon name="chevronRight" size={14} />
            </button>
          </div>
        )}
      </div>

      {consultDoc && (
        <ConsultModal
          doc={consultDoc}
          ctx={ctx}
          onClose={() => setConsultDoc(null)}
          downloadable={false}
        />
      )}
    </>
  );
}

function UtilisateursTab({ ctx }: { ctx: AppCtx }) {
  const [users, setUsers] = useState<Awaited<ReturnType<typeof api.users.deleted>>['users']>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewUser, setViewUser] = useState<typeof users[number] | null>(null);
  const [previewCarte, setPreviewCarte] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await api.users.deleted({ page: p, per_page: 30 });
      setUsers(res.users);
      setTotal(res.total);
      setPage(res.current_page);
      setLastPage(res.last_page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger les utilisateurs supprimés." });
    } finally {
      setLoading(false);
    }
  }, [ctx]);

  useEffect(() => { load(1); }, [load]);

  const allSelected = users.length > 0 && selected.size === users.length;

  const toggleAll = () => {
    if (allSelected) { setSelected(new Set()); return; }
    setSelected(new Set(users.map(u => u.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleRestore = async (id: string) => {
    if (!confirm("Voulez-vous vraiment restaurer cet utilisateur\u00a0?")) {
      ctx.toast({ tone: "info", title: "Annulé", body: "Restauration annulée." });
      return;
    }
    try {
      await api.users.restoreUser(id);
      ctx.toast({ tone: "success", title: "Restauré", body: "Utilisateur restauré." });
      load(page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de restaurer l'utilisateur." });
    }
  };

  const handleForceDelete = async () => {
    if (selected.size === 0) return;
    const msg = selected.size === 1
      ? "Voulez-vous vraiment supprimer cet utilisateur définitivement\u00a0?"
      : `Voulez-vous vraiment supprimer ces ${selected.size} utilisateurs définitivement\u00a0?`;
    if (!confirm(msg)) return;
    try {
      await api.users.batchForceDelete([...selected]);
      ctx.toast({ tone: "success", title: "Supprimé", body: `${selected.size} utilisateur(s) supprimé(s) définitivement.` });
      load(page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de supprimer les utilisateurs." });
    }
  };

  const pageNumbers: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(lastPage, page + 2); i++) pageNumbers.push(i);

  return (
    <>
      {selected.size > 0 && (
        <div className="row between center" style={{ marginBottom: 12, padding: "8px 14px", background: "#fef2f2", borderRadius: "var(--r-md)", border: "1px solid #fecaca" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#991b1b" }}>{selected.size} utilisateur{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}</span>
          <button className="btn btn-sm" style={{ background: "#dc2626", color: "#fff" }} onClick={handleForceDelete}>
            <Icon name="trash" size={14} /> Supprimer définitivement
          </button>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div className="sk" style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 12px", background: "var(--primary-soft)" }} />
            <div className="muted" style={{ fontSize: 13 }}>Chargement…</div>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }} className="muted-3">
            <Icon name="trash" size={30} style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-2)" }}>Aucun utilisateur dans la corbeille</div>
          </div>
        ) : (
          <div className="tbl-wrap" style={{ overflowX: "auto" }}>
            <table className="tbl tbl-sm" style={{ minWidth: 950 }}>
              <thead>
                <tr>
                  <th style={{ width: 36, textAlign: "center" }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer" }} />
                  </th>
                  <th style={{ width: 130 }}>Date suppression</th>
                  <th style={{ width: 150 }}>Supprimé par</th>
                  <th style={{ width: 130 }}>Nom</th>
                  <th>Email</th>
                  <th style={{ width: 70, textAlign: "center" }}>Carte</th>
                  <th style={{ width: 130, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ textAlign: "center" }}>
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} style={{ cursor: "pointer" }} />
                    </td>
                    <td><span className="mono" style={{ fontSize: 11 }}>{new Date(u.deleted_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></td>
                    <td>
                      {u.deleter
                        ? <span style={{ fontSize: 12, fontWeight: 500 }}>{u.deleter.prenom} {u.deleter.name}</span>
                        : <span className="muted-3">—</span>}
                    </td>
                    <td><span style={{ fontWeight: 600, fontSize: 13 }}>{u.prenom} {u.name}</span></td>
                    <td><span className="mono" style={{ fontSize: 12 }}>{u.email}</span></td>
                    <td style={{ textAlign: "center" }}>
                      {u.carte ? (
                        <button className="ra-btn tip" data-tip="Voir la carte" onClick={() => setPreviewCarte(carteUrl(u.carte))}>
                          <Icon name="eye" size={16} />
                        </button>
                      ) : <span className="muted-3" style={{ fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="row" style={{ gap: 4, justifyContent: "center" }}>
                        <button className="ra-btn tip" data-tip="Restaurer" onClick={() => handleRestore(u.id)}>
                          <Icon name="refresh" size={16} />
                        </button>
                        <button className="ra-btn tip" data-tip="Consulter" onClick={() => setViewUser(u)}>
                          <Icon name="info" size={16} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {lastPage > 1 && (
          <div className="row center gap-2" style={{ padding: "14px 18px", borderTop: "1px solid var(--border)" }}>
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => load(page - 1)}>
              <Icon name="chevronLeft" size={14} />Précédent
            </button>
            {pageNumbers.map(p => (
              <button key={p} className={`btn btn-ghost btn-sm${p === page ? " active-page" : ""}`}
                style={p === page ? { background: "var(--primary)", color: "#fff" } : {}}
                onClick={() => load(p)}>
                {p}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" disabled={page >= lastPage} onClick={() => load(page + 1)}>
              Suivant<Icon name="chevronRight" size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Visionneuse carte d'identité */}
      {previewCarte && (
        <>
          <div className="drawer-overlay" onClick={() => setPreviewCarte(null)} />
          <div className="drawer" style={{ maxWidth: 700 }}>
            <div className="row between center" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Carte d'identité</div>
              <button className="icon-btn" onClick={() => setPreviewCarte(null)}><Icon name="x" size={18} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {previewCarte.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                <img src={previewCarte} alt="Carte d'identité"
                  style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: "var(--r-md)", boxShadow: "0 2px 12px rgba(0,0,0,.12)" }} />
              ) : (
                <iframe src={previewCarte} title="Carte d'identité" style={{ width: "100%", height: "65vh", border: "none", borderRadius: "var(--r-md)" }} />
              )}
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewCarte(null)}>Fermer</button>
            </div>
          </div>
        </>
      )}

      {/* Drawer utilisateur */}
      {viewUser && (
        <>
          <div className="drawer-overlay" onClick={() => setViewUser(null)} />
          <div className="drawer" style={{ maxWidth: 600 }}>
            <div className="row between center" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Utilisateur supprimé</div>
                <div className="muted-3 mono" style={{ fontSize: 11 }}>
                  {new Date(viewUser.deleted_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setViewUser(null)}><Icon name="x" size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {viewUser.deleter && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--surface-2)", borderRadius: "var(--r-md)", fontSize: 13 }}>
                  <span className="muted">Supprimé par :</span> <strong>{viewUser.deleter.prenom} {viewUser.deleter.name}</strong>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Field label="Nom" value={`${viewUser.prenom} ${viewUser.name}`} />
                <Field label="Email" value={viewUser.email} />
                <Field label="Téléphone" value={viewUser.telephone} />
                <Field label="Adresse" value={viewUser.adresse} />
                <Field label="Service" value={viewUser.service} />
                <Field label="Direction" value={viewUser.direction} />
                <Field label="Situation matrimoniale" value={viewUser.statut_matrimoniale} />
                <Field label="Rôle" value={viewUser.role} />
              </div>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewUser(null)}>Fermer</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="row gap-2" style={{ fontSize: 13 }}>
      <span className="muted" style={{ minWidth: 160, flexShrink: 0, fontWeight: 500 }}>{label}</span>
      <span style={{ fontWeight: 600, wordBreak: "break-word" }}>{value || "—"}</span>
    </div>
  );
}
