"use client";

import Icon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { ROLES } from "@/lib/data";
import type { Role, User } from "@/lib/types";

interface TopbarProps {
  route: string;
  role: Role;
  user: User;
  roleMenuOpen: boolean;
  userMenuOpen: boolean;
  onToggleRoleMenu: () => void;
  onToggleUserMenu: () => void;
  onSetRole: (r: Role) => void;
  onToast: (t: { title: string; body?: string }) => void;
  onNavigate: (r: string) => void;
  onLogout: () => void;
  onChangePw: () => void;
  onToggleCollapse: () => void;
}

export default function Topbar({
  route,
  role, user,
  roleMenuOpen, userMenuOpen,
  onToggleRoleMenu, onToggleUserMenu,
  onSetRole, onToast, onNavigate, onLogout, onChangePw, onToggleCollapse,
}: TopbarProps) {
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onToggleCollapse}>
        <Icon name="menu" size={19} />
      </button>
      <div className="topbar-spacer" />

      {/* Menu utilisateur */}
      <div style={{ position: "relative" }}>
        <button onClick={onToggleUserMenu} style={{ borderRadius: "50%", border: "none", background: "none", cursor: "pointer" }}>
          <Avatar name={user.name} initials={user.initials} color={user.color} size={36} />
        </button>
        {userMenuOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={onToggleUserMenu} />
            <div className="user-menu">
              <div className="row gap-3 center" style={{ padding: "8px 10px 10px" }}>
                <Avatar name={user.name} initials={user.initials} color={user.color} size={36} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                  <div className="muted-3 mono" style={{ fontSize: 10.5, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.email || (user.id.toUpperCase() + "@dangbo.bj")}
                  </div>
                </div>
              </div>
              <div className="row gap-2 center" style={{ padding: "0 10px 8px" }}>
                <Badge tone={role === "chef" || role === "admin" ? "green" : role === "saisisseur" ? "gold" : "slate"} dot={ROLES[role].dot}>
                  {ROLES[role].name}
                </Badge>
                <span className="muted-3" style={{ fontSize: 11 }}>{user.service}</span>
              </div>
              <div className="hr" style={{ margin: "2px 0 6px" }} />
              {(role !== "saisisseur" && role !== "consultant") && (
                <button className="um-item" onClick={() => { onToggleUserMenu(); onChangePw(); }}>
                  <Icon name="key" size={17} className="muted" />Changer le mot de passe
                </button>
              )}
              <div className="hr" style={{ margin: "6px 0" }} />
              <button className="um-item danger" onClick={onLogout}>
                <Icon name="logout" size={17} />Se déconnecter
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
