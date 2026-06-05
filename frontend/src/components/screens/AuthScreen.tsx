"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import Seal from "@/components/ui/Seal";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { USERS, ROLES, DEMO_ACCOUNTS } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import { api, ApiError } from "@/lib/api";
import type { Role } from "@/lib/types";

// ── Utilitaires ───────────────────────────────────────────────────────────────

function pwStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const pct = Math.min(100, (s / 5) * 100);
  const label = pw.length === 0 ? '' : s <= 1 ? 'Faible' : s <= 3 ? 'Moyen' : 'Fort';
  const color = s <= 1 ? 'var(--danger)' : s <= 3 ? 'var(--gold)' : 'var(--primary)';
  return { pct, label, color };
}

function PwField({ value, onChange, placeholder, error, autoFocus }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-wrap">
      <input
        type={show ? 'text' : 'password'}
        className={`input ${error ? 'error' : ''}`}
        style={{ paddingRight: 40 }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
      />
      <button type="button" className="pw-eye" onClick={() => setShow(s => !s)} tabIndex={-1}>
        <Icon name={show ? 'eyeOff' : 'eye'} size={16} />
      </button>
    </div>
  );
}

function AuthBrand() {
  const feats = [
    { icon: 'archive',      t: 'Fonds 100 % dématérialisé',  d: 'État civil, urbanisme, courriers et comptabilité.' },
    { icon: 'search',       t: 'Recherche instantanée',       d: 'Retrouvez toute archive en quelques secondes.' },
    { icon: 'shieldCheck',  t: 'Traçabilité & sécurité',      d: 'Chaque accès est horodaté et nominatif.' },
  ];
  return (
    <div className="auth-brand">
      <div className="auth-brand-grid" />
      <div>
        <div className="row gap-3 center">
          <img src="/mairie_logo.jpeg" alt="Logo Mairie de Dangbo" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>Archives Dangbo</div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'rgba(243,246,240,.55)', textTransform: 'uppercase' }}>
              Mairie · Département de l&apos;Ouémé
            </div>
          </div>
        </div>
        <div className="row gap-2 center" style={{ marginTop: 30 }}>
          <span className="auth-flag"><span className="fg" /><span className="fr"><i /><i /></span></span>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.12em', color: 'rgba(243,246,240,.6)', textTransform: 'uppercase' }}>
            République du Bénin
          </span>
        </div>
        <div className="auth-hero-title">Système de gestion<br />des archives municipales</div>
        <div className="auth-hero-sub">
          Plateforme officielle de dématérialisation et de conservation du patrimoine documentaire de la commune de Dangbo.
        </div>
      </div>
      <div style={{ margin: '10px 0' }}>
        {feats.map((f, i) => (
          <div key={i} className="auth-feature">
            <span className="afi"><Icon name={f.icon} size={16} /></span>
            <div><div className="aft">{f.t}</div><div className="afd">{f.d}</div></div>
          </div>
        ))}
      </div>
      <div className="row between center">
        <span className="auth-foot">Fraternité · Justice · Travail</span>
        <span className="auth-foot">v1.0 — 2026</span>
      </div>
    </div>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function AuthScreen() {
  const app = useApp();

  const [mode,    setMode]    = useState<'login' | 'forgot' | 'sent' | 'reset' | 'done'>('login');
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot / reset
  const [resetToken, setResetToken] = useState('');
  const [rpw,  setRpw]  = useState('');
  const [rpw2, setRpw2] = useState('');
  const [rerr, setRerr] = useState<Record<string, string>>({});

  const fillDemo = (a: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(a.email);
    setPw(a.password);
    setErr('');
  };

  // ── Login ──────────────────────────────────────────────────────────────────

  const submitLogin = async () => {
    setErr('');
    if (!email.trim() || !pw) {
      setErr('Veuillez renseigner votre e-mail et votre mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await app.login(email.trim(), pw);
      // AppContext gère la redirection vers dashboard
    } catch (e) {
      if (e instanceof ApiError) {
        setErr(e.message);
      } else {
        setErr('Erreur de connexion. Vérifiez que le serveur est accessible.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Mot de passe oublié ────────────────────────────────────────────────────

  const submitForgot = async () => {
    setErr('');
    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      setErr('Saisissez une adresse e-mail valide.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email.trim());
      // En mode démo, le backend retourne le token directement
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setMode('sent');
    } catch (e) {
      if (e instanceof ApiError) {
        setErr(e.message);
      } else {
        // On affiche quand même "sent" pour ne pas révéler si l'email existe
        setMode('sent');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Reset mot de passe ─────────────────────────────────────────────────────

  const submitReset = async () => {
    const e: Record<string, string> = {};
    if (rpw.length < 8)  e.rpw  = '8 caractères minimum.';
    if (rpw2 !== rpw)    e.rpw2 = 'Les mots de passe ne correspondent pas.';
    setRerr(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      await api.auth.resetPassword(resetToken, email, rpw, rpw2);
      setMode('done');
    } catch (ex) {
      if (ex instanceof ApiError) {
        setRerr({ rpw: ex.message });
      } else {
        setRerr({ rpw: 'Erreur réseau. Réessayez.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const st = pwStrength(rpw);

  return (
    <div className="auth-wrap">
      <AuthBrand />
      <div className="auth-panel">
        <div className="auth-card">

          {/* ── Connexion ───────────────────────────────────────────────── */}
          {mode === 'login' && (
            <div>
              <div className="auth-h">Connexion</div>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 6, marginBottom: 24 }}>
                Accédez à votre espace de gestion des archives.
              </p>

              {err && (
                <div className="row gap-2 center" style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid #f0c9c5', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                  <Icon name="alert" size={15} style={{ color: 'var(--danger-deep)', flex: '0 0 auto' }} />
                  <span style={{ fontSize: 12.5, color: 'var(--danger-deep)', fontWeight: 500 }}>{err}</span>
                </div>
              )}

              <div className="field" style={{ marginBottom: 15 }}>
                <label>Adresse e-mail professionnelle</label>
                <div style={{ position: 'relative' }}>
                  <Icon name="mail" size={16} className="muted-3" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    className="input" style={{ paddingLeft: 36 }} placeholder="prenom.nom@dangbo.bj"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitLogin()}
                    autoFocus
                  />
                </div>
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <div className="row between center">
                  <label style={{ marginBottom: 0 }}>Mot de passe</label>
                  <button className="auth-link" onClick={() => { setMode('forgot'); setErr(''); }}>Mot de passe oublié ?</button>
                </div>
                <div onKeyDown={e => { if (e.key === 'Enter') submitLogin(); }}>
                  <PwField value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', height: 44 }} onClick={submitLogin} disabled={loading}>
                {loading
                  ? <><span className="sk" style={{ width: 15, height: 15, borderRadius: '50%' }} />Connexion…</>
                  : <><Icon name="login" size={17} />Se connecter</>}
              </button>

              <div className="row gap-3 center" style={{ margin: '22px 0 14px' }}>
                <div className="hr grow" />
                <span className="mono muted-3" style={{ fontSize: 10, letterSpacing: '.1em' }}>COMPTES DE DÉMONSTRATION</span>
                <div className="hr grow" />
              </div>
              <div className="col gap-2">
                {DEMO_ACCOUNTS.map(a => {
                  const u = USERS.find(x => x.id === a.uid)!;
                  return (
                    <button key={a.uid} className="demo-chip" onClick={() => fillDemo(a)}>
                      <Avatar name={u.name} initials={u.initials} color={u.color} size={30} />
                      <div className="grow" style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{u.name}</div>
                        <div className="muted-3 mono" style={{ fontSize: 10.5 }}>{a.email}</div>
                      </div>
                      <Badge tone={a.role === 'chef' || a.role === 'admin' ? 'green' : a.role === 'saisisseur' ? 'gold' : 'slate'}>
                        {ROLES[a.role].name}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              <div className="row gap-2 center muted-3" style={{ fontSize: 11, marginTop: 12, justifyContent: 'center' }}>
                <Icon name="key" size={13} />
                <span>Mot de passe de démo : <span className="mono" style={{ color: 'var(--text-2)' }}>dangbo2024</span></span>
              </div>
            </div>
          )}

          {/* ── Mot de passe oublié ─────────────────────────────────────── */}
          {mode === 'forgot' && (
            <div>
              <button className="row gap-2 center muted" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 18 }}
                onClick={() => { setMode('login'); setErr(''); }}>
                <Icon name="chevronLeft" size={15} />Retour à la connexion
              </button>
              <div className="s-ico" style={{ width: 46, height: 46, background: 'var(--gold-soft)', color: 'var(--gold-strong)', marginBottom: 16 }}>
                <Icon name="key" size={22} />
              </div>
              <div className="auth-h">Mot de passe oublié</div>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 6, marginBottom: 22, lineHeight: 1.5 }}>
                Saisissez votre e-mail professionnel. Un lien de réinitialisation vous sera envoyé.
              </p>
              {err && (
                <div className="row gap-2 center" style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid #f0c9c5', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                  <Icon name="alert" size={15} style={{ color: 'var(--danger-deep)' }} />
                  <span style={{ fontSize: 12.5, color: 'var(--danger-deep)' }}>{err}</span>
                </div>
              )}
              <div className="field" style={{ marginBottom: 18 }}>
                <label>Adresse e-mail</label>
                <div style={{ position: 'relative' }}>
                  <Icon name="mail" size={16} className="muted-3" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input className="input" style={{ paddingLeft: 36 }} placeholder="prenom.nom@dangbo.bj"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitForgot()} autoFocus />
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', height: 44 }} onClick={submitForgot} disabled={loading}>
                {loading
                  ? <><span className="sk" style={{ width: 15, height: 15, borderRadius: '50%' }} />Envoi…</>
                  : <><Icon name="mail" size={16} />Envoyer le lien de réinitialisation</>}
              </button>
            </div>
          )}

          {/* ── Lien envoyé ─────────────────────────────────────────────── */}
          {mode === 'sent' && (
            <div>
              <div className="s-ico" style={{ width: 52, height: 52, background: 'var(--primary-soft)', color: 'var(--primary)', marginBottom: 18 }}>
                <Icon name="mail" size={24} />
              </div>
              <div className="auth-h">Vérifiez votre messagerie</div>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>
                Si un compte est associé à <strong style={{ color: 'var(--text)' }}>{email || 'votre adresse'}</strong>, un lien de réinitialisation vient d&apos;y être envoyé. Le lien expire dans 30 minutes.
              </p>
              <div className="row gap-2 center" style={{ padding: '11px 13px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', margin: '18px 0' }}>
                <Icon name="info" size={15} className="muted" />
                <span className="muted" style={{ fontSize: 12 }}>Démonstration : poursuivez la réinitialisation ci-dessous.</span>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', height: 44, marginBottom: 10 }} onClick={() => setMode('reset')}>
                <Icon name="key" size={16} />Réinitialiser maintenant
              </button>
              <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { setMode('login'); setErr(''); }}>
                Retour à la connexion
              </button>
            </div>
          )}

          {/* ── Nouveau mot de passe ────────────────────────────────────── */}
          {mode === 'reset' && (
            <div>
              <div className="s-ico" style={{ width: 46, height: 46, background: 'var(--primary-soft)', color: 'var(--primary)', marginBottom: 16 }}>
                <Icon name="lock" size={22} />
              </div>
              <div className="auth-h">Nouveau mot de passe</div>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 6, marginBottom: 22 }}>
                Choisissez un mot de passe robuste (8 caractères minimum).
              </p>
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Nouveau mot de passe</label>
                <PwField value={rpw} onChange={e => { setRpw(e.target.value); setRerr(x => ({ ...x, rpw: '' })); }}
                  placeholder="••••••••" error={rerr.rpw} autoFocus />
                {rpw && (
                  <div style={{ marginTop: 8 }}>
                    <div className="auth-strength"><i style={{ width: st.pct + '%', background: st.color }} /></div>
                    <div className="row between" style={{ marginTop: 5 }}>
                      <span className="muted-3" style={{ fontSize: 11 }}>Sécurité</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: st.color }}>{st.label}</span>
                    </div>
                  </div>
                )}
                {rerr.rpw && <div className="err-msg"><Icon name="alert" size={13} />{rerr.rpw}</div>}
              </div>
              <div className="field" style={{ marginBottom: 20 }}>
                <label>Confirmer le mot de passe</label>
                <PwField value={rpw2} onChange={e => { setRpw2(e.target.value); setRerr(x => ({ ...x, rpw2: '' })); }}
                  placeholder="••••••••" error={rerr.rpw2} />
                {rerr.rpw2 && <div className="err-msg"><Icon name="alert" size={13} />{rerr.rpw2}</div>}
              </div>
              <button className="btn btn-primary" style={{ width: '100%', height: 44 }} onClick={submitReset} disabled={loading}>
                {loading
                  ? <><span className="sk" style={{ width: 15, height: 15, borderRadius: '50%' }} />Enregistrement…</>
                  : <><Icon name="check" size={17} />Définir le mot de passe</>}
              </button>
            </div>
          )}

          {/* ── Succès ─────────────────────────────────────────────────── */}
          {mode === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div className="s-ico" style={{ width: 56, height: 56, background: 'var(--primary-soft)', color: 'var(--primary)', margin: '0 auto 18px' }}>
                <Icon name="shieldCheck" size={26} />
              </div>
              <div className="auth-h">Mot de passe mis à jour</div>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>
                Votre mot de passe a été modifié avec succès. Vous pouvez désormais vous connecter avec vos nouveaux identifiants.
              </p>
              <button className="btn btn-primary" style={{ width: '100%', height: 44, marginTop: 22 }}
                onClick={() => { setMode('login'); setPw(''); setRpw(''); setRpw2(''); setErr(''); }}>
                <Icon name="login" size={17} />Aller à la connexion
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Modal changement de mot de passe ─────────────────────────────────────────

export function ChangePasswordModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [cur,  setCur]  = useState('');
  const [np,   setNp]   = useState('');
  const [np2,  setNp2]  = useState('');
  const [err,  setErr]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const st = pwStrength(np);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!cur)             e.cur  = 'Saisissez votre mot de passe actuel.';
    if (np.length < 8)    e.np   = '8 caractères minimum.';
    if (np && np === cur) e.np   = 'Le nouveau mot de passe doit être différent.';
    if (np2 !== np)       e.np2  = 'Les mots de passe ne correspondent pas.';
    setErr(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      await api.auth.changePassword(cur, np, np2);
      onDone();
    } catch (ex) {
      if (ex instanceof ApiError) {
        if (ex.status === 422 && ex.errors?.current_password) {
          setErr({ cur: ex.errors.current_password[0] });
        } else {
          setErr({ cur: ex.message });
        }
      } else {
        setErr({ cur: 'Erreur réseau. Réessayez.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="row between center" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div className="row gap-3 center">
            <div className="s-ico" style={{ width: 38, height: 38, background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              <Icon name="key" size={19} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Changer le mot de passe</div>
              <div className="muted-3" style={{ fontSize: 11.5 }}>Sécurité du compte</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Mot de passe actuel</label>
            <PwField value={cur} onChange={e => { setCur(e.target.value); setErr(x => ({ ...x, cur: '' })); }}
              placeholder="••••••••" error={err.cur} autoFocus />
            {err.cur && <div className="err-msg"><Icon name="alert" size={13} />{err.cur}</div>}
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Nouveau mot de passe</label>
            <PwField value={np} onChange={e => { setNp(e.target.value); setErr(x => ({ ...x, np: '' })); }}
              placeholder="••••••••" error={err.np} />
            {np && (
              <div style={{ marginTop: 8 }}>
                <div className="auth-strength"><i style={{ width: st.pct + '%', background: st.color }} /></div>
                <div className="row between" style={{ marginTop: 5 }}>
                  <span className="muted-3" style={{ fontSize: 11 }}>Sécurité</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: st.color }}>{st.label}</span>
                </div>
              </div>
            )}
            {err.np && <div className="err-msg"><Icon name="alert" size={13} />{err.np}</div>}
          </div>
          <div className="field" style={{ marginBottom: 4 }}>
            <label>Confirmer le nouveau mot de passe</label>
            <PwField value={np2} onChange={e => { setNp2(e.target.value); setErr(x => ({ ...x, np2: '' })); }}
              placeholder="••••••••" error={err.np2} />
            {err.np2 && <div className="err-msg"><Icon name="alert" size={13} />{err.np2}</div>}
          </div>
        </div>
        <div className="row between center gap-3" style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
            {loading ? 'Mise à jour…' : <><Icon name="check" size={15} />Mettre à jour</>}
          </button>
        </div>
      </div>
    </div>
  );
}
