"use client";

import Icon from "./Icon";

interface CheckboxProps {
  on: boolean;
  onClick: () => void;
}

export default function Checkbox({ on, onClick }: CheckboxProps) {
  return (
    <button
      type="button"
      className={`cbx ${on ? "on" : ""}`}
      onClick={onClick}
      role="checkbox"
      aria-checked={on}
    >
      <Icon name="check" size={12} stroke={3} />
    </button>
  );
}
