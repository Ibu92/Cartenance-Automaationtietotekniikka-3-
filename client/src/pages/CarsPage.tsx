import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Car, Plus, QrCode, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api, money } from "../lib/api";
import { Shell } from "../components/Shell";
import { useApp } from "../state";
import type { Car as CarType } from "../types";

export function CarsPage() {
  const { token, user, t } = useApp();
  const [cars, setCars] = useState<CarType[]>([]);
  const [error, setError] = useState("");
  const [qr, setQr] = useState<CarType | null>(null);
  const [form, setForm] = useState({ name: "", brand: "", model: "", year: new Date().getFullYear() });

  async function load() {
    setCars(await api<CarType[]>("/api/cars", { token }));
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function addCar(event: FormEvent) {
    event.preventDefault();
    await api<CarType>("/api/cars", { method: "POST", token, body: JSON.stringify(form) });
    setForm({ name: "", brand: "", model: "", year: new Date().getFullYear() });
    await load();
  }

  async function remove(id: number) {
    await api(`/api/cars/${id}`, { method: "DELETE", token });
    await load();
  }

  return (
    <Shell>
      <section className="page-head">
        <div><h1>{t("cars")}</h1><p>Track service history, costs, due dates, reminders, and QR handoffs.</p></div>
      </section>
      {error && <p className="error">{error}</p>}
      <section className="layout-grid">
        <form className="panel compact-form" onSubmit={addCar}>
          <h2><Plus size={18} />{t("addCar")}</h2>
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Brand<input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required /></label>
          <label>Model<input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required /></label>
          <label>Year<input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required /></label>
          <button className="button">{t("save")}</button>
        </form>
        <div className="cards-grid">
          {cars.map((car) => (
            <article className="vehicle-card" key={car.id}>
              <div className="vehicle-icon"><Car size={24} /></div>
              <div className="vehicle-main">
                <h2>{car.name}</h2>
                <p>{car.brand} {car.model} · {car.year}</p>
                <div className="metric-row">
                  <span>{car.recordCount} records</span>
                  <span>{car.maxKm.toLocaleString()} km</span>
                  <span>{money(car.totalCost, user?.defaultCurrency)}</span>
                </div>
              </div>
              <div className="card-actions">
                <button className="icon-button" onClick={() => setQr(car)} title={t("serviceLink")}><QrCode size={18} /></button>
                <button className="icon-button danger" onClick={() => remove(car.id)} title={t("delete")}><Trash2 size={18} /></button>
                <Link className="button" to={`/cars/${car.id}`}>{t("maintenance")}</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      {qr && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal qr-modal">
            <div className="modal-head"><h2>{qr.name}</h2><button className="icon-button" onClick={() => setQr(null)}>×</button></div>
            <QRCodeSVG value={`${location.origin}/service/${qr.id}`} size={220} />
            <p className="muted">{location.origin}/service/{qr.id}</p>
          </section>
        </div>
      )}
    </Shell>
  );
}
