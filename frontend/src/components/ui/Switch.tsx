"use client";

interface SwitchProps {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function Switch({ on, onClick, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      className={`switch ${on ? "on" : ""} ${disabled ? "disabled" : ""}`}
      onClick={disabled ? undefined : onClick}
      aria-pressed={on}
    />
  );
}
