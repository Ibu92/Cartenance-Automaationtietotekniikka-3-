import { LogOut, Moon, Settings, Sun, Wrench } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../state";
import { SettingsDialog } from "./SettingsDialog";
import { useState } from "react";

export function Shell({ children }: { children: React.ReactNode }) {
  const { logout, user, t } = useApp();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Cartenance home">
          <span className="brand-mark"><Wrench size={20} /></span>
          <span>Cartenance</span>
        </Link>
        <nav className="top-actions">
          <button className="icon-button" title={t("settings")} onClick={() => setSettingsOpen(true)}><Settings size={18} /></button>
          <span className="theme-indicator" title={user?.theme ?? "system"}>{user?.theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}</span>
          <button className="button ghost" onClick={() => { logout(); navigate("/login"); }}><LogOut size={16} />{t("logout")}</button>
        </nav>
      </header>
      <main>{children}</main>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
