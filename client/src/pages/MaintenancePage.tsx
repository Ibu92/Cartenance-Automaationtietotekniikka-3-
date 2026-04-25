import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bell, Camera, FileDown, Gauge, Plus, Trash2, Upload } from "lucide-react";
import { api, money, nextMaintenance } from "../lib/api";
import { Shell } from "../components/Shell";
import { useApp } from "../state";
import type { Car, Currency, MaintenanceRecord, MaintenanceType } from "../types";

type NewRecord = {
  date: string;
  kilometers: number;
  title: string;
  description: string;
  cost: number | null;
  type: MaintenanceType;
  currency: Currency;
};

export function MaintenancePage() {
  const { carId } = useParams();
  const { token, user, t } = useApp();
  const [cars, setCars] = useState<Car[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [filter, setFilter] = useState<"all" | MaintenanceType>("all");
  const [error, setError] = useState("");
  const [form, setForm] = useState<NewRecord>({ date: new Date().toISOString().slice(0, 10), kilometers: 0, title: "", description: "", cost: null, type: "maintenance", currency: user?.defaultCurrency ?? "EUR" });
  const car = cars.find((item) => item.id === Number(carId));
  const filtered = filter === "all" ? records : records.filter((record) => record.type === filter);
  const prediction = useMemo(() => nextMaintenance(records), [records]);
  const totals = useMemo(() => ({
    total: records.reduce((sum, row) => sum + (row.cost ?? 0), 0),
    maintenance: records.filter((row) => row.type === "maintenance").reduce((sum, row) => sum + (row.cost ?? 0), 0),
    repair: records.filter((row) => row.type === "repair").reduce((sum, row) => sum + (row.cost ?? 0), 0)
  }), [records]);

  async function load() {
    const [nextCars, nextRecords] = await Promise.all([
      api<Car[]>("/api/cars", { token }),
      api<MaintenanceRecord[]>(`/api/maintenance/${carId}`, { token })
    ]);
    setCars(nextCars);
    setRecords(nextRecords);
  }

  useEffect(() => { load().catch((err) => setError(err.message)); }, [carId]);

  async function add(event: FormEvent) {
    event.preventDefault();
    await api(`/api/maintenance/${carId}`, { method: "POST", token, body: JSON.stringify(form) });
    setForm({ ...form, title: "", description: "", cost: null });
    await load();
  }

  async function remove(id: number) {
    await api(`/api/maintenance/${id}`, { method: "DELETE", token });
    await load();
  }

  async function uploadPhotos(recordId: number, files: FileList | null) {
    if (!files?.length) return;
    const data = new FormData();
    Array.from(files).slice(0, 5).forEach((file) => data.append("photos", file));
    await api(`/api/maintenance/${recordId}/photos`, { method: "POST", token, body: data });
    await load();
  }

  async function addReminder(record: MaintenanceRecord) {
    const reminderDate = prediction.nextDate ?? record.date;
    await api(`/api/maintenance/${record.id}/reminders`, {
      method: "POST",
      token,
      body: JSON.stringify({ reminderType: "both", reminderDate, reminderKm: record.kilometers + 20000, isActive: true })
    });
    await load();
  }

  return (
    <Shell>
      <section className="page-head">
        <div>
          <Link to="/" className="back-link">← Vehicles</Link>
          <h1>{car ? car.name : "Maintenance"}</h1>
          <p>{car ? `${car.brand} ${car.model} · ${car.year}` : "Loading vehicle"}</p>
        </div>
        <a className="button" href={`/api/export/pdf/${carId}`}><FileDown size={16} />PDF</a>
      </section>
      {error && <p className="error">{error}</p>}
      <section className="stats-grid">
        <div className={`stat-panel ${prediction.overdue ? "warning" : ""}`}>
          <h2><Gauge size={18} />Next maintenance</h2>
          <p className="big">{prediction.nextDate ?? "Add first record"}</p>
          <div className="progress"><span style={{ width: `${prediction.progress}%` }} /></div>
          <p>{prediction.nextKm.toLocaleString()} km target · {prediction.daysLeft ?? "-"} days</p>
        </div>
        <div className="stat-panel"><h2>{t("costs")}</h2><p className="big">{money(totals.total, user?.defaultCurrency)}</p><p>{money(totals.maintenance, user?.defaultCurrency)} service · {money(totals.repair, user?.defaultCurrency)} repair</p></div>
      </section>
      <section className="layout-grid">
        <form className="panel compact-form" onSubmit={add}>
          <h2><Plus size={18} />Add record</h2>
          <label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
          <label>Kilometers<input type="number" value={form.kilometers} onChange={(e) => setForm({ ...form, kilometers: Number(e.target.value) })} required /></label>
          <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></label>
          <label>Cost<input type="number" value={form.cost ?? ""} onChange={(e) => setForm({ ...form, cost: e.target.value ? Number(e.target.value) : null })} /></label>
          <label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as MaintenanceType })}><option value="maintenance">{t("maintenance")}</option><option value="repair">{t("repair")}</option></select></label>
          <button className="button">{t("save")}</button>
        </form>
        <div className="history-column">
          <div className="segmented">
            {(["all", "maintenance", "repair"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
          {filtered.map((record) => (
            <article className="record-card" key={record.id}>
              <div className="record-head">
                <div><h2>{record.title}</h2><p>{record.date} · {record.kilometers.toLocaleString()} km · {money(record.cost, record.currency)}</p></div>
                <div className="card-actions">
                  <button className="icon-button" title={t("reminders")} onClick={() => addReminder(record)}><Bell size={18} /></button>
                  <button className="icon-button danger" title={t("delete")} onClick={() => remove(record.id)}><Trash2 size={18} /></button>
                </div>
              </div>
              <p>{record.description}</p>
              <div className="photo-strip">
                {record.photos.map((photo) => <img key={photo.id} src={`/uploads/${photo.fileName}`} alt="" />)}
                <label className="photo-upload"><Camera size={18} /><Upload size={14} /><input type="file" accept="image/*" multiple onChange={(e) => uploadPhotos(record.id, e.target.files)} /></label>
              </div>
              {record.reminders.length > 0 && <p className="muted">{record.reminders.length} active reminder(s)</p>}
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}
