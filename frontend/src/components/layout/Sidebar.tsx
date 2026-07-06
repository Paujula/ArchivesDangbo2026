"use client";

import Icon from "@/components/ui/Icon";
import { ROLES } from "@/lib/data";
import type { Route, Role } from "@/lib/types";

const NAV = [
  {
    group: "Principal",
    items: [
      { key: "dashboard" as Route, icon: "dashboard", label: "Tableau de bord",      roles: ["chef", "admin", "consultant", "saisisseur"] },
      { key: "search"    as Route, icon: "search",    label: "Recherche et Fonds",     roles: ["chef", "admin", "saisisseur", "consultant"] },
    ],
  },
  {
    group: "Gestion",
    items: [
      { key: "ingest" as Route, icon: "scan", label: "Numérisation", roles: ["chef", "saisisseur"] },
      { key: "my-documents" as Route, icon: "file", label: "Listes des documents", roles: ["saisisseur"] },
    ],
  },
  {
    group: "Administration",
    items: [
      { key: "documents" as Route, icon: "file",     label: "Document Archive",           roles: ["chef"] },
      { key: "users"     as Route, icon: "users",     label: "Utilisateurs et Droits",      roles: ["chef", "admin"] },
      { key: "demandes" as Route, icon: "download",   label: "Demandes d'accès",          roles: ["chef", "saisisseur", "consultant"] },
      { key: "historique" as Route, icon: "history",  label: "Historique d'activité",     roles: ["admin"] },
      { key: "settings"  as Route, icon: "settings",  label: "Paramètres et Nomenclature",  roles: ["chef", "admin"] },
      { key: "rapport" as Route, icon: "chart",       label: "Rapport Journalière",         roles: ["chef", "admin"] },
    ],
  },
];

interface SidebarProps {
  route: Route;
  role: Role;
  collapsed: boolean;
  onNavigate: (r: Route) => void;
  onToggleCollapse: () => void;
  userCount: number;
}

export default function Sidebar({ route, role, collapsed, onNavigate, onToggleCollapse, userCount }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <img src="/mairie_logo.jpeg" alt="Logo Mairie de Dangbo" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
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
                <button
                  key={it.key}
                  className={`sb-item ${route === it.key ? "active" : ""}`}
                  onClick={() => onNavigate(it.key)}
                  title={it.label}
                >
                  <Icon name={it.icon} size={18} />
                  <span className="sb-item-label">{it.label}</span>
                  {it.key === "users" && <span className="badge-count">{userCount}</span>}
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sb-foot">
        <button className="sb-item" onClick={onToggleCollapse} title="Réduire le menu">
          <Icon name="panel" size={18} />
          <span className="sb-item-label">Réduire le menu</span>
        </button>
        <div className="motto" style={{ marginTop: 8 }}>Fraternité · Justice · Travail</div>
      </div>
    </aside>
  );
}
