import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Wrench } from "lucide-react";
import { api } from "../lib/api";
import type { Car, Currency, MaintenanceType } from "../types";

export function ServicePersonnelPage() {
  const { carId } = useParams();
  const [car, setCar] = useState<Pick<Car, "id" | "name" | "brand" | "model" | "year"> | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), kilometers: 0, title: "", description: "", cost: null as number | null, type: "maintenance" as MaintenanceType, currency: "EUR" as Currency });

  useEffect(() => { api<typeof car>(`/api/service/${carId}/car`).then(setCar).catch((err) => setMessage(err.message)); }, [carId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const record = await api<{ id: number }>(`/api/service/${carId}/maintenance`, { method: "POST", body: JSON.stringify(form) });
    const input = document.getElementById("service-photos") as HTMLInputElement | null;
    if (input?.files?.length) {
      const data = new FormData();
      Array.from(input.files).slice(0, 5).forEach((file) => data.append("photos", file));
      await api(`/api/service/${record.id}/photos`, { method: "POST", body: data });
    }
    setMessage("Maintenance record saved");
    setForm({ ...form, title: "", description: "", cost: null });
  }

  return (
    <main className="auth-screen service-screen">
      <form className="auth-panel service-panel" onSubmit={submit}>
        <div className="auth-title"><Wrench size={32} /><h1>{car?.name ?? "Service"}</h1></div>
        {car && <p className="muted">{car.brand} {car.model} · {car.year}</p>}
        <label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
        <label>Kilometers<input type="number" value={form.kilometers} onChange={(e) => setForm({ ...form, kilometers: Number(e.target.value) })} required /></label>
        <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
        <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></label>
        <label>Cost<input type="number" value={form.cost ?? ""} onChange={(e) => setForm({ ...form, cost: e.target.value ? Number(e.target.value) : null })} /></label>
        <label>Photos<input id="service-photos" type="file" accept="image/*" multiple /></label>
        {message && <p className="success">{message}</p>}
        <button className="button wide">Save service record</button>
      </form>
    </main>
  );
}
