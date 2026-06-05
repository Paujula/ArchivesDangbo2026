"use client";

import { useState, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import { api } from "@/lib/api";
import type { AppCtx, Doc } from "@/lib/types";

export default function Search({ ctx }: { ctx: AppCtx }) {
  const [q,        setQ]        = useState("");
  const [sort,     setSort]     = useState("recent");

  const [docs,    setDocs]    = useState<Doc[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const fetchDocs = useCallback(async (params: Parameters<typeof api.archives.list>[0]) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.archives.list(params);
      setDocs(res.archives);
      setTotal(res.total);
    } catch {
      setError("Impossible de charger le fonds documentaire.");
    } finally {
      setLoading(false);
    }
  }, []);

  const doSearch = () => {
    setHasSearched(true);
    fetchDocs({ q, sort });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch();
  };

  return (
    <div className="content-pad" style={{ maxWidth: 1600 }}>
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Fonds documentaire</div>
          <h1>Recherche et Consultation</h1>
        </div>
      </div>

      {/* Barre de recherche globale */}
      <div className="card" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Icon name="search" size={19} className="muted-3" />
        <input
          value={q} onChange={e => setQ(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Rechercher par titre, référence, mot-clé… (ex : « naissance Hozin », « DGB-URB »)"
          style={{ flex: 1, border: "none", outline: "none", background: "none", fontSize: 15 }}
        />
        {q && <button className="ra-btn" onClick={() => { setQ(""); setDocs([]); setHasSearched(false); }}><Icon name="x" size={16} /></button>}
        {ctx.role === "chef" || ctx.role === "admin" ? (
          <div className="row gap-2 center" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 10 }}>
            <span className="muted-3 mono" style={{ fontSize: 11 }}>TRIER</span>
            <select className="select btn-sm" style={{ height: 34, width: "auto", paddingRight: 30 }} value={sort} onChange={e => { setSort(e.target.value); if (hasSearched) { fetchDocs({ q, sort: e.target.value }); } }}>
              <option value="recent">Plus récents</option>
              <option value="ancien">Plus anciens</option>
              <option value="vues">Plus consultés</option>
              <option value="titre">Titre A→Z</option>
            </select>
          </div>
        ) : null}
        <button className="btn btn-sm" onClick={doSearch} style={{ fontWeight: 600 }}>
          <Icon name="search" size={15} /> Rechercher
        </button>
      </div>

      {!hasSearched ? (
        <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Icon name="search" size={40} className="muted-3" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-2)" }}>Recherchez un document</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Saisissez un titre, une référence ou un mot-clé pour commencer
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="row between center wrap gap-3" style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
            <div className="row gap-2 center wrap">
              <strong style={{ fontSize: 14 }} className="tnum">{loading ? "…" : docs.length}</strong>
              <span className="muted" style={{ fontSize: 13 }}>résultat{docs.length > 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Cote</th>
                  <th>Titre</th>
                  <th style={{ width: 130 }}>Mot-clé</th>
                  <th style={{ width: 100 }}>Série</th>
                  <th style={{ width: 110 }}>Sous-série</th>
                  <th style={{ width: 110 }}>Direction</th>
                  <th style={{ width: 110 }}>Service</th>
                  {(ctx.role === "chef" || ctx.role === "admin") && <th style={{ width: 100 }}>Emplacement</th>}
                  <th style={{ width: 100, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i}><td colSpan={ctx.role === "chef" || ctx.role === "admin" ? 9 : 8}><div className="sk" style={{ height: 18, width: (60 + (i * 7) % 35) + "%" }} /></td></tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={ctx.role === "chef" || ctx.role === "admin" ? 9 : 8}>
                      <div className="col center" style={{ gap: 10, padding: 40 }}>
                        <Icon name="alert" size={26} />
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{error}</div>
                      </div>
                    </td>
                  </tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td colSpan={ctx.role === "chef" || ctx.role === "admin" ? 9 : 8} style={{ height: 220 }}>
                      <div className="col center" style={{ gap: 10, color: "var(--text-3)" }}>
                        <Icon name="search" size={30} />
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Aucune archive ne correspond</div>
                      </div>
                    </td>
                  </tr>
                ) : docs.map((d: Doc) => (
                    <tr key={d.id} style={{ cursor: "pointer" }} onClick={() => ctx.openDoc(d)}>
                      <td><span className="mono muted" style={{ fontSize: 11.5 }}>{d.cote || "—"}</span></td>
                      <td>
                        <div className="row gap-2 center" style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>
                            {d.title}
                          </span>
                        </div>
                      </td>
                      <td>
                        {d.description
                          ? <span style={{ fontSize: 11.5 }}>{d.description.length > 40 ? d.description.slice(0, 40) + "…" : d.description}</span>
                          : <span className="muted-3" style={{ fontSize: 11.5 }}>—</span>}
                      </td>
                      <td><span style={{ fontSize: 12 }}>{d.serie || "—"}</span></td>
                      <td><span style={{ fontSize: 12 }}>{(d.sous_serie || "—").replace(/^[\dA-Za-z]+\s*[–\-—]\s*/, "")}</span></td>
                      <td><span className="muted" style={{ fontSize: 12 }}>{d.direction || "—"}</span></td>
                      <td><span style={{ fontSize: 12 }}>{d.service || "—"}</span></td>
                      {(ctx.role === "chef" || ctx.role === "admin") && <td><span style={{ fontSize: 12 }}>{d.emplacement || "—"}</span></td>}
                      <td onClick={e => e.stopPropagation()}>
                        <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                          <button className="ra-btn tip" data-tip="Consulter" onClick={() => ctx.openDoc(d)}>
                            <Icon name="eye" size={16} />
                          </button>
                          <button className="ra-btn tip" data-tip="Télécharger"
                            onClick={async () => {
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
                                a.download = d.original_name || d.ref || d.id;
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
        </div>
      )}
    </div>
  );
}
