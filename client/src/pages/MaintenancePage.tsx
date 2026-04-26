import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Camera, Download, FileDown, Gauge, Trash2, Upload } from "lucide-react";
import { api, money, nextMaintenance } from "../lib/api";
import { Shell } from "../components/Shell";
import { useApp } from "../state";
import type { Car, Currency, MaintenanceRecord, MaintenanceType, Photo } from "../types";

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
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [form, setForm] = useState<NewRecord>({ date: new Date().toISOString().slice(0, 10), kilometers: 0, title: "", description: "", cost: null, type: "maintenance", currency: user?.defaultCurrency ?? "EUR" });
  const car = cars.find((item) => item.id === Number(carId));
  const filtered = filter === "all" ? records : records.filter((record) => record.type === filter);
  const maintenanceRecords = useMemo(() => records.filter((record) => record.type === "maintenance"), [records]);
  const prediction = useMemo(() => nextMaintenance(maintenanceRecords), [maintenanceRecords]);
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

  async function downloadPdf() {
    if (!token || !carId) return;
    setError("");
    const response = await fetch(`/api/export/pdf/${carId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "PDF download failed" }));
      setError(body.error ?? "PDF download failed");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = (car?.name ?? "vehicle").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "vehicle";
    link.download = `${safeName}-${t("maintenanceFileSuffix")}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const photoUrl = selectedPhoto ? `/uploads/${selectedPhoto.fileName}` : "";

  return (
    <Shell>
      <section className="page-head">
        <div>
          <Link to="/" className="back-link">{"<-"} {t("backToVehicles")}</Link>
          <h1>{car ? car.name : t("maintenance")}</h1>
          <p>{car ? `${car.brand} ${car.model} - ${car.year}` : t("loadingVehicle")}</p>
        </div>
        <button className="button" onClick={downloadPdf}><FileDown size={16} />PDF</button>
      </section>
      {error && <p className="error">{error}</p>}
      <section className="stats-grid">
        <div className={`stat-panel ${prediction.overdue ? "warning" : ""}`}>
          <h2><Gauge size={18} />{t("nextMaintenance")}</h2>
          <p className="big">{prediction.nextDate ?? t("addFirstRecord")}</p>
          <div className="progress"><span style={{ width: `${prediction.progress}%` }} /></div>
          <p>{prediction.nextKm.toLocaleString()} km {t("target")} - {prediction.daysLeft ?? "-"} {t("days")}</p>
        </div>
        <div className="stat-panel">
          <h2>{t("costs")}</h2>
          <p className="big">{money(totals.total, user?.defaultCurrency)}</p>
          <div className="cost-breakdown">
            <div><span>{t("serviceCost")}</span><strong>{money(totals.maintenance, user?.defaultCurrency)}</strong></div>
            <div><span>{t("repairCost")}</span><strong>{money(totals.repair, user?.defaultCurrency)}</strong></div>
          </div>
        </div>
      </section>
      <section className="layout-grid">
        <form className="panel compact-form" onSubmit={add}>
          <h2>{t("addRecord")}</h2>
          <label>{t("type")}<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as MaintenanceType })}><option value="maintenance">{t("maintenance")}</option><option value="repair">{t("repair")}</option></select></label>
          <label>{t("date")}<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
          <label>{t("kilometers")}<input type="number" value={form.kilometers} onChange={(e) => setForm({ ...form, kilometers: Number(e.target.value) })} required /></label>
          <label>{t("title")}<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label>{t("description")}<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></label>
          <label>{t("cost")}<input type="number" value={form.cost ?? ""} onChange={(e) => setForm({ ...form, cost: e.target.value ? Number(e.target.value) : null })} /></label>
          <button className="button">{t("save")}</button>
        </form>
        <div className="history-column">
          <div className="segmented">
            {(["all", "maintenance", "repair"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{t(item)}</button>)}
          </div>
          {filtered.map((record) => (
            <article className="record-card" key={record.id}>
              <div className="record-head">
                <div><h2>{record.title}</h2><p>{record.date} - {record.kilometers.toLocaleString()} km - {money(record.cost, record.currency)}</p></div>
                <div className="card-actions">
                  <button className="icon-button danger" title={t("delete")} onClick={() => remove(record.id)}><Trash2 size={18} /></button>
                </div>
              </div>
              <p>{record.description}</p>
              <div className="photo-strip">
                {record.photos.map((photo) => (
                  <button key={photo.id} className="photo-thumb" onClick={() => setSelectedPhoto(photo)} title={t("openPhoto")} type="button">
                    <img src={`/uploads/${photo.fileName}`} alt={t("openPhoto")} />
                  </button>
                ))}
                <label className="photo-upload"><Camera size={18} /><Upload size={14} /><input type="file" accept="image/*" multiple onChange={(e) => uploadPhotos(record.id, e.target.files)} /></label>
              </div>
            </article>
          ))}
        </div>
      </section>
      {selectedPhoto && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal photo-modal">
            <div className="modal-head">
              <h2>{t("photos")}</h2>
              <button className="icon-button" onClick={() => setSelectedPhoto(null)} aria-label={t("close")}>x</button>
            </div>
            <img className="photo-preview" src={photoUrl} alt={t("photos")} />
            <div className="modal-actions">
              <button className="button ghost" onClick={() => setSelectedPhoto(null)}>{t("close")}</button>
              <a className="button" href={photoUrl} download={selectedPhoto.fileName}><Download size={16} />{t("downloadPhoto")}</a>
            </div>
          </section>
        </div>
      )}
    </Shell>
  );
}
