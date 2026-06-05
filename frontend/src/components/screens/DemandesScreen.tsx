"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { AppCtx, DemandeEntry } from "@/lib/types";

const STATUT_LABELS: Record<string, string> = {
  en_attente: "En attente",
  approuve: "Approuvé",
  refuse: "Refusé",
};

const STATUT_TONES: Record<string, string> = {
  en_attente: "gold",
  approuve: "green",
  refuse: "danger",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) + " à " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function DemandesChef({ ctx }: { ctx: AppCtx }) {
  const [entries, setEntries] = useState<DemandeEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.demandes.list({ per_page: 20, page: p });
      setEntries(res.demandes);
      setTotal(res.total);
      setPage(res.current_page);
      setLastPage(res.last_page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger les demandes." });
    } finally {
      setLoading(false);
    }
  }, [ctx]);

  useEffect(() => { load(1); }, [load]);

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      await api.demandes.approve(id);
      ctx.toast({ tone: "success", title: "Approuvée", body: "Demande approuvée avec succès." });
      load(page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible d'approuver la demande." });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(id);
    try {
      await api.demandes.reject(id);
      ctx.toast({ tone: "success", title: "Refusée", body: "Demande refusée." });
      load(page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de refuser la demande." });
    } finally {
      setProcessing(null);
    }
  };

  const pageNumbers: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(lastPage, page + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="content-pad" style={{ maxWidth: 1100 }}>
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Gestion des accès · {total} demande{total > 1 ? "s" : ""}</div>
          <h1>Demandes de téléchargement</h1>
          <div className="ph-sub">Approuvez ou refusez les demandes d'accès aux documents.</div>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div className="sk" style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 12px", background: "var(--primary-soft)" }} />
            <div className="muted" style={{ fontSize: 13 }}>Chargement…</div>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }} className="muted-3">
            Aucune demande de téléchargement pour le moment.
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Date</th>
                  <th style={{ width: 180 }}>Utilisateur</th>
                  <th>Document</th>
                  <th style={{ width: 160 }}>Détails</th>
                  <th style={{ width: 110 }}>Statut</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td><span className="mono" style={{ fontSize: 11 }}>{formatDate(e.date_demande)}</span></td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        {e.utilisateur?.prenom} {e.utilisateur?.name}
                      </span>
                    </td>
                    <td>
                      {e.document ? (
                        <span style={{ fontSize: 12 }}>
                          <span className="mono">{e.document.cote}</span>
                          {e.document.cote ? " — " : ""}{e.document.title}
                        </span>
                      ) : (
                        <span className="muted-3">—</span>
                      )}
                    </td>
                    <td>
                      {e.document?.description ? (
                        <span style={{ fontSize: 11.5 }}>{e.document.description}</span>
                      ) : (
                        <span className="muted-3" style={{ fontSize: 11.5 }}>—</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={STATUT_TONES[e.statut] || "neutral"}>{STATUT_LABELS[e.statut] || e.statut}</Badge>
                    </td>
                    <td>
                      {e.statut === "en_attente" ? (
                        <div className="row gap-1">
                          <button className="btn btn-sm btn-success" disabled={processing === e.id}
                            onClick={() => handleApprove(e.id)}>
                            <Icon name="check" size={13} />Approuver
                          </button>
                          <button className="btn btn-sm btn-danger" disabled={processing === e.id}
                            onClick={() => handleReject(e.id)}>
                            <Icon name="close" size={13} />Refuser
                          </button>
                        </div>
                      ) : e.statut === "approuve" ? (
                        <span style={{ fontSize: 11.5, color: "var(--primary-strong)" }}>
                          <Icon name="check" size={13} style={{ marginRight: 4 }} />
                          Document autorisé{e.traite_par ? ` par ${e.traite_par.prenom} ${e.traite_par.name}` : ""}
                        </span>
                      ) : e.statut === "refuse" ? (
                        <span style={{ fontSize: 11.5, color: "var(--danger)" }}>
                          <Icon name="close" size={13} style={{ marginRight: 4 }} />
                          Document refusé
                        </span>
                      ) : null}
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
    </div>
  );
}

export default function DemandesScreen({ ctx }: { ctx: AppCtx }) {
  const role = ctx.role;

  if (role === "admin" || role === "chef") {
    return <DemandesChef ctx={ctx} />;
  }

  const [entries, setEntries] = useState<DemandeEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.demandes.list({ per_page: 20, page: p });
      setEntries(res.demandes);
      setTotal(res.total);
      setPage(res.current_page);
      setLastPage(res.last_page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger vos demandes." });
    } finally {
      setLoading(false);
    }
  }, [ctx]);

  useEffect(() => { load(1); }, [load]);

  const handleDownload = async (d: { id: string; title: string; cote: string }) => {
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
      a.download = d.title || d.cote || d.id;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de télécharger le fichier." });
    }
  };

  const pageNumbers: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(lastPage, page + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="content-pad" style={{ maxWidth: 1100 }}>
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Mes demandes · {total} demande{total > 1 ? "s" : ""}</div>
          <h1>Mes demandes de téléchargement</h1>
          <div className="ph-sub">Suivez l&apos;état de vos demandes d&apos;accès aux documents.</div>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div className="sk" style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 12px", background: "var(--primary-soft)" }} />
            <div className="muted" style={{ fontSize: 13 }}>Chargement…</div>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }} className="muted-3">
            Vous n&apos;avez aucune demande de téléchargement.
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Date</th>
                  <th>Document</th>
                  <th style={{ width: 160 }}>Détails</th>
                  <th style={{ width: 110 }}>Statut</th>
                  <th style={{ width: 100 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td><span className="mono" style={{ fontSize: 11 }}>{formatDate(e.date_demande)}</span></td>
                    <td>
                      {e.document ? (
                        <span style={{ fontSize: 12 }}>
                          <span className="mono">{e.document.cote}</span>
                          {e.document.cote ? " — " : ""}{e.document.title}
                        </span>
                      ) : <span className="muted-3">—</span>}
                    </td>
                    <td>
                      {e.document?.description ? (
                        <span style={{ fontSize: 11.5 }}>{e.document.description}</span>
                      ) : (
                        <span className="muted-3" style={{ fontSize: 11.5 }}>—</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={STATUT_TONES[e.statut] || "neutral"}>{STATUT_LABELS[e.statut] || e.statut}</Badge>
                    </td>
                    <td>
                      {e.statut === "approuve" && e.document ? (
                        <button className="btn btn-sm btn-success" onClick={() => handleDownload(e.document!)}>
                          <Icon name="download" size={13} /> Télécharger
                        </button>
                      ) : e.statut === "refuse" ? (
                        <span className="muted-3" style={{ fontSize: 11 }}>Vous ne pouvez pas télécharger ce document</span>
                      ) : (
                        <span className="muted-3" style={{ fontSize: 11 }}>En attente</span>
                      )}
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
    </div>
  );
}
