import React from "react";

export function Card({ children }) {
  return <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">{children}</div>;
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold active:scale-[0.99] disabled:opacity-50";
  const variants = {
    primary: "bg-violet-600 text-white hover:bg-violet-700",
    ghost: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, ...props }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-zinc-700">{label}</div>
      <input
        {...props}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />
    </label>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-zinc-700">{label}</div>
      <select
        {...props}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      >
        {children}
      </select>
    </label>
  );
}

export function FieldRow({ children }) {
  return <div className="grid grid-cols-1 gap-3">{children}</div>;
}

export function Toast({ kind = "info", children }) {
  const colors = {
    info: "border-zinc-200 bg-white text-zinc-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
  };
  return <div className={`rounded-xl border p-3 text-sm ${colors[kind]}`}>{children}</div>;
}

