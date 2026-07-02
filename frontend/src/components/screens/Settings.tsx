"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import Confirm from "@/components/ui/Confirm";
import { ROLES } from "@/lib/data";
import type { AppCtx } from "@/lib/types";

function AddInline({ placeholder, onAdd, btn = "Ajouter" }: {
  placeholder: string; onAdd: (v: string) => void; btn?: string;
}) {
  const [v, setV] = useState("");
  const submit = () => { const t = v.trim(); if (t) { onAdd(t); setV(""); } };
  return (
    <div className="row gap-2" style={{ marginTop: 10 }}>
      <input className="input" style={{ flex: 1 }} placeholder={placeholder} value={v}
        onChange={e => setV(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
      <button className="btn btn-soft" onClick={submit}><Icon name="plus" size={16} />{btn}</button>
    </div>
  );
}

export default function Settings({ ctx }: { ctx: AppCtx }) {
  const { services, serviceDirections, cfg, sousSeries, series, directions } = ctx;
  const [tab, setTab] = useState<"directions" | "services" | "series">("directions");
  const [newSerieNom, setNewSerieNom] = useState("");
  const [newSerieSous, setNewSerieSous] = useState("");
  const [newSousSerie, setNewSousSerie] = useState("");
  const [newServiceDir, setNewServiceDir] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [confirm, setConfirm] = useState<{ msg: string; onConfirm: () => void } | null>(null);

  if (ctx.role !== "chef" && ctx.role !== "admin") {
    return (
      <div className="content-pad">
        <div className="card card-pad" style={{ maxWidth: 560, margin: "60px auto", textAlign: "center", padding: 40 }}>
          <div className="s-ico" style={{ margin: "0 auto 18px", width: 60, height: 60, background: "var(--danger-soft)", color: "var(--danger-deep)" }}>
            <Icon name="lock" size={28} />
          </div>
          <h1 style={{ fontSize: 21 }}>Accès restreint</h1>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.5 }}>
            La configuration de la nomenclature est réservée à l&apos;<strong>Archiviste Chef</strong>.
          </p>
          <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => ctx.navigate("dashboard")}>
            <Icon name="chevronLeft" size={16} />Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  const removeService = (s: string) => {
    setConfirm({ msg: `Voulez-vous vraiment supprimer le service "${s}" ?`, onConfirm: () => {
      cfg.removeService(s);
      ctx.toast({ title: "Service supprimé avec succès", body: s + " a été retiré de la nomenclature." });
    }});
  };
  const addService = () => {
    const s = newServiceName.trim();
    if (!s) return;
    if (!newServiceDir) {
      ctx.toast({ tone: "danger", title: "Direction requise", body: "Vous devez obligatoirement choisir une direction." });
      return;
    }
    cfg.addService(s, newServiceDir);
    ctx.toast({ title: "Service ajouté", body: s + " est désormais sélectionnable." });
    setNewServiceName("");
    setNewServiceDir("");
  };

  return (
    <div className="content-pad" style={{ maxWidth: 1340 }}>
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Administration · Nomenclature documentaire</div>
          <h1>Paramètres et Nomenclature</h1>
          <div className="ph-sub">
            Configurez les services émetteurs, le cadre de classement et les typologies d&apos;archives.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="seg" style={{ marginBottom: "var(--gap-grid)" }}>
        <button className={tab === "directions" ? "on" : ""} onClick={() => setTab("directions")}>
          <Icon name="drive" size={15} /> Directions
        </button>
        <button className={tab === "services" ? "on" : ""} onClick={() => setTab("services")}>
          <Icon name="building" size={15} /> Services
        </button>
        <button className={tab === "series" ? "on" : ""} onClick={() => setTab("series")}>
          <Icon name="folder" size={15} /> Cadre de classement
        </button>
      </div>

      {tab === "directions" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 440px) 1fr", gap: "var(--gap-grid)", alignItems: "start" }}>
          <div className="card card-pad">
            <div className="row gap-2 center" style={{ marginBottom: 4 }}>
              <div className="s-ico" style={{ width: 30, height: 30, background: "var(--slate-soft)", color: "var(--slate)" }}>
                <Icon name="drive" size={16} />
              </div>
              <strong style={{ fontSize: 14.5 }}>Directions</strong>
              <span className="badge badge-neutral" style={{ marginLeft: "auto" }}>{ctx.directions.length}</span>
            </div>
            <div className="muted" style={{ fontSize: 12.5, margin: "6px 0 14px" }}>
              Directions administratives de la mairie.
            </div>

            <div className="col" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
              {ctx.directions.length === 0 && <div className="muted-3" style={{ padding: 14, fontSize: 12.5 }}>Aucune direction.</div>}
              {ctx.directions.map((d, i) => (
                <div key={d} className="row between center"
                  style={{ padding: "11px 13px", borderBottom: i < ctx.directions.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="row gap-3 center" style={{ minWidth: 0 }}>
                    <Icon name="drive" size={15} className="muted-3" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{d}</span>
                  </div>
                  <button className="ra-btn danger tip" data-tip="Retirer" onClick={() => setConfirm({ msg: `Voulez-vous vraiment supprimer la direction "${d}" ?`, onConfirm: () => {
                    cfg.removeDirection(d);
                    ctx.toast({ title: "Direction supprimée avec succès", body: d + " a été retirée." });
                  }})}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              ))}
            </div>
            <AddInline placeholder="Nom de la nouvelle direction…" onAdd={(n) => {
              cfg.addDirection(n);
              ctx.toast({ title: "Direction ajoutée", body: n + " est désormais sélectionnable." });
            }} />
          </div>
          <div />
        </div>
      )}

      {tab === "services" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 440px) 1fr", gap: "var(--gap-grid)", alignItems: "start" }}>
          <div className="card card-pad">
            <div className="row gap-2 center" style={{ marginBottom: 4 }}>
              <div className="s-ico" style={{ width: 30, height: 30, background: "var(--slate-soft)", color: "var(--slate)" }}>
                <Icon name="building" size={16} />
              </div>
              <strong style={{ fontSize: 14.5 }}>Services émetteurs</strong>
              <span className="badge badge-neutral" style={{ marginLeft: "auto" }}>{services.length}</span>
            </div>
            <div className="muted" style={{ fontSize: 12.5, margin: "6px 0 14px" }}>
              Directions et services de la mairie pouvant déposer des archives.
            </div>

            <div className="col" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
              {services.map((s, i) => (
                <div key={s} className="row between center"
                  style={{ padding: "11px 13px", borderBottom: i < services.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="row gap-2 center" style={{ minWidth: 0, flex: 1 }}>
                    <Icon name="building" size={15} className="muted-3" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s}</span>
                    {serviceDirections[s] && (
                      <span className="badge badge-neutral" style={{ fontSize: 10, marginLeft: 6 }}>
                        {serviceDirections[s]}
                      </span>
                    )}
                  </div>
                  <button className="ra-btn danger tip" data-tip="Retirer" onClick={() => removeService(s)}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Ajout d'un service avec direction obligatoire */}
            <div style={{ marginTop: 14, padding: 12, border: "1px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--surface-2)" }}>
              <strong style={{ fontSize: 13, display: "block", marginBottom: 10 }}>Ajouter un service</strong>
              <div className="col gap-2">
                <select className="select" value={newServiceDir} onChange={e => setNewServiceDir(e.target.value)}>
                  <option value="">— Direction obligatoire —</option>
                  {directions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input className="input" placeholder="Nom du nouveau service…" value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addService()} />
                <button className="btn btn-soft" onClick={addService}>
                  <Icon name="plus" size={16} />Ajouter
                </button>
              </div>
            </div>
          </div>
          <div />
        </div>
      )}

      {tab === "series" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 440px) 1fr", gap: "var(--gap-grid)", alignItems: "start" }}>
          {/* Séries d'archives */}
          <div className="card card-pad">
            <div className="row gap-2 center" style={{ marginBottom: 4 }}>
              <div className="s-ico" style={{ width: 30, height: 30, background: "var(--primary-soft)", color: "var(--primary)" }}>
                <Icon name="folder" size={16} />
              </div>
              <strong style={{ fontSize: 14.5 }}>Séries d&apos;archives</strong>
              <span className="badge badge-neutral" style={{ marginLeft: "auto" }}>{series.length}</span>
            </div>
            <div className="muted" style={{ fontSize: 12.5, margin: "6px 0 14px" }}>
              Grandes catégories du cadre de classement (A — L).
            </div>

            <div className="col" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden", maxHeight: 400, overflowY: "auto" }}>
              {series.length === 0 && <div className="muted-3" style={{ padding: 14, fontSize: 12.5 }}>Aucune série.</div>}
              {series.map((s, i) => (
                <div key={s.id} className="row between center"
                  style={{ padding: "8px 13px", borderBottom: i < series.length - 1 ? "1px solid var(--border)" : "none", fontSize: 13 }}>
                  <div className="row gap-2 center" style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nom_serie}</span>
                    <span className="muted-3" style={{ fontSize: 11 }}>({s.sous_series.length} ss-sér.)</span>
                  </div>
                  <button className="ra-btn danger" onClick={() => setConfirm({ msg: `Voulez-vous vraiment supprimer la série "${s.nom_serie}" ?`, onConfirm: () => {
                    cfg.removeSerie(s.id);
                    ctx.toast({ title: "Série supprimée avec succès", body: s.nom_serie + " a été retirée." });
                  }})}><Icon name="trash" size={14} /></button>
                </div>
              ))}
            </div>

            {/* Ajout série */}
            <div style={{ marginTop: 14, padding: 12, border: "1px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--surface-2)" }}>
              <strong style={{ fontSize: 13, display: "block", marginBottom: 10 }}>Ajouter une série</strong>
              <div className="col gap-2">
                <input className="input" placeholder="Nom de la série" value={newSerieNom}
                  onChange={e => setNewSerieNom(e.target.value)} />
                <button className="btn btn-soft" onClick={() => {
                  if (!newSerieNom.trim()) return;
                  cfg.addSerie(newSerieNom.trim());
                  setNewSerieNom("");
                }}>
                  <Icon name="plus" size={16} />Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Sous-séries */}
          <div className="card card-pad">
            <div className="row gap-2 center" style={{ marginBottom: 4 }}>
              <div className="s-ico" style={{ width: 30, height: 30, background: "var(--gold-soft)", color: "var(--gold-strong)" }}>
                <Icon name="layers" size={16} />
              </div>
              <strong style={{ fontSize: 14.5 }}>Sous-séries</strong>
              <span className="badge badge-neutral" style={{ marginLeft: "auto" }}>{sousSeries.length}</span>
            </div>
            <div className="muted" style={{ fontSize: 12.5, margin: "6px 0 14px" }}>
              Subdivisions liées à une série (ex : 1A — Gestion administrative).
            </div>

            <div className="col" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden", maxHeight: 400, overflowY: "auto" }}>
              {sousSeries.length === 0 && <div className="muted-3" style={{ padding: 14, fontSize: 12.5 }}>Aucune sous-série.</div>}
              {sousSeries.map((s, i) => {
                const parent = series.find(sr => sr.id === s.id_serie);
                return (
                  <div key={s.id} className="row between center"
                    style={{ padding: "8px 13px", borderBottom: i < sousSeries.length - 1 ? "1px solid var(--border)" : "none", fontSize: 13 }}>
                    <div className="row gap-2 center" style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.libelle_sous_serie}</span>
                      {parent && <span className="badge badge-neutral" style={{ fontSize: 10 }}>{parent.nom_serie}</span>}
                    </div>
                    <button className="ra-btn danger" onClick={() => setConfirm({ msg: `Voulez-vous vraiment supprimer la sous-série "${s.libelle_sous_serie}" ?`, onConfirm: () => {
                      cfg.removeSousSerie(s.id);
                      ctx.toast({ title: "Sous-série supprimée avec succès", body: s.libelle_sous_serie + " a été retirée." });
                    }})}><Icon name="trash" size={14} /></button>
                  </div>
                );
              })}
            </div>

            {/* Ajout sous-série */}
            <div style={{ marginTop: 14, padding: 12, border: "1px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--surface-2)" }}>
              <strong style={{ fontSize: 13, display: "block", marginBottom: 10 }}>Ajouter une sous-série</strong>
              <div className="col gap-2">
                <select className="select" value={newSerieSous} onChange={e => setNewSerieSous(e.target.value)}>
                  <option value="">— Série parente —</option>
                  {series.map(sr => <option key={sr.id} value={sr.id}>{sr.nom_serie}</option>)}
                </select>
                <input className="input" placeholder="ex : 3A — Contrôle qualité" value={newSousSerie}
                  onChange={e => setNewSousSerie(e.target.value)} />
                <button className="btn btn-soft" onClick={() => {
                  if (!newSousSerie.trim() || !newSerieSous) return;
                  cfg.addSousSerie(newSousSerie.trim(), newSerieSous);
                  setNewSousSerie(""); setNewSerieSous("");
                }}>
                  <Icon name="plus" size={16} />Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card card-pad" style={{ marginTop: "var(--gap-grid)", display: "flex", alignItems: "center", gap: 12, background: "var(--primary-tint)", borderColor: "var(--primary-soft)" }}>
        <Icon name="info" size={18} style={{ color: "var(--primary)", flex: "0 0 auto" }} />
        <span style={{ fontSize: 12.5, color: "var(--primary-strong)" }}>
          Toute modification de la nomenclature est répercutée immédiatement dans les filtres de recherche, le formulaire de numérisation et la matrice des droits d&apos;accès.
        </span>
      </div>

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
