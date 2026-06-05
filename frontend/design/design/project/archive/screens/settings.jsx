/* ============================================================
   ÉCRAN 6 — Paramètres & nomenclature (Admin)
   Gestion des services émetteurs + typologies / sous-types
   ============================================================ */
const BADGE_OPTIONS = [
  { tone: "green",  color: "#0c6e4a" },
  { tone: "slate",  color: "#3c5d76" },
  { tone: "gold",   color: "#c98a16" },
  { tone: "violet", color: "#6a4d8c" },
  { tone: "danger", color: "#c1322b" },
  { tone: "neutral",color: "#868f82" },
];

function AddInline({ placeholder, onAdd, btn = "Ajouter" }) {
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

function Settings({ ctx }) {
  const D = window.DATA;
  const { services, types, typeNames, cfg } = ctx;
  const [newCatColor, setNewCatColor] = useState("green");
  const [openCat, setOpenCat] = useState(typeNames[0] || null);

  if (ctx.role !== "chef") {
    return (
      <div className="content-pad">
        <div className="card card-pad" style={{ maxWidth: 560, margin: "60px auto", textAlign: "center", padding: 40 }}>
          <div className="s-ico" style={{ margin: "0 auto 18px", width: 60, height: 60, background: "var(--danger-soft)", color: "var(--danger-deep)" }}><Icon name="lock" size={28} /></div>
          <h1 style={{ fontSize: 21 }}>Accès restreint</h1>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.5 }}>La configuration de la nomenclature est réservée à l'<strong>Archiviste Chef</strong>.</p>
          <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => ctx.navigate("dashboard")}><Icon name="chevronLeft" size={16} />Retour au tableau de bord</button>
        </div>
      </div>
    );
  }

  const serviceCount = (s) => D.DOCS.filter(d => d.service === s).length;
  const typeCount = (t) => D.DOCS.filter(d => d.type === t).length;

  const removeService = (s) => { cfg.removeService(s); ctx.toast({ tone: "gold", title: "Service retiré", body: s + " a été retiré de la nomenclature." }); };
  const addService = (s) => { cfg.addService(s); ctx.toast({ title: "Service ajouté", body: s + " est désormais sélectionnable." }); };
  const addCat = (name) => { cfg.addType(name, newCatColor); setOpenCat(name); ctx.toast({ title: "Catégorie créée", body: name + " a été ajoutée aux typologies." }); };
  const removeCat = (t) => { cfg.removeType(t); ctx.toast({ tone: "gold", title: "Catégorie retirée", body: t + " a été retirée." }); };

  return (
    <div className="content-pad" style={{ maxWidth: 1340 }}>
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Administration · Nomenclature documentaire</div>
          <h1>Paramètres &amp; nomenclature</h1>
          <div className="ph-sub">Configurez les services émetteurs et les typologies d'archives. Ces listes alimentent la recherche, la numérisation et les droits.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 440px) 1fr", gap: "var(--gap-grid)", alignItems: "start" }}>

        {/* ---------- Services émetteurs ---------- */}
        <div className="card card-pad">
          <div className="row gap-2 center" style={{ marginBottom: 4 }}>
            <div className="s-ico" style={{ width: 30, height: 30, background: "var(--slate-soft)", color: "var(--slate)" }}><Icon name="building" size={16} /></div>
            <strong style={{ fontSize: 14.5 }}>Services émetteurs</strong>
            <span className="badge badge-neutral" style={{ marginLeft: "auto" }}>{services.length}</span>
          </div>
          <div className="muted" style={{ fontSize: 12.5, margin: "6px 0 14px" }}>Directions et services de la mairie pouvant déposer des archives.</div>

          <div className="col" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
            {services.map((s, i) => {
              const n = serviceCount(s);
              return (
                <div key={s} className="row between center" style={{ padding: "11px 13px", borderBottom: i < services.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="row gap-3 center" style={{ minWidth: 0 }}>
                    <Icon name="building" size={15} className="muted-3" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s}</span>
                  </div>
                  <div className="row gap-3 center">
                    <span className="mono muted-3 tip" data-tip={n + " document(s)"} style={{ fontSize: 11.5 }}>{n} doc.</span>
                    <button className="ra-btn danger tip" data-tip={n ? "Service utilisé" : "Retirer"} onClick={() => removeService(s)}><Icon name="trash" size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <AddInline placeholder="Nom du nouveau service…" onAdd={addService} />
        </div>

        {/* ---------- Typologies & sous-types ---------- */}
        <div className="card card-pad">
          <div className="row gap-2 center" style={{ marginBottom: 4 }}>
            <div className="s-ico" style={{ width: 30, height: 30, background: "var(--primary-soft)", color: "var(--primary)" }}><Icon name="grid" size={16} /></div>
            <strong style={{ fontSize: 14.5 }}>Typologies d'archives</strong>
            <span className="badge badge-neutral" style={{ marginLeft: "auto" }}>{typeNames.length} catégories</span>
          </div>
          <div className="muted" style={{ fontSize: 12.5, margin: "6px 0 14px" }}>Catégories principales et leurs sous-types d'indexation.</div>

          <div className="col gap-2">
            {typeNames.map(t => {
              const cat = types[t];
              const tone = typeTone(t);
              const dot = TYPE_DOT[t] || BADGE_DOT[tone];
              const open = openCat === t;
              const n = typeCount(t);
              return (
                <div key={t} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                  <div className="row between center" style={{ padding: "12px 14px", background: open ? "var(--surface-2)" : "var(--surface)", cursor: "pointer" }} onClick={() => setOpenCat(open ? null : t)}>
                    <div className="row gap-3 center" style={{ minWidth: 0 }}>
                      <span style={{ width: 11, height: 11, borderRadius: 3, background: dot, flex: "0 0 auto" }} />
                      <span style={{ fontSize: 13.5, fontWeight: 700 }}>{t}</span>
                      <span className="badge badge-neutral">{cat.subs.length} sous-types</span>
                    </div>
                    <div className="row gap-3 center">
                      <span className="mono muted-3" style={{ fontSize: 11.5 }}>{n} doc.</span>
                      <button className="ra-btn danger tip" data-tip="Retirer la catégorie" onClick={e => { e.stopPropagation(); removeCat(t); }}><Icon name="trash" size={15} /></button>
                      <Icon name="chevronDown" size={16} className="muted-3" style={{ transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform .15s" }} />
                    </div>
                  </div>
                  {open && (
                    <div style={{ padding: "4px 14px 14px", borderTop: "1px solid var(--border)" }}>
                      <div className="row wrap gap-2" style={{ margin: "12px 0 4px" }}>
                        {cat.subs.length === 0 && <span className="muted-3" style={{ fontSize: 12 }}>Aucun sous-type pour l'instant.</span>}
                        {cat.subs.map(s => (
                          <span key={s} className="badge badge-neutral" style={{ height: 28, paddingRight: 5 }}>
                            {s}
                            <button className="ra-btn" style={{ width: 18, height: 18 }} onClick={() => cfg.removeSub(t, s)}><Icon name="x" size={12} /></button>
                          </span>
                        ))}
                      </div>
                      <AddInline placeholder={"Nouveau sous-type de « " + t + " »…"} btn="Ajouter" onAdd={(s) => { cfg.addSub(t, s); ctx.toast({ title: "Sous-type ajouté", body: s + " → " + t }); }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ajouter une catégorie */}
          <div style={{ marginTop: 16, padding: 14, border: "1px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--surface-2)" }}>
            <div className="row gap-2 center" style={{ marginBottom: 10 }}><Icon name="plus" size={15} className="muted" /><strong style={{ fontSize: 13 }}>Nouvelle catégorie</strong></div>
            <div className="row gap-2 center" style={{ marginBottom: 10 }}>
              <span className="muted" style={{ fontSize: 12 }}>Couleur :</span>
              <div className="row gap-2">
                {BADGE_OPTIONS.map(o => (
                  <button key={o.tone} onClick={() => setNewCatColor(o.tone)} className="tip" data-tip={o.tone}
                    style={{ width: 22, height: 22, borderRadius: 5, background: o.color, border: newCatColor === o.tone ? "2.5px solid var(--text)" : "2.5px solid transparent" }} />
                ))}
              </div>
            </div>
            <AddInline placeholder="Nom de la catégorie (ex : Délibérations)…" btn="Créer la catégorie" onAdd={addCat} />
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: "var(--gap-grid)", display: "flex", alignItems: "center", gap: 12, background: "var(--primary-tint)", borderColor: "var(--primary-soft)" }}>
        <Icon name="info" size={18} style={{ color: "var(--primary)", flex: "0 0 auto" }} />
        <span style={{ fontSize: 12.5, color: "var(--primary-strong)" }}>Toute modification de la nomenclature est répercutée immédiatement dans les filtres de recherche, le formulaire de numérisation et la matrice des droits d'accès.</span>
      </div>
    </div>
  );
}

window.Settings = Settings;
