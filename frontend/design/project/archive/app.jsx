/* ============================================================
   APP SHELL — navigation, rôles, sécurité, tweaks
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "vert",
  "density": "compact",
  "titleFont": "'Space Grotesk'"
}/*EDITMODE-END*/;

// Utilisateur représentatif par rôle
const ROLE_USER = { chef: "u1", saisisseur: "u2", consultant: "u4" };

function App() {
  const D = window.DATA;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState("dashboard");
  const [role, setRole] = useState("chef");
  const [roleMenu, setRoleMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [viewerTab, setViewerTab] = useState("meta");
  const [lastList, setLastList] = useState("search");
  const [toasts, setToasts] = useState([]);
  const [denied, setDenied] = useState(null);
  const [topQ, setTopQ] = useState("");
  const [searchSeed, setSearchSeed] = useState("");
  const [searchKey, setSearchKey] = useState(0);
  const [authed, setAuthed] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [changePw, setChangePw] = useState(false);
  const tid = useRef(0);

  // ---- Configuration partagée : services & typologies ----
  const [services, setServices] = useState(() => [...D.SERVICES]);
  const [types, setTypes] = useState(() => JSON.parse(JSON.stringify(D.TYPES)));
  const typeNames = useMemo(() => Object.keys(types), [types]);
  useEffect(() => { window.TYPE_REGISTRY = types; }, [types]);
  const cfg = {
    addService: (n) => setServices(s => s.includes(n) ? s : [...s, n]),
    renameService: (o, n) => setServices(s => s.map(x => x === o ? n : x)),
    removeService: (n) => setServices(s => s.filter(x => x !== n)),
    addType: (n, badge) => setTypes(t => t[n] ? t : { ...t, [n]: { badge, subs: [] } }),
    removeType: (n) => setTypes(t => { const c = { ...t }; delete c[n]; return c; }),
    addSub: (ty, s) => setTypes(t => ({ ...t, [ty]: { ...t[ty], subs: t[ty].subs.includes(s) ? t[ty].subs : [...t[ty].subs, s] } })),
    removeSub: (ty, s) => setTypes(t => ({ ...t, [ty]: { ...t[ty], subs: t[ty].subs.filter(x => x !== s) } })),
  };

  // Applique thème / densité / police via tweaks
  useEffect(() => { document.documentElement.setAttribute("data-theme", t.theme); }, [t.theme]);
  useEffect(() => { document.documentElement.setAttribute("data-density", t.density); }, [t.density]);
  useEffect(() => { document.documentElement.style.setProperty("--font-display", t.titleFont + ", sans-serif"); }, [t.titleFont]);

  const user = D.USERS.find(u => u.id === ROLE_USER[role]);

  // ---- Sécurité / permissions ----
  const canAccess = useCallback((d) => {
    if (role === "chef") return true;
    if (d.restricted && user.service !== d.service) return false;
    if (role === "consultant") return !!user.rights[d.type];
    return true; // saisisseur
  }, [role, user]);
  const canEdit = useCallback((d) => {
    if (role === "chef") return true;
    if (role === "saisisseur") return d.by === user.name;
    return false;
  }, [role, user]);

  // ---- Toasts ----
  const toast = useCallback(({ tone, title, body }) => {
    const id = ++tid.current;
    setToasts(ts => [...ts, { id, tone, title, body }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4200);
  }, []);

  // ---- Navigation ----
  const navigate = useCallback((r) => { setRoute(r); document.querySelector(".content")?.scrollTo(0, 0); }, []);
  const openDoc = useCallback((d, tab = "meta") => {
    if (!canAccess(d)) { setDenied(d); return; }
    setActiveDoc(d); setViewerTab(tab); setLastList(route === "viewer" ? lastList : route); setRoute("viewer");
  }, [canAccess, route, lastList]);
  const denyAccess = useCallback((d) => {
    setDenied(d);
    toast({ tone: "danger", title: "Accès refusé", body: "Document hors de votre périmètre d'autorisation. Tentative journalisée." });
  }, [toast]);

  // Redirige si le rôle n'a plus accès à la page courante
  const allowedRoutes = {
    chef: ["dashboard", "search", "ingest", "users", "viewer", "settings"],
    saisisseur: ["dashboard", "search", "ingest", "viewer"],
    consultant: ["dashboard", "search", "viewer"],
  };
  useEffect(() => {
    if (!allowedRoutes[role].includes(route)) navigate("dashboard");
  }, [role]);

  const ctx = { role, user, navigate, openDoc, denyAccess, canAccess, canEdit, toast, activeDoc, viewerTab, lastList, searchSeed, services, types, typeNames, cfg };

  // ---- Nav model ----
  const NAV = [
    { group: "Principal", items: [
      { key: "dashboard", icon: "dashboard", label: "Tableau de bord", roles: ["chef", "saisisseur", "consultant"] },
      { key: "search", icon: "search", label: "Recherche & fonds", roles: ["chef", "saisisseur", "consultant"] },
    ]},
    { group: "Gestion", items: [
      { key: "ingest", icon: "scan", label: "Numérisation", roles: ["chef", "saisisseur"] },
    ]},
    { group: "Administration", items: [
      { key: "users", icon: "users", label: "Utilisateurs & droits", roles: ["chef"], badge: D.USERS.length },
      { key: "settings", icon: "settings", label: "Paramètres & nomenclature", roles: ["chef"] },
    ]},
  ];

  const submitTopSearch = () => { setSearchSeed(topQ); setSearchKey(k => k + 1); navigate("search"); };

  // ---- Porte d'authentification : aucun accès sans connexion ----
  if (!authed) {
    return <AuthScreen onLogin={(r, uid) => { setRole(r); setAuthed(true); setRoute("dashboard"); }} />;
  }
  const logout = () => { setUserMenu(false); setAuthed(false); setRoute("dashboard"); setRole("chef"); };

  return (
    <div className="app" data-collapsed={collapsed}>
      {/* ---------------- Sidebar ---------------- */}
      <aside className="sidebar">
        <div className="sb-brand">
          <Seal size={36} />
          <div className="sb-brand-txt">
            <span className="t1">Archives Dangbo</span>
            <span className="t2">Mairie · Ouémé</span>
          </div>
        </div>
        <nav className="sb-nav">
          {NAV.map(grp => {
            const items = grp.items.filter(it => it.roles.includes(role));
            if (!items.length) return null;
            return (
              <div key={grp.group}>
                <div className="sb-section-label">{grp.group}</div>
                {items.map(it => (
                  <button key={it.key} className={`sb-item ${route === it.key ? "active" : ""}`} onClick={() => navigate(it.key)} title={it.label}>
                    <Icon name={it.icon} size={18} />
                    <span className="sb-item-label">{it.label}</span>
                    {it.badge && <span className="badge-count">{it.badge}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sb-foot">
          <button className="sb-item" onClick={() => setCollapsed(c => !c)} title="Réduire le menu">
            <Icon name="panel" size={18} /><span className="sb-item-label">Réduire le menu</span>
          </button>
          <div className="motto" style={{ marginTop: 8 }}>Fraternité · Justice · Travail</div>
        </div>
      </aside>

      {/* ---------------- Main ---------------- */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <button className="icon-btn" onClick={() => setCollapsed(c => !c)}><Icon name="menu" size={19} /></button>
          <div className="topbar-search">
            <Icon name="search" size={17} />
            <input value={topQ} onChange={e => setTopQ(e.target.value)} onKeyDown={e => e.key === "Enter" && submitTopSearch()} placeholder="Rechercher dans tout le fonds d'archives…" />
            <span className="kbd">⏎</span>
          </div>
          <div className="topbar-spacer" />

          {/* Sélecteur de rôle */}
          <div className="role-switch">
            <button className="role-pill" onClick={() => setRoleMenu(m => !m)}>
              <span className="role-dot" style={{ background: D.ROLES[role].dot }} />
              <span className="rp-txt"><span className="rp-role">{D.ROLES[role].name}</span><span className="rp-sub">{D.ROLES[role].short}</span></span>
              <Icon name="chevronDown" size={15} className="muted-3" />
            </button>
            {roleMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={() => setRoleMenu(false)} />
                <div className="role-menu">
                  <div className="rm-head">Simuler un rôle utilisateur</div>
                  {Object.keys(D.ROLES).map(r => (
                    <button key={r} className={`role-opt ${role === r ? "active" : ""}`} onClick={() => { setRole(r); setRoleMenu(false); toast({ title: "Rôle : " + D.ROLES[r].name, body: "Permissions et navigation mises à jour." }); }}>
                      <span className="role-dot" style={{ background: D.ROLES[r].dot, marginTop: 4 }} />
                      <span style={{ flex: 1 }}>
                        <span className="row between center"><span className="ro-name">{D.ROLES[r].name}</span>{role === r && <Icon name="check" size={15} style={{ color: "var(--primary)" }} />}</span>
                        <span className="ro-desc">{D.ROLES[r].desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="icon-btn tip" data-tip="Notifications"><Icon name="bell" size={18} /><span style={{ position: "absolute", top: 7, right: 8, width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", border: "1.5px solid var(--surface)" }} /></button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setUserMenu(m => !m)} style={{ borderRadius: "50%" }}><Avatar name={user.name} initials={user.initials} color={user.color} size={36} /></button>
            {userMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={() => setUserMenu(false)} />
                <div className="user-menu">
                  <div className="row gap-3 center" style={{ padding: "8px 10px 10px" }}>
                    <Avatar name={user.name} initials={user.initials} color={user.color} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                      <div className="muted-3 mono" style={{ fontSize: 10.5, overflow: "hidden", textOverflow: "ellipsis" }}>{user.email || (user.id.toUpperCase() + "@dangbo.bj")}</div>
                    </div>
                  </div>
                  <div className="row gap-2 center" style={{ padding: "0 10px 8px" }}><Badge tone={role === "chef" ? "green" : role === "saisisseur" ? "gold" : "slate"} dot={D.ROLES[role].dot}>{D.ROLES[role].name}</Badge><span className="muted-3" style={{ fontSize: 11 }}>{user.service}</span></div>
                  <div className="hr" style={{ margin: "2px 0 6px" }} />
                  <button className="um-item" onClick={() => { setUserMenu(false); setChangePw(true); }}><Icon name="key" size={17} className="muted" />Changer le mot de passe</button>
                  {role === "chef" && <button className="um-item" onClick={() => { setUserMenu(false); navigate("settings"); }}><Icon name="settings" size={17} className="muted" />Paramètres &amp; nomenclature</button>}
                  <div className="hr" style={{ margin: "6px 0" }} />
                  <button className="um-item danger" onClick={logout}><Icon name="logout" size={17} />Se déconnecter</button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Contenu */}
        <main className="content">
          {route === "dashboard" && <Dashboard ctx={ctx} />}
          {route === "search" && <Search key={searchKey} ctx={{ ...ctx, searchSeed }} />}
          {route === "ingest" && <Ingest ctx={ctx} />}
          {route === "viewer" && activeDoc && <Viewer ctx={{ ...ctx, activeDoc, viewerTab, lastList }} />}
          {route === "users" && <Users ctx={ctx} />}
          {route === "settings" && <Settings ctx={ctx} />}
        </main>
      </div>

      {/* ---------------- Toasts ---------------- */}
      <div className="toast-wrap">
        {toasts.map(ts => (
          <div key={ts.id} className={`toast ${ts.tone || ""}`}>
            <div className="s-ico" style={{ width: 30, height: 30, flex: "0 0 auto",
              background: ts.tone === "danger" ? "var(--danger-soft)" : ts.tone === "gold" ? "var(--gold-soft)" : "var(--primary-soft)",
              color: ts.tone === "danger" ? "var(--danger-deep)" : ts.tone === "gold" ? "var(--gold-strong)" : "var(--primary)" }}>
              <Icon name={ts.tone === "danger" ? "alert" : ts.tone === "gold" ? "draft" : "check"} size={16} />
            </div>
            <div className="grow"><div className="t-title">{ts.title}</div><div className="t-body">{ts.body}</div></div>
            <button className="ra-btn" onClick={() => setToasts(x => x.filter(z => z.id !== ts.id))}><Icon name="x" size={14} /></button>
          </div>
        ))}
      </div>

      {/* ---------------- Modal accès refusé ---------------- */}
      {denied && (
        <div className="overlay" onClick={() => setDenied(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ height: 5, background: "var(--danger)" }} />
            <div style={{ padding: "26px 26px 22px" }}>
              <div className="row gap-3 center" style={{ marginBottom: 16 }}>
                <div className="s-ico" style={{ width: 46, height: 46, background: "var(--danger-soft)", color: "var(--danger-deep)" }}><Icon name="lock" size={22} /></div>
                <div><h2 style={{ fontSize: 18 }}>Document à accès restreint</h2><div className="muted" style={{ fontSize: 12.5 }}>Sécurité documentaire · {D.ROLES[role].name}</div></div>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--text-2)" }}>
                La consultation de <strong style={{ color: "var(--text)" }}>{denied.ref}</strong> — « {denied.title} » n'est pas autorisée pour votre profil.
                Ce document relève du service <strong style={{ color: "var(--text)" }}>{denied.service}</strong>.
              </p>
              <div className="row gap-2 center" style={{ marginTop: 14, padding: "11px 13px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <Icon name="shield" size={16} className="muted" /><span className="muted" style={{ fontSize: 12 }}>Cette tentative d'accès a été <strong>horodatée et enregistrée</strong> dans le journal d'audit.</span>
              </div>
            </div>
            <div className="row between center gap-3" style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setDenied(null); toast({ title: "Demande envoyée", body: "Votre demande d'accès a été transmise à l'archiviste chef." }); }}><Icon name="shieldCheck" size={15} />Demander l'accès</button>
              <button className="btn btn-primary btn-sm" onClick={() => setDenied(null)}>Compris</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Changer le mot de passe ---------------- */}
      {changePw && <ChangePasswordModal onClose={() => setChangePw(false)} onDone={() => { setChangePw(false); toast({ title: "Mot de passe modifié", body: "Votre mot de passe a été mis à jour avec succès." }); }} />}

      {/* ---------------- Tweaks ---------------- */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Palette institutionnelle" />
        <TweakRadio label="Thème" value={t.theme} options={[{ value: "vert", label: "Vert Bénin" }, { value: "bleu", label: "Bleu admin." }]} onChange={v => setTweak("theme", v)} />
        <TweakSection label="Densité" />
        <TweakRadio label="Affichage" value={t.density} options={[{ value: "compact", label: "Compact" }, { value: "confort", label: "Confort" }]} onChange={v => setTweak("density", v)} />
        <TweakSection label="Typographie" />
        <TweakSelect label="Police des titres" value={t.titleFont} options={[{ value: "'Space Grotesk'", label: "Space Grotesk" }, { value: "'Archivo'", label: "Archivo" }, { value: "'JetBrains Mono'", label: "JetBrains Mono" }]} onChange={v => setTweak("titleFont", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
