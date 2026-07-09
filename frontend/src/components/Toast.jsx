import { createContext, useContext, useState, useCallback } from "react";
import { Icon } from "../lib/icons";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const toast = {
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
    info: (m) => push(m, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed inset-x-0 bottom-24 lg:bottom-8 lg:pl-60 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-rise pointer-events-auto flex items-center gap-2.5 max-w-[26rem] w-full rounded-2xl px-4 py-3 text-[14px] font-medium text-white shadow-lg"
            style={{
              background:
                t.type === "error" ? "#dc2626" : t.type === "info" ? "#1e5f4f" : "#2e8b57",
            }}
          >
            <span className="grid place-items-center rounded-full bg-white/20 p-1">
              <Icon name={t.type === "error" ? "alertCirc" : "check"} size={16} strokeWidth={2.4} />
            </span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans ToastProvider");
  return ctx;
}
