// src/components/ui/Button.tsx
import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export default function Button({ loading, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`px-4 py-2 rounded-xl bg-black text-white text-sm w-full hover:opacity-85 disabled:opacity-60`}
    >
      {loading ? "..." : children}
    </button>
  );
}
