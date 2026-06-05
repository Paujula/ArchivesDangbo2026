"use client";

interface AvatarProps {
  name: string;
  initials: string;
  color: string;
  size?: number;
}

export default function Avatar({ name, initials, color, size = 36 }: AvatarProps) {
  return (
    <div
      className="avatar"
      style={{ background: color, width: size, height: size, fontSize: size * 0.36 }}
      title={name}
    >
      {initials}
    </div>
  );
}
