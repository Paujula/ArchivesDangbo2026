"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { AppCtx, HistoriqueEntry } from "@/lib/types";

function parseDetails(details: string): { label: string; value: string }[] {
  if (!details) return [];
  return details.split("|").map(p => {
    const idx = p.indexOf(":");
    if (idx === -1) return { label: "", value: p.trim() };
    return {
      label: p.slice(0, idx).trim(),
      value: p.slice(idx + 1).trim(),
    };
  }).filter(p => p.label || p.value);
}

const ACTION_TONES: Record<string, string> = {
  "Création du document": "green",
  "Modification du document": "gold",
  "Suppression du document": "danger",
  "Consultation du document": "slate",
  "Téléchargement du document": "blue",
  "Création de l'utilisateur": "green",
  "Modification de l'utilisateur": "gold",
  "Suppression de l'utilisateur": "danger",
  "Désactivation de l'utilisateur": "danger",
  "Activation de l'utilisateur": "green",
  "Création de la direction": "green",
  "Modification de la direction": "gold",
  "Suppression de la direction": "danger",
  "Création du service": "green",
  "Suppression du service": "danger",
  "Création de la sous-série": "green",
  "Modification de la sous-série": "gold",
  "Suppression de la sous-série": "danger",
  "Création de la série": "green",
  "Modification de la série": "gold",
  "Suppression de la série": "danger",
  Connexion: "blue",
  Déconnexion: "slate",
  "tentative de connexion échoué": "danger",
  "Changement de mot de passe": "gold",
};

const TYPE_LABELS: Record<string, string> = {
  document: "Document",
  utilisateur: "Utilisateur",
  settings: "Configuration",
  authentification: "Système",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) + " à " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoriqueScreen({ ctx }: { ctx: AppCtx }) {
  const [entries, setEntries] = useState<HistoriqueEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.historiques.list({ type: filter || undefined, page: p, per_page: 30 });
      setEntries(res.historiques);
      setTotal(res.total);
      setPage(res.current_page);
      setLastPage(res.last_page);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger l'historique." });
    } finally {
      setLoading(false);
    }
  }, [filter, ctx]);

  useEffect(() => { load(1); }, [load]);

  const pageNumbers: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(lastPage, page + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="content-pad" style={{ maxWidth: 1340 }}>
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Audit & traçabilité · {total} entrées</div>
          <h1>Historique d&apos;activité</h1>
          <div className="ph-sub">Toutes les actions effectuées sur le système sont enregistrées et horodatées.</div>
        </div>
      </div>

      <div className="row gap-2 wrap" style={{ marginBottom: 16 }}>
        <div className="seg">
          {(["", "document", "utilisateur", "settings", "authentification"] as const).map(t => (
            <button key={t} className={filter === t ? "on" : ""} onClick={() => setFilter(t)}>
              {t ? TYPE_LABELS[t] || t : "Toutes"}
            </button>
          ))}
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
            Aucune activité enregistrée pour ce filtre.
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 170 }}>Date</th>
                  <th style={{ width: 200 }}>Utilisateur</th>
                  <th style={{ width: 130 }}>Action</th>
                  <th>Détails</th>
                  <th style={{ width: 100 }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td><span className="mono" style={{ fontSize: 11 }}>{formatDate(e.date_action)}</span></td>
                    <td>
                      {e.user ? (
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{e.user.prenom} {e.user.name}</span>
                      ) : (
                        <span className="muted-3">Utilisateur inconnue</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={ACTION_TONES[e.action] || "neutral"}>{e.action}</Badge>
                    </td>
                    <td>
                      {(() => {
                        const parsed = parseDetails(e.details);
                        if (e.type === "utilisateur") {
                          const userField = parsed.find(d => d.label === "Utilisateur");
                          const changes = parsed.filter(d => d.label && d.label !== "Utilisateur");
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              {userField && (
                                <span style={{ fontSize: 11.5, fontWeight: 600 }}>{userField.value}</span>
                              )}
                              {changes.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                  {changes.map((d, i) => {
                                    const arrowIdx = d.value.indexOf("→");
                                    if (arrowIdx !== -1) {
                                      const oldVal = d.value.slice(0, arrowIdx).trim();
                                      const newVal = d.value.slice(arrowIdx + 1).trim();
                                      return (
                                        <div key={i} style={{ fontSize: 11.5, overflowWrap: "break-word" }}>
                                          <span className="muted" style={{ minWidth: 80, display: "inline-block" }}>{d.label}:</span>
                                          <span style={{ textDecoration: "line-through", opacity: 0.6, marginRight: 6 }}>{oldVal}</span>
                                          <span style={{ fontWeight: 600 }}>{newVal}</span>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div key={i} style={{ fontSize: 11.5, overflowWrap: "break-word" }}>
                                        <span className="muted" style={{ minWidth: 80, display: "inline-block" }}>{d.label}:</span>
                                        <span style={{ fontWeight: 600 }}>{d.value}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }
                        if (e.type === "document") {
                          const identityFields = ["Cote", "Titre"];
                          const identity = parsed.filter(d => identityFields.includes(d.label));
                          const changes = parsed.filter(d => !identityFields.includes(d.label));
                          const hasChanges = changes.some(d => d.value.includes("→"));
                          if (e.action === "Création du document") {
                            return (
                              <div className="row gap-2 wrap" style={{ gap: 3 }}>
                                {identity.concat(parsed.filter(d => d.label === "Analyse")).map((d, i) => (
                                  <span key={i} className="badge badge-ghost" style={{ overflowWrap: "break-word", fontWeight: 400 }}>
                                    <span className="muted">{d.label === "Analyse" ? "Mot clé" : d.label}:</span>&nbsp;{d.value}
                                  </span>
                                ))}
                              </div>
                            );
                          }
                          if (hasChanges) {
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 11.5, fontWeight: 600 }}>
                                  {identity.map(d => d.value).filter(Boolean).join(" · ")}
                                </span>
                                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                  {changes.map((d, i) => {
                                    const arrowIdx = d.value.indexOf("→");
                                    if (arrowIdx !== -1) {
                                      const oldVal = d.value.slice(0, arrowIdx).trim();
                                      const newVal = d.value.slice(arrowIdx + 1).trim();
                                      return (
                                        <div key={i} style={{ fontSize: 11.5, overflowWrap: "break-word" }}>
                                          <span className="muted" style={{ minWidth: 80, display: "inline-block" }}>{d.label}:</span>
                                          <span style={{ textDecoration: "line-through", opacity: 0.6, marginRight: 6 }}>{oldVal}</span>
                                          <span style={{ fontWeight: 600 }}>{newVal}</span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              </div>
                            );
                          }
                          return identity.length > 0 ? (
                            <span style={{ fontSize: 11.5, fontWeight: 600 }}>
                              {identity.map(d => d.value).filter(Boolean).join(" · ")}
                            </span>
                          ) : (
                            <span className="muted-3" style={{ fontSize: 11 }}>{e.details}</span>
                          );
                        }
                        return <span className="muted-3" style={{ fontSize: 11 }}>{e.details}</span>;
                      })()}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{TYPE_LABELS[e.type] || e.type}</span>
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
