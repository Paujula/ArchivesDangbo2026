/* ============================================================
   ÉCRAN 3 — Module de numérisation / Ajout d'une archive
   ============================================================ */
function Ingest({ ctx }) {
  const D = window.DATA;
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState(null);        // {name, size, progress, done}
  const [form, setForm] = useState({ title: "", type: "", sub: "", status: "Courante", format: "", service: "", date: "", desc: "" });
  const [kw, setKw] = useState(["Dangbo"]);
  const [kwInput, setKwInput] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const progRef = useRef(null);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  // Simule un téléversement avec progression
  const simulateUpload = (name = "scan_registre_2024.pdf", size = 18.4) => {
    setErrors(e => ({ ...e, file: undefined }));
    setFile({ name, size, progress: 0, done: false });
    clearInterval(progRef.current);
    progRef.current = setInterval(() => {
      setFile(f => {
        if (!f) return f;
        const p = Math.min(100, f.progress + Math.random() * 22 + 8);
        if (p >= 100) { clearInterval(progRef.current); return { ...f, progress: 100, done: true }; }
        return { ...f, progress: p };
      });
    }, 180);
  };
  useEffect(() => () => clearInterval(progRef.current), []);

  const onDrop = (e) => { e.preventDefault(); setDrag(false); simulateUpload(); };
  const addKw = () => { const v = kwInput.trim(); if (v && !kw.includes(v)) setKw([...kw, v]); setKwInput(""); };

  const subs = form.type ? ctx.types[form.type].subs : [];

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Le titre est obligatoire";
    if (!form.type) e.type = "Sélectionnez une typologie";
    if (!form.date) e.date = "Indiquez la date du document";
    if (!form.service) e.service = "Sélectionnez le service";
    if (!file || !file.done) e.file = "Téléversez d'abord le fichier scanné";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (validate_ = true, draft = false) => {
    if (validate_ && !validate()) { ctx.toast({ tone: "danger", title: "Champs manquants", body: "Veuillez corriger les champs signalés en rouge." }); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      ctx.toast({ tone: draft ? "gold" : undefined, title: draft ? "Brouillon enregistré" : "Archive indexée et validée", body: draft ? form.title + " — vous pourrez la compléter plus tard." : (form.title || "Nouvelle archive") + " a été ajoutée au fonds." });
      // reset
      setForm({ title: "", type: "", sub: "", status: "Courante", format: "", service: "", date: "", desc: "" });
      setKw(["Dangbo"]); setFile(null); setErrors({});
      if (!draft) ctx.navigate("search");
    }, 700);
  };

  return (
    <div className="content-pad" style={{ maxWidth: 1340 }}>
      <div className="page-head">
        <div className="ph-left">
          <button className="row gap-2 center muted" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 9 }} onClick={() => ctx.navigate("search")}>
            <Icon name="chevronLeft" size={15} />Retour au fonds
          </button>
          <h1>Numériser une archive</h1>
          <div className="ph-sub">Téléversez le document scanné puis renseignez sa fiche d'indexation.</div>
        </div>
        <div className="row gap-2 center mono muted-3" style={{ fontSize: 11.5 }}>
          <Icon name="shieldCheck" size={15} /><span>Saisie par {ctx.user.name}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: "var(--gap-grid)", alignItems: "start" }}>
        {/* ---- Zone de gauche : Upload + aperçu ---- */}
        <div className="card card-pad" style={{ position: "sticky", top: 12 }}>
          <div className="row gap-2 center" style={{ marginBottom: 12 }}>
            <div className="s-ico" style={{ background: "var(--gold-soft)", color: "var(--gold-strong)", width: 30, height: 30 }}><Icon name="scan" size={16} /></div>
            <strong style={{ fontSize: 14 }}>Fichier scanné</strong>
          </div>

          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => simulateUpload()}
              style={{
                border: `2px dashed ${drag ? "var(--primary)" : "var(--border-strong)"}`,
                background: drag ? "var(--primary-soft)" : "var(--surface-2)",
                borderRadius: "var(--r-lg)", padding: "44px 20px", textAlign: "center", cursor: "pointer",
                transition: "all .15s",
              }}>
              <div className="s-ico" style={{ margin: "0 auto 14px", width: 52, height: 52, background: "var(--surface)", color: "var(--primary)", boxShadow: "var(--shadow-sm)" }}><Icon name="upload" size={24} /></div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Glissez-déposez le scan ici</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 5 }}>ou <span style={{ color: "var(--primary)", fontWeight: 600 }}>parcourez vos fichiers</span></div>
              <div className="muted-3 mono" style={{ fontSize: 10.5, marginTop: 14, letterSpacing: ".06em" }}>PDF · JPEG · PNG · TIFF — 50 Mo max</div>
              {errors.file && <div className="err-msg" style={{ justifyContent: "center", marginTop: 12 }}><Icon name="alert" size={13} />{errors.file}</div>}
            </div>
          ) : (
            <div>
              {/* Aperçu */}
              <div style={{ position: "relative" }}>
                <div className="scan-ph" style={{ height: 280, flexDirection: "column", gap: 8, opacity: file.done ? 1 : .6 }}>
                  <Icon name="file" size={30} />
                  <span>{file.done ? "Aperçu du document" : "Traitement…"}</span>
                </div>
                {file.done && (
                  <div className="row gap-2" style={{ position: "absolute", top: 10, right: 10 }}>
                    <button className="icon-btn tip" data-tip="Pivoter" style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}><Icon name="rotate" size={15} /></button>
                    <button className="icon-btn tip" data-tip="Plein écran" style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}><Icon name="maximize" size={15} /></button>
                  </div>
                )}
              </div>
              {/* Ligne fichier */}
              <div className="row gap-3 center" style={{ marginTop: 12, padding: "11px 12px", background: "var(--surface-2)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                <div className="s-ico" style={{ background: "var(--danger-soft)", color: "var(--danger-deep)", width: 32, height: 32 }}><Icon name="file" size={16} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row between center">
                    <span style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                    <span className="mono muted-3" style={{ fontSize: 11 }}>{file.done ? file.size + " Mo" : Math.round(file.progress) + " %"}</span>
                  </div>
                  {!file.done ? (
                    <div className="bar" style={{ marginTop: 6 }}><i style={{ width: file.progress + "%", transition: "width .18s" }} /></div>
                  ) : (
                    <div className="row gap-2 center" style={{ marginTop: 3 }}><Icon name="check" size={13} style={{ color: "var(--primary)" }} /><span style={{ fontSize: 11.5, color: "var(--primary-strong)", fontWeight: 600 }}>Téléversé · prêt à indexer</span></div>
                  )}
                </div>
                <button className="ra-btn danger" onClick={() => setFile(null)}><Icon name="trash" size={15} /></button>
              </div>
            </div>
          )}
          <div className="row gap-2 center muted-3" style={{ marginTop: 14, fontSize: 11.5 }}>
            <Icon name="info" size={14} /><span>Le fichier d'origine est conservé sans modification (préservation).</span>
          </div>
        </div>

        {/* ---- Zone de droite : Indexation ---- */}
        <div className="card card-pad">
          <strong style={{ fontSize: 14, display: "block", marginBottom: 4 }}>Fiche d'indexation</strong>
          <div className="muted" style={{ fontSize: 12.5, marginBottom: 18 }}>Les champs marqués <span style={{ color: "var(--danger)" }}>*</span> sont obligatoires.</div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Titre du document <span className="req">*</span></label>
            <input className={`input ${errors.title ? "error" : ""}`} placeholder="ex : Registre des naissances — Arrondissement de Hozin"
              value={form.title} onChange={e => set("title", e.target.value)} />
            {errors.title && <div className="err-msg"><Icon name="alert" size={13} />{errors.title}</div>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div className="field">
              <label>Typologie d'archive <span className="req">*</span></label>
              <select className={`select ${errors.type ? "error" : ""}`} value={form.type} onChange={e => { set("type", e.target.value); set("sub", ""); }}>
                <option value="">— Choisir —</option>
                {ctx.typeNames.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.type && <div className="err-msg"><Icon name="alert" size={13} />{errors.type}</div>}
            </div>
            <div className="field">
              <label>Sous-type</label>
              <select className="select" value={form.sub} onChange={e => set("sub", e.target.value)} disabled={!form.type}>
                <option value="">{form.type ? "— Choisir —" : "Choisir une typologie d'abord"}</option>
                {subs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Statut de conservation</label>
            <div className="seg" style={{ width: "100%" }}>
              {Object.keys(D.CONSERVATION).map(s => (
                <button key={s} className={form.status === s ? "on" : ""} style={{ flex: 1 }} onClick={() => set("status", s)}>
                  {s}<span className="muted-3" style={{ display: "block", fontSize: 10, fontWeight: 500 }}>{D.CONSERVATION[s].desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div className="field">
              <label>Service émetteur <span className="req">*</span></label>
              <select className={`select ${errors.service ? "error" : ""}`} value={form.service} onChange={e => set("service", e.target.value)}>
                <option value="">— Choisir —</option>
                {ctx.services.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.service && <div className="err-msg"><Icon name="alert" size={13} />{errors.service}</div>}
            </div>
            <div className="field">
              <label>Format physique d'origine</label>
              <select className="select" value={form.format} onChange={e => set("format", e.target.value)}>
                <option value="">— Choisir —</option>
                {D.FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16, maxWidth: 220 }}>
            <label>Date du document <span className="req">*</span></label>
            <input type="date" className={`input ${errors.date ? "error" : ""}`} value={form.date} onChange={e => set("date", e.target.value)} />
            {errors.date && <div className="err-msg"><Icon name="alert" size={13} />{errors.date}</div>}
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label>Mots-clés d'indexation</label>
            <div className={`input`} style={{ height: "auto", minHeight: 40, padding: 6, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {kw.map(k => (
                <span key={k} className="chip" style={{ height: 24 }}>{k}<button onClick={() => setKw(kw.filter(x => x !== k))}><Icon name="x" size={11} /></button></span>
              ))}
              <input value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKw(); } }}
                placeholder={kw.length ? "Ajouter…" : "ex : naissance, Hozin, 2024"} style={{ flex: 1, minWidth: 120, border: "none", outline: "none", background: "none", fontSize: 13, height: 26 }} />
            </div>
            <div className="hint">Appuyez sur Entrée pour ajouter chaque mot-clé.</div>
          </div>

          <div className="field" style={{ marginBottom: 22 }}>
            <label>Description / notes</label>
            <textarea className="textarea" placeholder="Contexte, état du document d'origine, observations…" value={form.desc} onChange={e => set("desc", e.target.value)} />
          </div>

          <div className="hr" style={{ margin: "0 0 16px" }} />
          <div className="row between center wrap gap-3">
            <button className="btn btn-ghost" onClick={() => submit(false, true)} disabled={submitting}><Icon name="draft" size={16} />Enregistrer comme brouillon</button>
            <button className="btn btn-primary" onClick={() => submit(true, false)} disabled={submitting}>
              {submitting ? <><span className="sk" style={{ width: 14, height: 14, borderRadius: "50%" }} />Enregistrement…</> : <><Icon name="check" size={16} />Enregistrer et valider</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Ingest = Ingest;
