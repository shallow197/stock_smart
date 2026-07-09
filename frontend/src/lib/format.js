// Formatage adapté au marché : FCFA, fuseau Africa/Dakar (UTC+0), français.

export function money(value, withCurrency = false) {
  const n = Math.round(Number(value) || 0);
  const s = n.toLocaleString("fr-FR").replace(/ /g, " ");
  return withCurrency ? `${s} FCFA` : s;
}

// Format compact pour les grandes valeurs (ex : 1 247 000 -> 1,25 M)
export function moneyCompact(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(".", ",")} M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} K`;
  return money(n);
}

export function qty(value) {
  const n = Number(value) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
}

const DAKAR = { timeZone: "Africa/Dakar" };

export function time(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR", { ...DAKAR, hour: "2-digit", minute: "2-digit" });
}

export function dateShort(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { ...DAKAR, day: "2-digit", month: "short" });
}

export function dateLong(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { ...DAKAR, weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function relative(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "hier";
  if (d < 30) return `il y a ${d} j`;
  return dateShort(iso);
}

// Initiales pour les avatars (produits, clients)
export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Couleur d'avatar déterministe (dérivée du nom)
const AVATAR_TONES = [
  "bg-brand-100 text-brand-700",
  "bg-amber-100 text-amber-700",
  "bg-blue-100 text-blue-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
];
export function avatarTone(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

export const todayKey = () => new Date().toLocaleDateString("en-CA", DAKAR); // YYYY-MM-DD
