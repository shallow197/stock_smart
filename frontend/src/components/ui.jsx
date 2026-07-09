import { useEffect } from "react";
import { Icon } from "../lib/icons";
import { initials, avatarTone } from "../lib/format";

export function Spinner({ size = 22, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`animate-spin ${className}`} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function FullLoader({ label = "Chargement…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
      <Spinner size={30} className="text-brand-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ icon = "box", title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-8 py-16 text-center">
      <div className="grid place-items-center w-16 h-16 rounded-2xl bg-brand-50 text-brand-400 mb-1">
        <Icon name={icon} size={30} />
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {hint && <p className="text-[13px] text-muted max-w-[16rem]">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Avatar({ label, size = 44, tone }) {
  const cls = tone || avatarTone(label || "");
  return (
    <div
      className={`grid place-items-center rounded-xl font-bold ${cls}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials(label)}
    </div>
  );
}

const PRODUCT_STATUS = {
  normal: { cls: "chip-ok", label: "Normal" },
  low: { cls: "chip-warn", label: "Stock bas" },
  out: { cls: "chip-danger", label: "Rupture" },
};
export function ProductStatusChip({ status }) {
  const s = PRODUCT_STATUS[status] || PRODUCT_STATUS.normal;
  return <span className={`chip ${s.cls}`}>{s.label}</span>;
}

const CLIENT_STATUS = {
  ok: { cls: "chip-ok", label: "À jour" },
  credit: { cls: "chip-warn", label: "Crédit" },
  late: { cls: "chip-danger", label: "Retard" },
};
export function ClientStatusChip({ status }) {
  const s = CLIENT_STATUS[status] || CLIENT_STATUS.ok;
  return <span className={`chip ${s.cls}`}>{s.label}</span>;
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`seg ${value === o.value ? "seg-on" : "seg-off"}`}
        >
          {o.label}
          {o.count != null && (
            <span className={value === o.value ? "opacity-90" : "text-muted/70"}>({o.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = "Rechercher…" }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
        <Icon name="search" size={19} />
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-11"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted p-1.5 rounded-lg active:bg-line"
        >
          <Icon name="x" size={17} />
        </button>
      )}
    </div>
  );
}

export function Fab({ onClick, icon = "plus", label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label || "Ajouter"}
      className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-40 grid place-items-center w-14 h-14 rounded-full text-white active:scale-95 transition"
      style={{
        background: "linear-gradient(180deg, #2e8b57, #1e5f4f)",
        boxShadow: "0 12px 26px -8px rgba(30,95,79,0.7)",
      }}
    >
      <Icon name={icon} size={26} strokeWidth={2.2} />
    </button>
  );
}

export function IconButton({ icon, onClick, className = "", size = 22, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`grid place-items-center w-10 h-10 rounded-full transition active:scale-95 ${className}`}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}

// Bottom sheet réutilisable
export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = "");
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-[ecos-rise_.2s_ease]" onClick={onClose} />
      <div className="relative w-full max-w-[30rem] bg-surface rounded-t-3xl p-5 pb-8 animate-rise max-h-[88vh] overflow-y-auto">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        {title && <h2 className="text-[17px] font-bold text-ink mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
      {error && <p className="mt-1 text-[12px] font-medium text-danger">{error}</p>}
    </div>
  );
}
