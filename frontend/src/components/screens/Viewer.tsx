"use client";

import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import Seal from "@/components/ui/Seal";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Confirm from "@/components/ui/Confirm";
import { api, ApiError, ApiService } from "@/lib/api";
import { CONSERVATION, FORMATS } from "@/lib/data";
import type { AppCtx, Doc } from "@/lib/types";

interface EditFileState {
  name: string;
  size: number;
  progress: number;
  done: boolean;
  tempId?: string;
  originalName?: string;
  error?: string;
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row between" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 16, alignItems: "flex-start" }}>
      <span className="muted" style={{ fontSize: 12.5, flex: "0 0 142px" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right" }}>{children}</span>
    </div>
  );
}

export default function Viewer({ ctx }: { ctx: AppCtx }) {
  const d = ctx.activeDoc;
  if (!d) return <div style={{ padding: "40px", textAlign: "center" }} className="muted">Aucun document sélectionné.</div>;

  const [tab,       setTab]       = useState(ctx.viewerTab || "meta");
  const [zoom,      setZoom]      = useState(1);
  const [rot,       setRot]       = useState(0);
  const [page,      setPage]      = useState(1);
  const [related,   setRelated]   = useState<Doc[]>([]);
  const [viewCount, setViewCount] = useState(d.views);

  // Chargement du fichier réel
  const [fileUrl,     setFileUrl]     = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(true);
  const blobUrlRef = useRef<string | null>(null);

  const pages = Math.min(d.pages || 1, 999);
  const [returnAfterSave, setReturnAfterSave] = useState(false);

  useEffect(() => {
    if (ctx.editOnOpen) {
      setEditOpen(true);
      setReturnAfterSave(true);
      ctx.setEditOnOpen(false);
    }
  }, []);

  // ── Édition ──────────────────────────────────────────────────────────────
  const [confirm, setConfirm] = useState<{ msg: string; onConfirm: () => void } | null>(null);
  const [editOpen,  setEditOpen]  = useState(false);
  const [editForm,  setEditForm]  = useState({
    title: d.title, cote: d.cote, service: d.service, direction: d.direction,
    serie: d.serie, sous_serie: d.sous_serie, emplacement: d.emplacement ?? '',
    status: d.status, format: d.format, date: d.date, pages: String(d.pages || ''),
    restricted: d.restricted, description: d.description ?? '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editFile, setEditFile] = useState<EditFileState | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editDirections, setEditDirections] = useState<{ id: string; nom_direction: string }[]>([]);
  const [editServices, setEditServices] = useState<ApiService[]>([]);

  useEffect(() => {
    api.settings.listDirections().then(r => setEditDirections(r.directions)).catch(() => {});
    api.settings.listServices().then(r => setEditServices(r.services)).catch(() => {});
  }, []);

  useEffect(() => {
    if (editOpen) {
      setEditForm({
        title: d.title, cote: d.cote, service: d.service, direction: d.direction,
        serie: d.serie, sous_serie: d.sous_serie, emplacement: d.emplacement ?? '',
        status: d.status, format: d.format, date: d.date, pages: String(d.pages || ''),
        restricted: d.restricted, description: d.description ?? '',
      });
      setEditErrors({});
      setEditFile(null);
    }
  }, [editOpen, d]);

  const setEF = (k: string, v: string | boolean) => {
    setEditForm(f => ({ ...f, [k]: v }));
    setEditErrors(e => ({ ...e, [k]: "" }));
  };

  const saveEdit = async () => {
    const e: Record<string, string> = {};
    if (!editForm.title.trim()) e.title = "Le titre est obligatoire";
    if (!editForm.date) e.date = "Indiquez la date";
    setEditErrors(e);
    if (Object.keys(e).length > 0) return;

    setEditSaving(true);
    try {
      await api.archives.update(d.id, {
        title: editForm.title,
        cote: editForm.cote || undefined,
        service: editForm.service || undefined,
        direction: editForm.direction || undefined,
        serie: editForm.serie || undefined,
        sous_serie: editForm.sous_serie || undefined,
        emplacement: editForm.emplacement || undefined,
        status: editForm.status,
        format: editForm.format || undefined,
        date: editForm.date || undefined,
        pages: editForm.pages ? parseInt(editForm.pages) : undefined,
        restricted: editForm.restricted,
        description: editForm.description || undefined,
        keywords: editForm.description ? editForm.description.split(/[,;]+/).map(s => s.trim()).filter(Boolean) : undefined,
        temp_id: editFile?.tempId,
        original_name: editFile?.originalName,
      });
      ctx.toast({ title: "Document modifié", body: editForm.title + " a été mis à jour." });
      setEditOpen(false);
      if (returnAfterSave) ctx.navigate(ctx.lastList);
      setEditFile(null);
      await ctx.refreshActiveDoc();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erreur lors de la modification.";
      ctx.toast({ tone: "danger", title: "Erreur", body: msg });
    } finally {
      setEditSaving(false);
    }
  };

  const uploadFileForEdit = async (f: File) => {
    setEditFile({ name: f.name, size: 0, progress: 0, done: false });
    try {
      const res = await api.archives.upload(f, (pct) => {
        setEditFile(prev => prev ? { ...prev, progress: pct } : prev);
      });
      setEditFile({ name: f.name, size: res.size_mb, progress: 100, done: true, tempId: res.temp_id, originalName: res.original_name });
      if (res.pages > 0) {
        setEF("pages", String(res.pages));
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erreur lors du téléversement.";
      setEditFile(prev => prev ? { ...prev, done: false, error: msg } : null);
      setEditErrors(e => ({ ...e, file: msg }));
    }
  };

  const onEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFileForEdit(f);
    e.target.value = "";
  };

  // Empêche le double-enregistrement en React StrictMode
  const viewedRef = useRef<string | null>(null);

  // ── Protection clavier global ────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'S' || e.key === 'P'))) {
        e.preventDefault();
        ctx.toast({ tone: 'danger', title: 'Action interdite', body: 'Cette action n\'est pas autorisée sur ce document.' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ctx]);

  // ── Reset quand le document change ────────────────────────────────────────

  useEffect(() => {
    setTab(ctx.viewerTab || "meta");
    setZoom(1); setRot(0); setPage(1);
  }, [d.id, ctx.viewerTab]);

  // ── Enregistrer la vue ────────────────────────────────────────────────────

  useEffect(() => {
    if (viewedRef.current === d.id) return;
    viewedRef.current = d.id;
    api.archives.recordView(d.id)
      .then(({ views }) => setViewCount(views))
      .catch(() => {/* silencieux : la vue a échoué mais ce n'est pas bloquant */});
  }, [d.id]);

  // ── Charger le fichier depuis l'API (avec token) ──────────────────────────

  useEffect(() => {
    // Libérer l'ancienne URL blob
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setFileUrl(null);
    setFileLoading(true);

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('archive_token')
      : null;

    fetch(api.archives.downloadUrl(d.id), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.blob() : Promise.reject())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setFileUrl(url);
      })
      .catch(() => setFileUrl(null))
      .finally(() => setFileLoading(false));

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [d.id]);

  // ── Archives liées ────────────────────────────────────────────────────────

  useEffect(() => {
    setRelated([]);
    api.archives.related(d.id)
      .then(res => setRelated(res.archives))
      .catch(() => {/* silencieux : les documents liés ne sont pas bloquants */});
  }, [d.id]);

  const canEdit = ctx.canEdit(d);

  const viewerRef = useRef<HTMLDivElement>(null);

  const handleViewerContext = (e: React.MouseEvent) => {
    e.preventDefault();
    ctx.toast({ tone: 'danger', title: 'Action interdite', body: 'Le téléchargement et la capture d\'écran ne sont pas autorisés sur ce document.' });
  };

  const handleViewerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p') || (e.ctrlKey && e.key === 's') || (e.ctrlKey && e.shiftKey && e.key === 'i')) {
      e.preventDefault();
      ctx.toast({ tone: 'danger', title: 'Action interdite', body: 'Cette action n\'est pas autorisée.' });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* En-tête document */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <button className="row gap-2 center muted" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }}
          onClick={() => ctx.navigate(ctx.lastList || "search")}>
          <Icon name="chevronLeft" size={15} />Retour aux résultats
        </button>
        <div className="row between center wrap gap-4">
          <div className="row gap-3 center" style={{ minWidth: 0 }}>
            <div className="s-ico" style={{ background: "var(--primary-soft)", color: "var(--primary)", width: 40, height: 40, flex: "0 0 auto" }}>
              <Icon name="file" size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="row gap-2 center wrap">
                <Badge dot="#3c5d76">{d.serie || d.type}</Badge>
                <StatusBadge status={d.status} />
              </div>
              <h1 style={{ fontSize: 19, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 620 }}>
                {d.title}
              </h1>
            </div>
          </div>
          <div className="row gap-2">
            <button className="btn btn-ghost btn-sm" style={{ opacity: .4, cursor: "not-allowed" }} disabled
              onClick={() => ctx.toast({ tone: 'danger', title: 'Action interdite', body: 'Le téléchargement n\'est pas autorisé en mode consultation.' })}>
              <Icon name="lock" size={14} />Téléchargement protégé
            </button>
            {canEdit && !ctx.corbeilleView && ctx.lastList !== "search" && ctx.lastList !== "documents" && ctx.lastList !== "demandes" && (
              <button className="btn btn-soft btn-sm" onClick={() => setEditOpen(true)}>
                <Icon name="edit" size={15} />Modifier
              </button>
            )}
            {!ctx.corbeilleView && (ctx.role === "chef" || ctx.role === "admin") && ctx.lastList !== "search" && ctx.lastList !== "documents" && ctx.lastList !== "demandes" && (
              <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger-deep)", borderColor: "var(--danger-soft)" }}
                onClick={() => setConfirm({ msg: `Voulez-vous vraiment supprimer le document "${d.title}" ?`, onConfirm: async () => {
                  try {
                    await api.archives.delete(d.id);
                    ctx.toast({ title: "Document supprimé avec succès", body: d.title + " supprimé définitivement." });
                    ctx.navigate("search");
                  } catch (err) {
                    ctx.toast({ tone: "danger", title: "Erreur", body: err instanceof ApiError ? err.message : "Impossible de supprimer." });
                  }
                }})}>
                <Icon name="trash" size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Split */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.5fr 1fr", overflow: "hidden" }}>

        {/* ── Visionneuse ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", background: "#2a312a", overflow: "hidden" }}>

          {/* Toolbar */}
          <div className="row between center" style={{ padding: "8px 14px", background: "#222820", borderBottom: "1px solid rgba(255,255,255,.08)", color: "#dfe5da" }}>
            <div className="row gap-2 center">
              {/* Page info — informatif (le PDF natif gère la navigation interne) */}
              <button className="vw-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!!fileUrl}>
                <Icon name="chevronLeft" size={16} />
              </button>
              <span className="mono" style={{ fontSize: 12 }}>
                {fileUrl ? `${pages} page${pages > 1 ? "s" : ""}` : `Page ${page} / ${pages}`}
              </span>
              <button className="vw-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={!!fileUrl}>
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
            <div className="row gap-2 center">
              <button className="vw-btn" onClick={() => setZoom(z => Math.max(.5, +(z - .2).toFixed(2)))}>
                <Icon name="zoomOut" size={16} />
              </button>
              <span className="mono" style={{ fontSize: 12, width: 44, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
              <button className="vw-btn" onClick={() => setZoom(z => Math.min(3, +(z + .2).toFixed(2)))}>
                <Icon name="zoomIn" size={16} />
              </button>
              <span style={{ width: 1, height: 18, background: "rgba(255,255,255,.12)" }} />
              <button className="vw-btn" onClick={() => setRot(r => (r + 90) % 360)}>
                <Icon name="rotate" size={15} />
              </button>
              <button className="vw-btn" onClick={() => { setZoom(1); setRot(0); }}>
                <Icon name="refresh" size={15} />
              </button>
              <button className="vw-btn" data-tip="Télécharger"
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
                <Icon name="download" size={14} />
              </button>
            </div>
          </div>

          {/* Zone document protégée */}
          <div ref={viewerRef} onContextMenu={handleViewerContext} onKeyDown={handleViewerKeyDown}
            tabIndex={0} style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden", userSelect: "none" } as React.CSSProperties}>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", zIndex: 10, opacity: .06, fontSize: 11, fontWeight: 700, letterSpacing: ".15em", color: "#fff", transform: "rotate(-30deg)", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 48 }}>DOCUMENT CONFIDENTIEL</span>
            </div>
          {fileLoading ? (
            /* Chargement */
            <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
              <div className="col center" style={{ gap: 14 }}>
                <div className="sk" style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.12)" }} />
                <span style={{ color: "rgba(223,229,218,.5)", fontSize: 12.5 }}>Chargement du document…</span>
              </div>
            </div>
          ) : fileUrl ? (
            /* Vrai fichier dans un iframe avec zoom/rotation */
            <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: "100%", height: "100%",
                transform: `scale(${zoom}) rotate(${rot}deg)`,
                transformOrigin: "center center",
                transition: "transform .2s",
              }}>
                <iframe
                  src={fileUrl}
                  title={d.title}
                  style={{ width: "100%", height: "100%", border: "none", display: "block", pointerEvents: "auto" }}
                />
              </div>
            </div>
          ) : (
            /* Aucun fichier — document simulé (fallback) */
            <div style={{ flex: 1, overflow: "auto", display: "grid", placeItems: "center", padding: 28 }}>
              <div style={{
                transform: `scale(${zoom}) rotate(${rot}deg)`, transition: "transform .2s",
                background: "#fff", width: 440, minHeight: 580,
                boxShadow: "0 14px 40px rgba(0,0,0,.4)", borderRadius: 3, padding: 38, flex: "0 0 auto"
              }}>
                <div className="col center" style={{ gap: 6, textAlign: "center", borderBottom: "2px solid #1b201a", paddingBottom: 14, marginBottom: 16 }}>
                  <Seal size={42} />
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: ".04em" }}>
                    RÉPUBLIQUE DU BÉNIN
                  </div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".1em", color: "#586156" }}>
                    MAIRIE DE DANGBO · DÉPARTEMENT DE L&apos;OUÉMÉ
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, textAlign: "center", marginBottom: 18 }}>
                  {d.sous_serie || d.sub} — {d.serie || d.type}
                </div>
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} style={{ height: 9, background: "#eef0ec", borderRadius: 3, marginBottom: 11, width: (96 - (i * 13) % 42) + "%" }} />
                ))}
                <div className="mono" style={{ fontSize: 9, color: "#aab0a4", marginTop: 18 }}>p.{page}</div>
                <div style={{ marginTop: 20, padding: "10px 12px", background: "#f5f6f4", borderRadius: 4, border: "1px solid #dde0da" }}>
                  <span style={{ fontSize: 11, color: "#6b7268" }}>Aucun fichier joint — document non numérisé</span>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Barre de statut */}
          <div className="row between center" style={{ padding: "7px 14px", background: "#222820", color: "rgba(223,229,218,.6)", borderTop: "1px solid rgba(255,255,255,.08)" }}>
            <span className="mono" style={{ fontSize: 10.5 }}>{d.format || "—"} · {d.pages} pages · {d.size} Mo</span>
            <span className="mono row gap-2 center" style={{ fontSize: 10.5 }}>
              <Icon name="shieldCheck" size={13} />Document authentifié
            </span>
          </div>
        </div>

        {/* ── Panneau détails ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
          <div className="row" style={{ borderBottom: "1px solid var(--border)", padding: "0 8px" }}>
            {([["meta", "Métadonnées"], ["history", "Traçabilité"], ["related", "Liés"]] as [string, string][]).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "14px 12px", fontSize: 13, fontWeight: 600, position: "relative",
                color: tab === k ? "var(--text)" : "var(--text-3)",
              }}>
                {l}
                {k === "history" && (d.log?.length ?? 0) > 0 && (
                  <span className="badge-count" style={{ marginLeft: 6, background: "var(--surface-3)", color: "var(--text-2)", padding: "1px 6px", borderRadius: 20, fontSize: 10.5, fontFamily: "var(--font-mono)" }}>
                    {d.log?.length ?? 0}
                  </span>
                )}
                {tab === k && <span style={{ position: "absolute", left: 12, right: 12, bottom: -1, height: 2, background: "var(--primary)", borderRadius: 2 }} />}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {tab === "meta" && (
              <div>
                <MetaRow label="Titre"><span style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.4 }}>{d.title}</span></MetaRow>
                {d.description ? <MetaRow label="Analyse / Mot clés"><span style={{ fontSize: 12.5, lineHeight: 1.4 }}>{d.description}</span></MetaRow> : null}
                <MetaRow label="Série"><Badge>{d.serie || d.type}</Badge></MetaRow>
                <MetaRow label="Sous-série">{d.sous_serie || d.sub || <span className="muted-3">—</span>}</MetaRow>
                <MetaRow label="Date du document">
                  <span className="mono">{d.date ? new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</span>
                </MetaRow>
                <MetaRow label="Service émetteur">{d.service}</MetaRow>
                <MetaRow label="Statut de conservation"><StatusBadge status={d.status} /></MetaRow>
                <MetaRow label="Format d'origine">{d.format || <span className="muted-3">—</span>}</MetaRow>
                <MetaRow label="Volume"><span className="mono">{d.pages} p. · {d.size} Mo</span></MetaRow>
                <MetaRow label="Consultations"><span className="mono tnum">{viewCount}</span></MetaRow>
                <MetaRow label="Indexé par">{d.by}</MetaRow>
              </div>
            )}

            {tab === "history" && (
              <div>
                <div className="row gap-2 center" style={{ marginBottom: 14, padding: "10px 12px", background: "var(--primary-tint)", borderRadius: "var(--r-md)", border: "1px solid var(--primary-soft)" }}>
                  <Icon name="shield" size={16} style={{ color: "var(--primary)" }} />
                  <span style={{ fontSize: 12, color: "var(--primary-strong)", fontWeight: 600 }}>
                    Journal d&apos;audit inviolable — chaque accès est horodaté et nominatif.
                  </span>
                </div>
                {(d.log?.length ?? 0) === 0 ? (
                  <div className="muted-3" style={{ fontSize: 13, textAlign: "center", padding: "30px 0" }}>Aucune entrée dans le journal.</div>
                ) : (
                  <div style={{ position: "relative", paddingLeft: 22 }}>
                    <div style={{ position: "absolute", left: 6, top: 4, bottom: 4, width: 2, background: "var(--border)" }} />
                    {[...(d.log ?? [])].reverse().map((e, i) => {
                      const tone = e.action.includes("Validation") ? "var(--primary)"
                        : e.action.includes("Téléchargement") ? "var(--gold)"
                        : e.action.includes("Indexation") || e.action.includes("créée") || e.action.includes("Brouillon") ? "var(--slate)"
                        : "var(--text-3)";
                      return (
                        <div key={i} style={{ position: "relative", paddingBottom: 16 }}>
                          <span style={{ position: "absolute", left: -22, top: 2, width: 14, height: 14, borderRadius: "50%", background: "var(--surface)", border: `2.5px solid ${tone}` }} />
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{e.action}</div>
                          <div className="row gap-2 center" style={{ marginTop: 2 }}>
                            <span className="muted" style={{ fontSize: 12 }}>{e.user}</span>
                            <span className="muted-3 mono" style={{ fontSize: 11 }}>· {e.when}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === "related" && (
              <div className="col gap-2">
                {related.length === 0 ? (
                  <div className="muted-3" style={{ fontSize: 13, textAlign: "center", padding: "30px 0" }}>Aucune archive liée.</div>
                ) : related.map(x => (
                  <button key={x.id} className="row gap-3 center"
                    style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", textAlign: "left", width: "100%" }}
                    onClick={() => ctx.openDoc(x)}>
                    <Icon name="file" size={16} className="muted-3" />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.title}</div>
                      <div className="mono muted-3" style={{ fontSize: 11 }}>{x.cote || "—"}</div>
                    </div>
                    <Icon name="chevronRight" size={15} className="muted-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal d'édition ──────────────────────────────────────────────── */}
      {editOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center",
          padding: 24,
        }} onClick={() => setEditOpen(false)}>
          <div className="card card-pad" style={{
            maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto",
            animation: "fadeIn .15s ease",
          }} onClick={e => e.stopPropagation()}>
            <div className="row between center" style={{ marginBottom: 18 }}>
              <strong style={{ fontSize: 16 }}>Modifier le document</strong>
              <button className="icon-btn" onClick={() => setEditOpen(false)}><Icon name="x" size={18} /></button>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Cote d&apos;archivage</label>
              <input className="input" placeholder="ex : 2024-001"
                value={editForm.cote} onChange={e => setEF("cote", e.target.value)} />
              <div className="hint">Référence d'archivage (plusieurs documents peuvent partager la même cote).</div>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Titre du document <span className="req">*</span></label>
              <input className={`input ${editErrors.title ? "error" : ""}`}
                value={editForm.title} onChange={e => setEF("title", e.target.value)} />
              {editErrors.title && <div className="err-msg"><Icon name="alert" size={13} />{editErrors.title}</div>}
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Analyse / Mot clés</label>
              <textarea className="input" style={{ minHeight: 80, resize: "vertical" }} placeholder="Description du contenu, observations…"
                value={editForm.description} onChange={e => setEF("description", e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="field">
                <label>Direction</label>
                <select className="select" value={editForm.direction} onChange={e => setEF("direction", e.target.value)}>
                  <option value="">— Choisir —</option>
                  {ctx.directions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Service <span className="req">*</span></label>
                <select className={`select ${editErrors.service ? "error" : ""}`} value={editForm.service} onChange={e => setEF("service", e.target.value)}>
                  <option value="">— Choisir —</option>
                  {(() => {
                    const dirId = editForm.direction ? editDirections.find(d => d.nom_direction === editForm.direction)?.id : null;
                    const filtered = dirId ? editServices.filter(s => String(s.direction_id) === String(dirId)) : [];
                    const autres = editServices.find(s => s.name === "Autres");
                    return (filtered.length > 0 ? filtered : (autres ? [autres] : [])).map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="field">
                <label>Série <span className="req">*</span></label>
                <select className={`select ${editErrors.serie ? "error" : ""}`} value={editForm.serie} onChange={e => { setEF("serie", e.target.value); setEF("sous_serie", ""); }}>
                  <option value="">— Choisir —</option>
                  {ctx.series.map(s => <option key={s.id} value={s.nom_serie}>{s.nom_serie}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Sous-série</label>
                <select className="select" value={editForm.sous_serie} onChange={e => setEF("sous_serie", e.target.value)}>
                  <option value="">— Choisir —</option>
                  {ctx.series.filter(s => s.nom_serie === editForm.serie).flatMap(s => s.sous_series).map(ss => <option key={ss.id} value={ss.libelle_sous_serie}>{ss.libelle_sous_serie}</option>)}
                </select>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Emplacement physique</label>
              <input className="input" placeholder="ex : Armoire B3, Tablette 4"
                value={editForm.emplacement} onChange={e => setEF("emplacement", e.target.value)} />
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Statut de conservation</label>
              <div className="seg" style={{ width: "100%" }}>
                {Object.entries(CONSERVATION).map(([s, info]) => (
                  <button key={s} className={editForm.status === s ? "on" : ""} style={{ flex: 1 }} onClick={() => setEF("status", s)}>
                    {s}<span className="muted-3" style={{ display: "block", fontSize: 10, fontWeight: 500 }}>{info.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Format physique d&apos;origine</label>
              <select className="select" value={editForm.format} onChange={e => setEF("format", e.target.value)}>
                <option value="">— Choisir —</option>
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Date du document <span className="req">*</span></label>
              <input type="date" className={`input ${editErrors.date ? "error" : ""}`}
                value={editForm.date} onChange={e => setEF("date", e.target.value)} />
              {editErrors.date && <div className="err-msg"><Icon name="alert" size={13} />{editErrors.date}</div>}
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Fichier numérisé</label>
              <div style={{ padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                {editFile ? (
                  <div className="row gap-2 center between">
                    <div className="row gap-2 center" style={{ minWidth: 0 }}>
                      <Icon name="file" size={16} className="muted-3" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{editFile.name}</div>
                        {editFile.done ? (
                          <span className="muted" style={{ fontSize: 11 }}>Prêt à remplacer · {editFile.size} Mo</span>
                        ) : editFile.error ? (
                          <span style={{ fontSize: 11, color: "var(--danger)" }}>{editFile.error}</span>
                        ) : (
                          <div className="row gap-2 center">
                            <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 4, maxWidth: 120 }}>
                              <div style={{ width: `${editFile.progress}%`, height: "100%", background: "var(--primary)", borderRadius: 4, transition: "width .2s" }} />
                            </div>
                            <span className="mono muted" style={{ fontSize: 11 }}>{editFile.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {editFile.done && (
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditFile(null); }}>Annuler</button>
                    )}
                  </div>
                ) : (
                  <div className="row gap-2 center between">
                    <div className="row gap-2 center" style={{ minWidth: 0 }}>
                      <Icon name={d.file && d.file !== "temp/" ? "file" : "fileX"} size={16} className="muted-3" />
                      <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.original_name || (d.file ? "Fichier actuel" : "Aucun fichier")}
                      </span>
                    </div>
                    <button className="btn btn-soft btn-sm" onClick={() => editFileInputRef.current?.click()}>
                      <Icon name="upload" size={14} />Remplacer
                    </button>
                  </div>
                )}
                <input ref={editFileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff" style={{ display: "none" }} onChange={onEditFileChange} />
              </div>
            </div>

            <div className="row gap-3 center" style={{ marginBottom: 22, padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
              <input type="checkbox" id="edit-restricted" checked={editForm.restricted}
                onChange={e => setEF("restricted", e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--primary)", cursor: "pointer" }} />
              <label htmlFor="edit-restricted" style={{ cursor: "pointer", userSelect: "none" }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Accès restreint au service</span>
                <span className="muted" style={{ display: "block", fontSize: 12 }}>Seuls les agents du service émetteur pourront consulter ce document.</span>
              </label>
            </div>

            <div className="hr" style={{ margin: "0 0 14px" }} />
            <div className="row end gap-2">
              <button className="btn btn-ghost" onClick={() => setEditOpen(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={editSaving}>
                {editSaving
                  ? <><span className="sk" style={{ width: 14, height: 14, borderRadius: "50%" }} />Enregistrement…</>
                  : <><Icon name="check" size={16} />Modifier</>}
              </button>
            </div>
          </div>
        </div>
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
