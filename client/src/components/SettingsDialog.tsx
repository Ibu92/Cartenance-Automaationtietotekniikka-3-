import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../state";
import type { Language, Theme, User } from "../types";

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token, user, login, t } = useApp();
  const [form, setForm] = useState({ language: "en" as Language, theme: "dark" as Theme });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setForm({ language: user.language, theme: user.theme === "light" ? "light" : "dark" });
  }, [user, open]);

  if (!open) return null;

  async function save() {
    try {
      const next = await api<User>("/api/user/settings", { method: "PUT", token, body: JSON.stringify(form) });
      login(token!, next);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal">
        <div className="modal-head">
          <h2>{t("settings")}</h2>
          <button className="icon-button" onClick={onClose} aria-label={t("close")}>×</button>
        </div>
        <label>{t("language")}<select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as Language })}><option value="en">{t("english")}</option><option value="fi">{t("finnish")}</option></select></label>
        <label>{t("theme")}<select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value as Theme })}><option value="light">{t("light")}</option><option value="dark">{t("dark")}</option></select></label>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions"><button className="button ghost" onClick={onClose}>{t("cancel")}</button><button className="button" onClick={save}>{t("save")}</button></div>
      </section>
    </div>
  );
}
