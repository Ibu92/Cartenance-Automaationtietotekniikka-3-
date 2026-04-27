type ApiOptions = RequestInit & { token?: string | null };

export async function api<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error ?? "Request failed");
  }
  return response.json();
}

export function money(value: number | null | undefined) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(value ?? 0);
}

export function nextMaintenance(records: { date: string; kilometers: number }[]) {
  if (!records.length) return { nextDate: null, nextKm: 20000, daysLeft: null, kmLeft: null, progress: 0, overdue: false };
  const latestByDate = [...records].sort((a, b) => b.date.localeCompare(a.date))[0];
  const maxKm = Math.max(...records.map((record) => record.kilometers));
  const nextDate = new Date(latestByDate.date);
  nextDate.setFullYear(nextDate.getFullYear() + 1);
  const daysLeft = Math.ceil((nextDate.getTime() - Date.now()) / 86400000);
  const nextKm = maxKm + 20000;
  return { nextDate: nextDate.toISOString().slice(0, 10), nextKm, daysLeft, kmLeft: 20000, progress: Math.max(0, Math.min(100, 100 - (daysLeft / 365) * 100)), overdue: daysLeft < 0 };
}
