"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import AuthScreen, { ChangePasswordModal } from "@/components/screens/AuthScreen";
import Dashboard from "@/components/screens/Dashboard";
import Search from "@/components/screens/Search";
import Ingest from "@/components/screens/Ingest";
import Viewer from "@/components/screens/Viewer";
import Users from "@/components/screens/Users";
import Settings from "@/components/screens/Settings";
import Documents from "@/components/screens/Documents";
import MyDocuments from "@/components/screens/MyDocuments";
import Historique from "@/components/screens/Historique";
import DemandesScreen from "@/components/screens/DemandesScreen";
import RapportScreen from "@/components/screens/RapportScreen";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import ToastList from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { Route } from "@/lib/types";

export default function App() {
  const app = useApp();
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (app.authed && (app.role === "admin" || app.role === "chef")) {
      api.users.list().then(r => setUserCount(r.users.length)).catch(() => {});
    }
  }, [app.authed, app.role]);

  // ── Vérification initiale du token (splash) ─────────────────────────────
  if (app.authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="sk" style={{
            width: 40, height: 40, borderRadius: '50%',
            margin: '0 auto 16px',
            background: 'var(--primary-soft)',
          }} />
          <div className="muted" style={{ fontSize: 13 }}>Vérification de la session…</div>
        </div>
      </div>
    );
  }

  // ── Non authentifié ─────────────────────────────────────────────────────
  if (!app.authed) {
    return (
      <>
        <AuthScreen />
        <ToastList toasts={app.toasts} />
      </>
    );
  }

  // ── App principale ──────────────────────────────────────────────────────
  return (
    <div className="app" data-collapsed={app.collapsed}>
      <Sidebar
        route={app.route}
        role={app.role}
        collapsed={app.collapsed}
        onNavigate={app.navigate}
        onToggleCollapse={() => app.setCollapsed(c => !c)}
        userCount={userCount}
      />

      <div className="main">
        <Topbar
          route={app.route}
          role={app.role}
          user={app.user}
          roleMenuOpen={app.roleMenuOpen}
          userMenuOpen={app.userMenuOpen}
          onToggleRoleMenu={() => app.setRoleMenuOpen(!app.roleMenuOpen)}
          onToggleUserMenu={() => app.setUserMenuOpen(!app.userMenuOpen)}
          onSetRole={app.setRole}
          onToast={app.toast}
          onNavigate={(r) => app.navigate(r as Route)}
          onLogout={app.logout}
          onChangePw={() => app.setChangePwOpen(true)}
          onToggleCollapse={() => app.setCollapsed(c => !c)}
        />

        <main className="content">
          {app.route === 'dashboard' && <Dashboard ctx={app.ctx} />}
          {app.route === 'search'    && <Search ctx={app.ctx} />}
          {app.route === 'ingest'    && <Ingest ctx={app.ctx} />}
          {app.route === 'viewer'    && app.activeDoc && <Viewer ctx={app.ctx} />}
          {app.route === 'users'     && <Users ctx={app.ctx} />}
          {app.route === 'settings'  && <Settings ctx={app.ctx} />}
          {app.route === 'documents' && <Documents ctx={app.ctx} />}
          {app.route === 'my-documents' && <MyDocuments ctx={app.ctx} />}
          {app.route === 'historique' && <Historique ctx={app.ctx} />}
          {app.route === 'demandes' && <DemandesScreen ctx={app.ctx} />}
          {app.route === 'rapport' && <RapportScreen ctx={app.ctx} />}
        </main>
      </div>

      {/* Modales */}
      {app.changePwOpen && (
        <ChangePasswordModal
          onClose={() => app.setChangePwOpen(false)}
          onDone={() => {
            app.setChangePwOpen(false);
            app.toast({ title: 'Mot de passe mis à jour', body: 'Reconnexion requise.' });
            // Le changement de mdp révoque tous les tokens → force déconnexion
            setTimeout(() => app.logout(), 2000);
          }}
        />
      )}

      <ToastList toasts={app.toasts} />
    </div>
  );
}
