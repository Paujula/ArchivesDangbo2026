"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Confirm from "@/components/ui/Confirm";
import ConsultModal from "@/components/ui/ConsultModal";
import { api, ApiError, downloadDocument } from "@/lib/api";
import type { AppCtx, Doc } from "@/lib/types";

function EditDrawer({ doc, onClose, onSaved, ctx }: { doc: Doc; onClose: () => void; onSaved: (d: Doc) => void; ctx: AppCtx }) {
  const [title, setTitle] = useState(doc.title);
  const [cote, setCote] = useState(doc.cote || "");
  const [description, setDescription] = useState(doc.description || "");
  const [emplacement, setEmplacement] = useState(doc.emplacement || "");
  const [status, setStatus] = useState(doc.status);
  const [emplSearch, setEmplSearch] = useState("");
  const [showEmplSearch, setShowEmplSearch] = useState(false);
  const emplRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState(doc.format || "");
  const [date, setDate] = useState(doc.date || "");
  const [pages, setPages] = useState(String(doc.pages || ""));
  const [restricted, setRestricted] = useState(doc.restricted);
  const [serie, setSerie] = useState(doc.serie || "");
  const [sousSerie, setSousSerie] = useState(doc.sous_serie || "");
  const [direction, setDirection] = useState(doc.direction || "");
  const [service, setService] = useState(doc.service || "");
  const [saving, setSaving] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tempId, setTempId] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewFile(file);
    setUploading(true);
    try {
      const res = await api.archives.upload(file);
      setTempId(res.temp_id);
      setUploadedName(res.original_name);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de téléverser le fichier." });
      setNewFile(null);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        cote: cote || undefined,
        description: description || undefined,
        emplacement: emplacement || undefined,
        status: status || undefined,
        format: format || undefined,
        date: date || undefined,
        pages: pages ? parseInt(pages) : undefined,
        restricted,
        serie: serie || undefined,
        sous_serie: sousSerie || undefined,
        direction: direction || undefined,
        service: service || undefined,
      };
      if (tempId) {
        payload.temp_id = tempId;
        payload.original_name = uploadedName;
      }
      const { archive } = await api.archives.update(doc.id, payload);
      onSaved(archive);
      onClose();
      ctx.toast({ title: "Document modifié", body: archive.title + " mis à jour." });
    } catch (err) {
      ctx.toast({ tone: "danger", title: "Erreur", body: err instanceof ApiError ? err.message : "Impossible de modifier." });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (emplRef.current && !emplRef.current.contains(e.target as Node)) setShowEmplSearch(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="row between center" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Modifier le document</div>
            <div className="muted-3 mono" style={{ fontSize: 11 }}>{doc.cote || "—"}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Cote d&apos;archivage</label>
            <input className="input" placeholder="ex : 2024-001" value={cote} onChange={e => setCote(e.target.value)} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Titre</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Analyse / Mot clés</label>
            <textarea className="input" style={{ minHeight: 80, resize: "vertical" }} placeholder="Description du contenu, observations…"
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div className="field">
              <label>Direction</label>
              <select className="select" value={direction} onChange={e => { setDirection(e.target.value); if (service && ctx.serviceDirections[service] !== e.target.value) setService(""); }}>
                <option value="">Sélectionner…</option>
                {ctx.directions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Service</label>
              <select className="select" value={service} onChange={e => setService(e.target.value)}>
                <option value="">Sélectionner…</option>
                {ctx.services.filter(s => !direction || ctx.serviceDirections[s] === direction).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div className="field">
              <label>Série</label>
              <select className="select" value={serie} onChange={e => setSerie(e.target.value)}>
                <option value="">Sélectionner…</option>
                {ctx.series.map(s => (
                  <option key={s.id} value={s.nom_serie}>{s.nom_serie}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Sous-série</label>
              <select className="select" value={sousSerie} onChange={e => setSousSerie(e.target.value)}
                disabled={!serie}>
                <option value="">Sélectionner…</option>
                {ctx.series.find(s => s.nom_serie === serie)?.sous_series.map(ss => (
                  <option key={ss.id} value={ss.libelle_sous_serie}>{ss.libelle_sous_serie}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field" style={{ position: "relative", marginBottom: 16 }} ref={emplRef}>
            <label>Emplacement</label>
            <div className={`select ${emplacement ? "" : "placeholder"}`} style={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => setShowEmplSearch(!showEmplSearch)}>
              {emplacement || "— Choisir —"}
            </div>
            {showEmplSearch && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 2,
                background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)",
                boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
                <div className="row gap-1 center" style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>
                  <Icon name="search" size={13} className="muted-3" />
                  <input className="input" style={{ flex: 1, height: 28, fontSize: 12.5, border: "none", outline: "none", background: "none" }}
                    placeholder="Rechercher un emplacement…" value={emplSearch} autoFocus
                    onChange={e => setEmplSearch(e.target.value)} />
                  {emplSearch && <button className="ra-btn" onClick={() => setEmplSearch("")}><Icon name="x" size={13} /></button>}
                </div>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {(emplSearch ? ctx.emplacements.filter(e => e.toLowerCase().includes(emplSearch.toLowerCase())) : ctx.emplacements).length === 0 ? (
                    <div className="muted-3" style={{ padding: "12px 14px", fontSize: 12.5 }}>Aucun emplacement trouvé.</div>
                  ) : (emplSearch ? ctx.emplacements.filter(e => e.toLowerCase().includes(emplSearch.toLowerCase())) : ctx.emplacements).map(e => (
                    <div key={e} role="button" tabIndex={0}
                      style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--border)", background: e === emplacement ? "var(--primary-tint)" : "" }}
                      onClick={() => { setEmplacement(e); setEmplSearch(""); setShowEmplSearch(false); }}
                      onKeyDown={ev => ev.key === "Enter" && (setEmplacement(e), setShowEmplSearch(false))}>
                      {e}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div className="field">
              <label>Statut</label>
              <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="Courante">Courante</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Définitive">Définitive</option>
              </select>
            </div>
            <div className="field">
              <label>Format</label>
              <input className="input" value={format} onChange={e => setFormat(e.target.value)} placeholder="ex : Registre relié" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div className="field">
              <label>Date</label>
              <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Pages</label>
              <input type="number" className="input" min={0} placeholder="ex : 214" value={pages} onChange={e => setPages(e.target.value)} />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Remplacer le fichier</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="file" className="input" onChange={handleFileChange}
                style={{ flex: 1, padding: 6 }} />
              {uploading && <div className="spinner" style={{ width: 18, height: 18 }} />}
            </div>
            {newFile && !uploading && (
              <span className="muted" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                Nouveau fichier : {newFile.name}
              </span>
            )}
            {doc.original_name && !newFile && (
              <span className="muted" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                Fichier actuel : {doc.original_name}
              </span>
            )}
          </div>

          <div className="row gap-3 center" style={{ marginBottom: 22, padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
            <input type="checkbox" id="edit-restricted" checked={restricted}
              onChange={e => setRestricted(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--primary)", cursor: "pointer" }} />
            <label htmlFor="edit-restricted" style={{ cursor: "pointer", userSelect: "none" }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Accès restreint au service</span>
              <span className="muted" style={{ display: "block", fontSize: 12 }}>Seuls les agents du service émetteur pourront consulter ce document.</span>
            </label>
          </div>
        </div>

        <div className="row between center" style={{ padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? "Modification…" : <><Icon name="check" size={15} />Modifier</>}
          </button>
        </div>
      </div>
    </>
  );
}

export default function Documents({ ctx }: { ctx: AppCtx }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filterDir, setFilterDir] = useState("");
  const [filterSvc, setFilterSvc] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [sort, setSort] = useState("");
  const [consultDoc, setConsultDoc] = useState<Doc | null>(null);
  const [editDoc, setEditDoc] = useState<Doc | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState<{ msg: string; onConfirm: () => void } | null>(null);

  const fetchDocs = useCallback(async (params: NonNullable<Parameters<typeof api.archives.list>[0]>) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.archives.list({ ...params, per_page: 100 });
      setDocs(res.archives);
      setTotal(res.total);
    } catch {
      setError("Impossible de charger les documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  const doSearch = useCallback(() => {
    const params: Parameters<typeof api.archives.list>[0] = { q: q || undefined };
    if (sort) { params.sort = sort; }
    if (filterDir) params.direction = filterDir;
    if (filterSvc) params.service = filterSvc;
    if (filterDate) { params.from = filterDate; params.to = filterDate; }
    fetchDocs(params);
  }, [q, sort, filterDir, filterSvc, filterDate, fetchDocs]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  const handleDelete = async (d: Doc) => {
    setConfirm({ msg: `Voulez-vous vraiment supprimer le document "${d.title}" ?`, onConfirm: async () => {
      try {
        await api.archives.delete(d.id);
        setDocs(docs => docs.filter(x => x.id !== d.id));
        setTotal(t => t - 1);
        ctx.toast({ title: "Document déplacé", body: d.title + " a été déplacé dans la corbeille." });
      } catch (err) {
        ctx.toast({ tone: "danger", title: "Erreur", body: err instanceof ApiError ? err.message : "Impossible de supprimer." });
      }
    }});
  };

  if (ctx.role !== "chef" && ctx.role !== "admin") {
    return (
      <div className="content-pad">
        <div className="card card-pad" style={{ maxWidth: 560, margin: "60px auto", textAlign: "center", padding: 40 }}>
          <div className="s-ico" style={{ margin: "0 auto 18px", width: 60, height: 60, background: "var(--danger-soft)", color: "var(--danger-deep)" }}>
            <Icon name="lock" size={28} />
          </div>
          <h1 style={{ fontSize: 21 }}>Accès restreint</h1>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.5 }}>
            La gestion des documents archivés est réservée à l&apos;<strong>Archiviste Chef</strong>.
          </p>
          <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => ctx.navigate("dashboard")}>
            <Icon name="chevronLeft" size={16} />Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-pad" style={{ maxWidth: 1400 }}>
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Gestion · {total} documents archivés</div>
          <h1>Document Archive</h1>
          <div className="ph-sub">Liste complète des documents archivés · cote, titre, description, emplacement, série, sous-série, service, direction.</div>
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
        <div className="row gap-2 center wrap" style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <span className="muted-3 mono" style={{ fontSize: 11 }}>FILTRES</span>
          <select className="select" style={{ height: 32, width: "auto", fontSize: 12.5, paddingRight: 26 }}
            value={filterDir} onChange={e => { setFilterDir(e.target.value); if (e.target.value && filterSvc && ctx.serviceDirections[filterSvc] !== e.target.value) setFilterSvc(""); }}>
            <option value="">Toutes les directions</option>
            {ctx.directions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="select" style={{ height: 32, width: "auto", fontSize: 12.5, paddingRight: 26 }}
            value={filterSvc} onChange={e => setFilterSvc(e.target.value)}>
            <option value="">Tous les services</option>
            {(filterDir ? ctx.services.filter(s => ctx.serviceDirections[s] === filterDir) : ctx.services).map((s, i) => <option key={s + i} value={s}>{s}</option>)}
          </select>
          <input type="date" className="input" style={{ height: 32, width: 150, fontSize: 12 }}
            value={filterDate} onChange={e => setFilterDate(e.target.value)} title="Filtrer par date" />
          {(filterDir || filterSvc || filterDate) && (
            <button className="ra-btn muted-3" onClick={() => { setFilterDir(""); setFilterSvc(""); setFilterDate(""); }} style={{ fontSize: 12 }}>
              <Icon name="x" size={13} />Réinitialiser
            </button>
          )}
          <div className="row gap-2 center" style={{ marginLeft: "auto" }}>
            <span className="muted-3 mono" style={{ fontSize: 11 }}>TRIER</span>
            <select className="select btn-sm" style={{ height: 32, width: "auto", paddingRight: 26 }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="recent">Consultés récemment</option>
              <option value="ancien">Plus anciens</option>
              <option value="vues">Plus consultés</option>
              <option value="titre">Titre A→Z</option>
            </select>
          </div>
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
            <Icon name="search" size={30} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Aucun document trouvé</div>
          </div>
        ) : (
          <div className="tbl-wrap" style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 1200 }}>
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Cote</th>
                  <th>Titre</th>
                  <th style={{ width: 130 }}>Analyse / Mot clé</th>
                  <th style={{ width: 120 }}>Emplacement</th>
                  <th style={{ width: 100 }}>Série</th>
                  <th style={{ width: 110 }}>Sous-série</th>
                  <th style={{ width: 110 }}>Service</th>
                  <th style={{ width: 110 }}>Direction</th>
                  <th style={{ width: 110 }}>Indexé par</th>
                  <th style={{ width: 100 }}>Date enreg.</th>
                  <th style={{ width: 120, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const grouped: Record<string, Record<string, Doc[]>> = {};
                  const NO_EMPL = "Sans emplacement";
                  docs.forEach(d => {
                    const empl = d.emplacement || NO_EMPL;
                    const year = d.date ? new Date(d.date).getFullYear().toString() : "Sans date";
                    if (!grouped[empl]) grouped[empl] = {};
                    if (!grouped[empl][year]) grouped[empl][year] = [];
                    grouped[empl][year].push(d);
                  });
                  const empls = Object.keys(grouped).sort((a, b) => a === NO_EMPL ? 1 : b === NO_EMPL ? -1 : a.localeCompare(b));
                  const rows: React.ReactNode[] = [];
                  empls.forEach(empl => {
                    const years = Object.keys(grouped[empl]).sort((a, b) => a === "Sans date" ? 1 : b === "Sans date" ? -1 : b.localeCompare(a));
                    rows.push(
                      <tr key={`empl-${empl}`} className="group-header">
                        <td colSpan={11} style={{ padding: "8px 12px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                          <strong style={{ fontSize: 13, cursor: "pointer" }} onClick={() => setCollapsed(c => ({ ...c, [empl]: !c[empl] }))}>
                            <Icon name={collapsed[empl] ? "chevronRight" : "chevronDown"} size={14} style={{ marginRight: 6 }} />
                            {empl}
                          </strong>
                          <span className="muted-3 mono" style={{ fontSize: 11, marginLeft: 8 }}>
                            {years.reduce((s, y) => s + grouped[empl][y].length, 0)} doc.
                          </span>
                        </td>
                      </tr>
                    );
                    if (!collapsed[empl]) {
                      years.forEach(year => {
                        rows.push(
                          <tr key={`year-${empl}-${year}`} className="group-subheader">
                            <td colSpan={11} style={{ padding: "4px 12px 4px 32px", background: "var(--bg)", fontSize: 11.5, color: "var(--text-3)" }}>
                              {year} · {grouped[empl][year].length} doc.
                            </td>
                          </tr>
                        );
                        grouped[empl][year].forEach(d => {
                          rows.push(
                            <tr key={d.id}>
                              <td><span className="mono muted" style={{ fontSize: 11.5 }}>{d.cote || "—"}</span></td>
                              <td>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{d.title}</span>
                                {d.cote && <span className="muted-3 mono" style={{ display: "block", fontSize: 10.5 }}>{d.cote}</span>}
                              </td>
                              <td>
                                {d.description
                                  ? <span style={{ fontSize: 11.5 }}>{d.description.length > 40 ? d.description.slice(0, 40) + "…" : d.description}</span>
                                  : <span className="muted-3" style={{ fontSize: 11.5 }}>—</span>}
                              </td>
                              <td><span style={{ fontSize: 12 }}>{d.emplacement || "—"}</span></td>
                              <td><Badge>{d.serie || d.type || "—"}</Badge></td>
                              <td><span style={{ fontSize: 12 }}>{(d.sous_serie || d.sub || "-").replace(/^[\dA-Za-z]+\s*[-]\s*/, "")}</span></td>
                              <td><span style={{ fontSize: 12 }}>{d.service || "—"}</span></td>
                              <td><span style={{ fontSize: 12 }}>{d.direction || "—"}</span></td>
                              <td><span style={{ fontSize: 12 }}>{d.indexed_by || d.by || "—"}</span></td>
                              <td><span className="mono tnum" style={{ fontSize: 12 }}>{d.date ? new Date(d.date).toLocaleDateString("fr-FR") : "—"}</span></td>
                              <td>
                                <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                                  <button type="button" className="ra-btn tip" data-tip="Consulter" onClick={() => setConsultDoc(d)}>
                                    <Icon name="eye" size={16} />
                                  </button>
                                  <button type="button" className="ra-btn tip" data-tip="Modifier" onClick={() => setEditDoc(d)}>
                                    <Icon name="edit" size={15} />
                                  </button>
                                  <button type="button" className="ra-btn tip" data-tip="Télécharger"
                                    onClick={() => downloadDocument(d.id, d.original_name || d.title || d.id, ctx)}>
                                    <Icon name="download" size={16} />
                                  </button>
                                  <button type="button" className="ra-btn danger tip" data-tip="Supprimer" onClick={() => handleDelete(d)}>
                                    <Icon name="trash" size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      });
                    }
                  });
                  return rows;
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {consultDoc && (
        <ConsultModal
          doc={consultDoc}
          ctx={ctx}
          onClose={() => setConsultDoc(null)}
          onEdit={() => { setEditDoc(consultDoc); setConsultDoc(null); }}
        />
      )}

      {editDoc && (
        <EditDrawer
          doc={editDoc}
          ctx={ctx}
          onClose={() => setEditDoc(null)}
          onSaved={(updated) => setDocs(prev => prev.map(d => d.id === updated.id ? updated : d))}
        />
      )}

      {confirm && (
        <Confirm
          msg={confirm.msg}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
          onCancel={() => { ctx.toast({ title: "Suppression annulée", body: "Aucune modification." }); setConfirm(null); }}
        />
      )}
    </div>
  );
}
