// src/components/ui/Card.tsx
import React from "react";

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-6 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}
