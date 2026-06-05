/* ============================================================
   ÉCRAN 5 — Gestion des utilisateurs & droits (Admin)
   ============================================================ */
function RoleTag({ role }) {
  const R = window.DATA.ROLES[role];
  const tone = role === "chef" ? "green" : role === "saisisseur" ? "gold" : "slate";
  return <Badge tone={tone} dot={R.dot}>{R.name}</Badge>;
}

const AVATAR_COLORS = ["#0c6e4a", "#3c5d76", "#c98a16", "#6a4d8c", "#b0563f", "#2f7d6b", "#8c5a3c", "#456a8a"];
function makeInitials(name) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p[0][0] + (p[1] ? p[1][0] : (p[0][1] || ""))).toUpperCase();
}

function Users({ ctx }) {
  const D = window.DATA;
  const [users, setUsers] = useState(() => D.USERS.map(u => ({ ...u, rights: { ...u.rights } })));
  const [draft, setDraft] = useState(null);   // user object being created/edited
  const [isNew, setIsNew] = useState(false);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState("tous");

  const isAdmin = ctx.role === "chef";
  if (!isAdmin) {
    return (
      <div className="content-pad">
        <div className="card card-pad" style={{ maxWidth: 560, margin: "60px auto", textAlign: "center", padding: 40 }}>
          <div className="s-ico" style={{ margin: "0 auto 18px", width: 60, height: 60, background: "var(--danger-soft)", color: "var(--danger-deep)" }}><Icon name="lock" size={28} /></div>
          <h1 style={{ fontSize: 21 }}>Accès restreint</h1>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.5 }}>
            La gestion des utilisateurs et des droits est réservée au profil <strong>Archiviste Chef / Super Admin</strong>.
            Votre rôle actuel est <strong>{D.ROLES[ctx.role].name}</strong>.
          </p>
          <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => ctx.navigate("dashboard")}><Icon name="chevronLeft" size={16} />Retour au tableau de bord</button>
        </div>
      </div>
    );
  }

  const updateUser = (id, patch) => setUsers(us => us.map(u => u.id === id ? { ...u, ...patch } : u));
  const patchDraft = (patch) => { setDraft(d => ({ ...d, ...patch })); setErrors({}); };
  const toggleDraftRight = (t) => setDraft(d => ({ ...d, rights: { ...d.rights, [t]: !d.rights[t] } }));

  const blankRights = () => Object.fromEntries(ctx.typeNames.map(t => [t, false]));

  const openNew = () => {
    setIsNew(true); setErrors({});
    setDraft({ id: "", name: "", email: "", role: "consultant", service: ctx.services[0], color: AVATAR_COLORS[users.length % AVATAR_COLORS.length], status: "actif", last: "Jamais connecté", rights: { ...blankRights(), Courriers: true } });
  };
  const openEdit = (u) => { setIsNew(false); setErrors({}); setDraft({ ...u, email: u.email || (u.id.toUpperCase() + "@dangbo.bj"), rights: { ...u.rights } }); };

  const save = () => {
    const e = {};
    if (!draft.name.trim()) e.name = "Le nom complet est obligatoire";
    if (isNew && !draft.email.trim()) e.email = "L'adresse e-mail est obligatoire";
    setErrors(e);
    if (Object.keys(e).length) { ctx.toast({ tone: "danger", title: "Champs manquants", body: "Veuillez corriger les champs en rouge." }); return; }
    const rights = draft.role === "chef" ? Object.fromEntries(ctx.typeNames.map(t => [t, true])) : draft.rights;
    if (isNew) {
      const id = "u" + (users.length + 1) + Date.now().toString().slice(-3);
      const u = { ...draft, id, initials: makeInitials(draft.name), rights };
      setUsers(us => [...us, u]);
      ctx.toast({ title: "Agent créé", body: draft.name + " a été ajouté avec le rôle " + D.ROLES[draft.role].name + "." });
    } else {
      updateUser(draft.id, { ...draft, initials: makeInitials(draft.name), rights });
      ctx.toast({ title: "Agent mis à jour", body: "Les informations de " + draft.name + " ont été enregistrées." });
    }
    setDraft(null);
  };

  const shown = users.filter(u => filter === "tous" ? true : u.role === filter);

  return (
    <div className="content-pad" style={{ maxWidth: 1340 }}>
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Administration · {users.length} agents</div>
          <h1>Utilisateurs &amp; droits d'accès</h1>
          <div className="ph-sub">Gérez les rôles et les autorisations par typologie d'archive pour chaque service.</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Icon name="plus" size={16} />Ajouter un agent</button>
      </div>

      <div className="row between center wrap gap-3" style={{ marginBottom: 14 }}>
        <div className="seg">
          {[["tous", "Tous"], ["chef", "Archiviste Chef"], ["saisisseur", "Saisisseurs"], ["consultant", "Consultants"]].map(([k, l]) => (
            <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}<span className="muted-3 mono" style={{ marginLeft: 6, fontSize: 10.5 }}>{k === "tous" ? users.length : users.filter(u => u.role === k).length}</span></button>
          ))}
        </div>
        <div className="row gap-2 center muted-3" style={{ fontSize: 11.5 }}><Icon name="info" size={14} />Les modifications de droits sont appliquées immédiatement.</div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Agent</th>
                <th style={{ width: 170 }}>Rôle</th>
                <th style={{ width: 180 }}>Service affecté</th>
                <th style={{ width: 230 }}>Droits par typologie</th>
                <th style={{ width: 110 }}>Statut</th>
                <th style={{ width: 130 }}>Dern. connexion</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {shown.map(u => {
                const granted = ctx.typeNames.filter(t => u.rights[t]).length;
                return (
                  <tr key={u.id} style={{ cursor: "pointer" }} onClick={() => openEdit(u)}>
                    <td>
                      <div className="row gap-3 center">
                        <Avatar name={u.name} initials={u.initials} color={u.color} size={34} />
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div><div className="muted-3 mono" style={{ fontSize: 11 }}>{u.email || (u.id.toUpperCase() + "@dangbo.bj")}</div></div>
                      </div>
                    </td>
                    <td><RoleTag role={u.role} /></td>
                    <td><span style={{ fontSize: 12.5 }}>{u.service}</span></td>
                    <td>
                      {u.role === "chef" ? <span className="badge badge-green"><Icon name="shieldCheck" size={12} />Accès total</span> : (
                        <div className="row gap-2 center wrap">
                          {ctx.typeNames.map(t => (
                            <span key={t} className="tip" data-tip={t} style={{ width: 9, height: 9, borderRadius: 2, background: u.rights[t] ? (TYPE_DOT[t] || BADGE_DOT[typeTone(t)]) : "var(--border-strong)", opacity: u.rights[t] ? 1 : .55 }} />
                          ))}
                          <span className="muted-3 mono" style={{ fontSize: 11, marginLeft: 2 }}>{granted}/{ctx.typeNames.length}</span>
                        </div>
                      )}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="row gap-2 center" onClick={() => updateUser(u.id, { status: u.status === "actif" ? "inactif" : "actif" })}>
                        <span className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: u.status === "actif" ? "var(--primary)" : "var(--text-3)" }} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: u.status === "actif" ? "var(--primary-strong)" : "var(--text-3)" }}>{u.status === "actif" ? "Actif" : "Inactif"}</span>
                      </button>
                    </td>
                    <td><span className="muted mono" style={{ fontSize: 11.5 }}>{u.last}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="ra-btn tip" data-tip="Modifier" onClick={() => openEdit(u)}><Icon name="settings" size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer création / édition d'agent */}
      {draft && (
        <>
          <div className="drawer-overlay" onClick={() => setDraft(null)} />
          <div className="drawer">
            <div className="row between center" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div className="row gap-3 center">
                <Avatar name={draft.name || "Nouvel agent"} initials={draft.name ? makeInitials(draft.name) : "+"} color={draft.color} size={40} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{isNew ? "Nouvel agent" : draft.name}</div>
                  <div className="muted-3 mono" style={{ fontSize: 11 }}>{isNew ? "Création de compte" : (draft.email)}</div>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setDraft(null)}><Icon name="x" size={18} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {/* Identité */}
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Nom complet <span className="req">*</span></label>
                <input className={`input ${errors.name ? "error" : ""}`} placeholder="ex : Rachelle Akplogan" value={draft.name}
                  onChange={e => patchDraft({ name: e.target.value, email: isNew ? (e.target.value.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "") + "@dangbo.bj") : draft.email })} />
                {errors.name && <div className="err-msg"><Icon name="alert" size={13} />{errors.name}</div>}
              </div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Adresse e-mail {isNew && <span className="req">*</span>}</label>
                <input className={`input ${errors.email ? "error" : ""}`} placeholder="prenom.nom@dangbo.bj" value={draft.email} onChange={e => patchDraft({ email: e.target.value })} />
                {errors.email && <div className="err-msg"><Icon name="alert" size={13} />{errors.email}</div>}
              </div>

              {/* Couleur du badge */}
              <div className="field" style={{ marginBottom: 18 }}>
                <label>Couleur de l'avatar</label>
                <div className="row gap-2 wrap">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => patchDraft({ color: c })} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: draft.color === c ? "2.5px solid var(--text)" : "2.5px solid transparent", outline: draft.color === c ? "1px solid var(--text)" : "none" }} />
                  ))}
                </div>
              </div>

              <div className="hr" style={{ marginBottom: 18 }} />

              {/* Rôle */}
              <div className="field" style={{ marginBottom: 18 }}>
                <label>Rôle</label>
                <select className="select" value={draft.role} onChange={e => patchDraft({ role: e.target.value })}>
                  <option value="chef">Archiviste Chef / Super Admin</option>
                  <option value="saisisseur">Agent Saisisseur / Numériseur</option>
                  <option value="consultant">Agent Consultant</option>
                </select>
                <div className="hint">{D.ROLES[draft.role].desc}</div>
              </div>

              <div className="field" style={{ marginBottom: 22 }}>
                <label>Service affecté</label>
                <select className="select" value={draft.service} onChange={e => patchDraft({ service: e.target.value })}>
                  {ctx.services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="hr" style={{ marginBottom: 18 }} />

              <div className="row gap-2 center" style={{ marginBottom: 4 }}><Icon name="shield" size={16} className="muted" /><strong style={{ fontSize: 13.5 }}>Accès par typologie d'archive</strong></div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>Activez les catégories que cet agent peut rechercher et consulter.</div>

              {draft.role === "chef" ? (
                <div className="row gap-2 center" style={{ padding: "14px 16px", background: "var(--primary-tint)", borderRadius: "var(--r-md)", border: "1px solid var(--primary-soft)" }}>
                  <Icon name="shieldCheck" size={18} style={{ color: "var(--primary)" }} />
                  <span style={{ fontSize: 12.5, color: "var(--primary-strong)", fontWeight: 600 }}>Accès total à toutes les typologies (rôle administrateur).</span>
                </div>
              ) : (
                <div className="col gap-2">
                  {ctx.typeNames.map(t => (
                    <div key={t} className="row between center" style={{ padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: draft.rights[t] ? "var(--surface-2)" : "var(--surface)" }}>
                      <div className="row gap-3 center">
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: TYPE_DOT[t] || BADGE_DOT[typeTone(t)] }} />
                        <div><div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div><div className="muted-3" style={{ fontSize: 11 }}>{(ctx.types[t] || {}).subs?.join(" · ")}</div></div>
                      </div>
                      <Switch on={!!draft.rights[t]} onClick={() => toggleDraftRight(t)} />
                    </div>
                  ))}
                </div>
              )}

              <div className="hr" style={{ margin: "22px 0 18px" }} />
              <div className="row between center" style={{ padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>Compte actif</div><div className="muted-3" style={{ fontSize: 11 }}>Autorise la connexion de l'agent</div></div>
                <Switch on={draft.status === "actif"} onClick={() => patchDraft({ status: draft.status === "actif" ? "inactif" : "actif" })} />
              </div>
            </div>

            <div className="row between center gap-3" style={{ padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
              {isNew ? (
                <button className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>Annuler</button>
              ) : (
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-deep)" }} onClick={() => { ctx.toast({ tone: "danger", title: "Révocation", body: draft.name + " — confirmation requise avant suppression." }); }}><Icon name="trash" size={15} />Révoquer l'accès</button>
              )}
              <button className="btn btn-primary btn-sm" onClick={save}><Icon name={isNew ? "plus" : "check"} size={15} />{isNew ? "Créer l'agent" : "Enregistrer"}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

window.Users = Users;
