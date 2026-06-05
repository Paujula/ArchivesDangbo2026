"use client";

import { BADGE_DOT, CONSERVATION } from "@/lib/data";

interface BadgeProps {
  tone?: string;
  dot?: string;
  children: React.ReactNode;
}

export default function Badge({ tone = "neutral", dot, children }: BadgeProps) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="dot" style={{ background: dot }} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = (CONSERVATION[status] || {}).badge || "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
