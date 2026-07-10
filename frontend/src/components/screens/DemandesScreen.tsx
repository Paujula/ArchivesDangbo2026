"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Confirm from "@/components/ui/Confirm";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
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



const CARD_CONFIG = [
  { key: "en_attente", icon: "clock", tone: "gold", label: "En attente" },
  { key: "approuve", icon: "check", tone: "green", label: "Approuvées" },
  { key: "refuse", icon: "x", tone: "danger", label: "Refusées" },
];

function DemandesChef({ ctx }: { ctx: AppCtx }) {
  const [entries, setEntries] = useState<DemandeEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [viewingDoc, setViewingDoc] = useState<number | null>(null);
  const [stats, setStats] = useState<{ en_attente: number; approuve: number; refuse: number } | null>(null);
  const [confirm, setConfirm] = useState<{ msg: string; onConfirm: () => void } | null>(null);
  const filter = ctx.demandesFilterChef;
  const setFilter = ctx.setDemandesFilterChef;

  useEffect(() => {
    api.demandes.stats().then(setStats).catch(() => {/* silencieux : le chargement des stats n'est pas bloquant */});
  }, []);

  const handleViewDocument = async (entry: DemandeEntry) => {
    if (!entry.document?.id) return;
    setViewingDoc(entry.id);
    try {
      const { archive } = await api.archives.get(entry.document.id);
      ctx.openDoc(archive);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger le document." });
    } finally {
      setViewingDoc(null);
    }
  };

  const load = useCallback(async (p: number, statusFilter?: string | null) => {
    setLoading(true);
    try {
      const f = statusFilter !== undefined ? statusFilter : filter;
      const res = await api.demandes.list({ per_page: 20, page: p, statut: f || undefined });
      setEntries(res.demandes);
      setTotal(res.total);
      setPage(res.current_page);
      setLastPage(res.last_page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger les demandes." });
    } finally {
      setLoading(false);
    }
  }, [ctx, filter]);

  useEffect(() => { load(1, filter); }, [load, filter]);

  const handleFilter = (key: string | null) => {
    setFilter(filter === key ? null : key);
  };

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      await api.demandes.approve(id);
      ctx.toast({ tone: "success", title: "Approuvée", body: "Demande approuvée avec succès." });
      const { en_attente, approuve, refuse } = await api.demandes.stats();
      setStats({ en_attente, approuve, refuse });
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
      const { en_attente, approuve, refuse } = await api.demandes.stats();
      setStats({ en_attente, approuve, refuse });
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
          <div className="eyebrow" style={{ marginBottom: 7 }}>Gestion des accès</div>
          <h1>Demandes de téléchargement</h1>
          <div className="ph-sub">Approuvez ou refusez les demandes d'accès aux documents.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--gap-grid)", marginBottom: "var(--gap-grid)" }}>
        {CARD_CONFIG.map(c => {
          const count = stats?.[c.key as keyof typeof stats] ?? 0;
          const active = filter === c.key;
          const bg: Record<string, string> = { gold: "var(--gold-soft)", green: "var(--primary-soft)", danger: "var(--danger-soft)" };
          const fg: Record<string, string> = { gold: "var(--gold-strong)", green: "var(--primary)", danger: "var(--danger)" };
          return (
            <div key={c.key} className="stat" role="button" tabIndex={0}
              style={{ cursor: "pointer", outline: active ? `2px solid ${fg[c.tone]}` : "none", outlineOffset: -2 }}
              onClick={() => handleFilter(c.key)} onKeyDown={e => e.key === "Enter" && handleFilter(c.key)}>
              <div className="s-top">
                <div className="s-ico" style={{ background: bg[c.tone], color: fg[c.tone] }}><Icon name={c.icon} size={19} /></div>
              </div>
              <div className="s-label">{c.label}</div>
              <div className="s-val tnum">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600 }}>
          {filter ? (
            <>Demandes {CARD_CONFIG.find(c => c.key === filter)?.label.toLowerCase()} · {total} résultat{total > 1 ? "s" : ""}</>
          ) : (
            <>Toutes les demandes · {total} demande{total > 1 ? "s" : ""}</>
          )}
        </div>
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
                  <th style={{ width: 120 }}>Fichier</th>
                  <th style={{ width: 110 }}>Statut</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td><span className="mono" style={{ fontSize: 11 }}>{formatDateTime(e.date_demande)}</span></td>
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
                      {e.document ? (
                        <button className="btn btn-sm btn-ghost" disabled={viewingDoc === e.id}
                          onClick={() => handleViewDocument(e)}>
                          <Icon name="eye" size={13} />{viewingDoc === e.id ? "…" : "Voir"}
                        </button>
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
                            onClick={() => setConfirm({ msg: `Voulez-vous vraiment approuver le téléchargement de ce document "${e.document?.title || e.document?.cote || ""}" ?`, onConfirm: () => handleApprove(e.id) })}>
                            <Icon name="check" size={13} />Approuver
                          </button>
                          <button className="btn btn-sm btn-danger" disabled={processing === e.id}
                            onClick={() => setConfirm({ msg: `Voulez-vous vraiment bloquer le téléchargement ?`, onConfirm: () => handleReject(e.id) })}>
                            <Icon name="x" size={13} />Refuser
                          </button>
                        </div>
                      ) : e.statut === "approuve" ? (
                        <span style={{ fontSize: 11.5, color: "var(--primary-strong)" }}>
                          <Icon name="check" size={13} style={{ marginRight: 4 }} />
                          Document autorisé{e.traite_par ? ` par ${e.traite_par.prenom} ${e.traite_par.name}` : ""}
                        </span>
                      ) : e.statut === "refuse" ? (
                        <span style={{ fontSize: 11.5, color: "var(--danger)" }}>
                          <Icon name="x" size={13} style={{ marginRight: 4 }} />
                          Document refusé{e.traite_par ? ` par ${e.traite_par.prenom} ${e.traite_par.name}` : ""}
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

      {confirm && (
        <Confirm
          msg={confirm.msg}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
          onCancel={() => { setConfirm(null); }}
        />
      )}
    </div>
  );
}

function DemandesUser({ ctx }: { ctx: AppCtx }) {
  const [entries, setEntries] = useState<DemandeEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ en_attente: number; approuve: number; refuse: number } | null>(null);
  const filter = ctx.demandesFilter;
  const setFilter = ctx.setDemandesFilter;

  useEffect(() => {
    api.demandes.stats().then(setStats).catch(() => {});
  }, []);

  const load = useCallback(async (p: number, statusFilter?: string | null) => {
    setLoading(true);
    try {
      const f = statusFilter !== undefined ? statusFilter : filter;
      const res = await api.demandes.list({ per_page: 20, page: p, statut: f || undefined });
      setEntries(res.demandes);
      setTotal(res.total);
      setPage(res.current_page);
      setLastPage(res.last_page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger vos demandes." });
    } finally {
      setLoading(false);
    }
  }, [ctx, filter]);

  useEffect(() => { load(1, filter); }, [load, filter]);

  const handleFilter = (key: string | null) => {
    setFilter(filter === key ? null : key);
  };

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
          <div className="eyebrow" style={{ marginBottom: 7 }}>Mes demandes</div>
          <h1>Mes demandes de téléchargement</h1>
          <div className="ph-sub">Suivez l&apos;état de vos demandes d&apos;accès aux documents.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--gap-grid)", marginBottom: "var(--gap-grid)" }}>
        {CARD_CONFIG.map(c => {
          const count = stats?.[c.key as keyof typeof stats] ?? 0;
          const active = filter === c.key;
          const bg: Record<string, string> = { gold: "var(--gold-soft)", green: "var(--primary-soft)", danger: "var(--danger-soft)" };
          const fg: Record<string, string> = { gold: "var(--gold-strong)", green: "var(--primary)", danger: "var(--danger)" };
          return (
            <div key={c.key} className="stat" role="button" tabIndex={0}
              style={{ cursor: "pointer", outline: active ? `2px solid ${fg[c.tone]}` : "none", outlineOffset: -2 }}
              onClick={() => handleFilter(c.key)} onKeyDown={e => e.key === "Enter" && handleFilter(c.key)}>
              <div className="s-top">
                <div className="s-ico" style={{ background: bg[c.tone], color: fg[c.tone] }}><Icon name={c.icon} size={19} /></div>
              </div>
              <div className="s-label">{c.label}</div>
              <div className="s-val tnum">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600 }}>
          {filter ? (
            <>Demandes {CARD_CONFIG.find(c => c.key === filter)?.label.toLowerCase()} · {total} résultat{total > 1 ? "s" : ""}</>
          ) : (
            <>Toutes mes demandes · {total} demande{total > 1 ? "s" : ""}</>
          )}
        </div>
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
                    <td><span className="mono" style={{ fontSize: 11 }}>{formatDateTime(e.date_demande)}</span></td>
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

export default function DemandesScreen({ ctx }: { ctx: AppCtx }) {
  if (ctx.role === "admin" || ctx.role === "chef") {
    return <DemandesChef ctx={ctx} />;
  }
  return <DemandesUser ctx={ctx} />;
}
