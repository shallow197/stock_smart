import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

// Coquille des écrans principaux : contenu défilant + navigation basse.
export default function AppShell() {
  return (
    <div className="app-frame pb-28 lg:pb-10">
      <Outlet />
      <BottomNav />
    </div>
  );
}
