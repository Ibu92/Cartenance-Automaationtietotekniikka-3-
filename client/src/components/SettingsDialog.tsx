import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../state";
import type { Currency, Language, Theme, User } from "../types";

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token, user, login, t } = useApp();
  const [form, setForm] = useState({ defaultCurrency: "EUR" as Currency, language: "en" as Language, theme: "system" as Theme });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setForm({ defaultCurrency: user.defaultCurrency, language: user.language, theme: user.theme });
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
          <button className="icon-button" onClick={onClose}>×</button>
        </div>
        <label>Currency<select value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value as Currency })}>{["EUR", "USD", "GBP", "JPY", "THB", "INR"].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Language<select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as Language })}><option value="en">English</option><option value="fi">Suomi</option></select></label>
        <label>Theme<select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value as Theme })}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions"><button className="button ghost" onClick={onClose}>{t("cancel")}</button><button className="button" onClick={save}>{t("save")}</button></div>
      </section>
    </div>
  );
}
