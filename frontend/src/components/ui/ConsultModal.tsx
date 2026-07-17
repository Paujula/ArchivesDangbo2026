"use client";

import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import { api, downloadDocument } from "@/lib/api";
import type { AppCtx, Doc } from "@/lib/types";

function DocPreview({ doc }: { doc: Doc }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }
    setFileUrl(null); setLoading(true);
    const token = localStorage.getItem("archive_token");
    fetch(api.archives.downloadUrl(doc.id), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(blob => { const url = URL.createObjectURL(blob); blobRef.current = url; setFileUrl(url); })
      .catch(() => { setFileUrl(null); })
      .finally(() => setLoading(false));
    return () => { if (blobRef.current) { URL.revokeObjectURL(blobRef.current); } };
  }, [doc.id]);

  if (loading) return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", background: "#2a312a" }}>
      <div className="sk" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.12)" }} />
    </div>
  );
  if (!fileUrl) return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", background: "#2a312a" }}>
      <span style={{ color: "rgba(223,229,218,.5)", fontSize: 12.5 }}>Aucun fichier numérisé</span>
    </div>
  );
  return (
    <div style={{ flex: 1, overflow: "hidden", background: "#2a312a" }}>
      <iframe src={fileUrl} title={doc.title}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
    </div>
  );
}

export default function ConsultModal({ doc, ctx, onClose, onEdit, downloadable = true }: {
  doc: Doc; ctx: AppCtx; onClose: () => void; onEdit?: () => void; downloadable?: boolean;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center",
      padding: 24,
    }} onClick={onClose}>
      <div className="card" style={{
        maxWidth: 1100, width: "100%", maxHeight: "90vh", overflow: "hidden",
        display: "flex", flexDirection: "column", animation: "fadeIn .15s ease",
      }} onClick={e => e.stopPropagation()}>
        <div className="row between center" style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="row gap-3 center" style={{ minWidth: 0 }}>
            <button className="row gap-2 center muted" style={{ fontSize: 12.5, fontWeight: 600, flexShrink: 0 }} onClick={onClose}>
              <Icon name="chevronLeft" size={15} />Retour
            </button>
            <span style={{ width: 1, height: 20, background: "var(--border)" }} />
            <div className="s-ico" style={{ width: 34, height: 34, background: "var(--primary-soft)", color: "var(--primary)" }}>
              <Icon name="file" size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {doc.title}
              </div>
              <div className="muted-3 mono" style={{ fontSize: 11 }}>{doc.cote || "—"}</div>
            </div>
          </div>
          <div className="row gap-2">
            {ctx.canEdit(doc) && onEdit && (
              <button className="btn btn-soft btn-sm" onClick={onEdit}>
                <Icon name="edit" size={14} />Modifier
              </button>
            )}
            {downloadable && (
              <button className="btn btn-ghost btn-sm" onClick={() => downloadDocument(doc.id, doc.original_name || doc.title || doc.id, ctx)}>
                <Icon name="download" size={14} />Télécharger
              </button>
            )}
            <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
          </div>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 380px", overflow: "hidden" }}>
          <DocPreview doc={doc} />
          <div style={{ overflowY: "auto", padding: "16px 20px", borderLeft: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--primary)", marginBottom: 14 }}>
              Métadonnées
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", alignContent: "start" }}>
              <div className="field">
                <label>Titre</label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{doc.title}</div>
              </div>
              <div className="field">
                <label>Cote d'archivage</label>
                <div style={{ fontSize: 13 }}>{doc.cote || "—"}</div>
              </div>
              <div className="field">
                <label>Analyse / Mot clés</label>
                <div style={{ fontSize: 13 }}>{doc.description || "—"}</div>
              </div>
              <div className="field">
                <label>Direction</label>
                <div style={{ fontSize: 13 }}>{doc.direction || "—"}</div>
              </div>
              <div className="field">
                <label>Service</label>
                <div style={{ fontSize: 13 }}>{doc.service || "—"}</div>
              </div>
              <div className="field">
                <label>Série</label>
                <div style={{ fontSize: 13 }}>{doc.serie || "—"}</div>
              </div>
              <div className="field">
                <label>Sous-série</label>
                <div style={{ fontSize: 13 }}>{doc.sous_serie || "—"}</div>
              </div>
              <div className="field">
                <label>Emplacement</label>
                <div style={{ fontSize: 13 }}>{doc.emplacement || "—"}</div>
              </div>
              <div className="field">
                <label>Statut</label>
                <div style={{ fontSize: 13 }}>{doc.status || "—"}</div>
              </div>
              <div className="field">
                <label>Format</label>
                <div style={{ fontSize: 13 }}>{doc.format || "—"}</div>
              </div>
              <div className="field">
                <label>Date</label>
                <div style={{ fontSize: 13 }}>{doc.date ? new Date(doc.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</div>
              </div>
              <div className="field">
                <label>Pages</label>
                <div style={{ fontSize: 13 }}>{doc.pages || "—"}</div>
              </div>
              <div className="field">
                <label>Indexé par</label>
                <div style={{ fontSize: 13 }}>{doc.indexed_by || doc.by || "—"}</div>
              </div>
              <div className="field">
                <label>Consultations</label>
                <div style={{ fontSize: 13 }}>{doc.views ?? 0}</div>
              </div>
              {doc.restricted && (
                <div className="field">
                  <div className="row gap-2 center" style={{ color: "var(--danger-deep)", fontSize: 12.5 }}>
                    <Icon name="lock" size={14} />Accès restreint
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
