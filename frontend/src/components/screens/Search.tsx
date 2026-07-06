"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { api } from "@/lib/api";
import type { AppCtx, Doc } from "@/lib/types";

const SEARCH_HISTORY_KEY = "archive_search_history";
const MAX_HISTORY = 10;

function getHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
  } catch { return []; }
}

function addToHistory(q: string) {
  const h = getHistory().filter(x => x !== q);
  h.unshift(q);
  if (h.length > MAX_HISTORY) h.length = MAX_HISTORY;
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(h));
}

export default function Search({ ctx }: { ctx: AppCtx }) {
  const [q,        setQ]        = useState(ctx.searchQ || "");
  const [sort,     setSort]     = useState(ctx.searchSort || "recent");
  const [filterDir, setFilterDir] = useState("");
  const [filterSvc, setFilterSvc] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [sortTouched, setSortTouched] = useState(!!ctx.searchSort);
  const inputRef = useRef<HTMLInputElement>(null);
  const histRef = useRef<HTMLDivElement>(null);

  const [docs,    setDocs]    = useState<Doc[]>(ctx.hasSearched ? ctx.searchDocs : []);
  const [total,   setTotal]   = useState(ctx.hasSearched ? ctx.searchTotal : 0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [hasSearched, setHasSearched] = useState(ctx.hasSearched);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (histRef.current && !histRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const fetchDocs = useCallback(async (params: NonNullable<Parameters<typeof api.archives.list>[0]>) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.archives.list(params);
      setDocs(res.archives);
      setTotal(res.total);
      ctx.setSearch(params.q || '', res.archives, res.total, sortTouched ? params.sort || '' : '');
    } catch {
      setError("Impossible de charger le fonds documentaire.");
    } finally {
      setLoading(false);
    }
  }, [ctx]);

  const doSearch = () => {
    const trimmed = q.trim();
    if (!trimmed && !filterDir && !filterSvc && !filterDate) return;
    if (trimmed) addToHistory(trimmed);
    setHistory(getHistory());
    setHasSearched(true);
    setShowHistory(false);
    const params: Parameters<typeof api.archives.list>[0] = { q: trimmed };
    if (sortTouched && sort) params.sort = sort;
    if (filterDir) params.direction = filterDir;
    if (filterSvc) params.service = filterSvc;
    if (filterDate) { params.from = filterDate; params.to = filterDate; }
    fetchDocs(params);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch();
  };

  const filteredHistory = q.trim()
    ? history.filter(h => h.toLowerCase().startsWith(q.trim().toLowerCase()))
    : history;

  const clearAll = () => {
    setQ(""); setDocs([]); setHasSearched(false); setFilterDir(""); setFilterSvc(""); setFilterDate("");
    setSort("recent"); setSortTouched(false);
    ctx.clearSearch();
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
      <div className="card" style={{ padding: "10px 12px", marginBottom: 16 }}>
        {/* Première ligne : input + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="search" size={19} className="muted-3" />
          <div style={{ position: "relative", flex: 1 }}>
            <input ref={inputRef}
              value={q} onChange={e => setQ(e.target.value)} onKeyDown={handleKeyDown}
              onFocus={() => setShowHistory(true)}
              placeholder="Rechercher par titre, référence, mot-clé…"
              style={{ width: "100%", border: "none", outline: "none", background: "none", fontSize: 15 }}
            />
            {q.trim() && showHistory && filteredHistory.length > 0 && (
              <div ref={histRef} className="card"
                style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 4, padding: 4, fontSize: 13, maxHeight: 280, overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
                {filteredHistory.map((h, i) => (
                  <div key={i} className="row gap-2 center" role="button" tabIndex={0}
                    style={{ padding: "7px 8px", borderRadius: "var(--r-sm)", cursor: "pointer" }}
                    onClick={() => { setQ(h); setShowHistory(false); inputRef.current?.focus(); }}
                    onKeyDown={e => e.key === "Enter" && (setQ(h), setShowHistory(false))}>
                    <Icon name="history" size={14} className="muted-3" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {q && <button className="ra-btn" onClick={clearAll}><Icon name="x" size={16} /></button>}
          <button className="btn btn-sm" onClick={doSearch} style={{ fontWeight: 600, flexShrink: 0 }}>
            <Icon name="search" size={15} /> Rechercher
          </button>
        </div>

        {/* Deuxième ligne : filtres direction / service */}
        <div className="row gap-2 center wrap" style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <span className="muted-3 mono" style={{ fontSize: 11 }}>FILTRES</span>
          {(() => {
            const hasRestrictions = ctx.role !== "chef" && ctx.role !== "admin" && ctx.user.rights && Object.keys(ctx.user.rights).length > 0;
            const allowedDirs = hasRestrictions
              ? ctx.directions.filter(d => ctx.user.rights[d])
              : ctx.directions;
            const allowedSvcs = hasRestrictions
              ? ctx.services.filter(s => ctx.serviceDirections[s] && ctx.user.rights[ctx.serviceDirections[s]])
              : ctx.services;
            return <>
              <select className="select" style={{ height: 32, width: "auto", fontSize: 12.5, paddingRight: 26 }}
                value={filterDir} onChange={e => { setFilterDir(e.target.value); if (e.target.value && filterSvc && ctx.serviceDirections[filterSvc] !== e.target.value) setFilterSvc(""); }}>
                <option value="">Toutes les directions</option>
                {allowedDirs.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="select" style={{ height: 32, width: "auto", fontSize: 12.5, paddingRight: 26 }}
                value={filterSvc} onChange={e => { setFilterSvc(e.target.value); }}>
                <option value="">Tous les services</option>
                {(filterDir ? allowedSvcs.filter(s => ctx.serviceDirections[s] === filterDir) : allowedSvcs).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </>;
          })()}
          {(filterDir || filterSvc || filterDate) && (
            <button className="ra-btn muted-3" onClick={() => { setFilterDir(""); setFilterSvc(""); setFilterDate(""); }} style={{ fontSize: 12 }}>
              <Icon name="x" size={13} />Réinitialiser
            </button>
          )}
          {(ctx.role === "chef" || ctx.role === "admin") && (
            <input type="date" className="input" style={{ height: 32, width: 150, fontSize: 12 }}
              value={filterDate} onChange={e => setFilterDate(e.target.value)} title="Filtrer par date" />
          )}
          {ctx.role === "chef" || ctx.role === "admin" ? (
            <div className="row gap-2 center" style={{ marginLeft: "auto" }}>
              <span className="muted-3 mono" style={{ fontSize: 11 }}>TRIER</span>
              <select className="select btn-sm" style={{ height: 32, width: "auto", paddingRight: 26 }} value={sort} onChange={e => { const v = e.target.value; setSort(v); setSortTouched(true); const params: Parameters<typeof api.archives.list>[0] = { q, sort: v }; if (filterDir) params.direction = filterDir; if (filterSvc) params.service = filterSvc; if (filterDate) { params.from = filterDate; params.to = filterDate; } if (!hasSearched) setHasSearched(true); fetchDocs(params); }}>
                <option value="recent">Plus récents</option>
                <option value="ancien">Plus anciens</option>
                <option value="vues">Plus consultés</option>
                <option value="titre">Titre A→Z</option>
              </select>
            </div>
          ) : null}
        </div>
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
                  <th style={{ width: 120 }}>Mot-clé</th>
                  <th style={{ width: 90 }}>Série</th>
                  <th style={{ width: 100 }}>Sous-série</th>
                  <th style={{ width: 100 }}>Direction</th>
                  <th style={{ width: 100 }}>Service</th>
                  {(ctx.role === "chef" || ctx.role === "admin") && <th style={{ width: 90 }}>Emplacement</th>}
                  <th style={{ width: 90, textAlign: "right" }}>Actions</th>
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
                    <tr key={d.id}>
                      <td><span className="mono muted" style={{ fontSize: 11.5 }}>{d.cote || "—"}</span></td>
                      <td>
                          <div className="row gap-2 center" style={{ minWidth: 0 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>
                              {d.title}
                            </span>
                            {d.status === "brouillon" && (
                              <span className="badge" style={{ background: "var(--gold-soft, #fef3c7)", color: "var(--gold-deep, #92400e)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: .3, whiteSpace: "nowrap", flexShrink: 0 }}>Brouillon</span>
                            )}
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
        </div>
      )}
    </div>
  );
}
