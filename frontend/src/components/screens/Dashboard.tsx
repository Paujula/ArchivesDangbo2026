"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { AppCtx, DashboardStats } from "@/lib/types";
import { SERIE_DOT } from "@/lib/data";

function StatCard({ icon, tone, label, value, unit, delta, deltaTone = "up", children }: {
  icon: string; tone: string; label: string; value: string;
  unit?: string; delta?: string; deltaTone?: string; children?: React.ReactNode;
}) {
  const bg: Record<string, string> = { green: "var(--primary-soft)", gold: "var(--gold-soft)", slate: "var(--slate-soft)", violet: "var(--violet-soft)" };
  const fg: Record<string, string> = { green: "var(--primary)", gold: "var(--gold-strong)", slate: "var(--slate)", violet: "var(--violet)" };
  return (
    <div className="stat">
      <div className="s-top">
        <div className="s-ico" style={{ background: bg[tone], color: fg[tone] }}><Icon name={icon} size={19} /></div>
        {delta && (
          <span className={`s-delta ${deltaTone}`}>
            <Icon name={deltaTone === "up" ? "trending" : "clock"} size={13} />{delta}
          </span>
        )}
      </div>
      <div className="s-label">{label}</div>
      <div className="s-val tnum">{value}{unit && <span className="u">{unit}</span>}</div>
      {children}
    </div>
  );
}

function formatWhen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

const ACTION_TONES: Record<string, string> = {
  Création: "green",
  Modification: "gold",
  Suppression: "danger",
  Consultation: "slate",
};

