// src/components/ui/Input.tsx
import React from "react";

export default function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-3 py-2 border border-zinc-300 bg-white text-sm outline-none focus:ring-2 focus:ring-black/20"
    />
  );
}
