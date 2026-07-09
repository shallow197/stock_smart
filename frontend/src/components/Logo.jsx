import { Icon } from "../lib/icons";

// Marque EcoStock : tuile verte + feuille.
export default function Logo({ size = 64 }) {
  return (
    <div
      className="grid place-items-center text-white shadow-lg"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "linear-gradient(160deg, #2e8b57, #1e5f4f)",
        boxShadow: "0 14px 30px -12px rgba(30,95,79,0.75)",
      }}
    >
      <Icon name="logo" size={size * 0.56} strokeWidth={2.2} />
    </div>
  );
}
