/* ============================================================
   ÉCRAN 4 — Vue détail d'un document & visionneuse (split-screen)
   ============================================================ */
function MetaRow({ label, children }) {
  return (
    <div className="row between" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 16, alignItems: "flex-start" }}>
      <span className="muted" style={{ fontSize: 12.5, flex: "0 0 142px" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right" }}>{children}</span>
    </div>
  );
}

function Viewer({ ctx }) {
  const d = ctx.activeDoc;
  const [tab, setTab] = useState(ctx.viewerTab || "meta");
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [page, setPage] = useState(1);
  const pages = Math.min(d.pages, 999);
  useEffect(() => { setTab(ctx.viewerTab || "meta"); setZoom(1); setRot(0); setPage(1); }, [d.id, ctx.viewerTab]);

  const canEdit = ctx.canEdit(d);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* En-tête document */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <button className="row gap-2 center muted" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }} onClick={() => ctx.navigate(ctx.lastList || "search")}>
          <Icon name="chevronLeft" size={15} />Retour aux résultats
        </button>
        <div className="row between center wrap gap-4">
          <div className="row gap-3 center" style={{ minWidth: 0 }}>
            <div className="s-ico" style={{ background: "var(--primary-soft)", color: "var(--primary)", width: 40, height: 40, flex: "0 0 auto" }}><Icon name="file" size={20} /></div>
            <div style={{ minWidth: 0 }}>
              <div className="row gap-2 center wrap"><span className="ref" style={{ fontSize: 12.5 }}>{d.ref}</span><span className="muted-3">·</span><TypeBadge type={d.type} /><StatusBadge status={d.status} /></div>
              <h1 style={{ fontSize: 19, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 620 }}>{d.title}</h1>
            </div>
          </div>
          <div className="row gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => ctx.toast({ title: "Téléchargement", body: d.ref + " — préparation du PDF…" })}><Icon name="download" size={15} />Télécharger</button>
            {canEdit && <button className="btn btn-soft btn-sm" onClick={() => ctx.toast({ title: "Mode édition", body: "Ouverture de la fiche d'indexation…" })}><Icon name="edit" size={15} />Modifier</button>}
            {ctx.role === "chef" && <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger-deep)", borderColor: "var(--danger-soft)" }} onClick={() => ctx.toast({ tone: "danger", title: "Suppression", body: "Action réservée — confirmation requise." })}><Icon name="trash" size={15} /></button>}
          </div>
        </div>
      </div>

      {/* Split */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.5fr 1fr", overflow: "hidden" }}>
        {/* ----- Visionneuse ----- */}
        <div style={{ display: "flex", flexDirection: "column", background: "#2a312a", overflow: "hidden" }}>
          {/* Toolbar */}
          <div className="row between center" style={{ padding: "8px 14px", background: "#222820", borderBottom: "1px solid rgba(255,255,255,.08)", color: "#dfe5da" }}>
            <div className="row gap-2 center">
              <button className="vw-btn" onClick={() => setPage(p => Math.max(1, p - 1))}><Icon name="chevronLeft" size={16} /></button>
              <span className="mono" style={{ fontSize: 12 }}>Page {page} / {pages}</span>
              <button className="vw-btn" onClick={() => setPage(p => Math.min(pages, p + 1))}><Icon name="chevronRight" size={16} /></button>
            </div>
            <div className="row gap-2 center">
              <button className="vw-btn" onClick={() => setZoom(z => Math.max(.5, +(z - .2).toFixed(2)))}><Icon name="zoomOut" size={16} /></button>
              <span className="mono" style={{ fontSize: 12, width: 44, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
              <button className="vw-btn" onClick={() => setZoom(z => Math.min(3, +(z + .2).toFixed(2)))}><Icon name="zoomIn" size={16} /></button>
              <span style={{ width: 1, height: 18, background: "rgba(255,255,255,.12)" }} />
              <button className="vw-btn" onClick={() => setRot(r => (r + 90) % 360)}><Icon name="rotate" size={15} /></button>
              <button className="vw-btn" onClick={() => { setZoom(1); setRot(0); }}><Icon name="refresh" size={15} /></button>
              <button className="vw-btn" onClick={() => ctx.toast({ title: "Plein écran", body: "Affichage de la visionneuse en plein écran." })}><Icon name="maximize" size={15} /></button>
            </div>
          </div>
          {/* Page */}
          <div style={{ flex: 1, overflow: "auto", display: "grid", placeItems: "center", padding: 28 }}>
            <div style={{ transform: `scale(${zoom}) rotate(${rot}deg)`, transition: "transform .2s", background: "#fff", width: 440, minHeight: 580, boxShadow: "0 14px 40px rgba(0,0,0,.4)", borderRadius: 3, padding: 38, flex: "0 0 auto" }}>
              {/* En-tête de page scannée simulé */}
              <div className="col center" style={{ gap: 6, textAlign: "center", borderBottom: "2px solid #1b201a", paddingBottom: 14, marginBottom: 16 }}>
                <Seal size={42} />
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: ".04em" }}>RÉPUBLIQUE DU BÉNIN</div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".1em", color: "#586156" }}>MAIRIE DE DANGBO · DÉPARTEMENT DE L'OUÉMÉ</div>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, textAlign: "center", marginBottom: 18 }}>{d.sub} — {d.type}</div>
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} style={{ height: 9, background: "#eef0ec", borderRadius: 3, marginBottom: 11, width: (96 - (i * 13) % 42) + "%" }} />
              ))}
              <div className="mono" style={{ position: "absolute", fontSize: 9, color: "#aab0a4", marginTop: 18 }}>{d.ref} · p.{page}</div>
            </div>
          </div>
          <div className="row between center" style={{ padding: "7px 14px", background: "#222820", color: "rgba(223,229,218,.6)", borderTop: "1px solid rgba(255,255,255,.08)" }}>
            <span className="mono" style={{ fontSize: 10.5 }}>{d.format} · {d.pages} pages · {d.size} Mo</span>
            <span className="mono row gap-2 center" style={{ fontSize: 10.5 }}><Icon name="shieldCheck" size={13} />Document authentifié</span>
          </div>
        </div>

        {/* ----- Panneau détails ----- */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
          <div className="row" style={{ borderBottom: "1px solid var(--border)", padding: "0 8px" }}>
            {[["meta", "Métadonnées"], ["history", "Traçabilité"], ["related", "Liés"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "14px 12px", fontSize: 13, fontWeight: 600, position: "relative",
                color: tab === k ? "var(--text)" : "var(--text-3)",
              }}>
                {l}{k === "history" && <span className="badge-count" style={{ marginLeft: 6, background: "var(--surface-3)", color: "var(--text-2)", padding: "1px 6px", borderRadius: 20, fontSize: 10.5, fontFamily: "var(--font-mono)" }}>{d.log.length}</span>}
                {tab === k && <span style={{ position: "absolute", left: 12, right: 12, bottom: -1, height: 2, background: "var(--primary)", borderRadius: 2 }} />}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {tab === "meta" && (
              <div>
                <MetaRow label="Référence unique"><span className="ref">{d.ref}</span></MetaRow>
                <MetaRow label="Titre"><span style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.4 }}>{d.title}</span></MetaRow>
                <MetaRow label="Typologie"><TypeBadge type={d.type} /></MetaRow>
                <MetaRow label="Sous-type">{d.sub}</MetaRow>
                <MetaRow label="Date du document"><span className="mono">{new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span></MetaRow>
                <MetaRow label="Service émetteur">{d.service}</MetaRow>
                <MetaRow label="Statut de conservation"><StatusBadge status={d.status} /></MetaRow>
                <MetaRow label="Format d'origine">{d.format}</MetaRow>
                <MetaRow label="Volume"><span className="mono">{d.pages} p. · {d.size} Mo</span></MetaRow>
                <MetaRow label="Consultations"><span className="mono tnum">{d.views}</span></MetaRow>
                <MetaRow label="Indexé par">{d.by}</MetaRow>
                <div style={{ paddingTop: 14 }}>
                  <div className="muted" style={{ fontSize: 12.5, marginBottom: 8 }}>Mots-clés</div>
                  <div className="row wrap gap-2">{d.kw.map(k => <span key={k} className="badge badge-neutral"><Icon name="tag" size={11} />{k}</span>)}</div>
                </div>
              </div>
            )}

            {tab === "history" && (
              <div>
                <div className="row gap-2 center" style={{ marginBottom: 14, padding: "10px 12px", background: "var(--primary-tint)", borderRadius: "var(--r-md)", border: "1px solid var(--primary-soft)" }}>
                  <Icon name="shield" size={16} style={{ color: "var(--primary)" }} />
                  <span style={{ fontSize: 12, color: "var(--primary-strong)", fontWeight: 600 }}>Journal d'audit inviolable — chaque accès est horodaté et nominatif.</span>
                </div>
                <div style={{ position: "relative", paddingLeft: 22 }}>
                  <div style={{ position: "absolute", left: 6, top: 4, bottom: 4, width: 2, background: "var(--border)" }} />
                  {d.log.slice().reverse().map((e, i) => {
                    const tone = e.action.includes("Validation") ? "var(--primary)" : e.action.includes("Téléchargement") ? "var(--gold)" : e.action.includes("Numérisation") || e.action.includes("créée") ? "var(--slate)" : "var(--text-3)";
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
              </div>
            )}

            {tab === "related" && (
              <div className="col gap-2">
                {window.DATA.DOCS.filter(x => x.type === d.type && x.id !== d.id).slice(0, 5).map(x => (
                  <button key={x.id} className="row gap-3 center" style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", textAlign: "left", width: "100%" }} onClick={() => ctx.openDoc(x)}>
                    <Icon name="file" size={16} className="muted-3" />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.title}</div>
                      <div className="ref" style={{ fontSize: 11 }}>{x.ref}</div>
                    </div>
                    <Icon name="chevronRight" size={15} className="muted-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Viewer = Viewer;
