"use client";

interface Option {
  value: string;
  label: string;
}

interface SegmentedProps {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}

export default function Segmented({ value, onChange, options }: SegmentedProps) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