export default function Dashboard({ ctx }: { ctx: AppCtx }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.stats()
      .then(setStats)
      .catch(() => ctx.toast({ tone: "danger", title: "Erreur", body: "Impossible de charger les statistiques." }))
      .finally(() => setLoading(false));
  }, [ctx]);

  const canValidate = ctx.role === "chef" || ctx.role === "admin";

  return (
    <div className="content-pad">
      <div className="page-head">
        <div className="ph-left">
          <div className="eyebrow" style={{ marginBottom: 7 }}>Mairie de Dangbo · Ouémé</div>
          <h1>Tableau de bord</h1>
          <div className="ph-sub">
            Vue d&apos;ensemble du fonds d&apos;archives dématérialisées ·{" "}
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost" onClick={() => ctx.navigate("search")}>
            <Icon name="search" size={16} />Recherche avancée
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <div className="sk" style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 12px", background: "var(--primary-soft)" }} />
          <div className="muted" style={{ fontSize: 13 }}>Chargement des statistiques…</div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
            <StatCard icon="archive" tone="green" label="Documents dématérialisés"
              value={(stats?.total_documents ?? 0).toLocaleString("fr-FR")}
              delta={stats ? `+${stats.documents_this_week} / 7 j` : ""} />
            <StatCard icon="users" tone="slate" label="Utilisateurs actifs"
              value={String(stats?.active_users ?? 0)}
              unit={stats ? ` / ${stats.total_users}` : ""}
              delta={stats ? `${Math.round(stats.active_users / (stats.total_users || 1) * 100)}% actifs` : ""} deltaTone="flat" />
            <StatCard icon="eye" tone="gold" label="Consultations totales"
              value={(stats?.total_views ?? 0).toLocaleString("fr-FR")}
              delta="Cumul vues documents" deltaTone="flat" />
            <StatCard icon="shieldCheck" tone="violet" label="Activité récente"
              value={String(stats?.recent_activity.length ?? 0)}
              delta={canValidate ? "En temps réel" : "Réservé au Chef"} deltaTone="flat" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: "var(--gap-grid)", marginTop: "var(--gap-grid)" }}>
            {ctx.role === "admin" ? (
              <div className="card">
                <div className="row between center" style={{ padding: "15px 18px", borderBottom: "1px solid var(--border)" }}>
                  <div className="row gap-2 center">
                    <Icon name="history" size={17} className="muted" />
                    <strong style={{ fontSize: 14 }}>Activité récente</strong>
                  </div>
                  {ctx.role === "admin" && (
                    <button className="btn btn-sm btn-ghost" onClick={() => ctx.navigate("historique")}>
                      Tout voir<Icon name="chevronRight" size={14} />
                    </button>
                  )}
                </div>
                <div>
                  {(stats?.recent_activity.length ?? 0) === 0 ? (
                    <div className="muted-3" style={{ textAlign: "center", padding: "30px 0", fontSize: 13 }}>
                      Aucune activité récente.
                    </div>
                  ) : (
                    stats?.recent_activity.map((a, i) => (
                      <div key={i} className="row gap-3" style={{ padding: "12px 18px", borderBottom: i < (stats?.recent_activity.length ?? 1) - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
                        <Avatar name={a.user?.name ?? ""} initials={a.user?.initials ?? "?"} color={a.user?.color ?? "#868f82"} size={32} />
                        <div className="grow" style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                            <strong>{a.user?.name ?? "Système"}</strong>{" "}
                            <span style={{ fontWeight: 600 }}>{a.details}</span>
                          </div>
                          <div className="row gap-2 center" style={{ marginTop: 4 }}>
                            <Badge tone={ACTION_TONES[a.action] || "neutral"}>{a.action}</Badge>
                          </div>
                        </div>
                        <span className="muted-3 mono" style={{ fontSize: 11, whiteSpace: "nowrap" }}>{formatWhen(a.date_action)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="col gap-4">
                <div className="card card-pad">
                  <div className="row gap-2 center" style={{ marginBottom: 14 }}>
                    <Icon name="briefcase" size={16} className="muted" />
                    <strong style={{ fontSize: 14 }}>Répartition par service</strong>
                  </div>
                  {(stats?.service_distribution.length ?? 0) === 0 ? (
                    <div className="muted-3" style={{ textAlign: "center", padding: "20px 0", fontSize: 13 }}>Aucune donnée.</div>
                  ) : (
                    (stats?.service_distribution ?? []).map((t, i, arr) => {
                      const max = Math.max(...arr.map(x => x.count), 1);
                      return (
                        <div key={i} style={{ marginBottom: i < arr.length - 1 ? 13 : 0 }}>
                          <div className="row between" style={{ marginBottom: 5 }}>
                            <span className="row gap-2 center" style={{ fontSize: 12.5, fontWeight: 600 }}>
                              <span className="dot" style={{ width: 8, height: 8, borderRadius: 2, background: "var(--slate)" }} />
                              {t.label}
                            </span>
                            <span className="mono muted tnum" style={{ fontSize: 12 }}>{t.count.toLocaleString("fr-FR")}</span>
                          </div>
                          <div className="bar">
                            <i style={{ width: (t.count / max * 100) + "%", background: "var(--slate)" }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="card card-pad">
                  <div className="row gap-2 center" style={{ marginBottom: 14 }}>
                    <Icon name="building" size={16} className="muted" />
                    <strong style={{ fontSize: 14 }}>Répartition par direction</strong>
                  </div>
                  {(stats?.direction_distribution.length ?? 0) === 0 ? (
                    <div className="muted-3" style={{ textAlign: "center", padding: "20px 0", fontSize: 13 }}>Aucune donnée.</div>
                  ) : (
                    (stats?.direction_distribution ?? []).map((t, i, arr) => {
                      const max = Math.max(...arr.map(x => x.count), 1);
                      return (
                        <div key={i} style={{ marginBottom: i < arr.length - 1 ? 13 : 0 }}>
                          <div className="row between" style={{ marginBottom: 5 }}>
                            <span className="row gap-2 center" style={{ fontSize: 12.5, fontWeight: 600 }}>
                              <span className="dot" style={{ width: 8, height: 8, borderRadius: 2, background: "var(--gold-strong)" }} />
                              {t.label}
                            </span>
                            <span className="mono muted tnum" style={{ fontSize: 12 }}>{t.count.toLocaleString("fr-FR")}</span>
                          </div>
                          <div className="bar">
                            <i style={{ width: (t.count / max * 100) + "%", background: "var(--gold-strong)" }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="col gap-4">
              <div className="card card-pad">
                <div className="row gap-2 center" style={{ marginBottom: 14 }}>
                  <Icon name="grid" size={16} className="muted" />
                  <strong style={{ fontSize: 14 }}>Répartition par série</strong>
                </div>
                {(stats?.series_distribution.length ?? 0) === 0 ? (
                  <div className="muted-3" style={{ textAlign: "center", padding: "20px 0", fontSize: 13 }}>Aucune donnée.</div>
                ) : (
                  (stats?.series_distribution ?? []).map((t, i, arr) => {
                    const max = Math.max(...arr.map(x => x.count), 1);
                    const color = SERIE_DOT[t.label] || "var(--slate)";
                    return (
                      <div key={i} style={{ marginBottom: i < arr.length - 1 ? 13 : 0 }}>
                        <div className="row between" style={{ marginBottom: 5 }}>
                          <span className="row gap-2 center" style={{ fontSize: 12.5, fontWeight: 600 }}>
                            <span className="dot" style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                            {t.label}
                          </span>
                          <span className="mono muted tnum" style={{ fontSize: 12 }}>{t.count.toLocaleString("fr-FR")}</span>
                        </div>
                        <div className="bar">
                          <i style={{ width: (t.count / max * 100) + "%", background: color }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="card card-pad">
                <div className="row gap-2 center" style={{ marginBottom: 14 }}>
                  <Icon name="users" size={16} className="muted" />
                  <strong style={{ fontSize: 14 }}>Utilisateurs</strong>
                </div>
                <div className="row gap-3 center wrap">
                  <div>
                    <div className="s-val tnum" style={{ fontSize: 28 }}>{(stats?.active_users ?? 0)}</div>
                    <div className="muted" style={{ fontSize: 12 }}>Comptes actifs</div>
                  </div>
                  <div style={{ width: 1, height: 40, background: "var(--border)" }} />
                  <div>
                    <div className="s-val tnum" style={{ fontSize: 28 }}>{((stats?.total_users ?? 0) - (stats?.active_users ?? 0))}</div>
                    <div className="muted" style={{ fontSize: 12 }}>Comptes inactifs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
