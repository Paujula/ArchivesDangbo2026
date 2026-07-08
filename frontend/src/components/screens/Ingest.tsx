"use client";

import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import { CONSERVATION, FORMATS } from "@/lib/data";
import { api, ApiError, ApiService } from "@/lib/api";
import type { AppCtx } from "@/lib/types";

interface FileState {
  name:     string;
  size:     number;   // Mo
  progress: number;   // 0-100
  done:     boolean;
  tempId?:  string;
  originalName?: string;
  error?:   string;
}

export default function Ingest({ ctx }: { ctx: AppCtx }) {
  const [drag,       setDrag]       = useState(false);
  const [file,       setFile]       = useState<FileState | null>(null);
  const [form,       setForm]       = useState({ title: "", status: "Courante", format: "", direction: "", serie: "", sousSerie: "", emplacement: "", service: ctx.user.service || "", date: "", cote: "", pages: "", restricted: false, description: "" });

  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [directions, setDirections] = useState<{ id: string; nom_direction: string }[]>([]);
  const [services,   setServices]   = useState<ApiService[]>([]);
  const [series,     setSeries]     = useState<{ id: string; nom_serie: string; sous_series: { id: string; libelle_sous_serie: string }[] }[]>([]);
  const [sousSeries, setSousSeries] = useState<{ id: string; libelle_sous_serie: string; id_serie: string }[]>([]);
  const [emplacements, setEmplacements] = useState<{ id: string; nom_emplacement: string }[]>([]);
  const [dirSearch, setDirSearch] = useState("");
  const [showDirSearch, setShowDirSearch] = useState(false);
  const [svcSearch, setSvcSearch] = useState("");
  const [showSvcSearch, setShowSvcSearch] = useState(false);
  const [serieSearch, setSerieSearch] = useState("");
  const [showSerieSearch, setShowSerieSearch] = useState(false);
  const [sousSerieSearch, setSousSerieSearch] = useState("");
  const [showSsSearch, setShowSsSearch] = useState(false);
  const [emplSearch, setEmplSearch] = useState("");
  const [showEmplSearch, setShowEmplSearch] = useState(false);
  const filteredSousSeries = form.serie ? sousSeries.filter(ss => ss.id_serie === form.serie) : [];
  const searchedSousSeries = sousSerieSearch ? filteredSousSeries.filter(ss => ss.libelle_sous_serie.toLowerCase().includes(sousSerieSearch.toLowerCase())) : filteredSousSeries;
  const searchedEmplacements = emplSearch ? emplacements.filter(e => e.nom_emplacement.toLowerCase().includes(emplSearch.toLowerCase())) : emplacements;
  const searchedDirections = dirSearch ? directions.filter(d => d.nom_direction.toLowerCase().includes(dirSearch.toLowerCase())) : directions;
  const filteredServices = form.direction
    ? services.filter(s => s.direction_id === form.direction)
    : services;
  const searchedServices = svcSearch ? filteredServices.filter(s => s.name.toLowerCase().includes(svcSearch.toLowerCase())) : filteredServices;
  const searchedSeries = serieSearch ? series.filter(s => s.nom_serie.toLowerCase().includes(serieSearch.toLowerCase())) : series;
  const autresService = services.find(s => s.name === "Autres");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLDivElement>(null);
  const svcRef = useRef<HTMLDivElement>(null);
  const serieRef = useRef<HTMLDivElement>(null);
  const ssRef = useRef<HTMLDivElement>(null);
  const emplRef = useRef<HTMLDivElement>(null);

  const set = (k: string, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  // ── Upload réel avec suivi de progression ─────────────────────────────────

  const uploadFile = async (f: File) => {
    setErrors(e => ({ ...e, file: "" }));
    setFile({ name: f.name, size: 0, progress: 0, done: false });

    try {
      const res = await api.archives.upload(f, (pct) => {
        setFile(prev => prev ? { ...prev, progress: pct } : prev);
      });
      setFile({ name: f.name, size: res.size_mb, progress: 100, done: true, tempId: res.temp_id, originalName: res.original_name });
      // Auto-remplir le nombre de pages si le backend l'a détecté
      if (res.pages > 0) {
        set("pages", String(res.pages));
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erreur lors du téléversement.";
      setFile(prev => prev ? { ...prev, done: false, error: msg } : null);
      setErrors(e => ({ ...e, file: msg }));
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) uploadFile(f);
  };

  useEffect(() => {
    api.settings.listDirections().then(r => setDirections(r.directions.map((d: any) => ({ ...d, id: String(d.id) })))).catch(() => ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger les directions." }));
    api.settings.listServices().then(r => setServices(r.services.map((s: any) => ({ ...s, id: String(s.id), direction_id: s.direction_id != null ? String(s.direction_id) : null })))).catch(() => ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger les services." }));
    api.settings.listSeries().then(r => setSeries(r.series.map((s: any) => ({ ...s, id: String(s.id), sous_series: s.sous_series.map((ss: any) => ({ ...ss, id: String(ss.id) })) })))).catch(() => ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger les séries." }));
    api.settings.listSousSeries().then(r => setSousSeries(r.sous_series.map((s: any) => ({ ...s, id: String(s.id), id_serie: String(s.id_serie) })))).catch(() => ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger les sous-séries." }));
    api.settings.listEmplacements().then(r => setEmplacements(r.emplacements.map((e: any) => ({ ...e, id: String(e.id) })))).catch(() => ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger les emplacements." }));
  }, [ctx]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dirRef.current && !dirRef.current.contains(t)) setShowDirSearch(false);
      if (svcRef.current && !svcRef.current.contains(t)) setShowSvcSearch(false);
      if (serieRef.current && !serieRef.current.contains(t)) setShowSerieSearch(false);
      if (ssRef.current && !ssRef.current.contains(t)) setShowSsSearch(false);
      if (emplRef.current && !emplRef.current.contains(t)) setShowEmplSearch(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim())    e.title   = "Le titre est obligatoire";
    if (!form.service)         e.service = "Sélectionnez un service";
    if (!form.serie)           e.serie   = "Sélectionnez une série";
    if (!form.date)            e.date    = "Indiquez la date du document";
    if (!file?.done)           e.file    = "Téléversez d'abord le fichier scanné";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Soumission ──────────────────────────────────────────────────────────────

  const submit = async (asDraft: boolean) => {
    if (!asDraft && !validate()) {
      ctx.toast({ tone: "danger", title: "Champs manquants", body: "Veuillez corriger les champs signalés en rouge." });
      return;
    }

    setSubmitting(true);
    const emplName = form.emplacement ? emplacements.find(e => e.id === form.emplacement)?.nom_emplacement || form.emplacement : undefined;
    try {
      await api.archives.create({
        title:       form.title,
        cote:        form.cote || undefined,
        direction:   form.direction || undefined,
        serie:       form.serie || undefined,
        sous_serie:  form.sousSerie || undefined,
        emplacement: emplName,
        service:     form.service,
        status:      form.status,
        format:      form.format || undefined,
        date:        form.date || new Date().toISOString().slice(0, 10),
        pages:       form.pages ? parseInt(form.pages) : undefined,
        restricted:  form.restricted,
        description: form.description || undefined,
        keywords:    form.description ? form.description.split(/[,;]+/).map(s => s.trim()).filter(Boolean) : undefined,
        temp_id:     file?.tempId,
        original_name: file?.originalName,
        draft:       asDraft,
      });

      ctx.toast({
        tone: asDraft ? "gold" : undefined,
        title: asDraft ? "Brouillon enregistré" : "Archive indexée et validée",
        body: asDraft
          ? (form.title || "Document") + " — vous pourrez la compléter plus tard."
          : (form.title || "Nouvelle archive") + " a été ajoutée au fonds.",
      });

      // Réinitialiser le formulaire
      setForm({ title: "", status: "Courante", format: "", direction: "", serie: "", sousSerie: "", emplacement: "", service: ctx.user.service || "", date: "", cote: "", pages: "", restricted: false, description: "" });
      setFile(null);
      setErrors({});

      if (!asDraft) ctx.navigate("search");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement.";
      ctx.toast({ tone: "danger", title: "Erreur", body: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-pad" style={{ maxWidth: 1340 }}>
      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff"
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      <div className="page-head">
        <div className="ph-left">
          <button className="row gap-2 center muted" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }}
            onClick={() => ctx.navigate("search")}>
            <Icon name="chevronLeft" size={15} />Retour au fonds
          </button>
          <h1>Numériser une archive</h1>
          <div className="ph-sub">Téléversez le document scanné puis renseignez sa fiche d&apos;indexation.</div>
        </div>
        <div className="row gap-2 center mono muted-3" style={{ fontSize: 11.5 }}>
          <Icon name="shieldCheck" size={15} /><span>Saisie par {ctx.user.name}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: "var(--gap-grid)", alignItems: "start" }}>
        {/* Zone Upload */}
        <div className="card card-pad" style={{ position: "sticky", top: 12 }}>
          <div className="row gap-2 center" style={{ marginBottom: 12 }}>
            <div className="s-ico" style={{ background: "var(--gold-soft)", color: "var(--gold-strong)", width: 30, height: 30 }}>
              <Icon name="scan" size={16} />
            </div>
            <strong style={{ fontSize: 14 }}>Fichier scanné</strong>
          </div>

          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${drag ? "var(--primary)" : errors.file ? "var(--danger)" : "var(--border-strong)"}`,
                background: drag ? "var(--primary-soft)" : "var(--surface-2)",
                borderRadius: "var(--r-lg)", padding: "44px 20px", textAlign: "center", cursor: "pointer",
                transition: "all .15s",
              }}>
              <div className="s-ico" style={{ margin: "0 auto 14px", width: 52, height: 52, background: "var(--surface)", color: "var(--primary)", boxShadow: "var(--shadow-sm)" }}>
                <Icon name="upload" size={24} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Glissez-déposez le scan ici</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 5 }}>
                ou <span style={{ color: "var(--primary)", fontWeight: 600 }}>parcourez vos fichiers</span>
              </div>
              <div className="muted-3 mono" style={{ fontSize: 10.5, marginTop: 14, letterSpacing: ".06em" }}>
                PDF · JPEG · PNG · TIFF — 50 Mo max
              </div>
              {errors.file && (
                <div className="err-msg" style={{ justifyContent: "center", marginTop: 12 }}>
                  <Icon name="alert" size={13} />{errors.file}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ position: "relative" }}>
                <div className="scan-ph" style={{ height: 280, flexDirection: "column", gap: 8, opacity: file.done ? 1 : .6 }}>
                  <Icon name="file" size={30} />
                  <span>{file.done ? "Aperçu du document" : file.error ? "Échec du téléversement" : "Téléversement…"}</span>
                </div>
                {file.done && (
                  <div className="row gap-2" style={{ position: "absolute", top: 10, right: 10 }}>
                    <button className="icon-btn tip" data-tip="Pivoter" style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
                      <Icon name="rotate" size={15} />
                    </button>
                    <button className="icon-btn tip" data-tip="Plein écran" style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
                      <Icon name="maximize" size={15} />
                    </button>
                  </div>
                )}
              </div>
              <div className="row gap-3 center" style={{ marginTop: 12, padding: "11px 12px", background: "var(--surface-2)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                <div className="s-ico" style={{ background: "var(--danger-soft)", color: "var(--danger-deep)", width: 32, height: 32 }}>
                  <Icon name="file" size={16} />
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row between center">
                    <span style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                    <span className="mono muted-3" style={{ fontSize: 11 }}>
                      {file.done ? file.size + " Mo" : Math.round(file.progress) + " %"}
                    </span>
                  </div>
                  {file.error ? (
                    <div className="row gap-2 center" style={{ marginTop: 3 }}>
                      <Icon name="alert" size={13} style={{ color: "var(--danger)" }} />
                      <span style={{ fontSize: 11.5, color: "var(--danger)", fontWeight: 600 }}>{file.error}</span>
                    </div>
                  ) : !file.done ? (
                    <div className="bar" style={{ marginTop: 6 }}>
                      <i style={{ width: file.progress + "%", transition: "width .18s" }} />
                    </div>
                  ) : (
                    <div className="row gap-2 center" style={{ marginTop: 3 }}>
                      <Icon name="check" size={13} style={{ color: "var(--primary)" }} />
                      <span style={{ fontSize: 11.5, color: "var(--primary-strong)", fontWeight: 600 }}>Téléversé · prêt à indexer</span>
                    </div>
                  )}
                </div>
                <button className="ra-btn danger" onClick={() => setFile(null)}><Icon name="trash" size={15} /></button>
              </div>
            </div>
          )}
          <div className="row gap-2 center muted-3" style={{ marginTop: 14, fontSize: 11.5 }}>
            <Icon name="info" size={14} />
            <span>Le fichier d&apos;origine est conservé sans modification (préservation).</span>
          </div>
        </div>

        {/* Zone Indexation */}
        <div className="card card-pad">
          <strong style={{ fontSize: 14, display: "block", marginBottom: 4 }}>Fiche d&apos;indexation</strong>
          <div className="muted" style={{ fontSize: 12.5, marginBottom: 18 }}>
            Les champs marqués <span style={{ color: "var(--danger)" }}>*</span> sont obligatoires.
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Cote d&apos;archivage</label>
            <input className="input" placeholder="ex : 2024-001"
              value={form.cote} onChange={e => set("cote", e.target.value)} />
            <div className="hint">Référence d'archivage (plusieurs documents peuvent partager la même cote).</div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Titre du document <span className="req">*</span></label>
            <input className={`input ${errors.title ? "error" : ""}`}
              placeholder="ex : Registre des naissances — Arrondissement de Hozin"
              value={form.title} onChange={e => set("title", e.target.value)} />
            {errors.title && <div className="err-msg"><Icon name="alert" size={13} />{errors.title}</div>}
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Analyse / Mot clés</label>
            <textarea className="input" style={{ minHeight: 80, resize: "vertical" }} placeholder="Description du contenu, observations…"
              value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div className="field" style={{ position: "relative" }} ref={dirRef}>
              <label>Direction</label>
              <div className={`select ${form.direction ? "" : "placeholder"}`} style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => setShowDirSearch(!showDirSearch)}>
                {form.direction ? directions.find(d => d.id === form.direction)?.nom_direction : "— Choisir —"}
              </div>
              {showDirSearch && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 2,
                  background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)",
                  boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
                  <div className="row gap-1 center" style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>
                    <Icon name="search" size={13} className="muted-3" />
                    <input className="input" style={{ flex: 1, height: 28, fontSize: 12.5, border: "none", outline: "none", background: "none" }}
                      placeholder="Rechercher une direction…" value={dirSearch} autoFocus
                      onChange={e => setDirSearch(e.target.value)} />
                    {dirSearch && <button className="ra-btn" onClick={() => setDirSearch("")}><Icon name="x" size={13} /></button>}
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {searchedDirections.length === 0 ? (
                      <div className="muted-3" style={{ padding: "12px 14px", fontSize: 12.5 }}>Aucune direction trouvée.</div>
                    ) : searchedDirections.map(d => (
                      <div key={d.id} role="button" tabIndex={0}
                        style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--border)", background: d.id === form.direction ? "var(--primary-tint)" : "" }}
                        onClick={() => { set("direction", d.id); set("service", ""); setDirSearch(""); setShowDirSearch(false); }}
                        onKeyDown={e => e.key === "Enter" && (set("direction", d.id), setShowDirSearch(false))}>
                        {d.nom_direction}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="field" style={{ position: "relative" }} ref={svcRef}>
              <label>Service <span className="req">*</span></label>
              <div className={`select ${form.service ? "" : "placeholder"} ${errors.service ? "error" : ""}`} style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => setShowSvcSearch(!showSvcSearch)}>
                {form.service ? (filteredServices.find(s => s.id === form.service) || autresService)?.name : "— Choisir —"}
              </div>
              {showSvcSearch && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 2,
                  background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)",
                  boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
                  <div className="row gap-1 center" style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>
                    <Icon name="search" size={13} className="muted-3" />
                    <input className="input" style={{ flex: 1, height: 28, fontSize: 12.5, border: "none", outline: "none", background: "none" }}
                      placeholder="Rechercher un service…" value={svcSearch} autoFocus
                      onChange={e => setSvcSearch(e.target.value)} />
                    {svcSearch && <button className="ra-btn" onClick={() => setSvcSearch("")}><Icon name="x" size={13} /></button>}
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {(() => { const base = filteredServices.length > 0 ? filteredServices : (autresService ? [autresService] : []); const items = svcSearch ? base.filter(s => s.name.toLowerCase().includes(svcSearch.toLowerCase())) : base; if (items.length === 0) return <div className="muted-3" style={{ padding: "12px 14px", fontSize: 12.5 }}>Aucun service trouvé.</div>; return items.map(s => (
                      <div key={s.id} role="button" tabIndex={0}
                        style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--border)", background: s.id === form.service ? "var(--primary-tint)" : "" }}
                        onClick={() => { set("service", s.id); setSvcSearch(""); setShowSvcSearch(false); }}
                        onKeyDown={e => e.key === "Enter" && (set("service", s.id), setShowSvcSearch(false))}>
                        {s.name}
                      </div>
                    )); })()}
                  </div>
                </div>
              )}
              {errors.service && <div className="err-msg"><Icon name="alert" size={13} />{errors.service}</div>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div className="field" style={{ position: "relative" }} ref={serieRef}>
              <label>Série <span className="req">*</span></label>
              <div className={`select ${form.serie ? "" : "placeholder"} ${errors.serie ? "error" : ""}`} style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => setShowSerieSearch(!showSerieSearch)}>
                {form.serie ? series.find(s => s.id === form.serie)?.nom_serie : "— Choisir —"}
              </div>
              {showSerieSearch && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 2,
                  background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)",
                  boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
                  <div className="row gap-1 center" style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>
                    <Icon name="search" size={13} className="muted-3" />
                    <input className="input" style={{ flex: 1, height: 28, fontSize: 12.5, border: "none", outline: "none", background: "none" }}
                      placeholder="Rechercher une série…" value={serieSearch} autoFocus
                      onChange={e => setSerieSearch(e.target.value)} />
                    {serieSearch && <button className="ra-btn" onClick={() => setSerieSearch("")}><Icon name="x" size={13} /></button>}
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {searchedSeries.length === 0 ? (
                      <div className="muted-3" style={{ padding: "12px 14px", fontSize: 12.5 }}>Aucune série trouvée.</div>
                    ) : searchedSeries.map(s => (
                      <div key={s.id} role="button" tabIndex={0}
                        style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--border)", background: s.id === form.serie ? "var(--primary-tint)" : "" }}
                        onClick={() => { set("serie", s.id); set("sousSerie", ""); setSousSerieSearch(""); setShowSsSearch(false); setSerieSearch(""); setShowSerieSearch(false); }}
                        onKeyDown={e => e.key === "Enter" && (set("serie", s.id), setShowSerieSearch(false))}>
                        {s.nom_serie}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.serie && <div className="err-msg"><Icon name="alert" size={13} />{errors.serie}</div>}
            </div>
            <div className="field" style={{ position: "relative" }} ref={ssRef}>
              <label>Sous-série</label>
              <div className={`select ${form.sousSerie ? "" : "placeholder"}`} style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => setShowSsSearch(!showSsSearch)}>
                {form.sousSerie ? sousSeries.find(ss => ss.id === form.sousSerie)?.libelle_sous_serie : "— Choisir —"}
              </div>
              {showSsSearch && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 2,
                  background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)",
                  boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
                  <div className="row gap-1 center" style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>
                    <Icon name="search" size={13} className="muted-3" />
                    <input className="input" style={{ flex: 1, height: 28, fontSize: 12.5, border: "none", outline: "none", background: "none" }}
                      placeholder="Rechercher une sous-série…" value={sousSerieSearch} autoFocus
                      onChange={e => setSousSerieSearch(e.target.value)} />
                    {sousSerieSearch && <button className="ra-btn" onClick={() => setSousSerieSearch("")}><Icon name="x" size={13} /></button>}
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {searchedSousSeries.length === 0 ? (
                      <div className="muted-3" style={{ padding: "12px 14px", fontSize: 12.5 }}>Aucune sous-série trouvée.</div>
                    ) : searchedSousSeries.map(ss => (
                      <div key={ss.id} role="button" tabIndex={0}
                        style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--border)", background: ss.id === form.sousSerie ? "var(--primary-tint)" : "" }}
                        onClick={() => { set("sousSerie", ss.id); setSousSerieSearch(""); setShowSsSearch(false); }}
                        onKeyDown={e => e.key === "Enter" && (set("sousSerie", ss.id), setShowSsSearch(false))}>
                        {ss.libelle_sous_serie}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="field" style={{ position: "relative", marginBottom: 16 }} ref={emplRef}>
            <label>Emplacement physique</label>
            <div className={`select ${form.emplacement ? "" : "placeholder"}`} style={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => setShowEmplSearch(!showEmplSearch)}>
              {form.emplacement ? emplacements.find(e => e.id === form.emplacement)?.nom_emplacement : "— Choisir —"}
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
                  {searchedEmplacements.length === 0 ? (
                    <div className="muted-3" style={{ padding: "12px 14px", fontSize: 12.5 }}>Aucun emplacement trouvé.</div>
                  ) : searchedEmplacements.map(e => (
                    <div key={e.id} role="button" tabIndex={0}
                      style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--border)", background: e.id === form.emplacement ? "var(--primary-tint)" : "" }}
                      onClick={() => { set("emplacement", e.id); setEmplSearch(""); setShowEmplSearch(false); }}
                      onKeyDown={e2 => e2.key === "Enter" && (set("emplacement", e.id), setShowEmplSearch(false))}>
                      {e.nom_emplacement}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Statut de conservation</label>
            <div className="seg" style={{ width: "100%" }}>
              {Object.entries(CONSERVATION).map(([s, info]) => (
                <button key={s} className={form.status === s ? "on" : ""} style={{ flex: 1 }} onClick={() => set("status", s)}>
                  {s}
                  <span className="muted-3" style={{ display: "block", fontSize: 10, fontWeight: 500 }}>{info.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Format physique d&apos;origine</label>
            <select className="select" value={form.format} onChange={e => set("format", e.target.value)}>
              <option value="">— Choisir —</option>
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Date de l'enregistrement du document <span className="req">*</span></label>
            <input type="date" className={`input ${errors.date ? "error" : ""}`} value={form.date} onChange={e => set("date", e.target.value)} />
            {errors.date && <div className="err-msg"><Icon name="alert" size={13} />{errors.date}</div>}
          </div>

          {/* Accès restreint */}
          <div className="row gap-3 center" style={{ marginBottom: 22, padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
            <input type="checkbox" id="restricted" checked={form.restricted as boolean}
              onChange={e => set("restricted", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--primary)", cursor: "pointer" }} />
            <label htmlFor="restricted" style={{ cursor: "pointer", userSelect: "none" }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Accès restreint au service</span>
              <span className="muted" style={{ display: "block", fontSize: 12 }}>Seuls les agents du service émetteur pourront consulter ce document.</span>
            </label>
          </div>

          <div className="hr" style={{ margin: "0 0 16px" }} />
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => submit(false)} disabled={submitting}>
            {submitting
              ? <><span className="sk" style={{ width: 14, height: 14, borderRadius: "50%" }} />Enregistrement…</>
              : <><Icon name="check" size={16} />Enregistrer</>}
          </button>
        </div>
      </div>
    </div>
  );
}
