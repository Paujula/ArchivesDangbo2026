"use client";

export default function Seal({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-label="Sceau Mairie de Dangbo">
      <circle cx="24" cy="24" r="23" fill="var(--primary)" stroke="var(--gold)" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="18.5" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="0.8" strokeDasharray="1.5 2.2" />
      <g transform="translate(24 24)">
        <rect x="-7.5" y="-7.5" width="15" height="15" fill="var(--gold)" transform="rotate(0)" />
        <rect x="-7.5" y="-7.5" width="15" height="15" fill="var(--gold)" transform="rotate(45)" />
        <circle r="4.4" fill="var(--primary-deep)" />
        <text x="0" y="3.4" textAnchor="middle" fontFamily="'Space Grotesk',sans-serif" fontWeight="700" fontSize="7" fill="var(--gold)">D</text>
      </g>
    </svg>
  );
}
