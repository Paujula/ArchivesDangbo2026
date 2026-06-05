/* ============================================================
   Composants partagés — exposés sur window
   ============================================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------- Icônes (style linéaire, 24px viewBox) ---------- */
const ICONS = {
  dashboard: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
  scan: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8M8 17h8M8 9h2",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2l-.4-2.6h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.07-.4.1-.8.1-1.2Z",
  archive: "M21 8v13H3V8M1 3h22v5H1V3Zm9 9h4",
  chevronDown: "M6 9l6 6 6-6",
  chevronRight: "M9 6l6 6-6 6",
  chevronLeft: "M15 6l-6 6 6 6",
  plus: "M12 5v14M5 12h14",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3Z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  history: "M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l4 2",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM7 11V7a5 5 0 0 1 10 0v4",
  unlock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM7 11V7a5 5 0 0 1 9.9-1",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  menu: "M3 12h18M3 6h18M3 18h18",
  panel: "M3 3h18v18H3V3Zm6 0v18",
  zoomIn: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35M11 8v6M8 11h6",
  zoomOut: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35M8 11h6",
  rotate: "M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16",
  alert: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01",
  drive: "M22 12H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11ZM6 16h.01M10 16h.01",
  trending: "M22 7l-8.5 8.5-5-5L2 17M16 7h6v6",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  tag: "M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.82 8.82a2 2 0 0 0 2.83 0l7.17-7.17a2 2 0 0 0 0-2.83l-8.82-8.82ZM7 7h.01",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  shieldCheck: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-4",
  more: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  maximize: "M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2",
  printer: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8Z",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM17 21v-8H7v8M7 3v5h8",
  draft: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M12 18v-6M9 15h6",
  trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  sort: "M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4",
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2Z",
  building: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v.01M9 12v.01M9 15v.01M9 18v.01",
  check2: "M20 6 9 17l-5-5",
  refresh: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM22 7l-10 6L2 7",
  eyeOff: "M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68M6.61 6.61A13.5 13.5 0 0 0 2 11s3.5 7 10 7a9.12 9.12 0 0 0 5.39-1.61M14.12 14.12a3 3 0 1 1-4.24-4.24M2 2l20 20",
  key: "M14 7a4 4 0 1 0-5.66 5.66L3 18v3h3l5.34-5.34A4 4 0 0 0 14 7Zm2-1h.01",
  login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
};

function Icon({ name, size = 18, stroke = 2, className = "", style }) {
  const d = ICONS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true">
      {d && d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

/* ---------- Sceau institutionnel (placeholder du blason) ---------- */
function Seal({ size = 38 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" aria-label="Sceau Mairie de Dangbo">
      <circle cx="24" cy="24" r="23" fill="var(--primary)" stroke="var(--gold)" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="18.5" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="0.8" strokeDasharray="1.5 2.2" />
      {/* Étoile du Bénin — deux carrés pivotés */}
      <g transform="translate(24 24)">
        <rect x="-7.5" y="-7.5" width="15" height="15" fill="var(--gold)" transform="rotate(0)" />
        <rect x="-7.5" y="-7.5" width="15" height="15" fill="var(--gold)" transform="rotate(45)" />
        <circle r="4.4" fill="var(--primary-deep)" />
        <text x="0" y="3.4" textAnchor="middle" fontFamily="'Space Grotesk',sans-serif" fontWeight="700" fontSize="7" fill="var(--gold)">D</text>
      </g>
    </svg>
  );
}

/* ---------- Badges ---------- */
function Badge({ tone = "neutral", dot, children }) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="dot" style={{ background: dot }} />}
      {children}
    </span>
  );
}
const TYPE_TONE = { "État Civil": "green", "Urbanisme": "slate", "Courriers": "gold", "Comptabilité": "violet" };
const TYPE_DOT  = { "État Civil": "#0c6e4a", "Urbanisme": "#3c5d76", "Courriers": "#c98a16", "Comptabilité": "#6a4d8c" };
const BADGE_DOT = { green: "#0c6e4a", gold: "#c98a16", slate: "#3c5d76", violet: "#6a4d8c", danger: "#c1322b", neutral: "#868f82" };
function typeTone(type) { return (window.TYPE_REGISTRY && window.TYPE_REGISTRY[type] && window.TYPE_REGISTRY[type].badge) || TYPE_TONE[type] || "neutral"; }
function TypeBadge({ type }) { const tone = typeTone(type); return <Badge tone={tone} dot={TYPE_DOT[type] || BADGE_DOT[tone]}>{type}</Badge>; }
function StatusBadge({ status }) {
  const tone = (window.DATA.CONSERVATION[status] || {}).badge || "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

/* ---------- Form controls ---------- */
function Switch({ on, onClick, disabled }) {
  return <button type="button" className={`switch ${on ? "on" : ""} ${disabled ? "disabled" : ""}`} onClick={disabled ? undefined : onClick} aria-pressed={on} />;
}
function Checkbox({ on, onClick }) {
  return (
    <button type="button" className={`cbx ${on ? "on" : ""}`} onClick={onClick} role="checkbox" aria-checked={on}>
      <Icon name="check" size={12} stroke={3} />
    </button>
  );
}

/* ---------- Avatar ---------- */
function Avatar({ name, initials, color, size = 36 }) {
  return <div className="avatar" style={{ background: color, width: size, height: size, fontSize: size * .36 }} title={name}>{initials}</div>;
}

/* ---------- Segmented ---------- */
function Segmented({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

Object.assign(window, { useState, useEffect, useRef, useMemo, useCallback, Icon, Seal, Badge, TypeBadge, StatusBadge, Switch, Checkbox, Avatar, Segmented, TYPE_TONE, TYPE_DOT, BADGE_DOT, typeTone });
