/* ============================================================
   ÉCRAN 2 — Moteur de recherche avancée & filtrage
   ============================================================ */
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button className="row between center" style={{ width: "100%", padding: "13px 2px", textAlign: "left" }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".02em" }}>{title}</span>
        <Icon name="chevronDown" size={15} className="muted-3" style={{ transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform .15s" }} />
      </button>
      {open && <div style={{ paddingBottom: 14 }}>{children}</div>}
    </div>
  );
}
function CheckRow({ on, onClick, label, count }) {
  return (
    <button className="row between center" style={{ width: "100%", padding: "6px 2px", textAlign: "left" }} onClick={onClick}>
      <span className="row gap-2 center"><Checkbox on={on} onClick={onClick} /><span style={{ fontSize: 13 }}>{label}</span></span>
      {count != null && <span className="mono muted-3 tnum" style={{ fontSize: 11.5 }}>{count}</span>}
    </button>
  );
}

function Search({ ctx }) {
  const D = window.DATA;
  const [q, setQ] = useState(ctx.searchSeed || "");
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [service, setService] = useState("");
  const [format, setFormat] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(false);

  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  // simulate loading on filter change
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 380); return () => clearTimeout(t); }, [q, types, statuses, service, format, from, to, sort]);

  const counts = useMemo(() => {
    const c = {};
    ctx.typeNames.forEach(t => c[t] = D.DOCS.filter(d => d.type === t).length);
    return c;
  }, [ctx.typeNames]);

  const results = useMemo(() => {
    let r = D.DOCS.filter(d => {
      if (q) {
        const hay = (d.title + " " + d.ref + " " + d.kw.join(" ") + " " + d.sub).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (types.length && !types.includes(d.type)) return false;
      if (statuses.length && !statuses.includes(d.status)) return false;
      if (service && d.service !== service) return false;
      if (format && d.format !== format) return false;
      if (from && d.date < from) return false;
      if (to && d.date > to) return false;
      return true;
    });
    r = [...r].sort((a, b) => sort === "recent" ? b.date.localeCompare(a.date) : sort === "ancien" ? a.date.localeCompare(b.date) : sort === "vues" ? b.views - a.views : a.title.localeCompare(b.title));
    return r;
  }, [q, types, statuses, service, format, from, to, sort]);

  const activeChips = [
    ...types.map(t => ({ k: "type:" + t, label: t, clear: () => toggle(types, setTypes, t) })),
    ...statuses.map(s => ({ k: "st:" + s, label: s, clear: () => toggle(statuses, setStatuses, s) })),
    ...(service ? [{ k: "sv", label: service, clear: () => setService("") }] : []),
    ...(format ? [{ k: "fm", label: format, clear: () => setFormat("") }] : []),
    ...(from ? [{ k: "fr", label: "Depuis " + from, clear: () => setFrom("") }] : []),
    ...(to ? [{ k: "to", label: "Jusqu'au " + to, clear: () => setTo("") }] : []),
  ];
  const clearAll = () => { setTypes([]); setStatuses([]); setService(""); setFormat(""); setFrom(""); setTo(""); setQ(""); };

  return (
    <div className="content-pad" style={{ maxWidth: 1600 }}>
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Fonds documentaire · {D.DOCS.length} références indexées</div>
          <h1>Recherche &amp; consultation</h1>
        </div>
        <button className="btn btn-primary" onClick={() => ctx.navigate("ingest")}><Icon name="plus" size={16} />Ajouter une archive</button>
      </div>

      {/* Barre de recherche globale */}
      <div className="card" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Icon name="search" size={19} className="muted-3" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher par titre, référence, mot-clé… (ex : « naissance Hozin », « DGB-URB »)"
          style={{ flex: 1, border: "none", outline: "none", background: "none", fontSize: 15 }} />
        {q && <button className="ra-btn" onClick={() => setQ("")}><Icon name="x" size={16} /></button>}
        <div className="row gap-2 center" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 10 }}>
          <span className="muted-3 mono" style={{ fontSize: 11 }}>TRIER</span>
          <select className="select btn-sm" style={{ height: 34, width: "auto", paddingRight: 30 }} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="recent">Plus récents</option>
            <option value="ancien">Plus anciens</option>
            <option value="vues">Plus consultés</option>
            <option value="titre">Titre A→Z</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "248px 1fr", gap: "var(--gap-grid)", alignItems: "start" }}>
        {/* Panneau filtres */}
        <div className="card card-pad" style={{ position: "sticky", top: 12 }}>
          <div className="row between center" style={{ marginBottom: 4 }}>
            <span className="row gap-2 center" style={{ fontWeight: 700, fontSize: 13 }}><Icon name="filter" size={15} />Filtres</span>
            {activeChips.length > 0 && <button className="muted" style={{ fontSize: 11.5, fontWeight: 600 }} onClick={clearAll}>Réinitialiser</button>}
          </div>

          <FilterSection title="TYPE DE DOCUMENT">
            {ctx.typeNames.map(t => <CheckRow key={t} on={types.includes(t)} onClick={() => toggle(types, setTypes, t)} label={t} count={counts[t]} />)}
          </FilterSection>

          <FilterSection title="STATUT DE CONSERVATION">
            {Object.keys(D.CONSERVATION).map(s => <CheckRow key={s} on={statuses.includes(s)} onClick={() => toggle(statuses, setStatuses, s)} label={s} count={D.DOCS.filter(d => d.status === s).length} />)}
          </FilterSection>

          <FilterSection title="SERVICE ÉMETTEUR" defaultOpen={false}>
            <select className="select" value={service} onChange={e => setService(e.target.value)}>
              <option value="">Tous les services</option>
              {ctx.services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FilterSection>

          <FilterSection title="FORMAT D'ORIGINE" defaultOpen={false}>
            <select className="select" value={format} onChange={e => setFormat(e.target.value)}>
              <option value="">Tous les formats</option>
              {D.FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </FilterSection>

          <FilterSection title="PÉRIODE DU DOCUMENT" defaultOpen={false}>
            <div className="field" style={{ marginBottom: 8 }}><label>Du</label><input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} /></div>
            <div className="field"><label>Au</label><input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} /></div>
          </FilterSection>
        </div>

        {/* Résultats */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="row between center wrap gap-3" style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
            <div className="row gap-2 center wrap">
              <strong style={{ fontSize: 14 }} className="tnum">{loading ? "…" : results.length}</strong>
              <span className="muted" style={{ fontSize: 13 }}>résultat{results.length > 1 ? "s" : ""}</span>
              {activeChips.length > 0 && <span className="muted-3" style={{ fontSize: 12 }}>· filtré</span>}
            </div>
            <div className="row gap-2 wrap">
              {activeChips.map(c => (
                <span key={c.k} className="chip">{c.label}<button onClick={c.clear}><Icon name="x" size={12} /></button></span>
              ))}
            </div>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 158 }}>Référence</th>
                  <th>Titre</th>
                  <th style={{ width: 130 }}>Type</th>
                  <th style={{ width: 110 }}>Date</th>
                  <th style={{ width: 124 }}>Statut</th>
                  <th style={{ width: 132, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i}><td colSpan={6}><div className="sk" style={{ height: 18, width: (60 + (i * 7) % 35) + "%" }} /></td></tr>
                  ))
                ) : results.length === 0 ? (
                  <tr><td colSpan={6} style={{ height: 220 }}>
                    <div className="col center" style={{ gap: 10, color: "var(--text-3)" }}>
                      <Icon name="search" size={30} /><div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Aucune archive ne correspond</div>
                      <button className="btn btn-sm btn-ghost" onClick={clearAll}>Réinitialiser les filtres</button>
                    </div>
                  </td></tr>
                ) : results.map(d => {
                  const access = ctx.canAccess(d);
                  return (
                    <tr key={d.id} className={!access ? "locked-row" : ""} style={{ cursor: access ? "pointer" : "default" }} onClick={() => access ? ctx.openDoc(d) : ctx.denyAccess(d)}>
                      <td><span className="ref">{d.ref}</span></td>
                      <td>
                        <div className="row gap-2 center" style={{ minWidth: 0 }}>
                          {!access && <Icon name="lock" size={14} style={{ color: "var(--danger)", flex: "0 0 auto" }} />}
                          <span style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360, opacity: access ? 1 : .6 }}>{d.title}</span>
                        </div>
                        <span className="muted-3" style={{ fontSize: 11.5 }}>{d.sub} · {d.service} · {d.format}</span>
                      </td>
                      <td><TypeBadge type={d.type} /></td>
                      <td><span className="mono muted tnum" style={{ fontSize: 12 }}>{new Date(d.date).toLocaleDateString("fr-FR")}</span></td>
                      <td><StatusBadge status={d.status} /></td>
                      <td onClick={e => e.stopPropagation()}>
                        {access ? (
                          <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                            <button className="ra-btn tip" data-tip="Aperçu" onClick={() => ctx.openDoc(d)}><Icon name="eye" size={16} /></button>
                            {ctx.canEdit(d) && <button className="ra-btn tip" data-tip="Modifier" onClick={() => ctx.openDoc(d, "edit")}><Icon name="edit" size={15} /></button>}
                            <button className="ra-btn tip" data-tip="Télécharger" onClick={() => ctx.toast({ title: "Téléchargement", body: d.ref + " — préparation du PDF…" })}><Icon name="download" size={16} /></button>
                            <button className="ra-btn tip" data-tip="Historique" onClick={() => ctx.openDoc(d, "history")}><Icon name="history" size={16} /></button>
                          </div>
                        ) : (
                          <div className="row-actions" style={{ justifyContent: "flex-end", opacity: 1 }}>
                            <button className="ra-btn locked tip" data-tip="Accès restreint" onClick={() => ctx.denyAccess(d)}><Icon name="lock" size={15} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Search = Search;
