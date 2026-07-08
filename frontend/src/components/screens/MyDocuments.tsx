"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { AppCtx, Doc } from "@/lib/types";

export default function MyDocuments({ ctx }: { ctx: AppCtx }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const fetchDocs = useCallback(async (searchQ?: string) => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { user_id: ctx.user.id };
      if (searchQ) params.q = searchQ;
      const res = await api.archives.list(params);
      setDocs(res.archives);
      setTotal(res.total);
    } catch {
      setError("Impossible de charger la liste.");
    } finally {
      setLoading(false);
    }
  }, [ctx.user.id]);

  useEffect(() => {
    fetchDocs(q || undefined);
  }, [fetchDocs, q]);

  return (
    <div className="content-pad" style={{ maxWidth: 1400 }}>
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Mes documents · {total} document{total > 1 ? "s" : ""} enregistré{total > 1 ? "s" : ""}</div>
          <h1>Listes des documents</h1>
          <div className="ph-sub">Documents que vous avez enregistrés dans le système.</div>
        </div>
        <button className="btn btn-primary" onClick={() => ctx.navigate("ingest")}>
          <Icon name="plus" size={16} />Ajouter une archive
        </button>
      </div>

      <div className="card" style={{ padding: "10px 14px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="search" size={18} className="muted-3" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Rechercher par titre, référence, mot-clé…"
            style={{ flex: 1, border: "none", outline: "none", background: "none", fontSize: 14 }}
          />
          {q && <button className="ra-btn" onClick={() => setQ("")}><Icon name="x" size={16} /></button>}
        </div>

      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div className="sk" style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 12px", background: "var(--primary-soft)" }} />
            <div className="muted" style={{ fontSize: 13 }}>Chargement des documents…</div>
          </div>
        ) : error ? (
          <div className="col center" style={{ padding: 40, gap: 10, color: "var(--danger)" }}>
            <Icon name="alert" size={26} />
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{error}</div>
          </div>
        ) : docs.length === 0 ? (
          <div className="col center" style={{ padding: 40, gap: 10, color: "var(--text-3)" }}>
            <Icon name="file" size={30} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Aucun document enregistré</div>
            <button className="btn btn-sm btn-primary" onClick={() => ctx.navigate("ingest")}>
              Commencer la numérisation
            </button>
          </div>
        ) : (
          <div className="tbl-wrap" style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Cote</th>
                  <th>Titre</th>
                  <th style={{ width: 130 }}>Mot clé</th>
                  <th style={{ width: 100 }}>Série</th>
                  <th style={{ width: 110 }}>Sous-série</th>
                  <th style={{ width: 110 }}>Service</th>
                  <th style={{ width: 100 }}>Date enreg.</th>
                  <th style={{ width: 100, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id}>
                    <td><span className="mono muted" style={{ fontSize: 11.5 }}>{d.cote || "—"}</span></td>
                    <td>
                      <div className="row gap-2 center" style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                        {d.status === "brouillon" && (
                          <span className="badge" style={{ background: "var(--gold-soft, #fef3c7)", color: "var(--gold-deep, #92400e)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: .3, whiteSpace: "nowrap", flexShrink: 0 }}>Brouillon</span>
                        )}
                      </div>

                    </td>
                    <td>
                      {d.kw?.length
                        ? <span style={{ fontSize: 11.5 }}>{d.kw.join(", ").length > 40 ? d.kw.join(", ").slice(0, 40) + "…" : d.kw.join(", ")}</span>
                        : <span className="muted-3" style={{ fontSize: 11.5 }}>—</span>}
                    </td>
                    <td><Badge>{d.serie || d.type || "—"}</Badge></td>
                    <td><span style={{ fontSize: 12 }}>{(d.sous_serie || d.sub || "—").replace(/^[\dA-Za-z]+\s*[–\-—]\s*/, "")}</span></td>
                    <td><span style={{ fontSize: 12 }}>{d.service || "—"}</span></td>
                    <td><span className="mono tnum" style={{ fontSize: 12 }}>{d.date ? new Date(d.date).toLocaleDateString("fr-FR") : "—"}</span></td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <button type="button" className="ra-btn tip" data-tip="Modifier" onClick={() => { ctx.setEditOnOpen(true); ctx.openDoc(d); }}>
                          <Icon name="edit" size={16} />
                        </button>
                        <button type="button" className="ra-btn tip" data-tip="Consulter" onClick={() => ctx.openDoc(d)}>
                          <Icon name="eye" size={16} />
                        </button>
                        <button type="button" className="ra-btn tip" data-tip="Télécharger" onClick={async () => {
                          if (ctx.role !== "admin" && ctx.role !== "chef") {
                            const check = await api.demandes.check(d.id).catch(() => null);
                            if (!check || !check.can_download) {
                              if (check?.statut === "en_attente") {
                                ctx.toast({ tone: "gold", title: "En attente", body: "Votre demande est en cours de validation." });
                              } else if (check?.statut === "refuse") {
                                ctx.toast({ tone: "danger", title: "Accès refusé", body: "Vous ne pouvez pas télécharger ce document." });
                              } else {
                                try {
                                  await api.demandes.create(d.id);
                                  ctx.toast({ tone: "success", title: "Demande envoyée", body: "Votre demande de téléchargement a été transmise au chef archiviste." });
                                } catch { ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible d'envoyer la demande." }); }
                              }
                              return;
                            }
                          }
                          const token = localStorage.getItem("archive_token");
                          try {
                            const r = await fetch(api.archives.saveUrl(d.id), {
                              headers: token ? { Authorization: `Bearer ${token}` } : {},
                            });
                            if (!r.ok) throw new Error();
                            const blob = await r.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = d.original_name || d.id;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch {
                            ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de télécharger le fichier." });
                          }
                        }}>
                          <Icon name="download" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
