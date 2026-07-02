"use client";

import Icon from "./Icon";

export default function Confirm({ msg, onConfirm, onCancel }: {
  msg: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div style={{ padding: 24, textAlign: "center" }}>
          <div className="s-ico" style={{ width: 44, height: 44, background: "var(--danger-soft)", color: "var(--danger-deep)", margin: "0 auto 14px" }}>
            <Icon name="alert" size={20} />
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{msg}</p>
          <div className="row gap-2" style={{ justifyContent: "center", marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={onCancel}>Non</button>
            <button className="btn" style={{ background: "var(--danger-deep)", color: "#fff" }} onClick={onConfirm}>Oui</button>
          </div>
        </div>
      </div>
    </div>
  );
}
