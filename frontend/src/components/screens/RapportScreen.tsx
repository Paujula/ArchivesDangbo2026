"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import ConsultModal from "@/components/ui/ConsultModal";
import { api, getToken } from "@/lib/api";
import type { AppCtx, Doc, RapportDocument } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function RapportScreen({ ctx }: { ctx: AppCtx }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(ctx.rapportDate || today);
  const [loading, setLoading] = useState(false);
  const [consultDoc, setConsultDoc] = useState<Doc | null>(null);

  const search = async () => {
    if (!date) return;
    setLoading(true);
    try {
      const res = await api.rapport.documentsByDate(date);
      ctx.setRapportState(date, res.documents, res.total);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger le rapport." });
    } finally {
      setLoading(false);
    }
  };

  const viewDocument = async (d: RapportDocument) => {
    try {
      const { archive } = await api.archives.get(d.id);
      setConsultDoc(archive);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible d'ouvrir le document." });
    }
  };

  const printDocument = async (d: RapportDocument) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/archives/${d.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (w) {
        w.onload = () => URL.revokeObjectURL(url);
      } else {
        URL.revokeObjectURL(url);
      }
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible d'imprimer le fichier." });
    }
  };

  const downloadDocument = async (d: RapportDocument) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/archives/${d.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = d.original_name || d.title || d.id;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de télécharger le fichier." });
    }
  };

  return (
    <div className="content-pad" style={{ maxWidth: 1400 }}>
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Administration · Rapport</div>
          <h1>Rapport Journalière</h1>
          <div className="ph-sub">
            Consultez les documents créés à une date donnée et les agents qui les ont indexés.
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: "var(--gap-grid)" }}>
        <div className="row gap-3 center" style={{ flexWrap: "wrap" }}>
          <div className="field" style={{ minWidth: 200 }}>
            <label className="label">Date de création</label>
            <input className="input" type="date" value={date}
              onChange={e => setDate(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()} />
          </div>
          <button className="btn" style={{ marginTop: 22 }} onClick={search} disabled={loading}>
            <Icon name="search" size={16} />{loading ? "Chargement…" : "Rechercher"}
          </button>
        </div>
      </div>

      {ctx.rapportSearched && ctx.rapportTotal === 0 ? (
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <div className="muted" style={{ fontSize: 14 }}>Aucun document trouvé pour cette date.</div>
        </div>
      ) : ctx.rapportSearched ? (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 0" }}>
            <strong style={{ fontSize: 14 }}>
              {ctx.rapportTotal} document{ctx.rapportTotal > 1 ? "s" : ""} créé{ctx.rapportTotal > 1 ? "s" : ""} le {new Date(ctx.rapportDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </strong>
          </div>

          <div className="tbl-wrap" style={{ overflowX: "auto", marginTop: 16 }}>
            <table className="tbl" style={{ fontSize: 13, minWidth: 1100 }}>
              <thead>
                <tr>
                    <th style={{ verticalAlign: "top" }}>Cote</th>
                    <th style={{ verticalAlign: "top" }}>Titre</th>
                    <th style={{ verticalAlign: "top" }}>Date enreg.</th>
                    <th style={{ verticalAlign: "top" }}>Mot clé</th>
                  <th style={{ verticalAlign: "top" }}>Série</th>
                  <th style={{ verticalAlign: "top" }}>Sous-série</th>
                  <th style={{ verticalAlign: "top" }}>Service</th>
                  <th style={{ verticalAlign: "top" }}>Direction</th>
                  <th style={{ verticalAlign: "top" }}>Indexé par</th>
                  <th style={{ verticalAlign: "top" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ctx.rapportDocs.map(d => (
                  <tr key={d.id}>
                    <td className="muted" style={{ whiteSpace: "nowrap", verticalAlign: "top" }}>{d.cote || "—"}</td>
                    <td style={{ fontWeight: 600, minWidth: 140, verticalAlign: "top" }}>{d.title}</td>
                    <td className="muted" style={{ whiteSpace: "nowrap", verticalAlign: "top" }}>{d.date || "—"}</td>
                    <td className="muted" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "top" }}>
                      {d.description || "—"}
                    </td>
                    <td style={{ verticalAlign: "top" }}>{d.serie || "—"}</td>
                    <td className="muted" style={{ verticalAlign: "top" }}>{d.sous_serie || "—"}</td>
                    <td style={{ verticalAlign: "top" }}>{d.service || "—"}</td>
                    <td style={{ verticalAlign: "top" }}>{d.direction || "—"}</td>
                    <td style={{ verticalAlign: "top" }}>
                      {d.creator
                        ? `${d.creator.prenom} ${d.creator.name}`
                        : d.indexed_by || "—"
                      }
                    </td>
                    <td style={{ verticalAlign: "top" }}>
                      <div className="row gap-1">
                        {d.file && (
                          <>
                            <button className="ra-btn tip" data-tip="Voir" onClick={() => viewDocument(d)}>
                              <Icon name="eye" size={16} />
                            </button>
                            <button className="ra-btn tip" data-tip="Imprimer" onClick={() => printDocument(d)}>
                              <Icon name="printer" size={16} />
                            </button>
                            <button className="ra-btn tip" data-tip="Télécharger" onClick={() => downloadDocument(d)}>
                              <Icon name="download" size={16} />
                            </button>
                          </>
                        )}
                        {!d.file && <span className="muted-3" style={{ fontSize: 12 }}>Aucun fichier</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {consultDoc && (
        <ConsultModal
          doc={consultDoc}
          ctx={ctx}
          onClose={() => setConsultDoc(null)}
          downloadable={false}
        />
      )}
    </div>
  );
}
