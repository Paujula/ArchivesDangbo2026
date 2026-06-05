"use client";

import Icon from "./Icon";
import type { Toast as ToastType } from "@/lib/types";

export default function ToastList({ toasts }: { toasts: ToastType[] }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.tone || ""}`}>
          <div style={{ color: t.tone === "danger" ? "var(--danger)" : t.tone === "gold" ? "var(--gold)" : "var(--primary)", marginTop: 1 }}>
            <Icon name={t.tone === "danger" ? "alert" : t.tone === "gold" ? "star" : "shieldCheck"} size={18} />
          </div>
          <div>
            <div className="t-title">{t.title}</div>
            {t.body && <div className="t-body">{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
