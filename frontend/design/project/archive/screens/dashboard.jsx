/* ============================================================
   ÉCRAN 1 — Tableau de bord
   ============================================================ */
function StatCard({ icon, tone, label, value, unit, delta, deltaTone = "up", children }) {
  const bg = { green: "var(--primary-soft)", gold: "var(--gold-soft)", slate: "var(--slate-soft)", violet: "var(--violet-soft)" }[tone];
  const fg = { green: "var(--primary)", gold: "var(--gold-strong)", slate: "var(--slate)", violet: "var(--violet)" }[tone];
  return (
    <div className="stat">
      <div className="s-top">
        <div className="s-ico" style={{ background: bg, color: fg }}><Icon name={icon} size={19} /></div>
        {delta && <span className={`s-delta ${deltaTone}`}><Icon name={deltaTone === "up" ? "trending" : "clock"} size={13} />{delta}</span>}
      </div>
      <div className="s-label">{label}</div>
      <div className="s-val tnum">{value}{unit && <span className="u">{unit}</span>}</div>
      {children}
    </div>
  );
}

function Dashboard({ ctx }) {
  const D = window.DATA;
  const totalDocs = 24819;
  const pending = D.DOCS.filter(d => false).length; // placeholder
  const canValidate = ctx.role === "chef";

  return (
    <div className="content-pad">
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Mairie de Dangbo · Ouémé</div>
          <h1>Tableau de bord</h1>
          <div className="ph-sub">Vue d'ensemble du fonds d'archives dématérialisées · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost" onClick={() => ctx.navigate("search")}><Icon name="search" size={16} />Recherche avancée</button>
          <button className="btn btn-primary" onClick={() => ctx.navigate("ingest")}><Icon name="plus" size={16} />Ajouter une archive</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <StatCard icon="archive" tone="green" label="Documents dématérialisés" value={totalDocs.toLocaleString("fr-FR")} delta="+486 / 7 j" />
        <StatCard icon="drive" tone="slate" label="Espace de stockage utilisé" value="342" unit=" Go" delta="33 % de 1 To" deltaTone="flat">
          <div className="bar" style={{ marginTop: 12 }}><i style={{ width: "33%" }} /></div>
        </StatCard>
        <StatCard icon="scan" tone="gold" label="Scannés cette semaine" value="486" delta="+12 % vs S-1" />
        <StatCard icon="shieldCheck" tone="violet" label="Fiches à valider" value="12" delta={canValidate ? "Action requise" : "Réservé au Chef"} deltaTone="flat" />
      </div>

      {/* Grille principale */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: "var(--gap-grid)", marginTop: "var(--gap-grid)" }}>
        {/* Flux d'activité */}
        <div className="card">
          <div className="row between center" style={{ padding: "15px 18px", borderBottom: "1px solid var(--border)" }}>
            <div className="row gap-2 center"><Icon name="history" size={17} className="muted" /><strong style={{ fontSize: 14 }}>Activité récente</strong></div>
            <button className="btn btn-sm btn-ghost" onClick={() => ctx.navigate("search")}>Tout voir<Icon name="chevronRight" size={14} /></button>
          </div>
          <div>
            {D.ACTIVITY.map((a, i) => (
              <div key={i} className="row gap-3" style={{ padding: "12px 18px", borderBottom: i < D.ACTIVITY.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
                <Avatar name={a.who} initials={a.ini} color={a.color} size={32} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <strong>{a.who}</strong> <span className="muted">{a.action}</span>{" "}
                    <span style={{ fontWeight: 600 }}>{a.target}</span>
                  </div>
                  <div className="row gap-2 center" style={{ marginTop: 4 }}>
                    {a.type === "validation" && <Badge tone="green">Validation</Badge>}
                    {a.type === "consultation" && <Badge tone="neutral">Consultation</Badge>}
                    {a.type === "refus" && <Badge tone="danger">Accès refusé</Badge>}
                    {D.TYPES[a.type] && <TypeBadge type={a.type} />}
                    <span className="muted-3" style={{ fontSize: 11.5 }}>{a.meta}</span>
                  </div>
                </div>
                <span className="muted-3 mono" style={{ fontSize: 11, whiteSpace: "nowrap" }}>{a.when}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="col gap-4">
          {/* Répartition par typologie */}
          <div className="card card-pad">
            <div className="row gap-2 center" style={{ marginBottom: 14 }}><Icon name="grid" size={16} className="muted" /><strong style={{ fontSize: 14 }}>Répartition par typologie</strong></div>
            {D.TYPE_DIST.map((t, i) => {
              const max = Math.max(...D.TYPE_DIST.map(x => x.count));
              return (
                <div key={i} style={{ marginBottom: i < D.TYPE_DIST.length - 1 ? 13 : 0 }}>
                  <div className="row between" style={{ marginBottom: 5 }}>
                    <span className="row gap-2 center" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      <span className="dot" style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_DOT[t.label] }} />{t.label}
                    </span>
                    <span className="mono muted tnum" style={{ fontSize: 12 }}>{t.count.toLocaleString("fr-FR")}</span>
                  </div>
                  <div className="bar"><i style={{ width: (t.count / max * 100) + "%", background: TYPE_DOT[t.label] }} /></div>
                </div>
              );
            })}
          </div>

          {/* Stockage par statut */}
          <div className="card card-pad">
            <div className="row gap-2 center" style={{ marginBottom: 14 }}><Icon name="drive" size={16} className="muted" /><strong style={{ fontSize: 14 }}>Stockage par statut de conservation</strong></div>
            <div className="row" style={{ height: 10, borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
              {D.STORAGE.byStatus.map((s, i) => {
                const c = { green: "var(--primary)", gold: "var(--gold)", slate: "var(--slate)" }[s.badge];
                return <div key={i} style={{ width: (s.gb / D.STORAGE.byStatus.reduce((a, b) => a + b.gb, 0) * 100) + "%", background: c }} />;
              })}
            </div>
            {D.STORAGE.byStatus.map((s, i) => (
              <div key={i} className="row between" style={{ padding: "5px 0" }}>
                <span className="row gap-2 center" style={{ fontSize: 12.5 }}>
                  <span className="dot" style={{ width: 8, height: 8, borderRadius: "50%", background: { green: "var(--primary)", gold: "var(--gold)", slate: "var(--slate)" }[s.badge] }} />
                  {s.label}
                </span>
                <span className="mono muted tnum" style={{ fontSize: 12 }}>{s.gb} Go</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bandeau raccourcis */}
      <div className="card card-pad" style={{ marginTop: "var(--gap-grid)", background: "var(--primary-tint)", borderColor: "var(--primary-soft)" }}>
        <div className="row between center wrap gap-4">
          <div className="row gap-3 center">
            <div className="s-ico" style={{ background: "var(--surface)", color: "var(--primary)", width: 42, height: 42 }}><Icon name="shield" size={20} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Plan de numérisation 2024</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>4 510 courriers et 11 240 actes d'état civil sécurisés · objectif annuel 92 % atteint</div>
            </div>
          </div>
          <div className="row gap-2 center" style={{ minWidth: 240 }}>
            <div className="grow"><div className="bar" style={{ height: 9 }}><i style={{ width: "92%" }} /></div></div>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--primary-strong)" }}>92 %</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
