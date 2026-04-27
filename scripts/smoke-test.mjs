const baseUrl = process.env.CARTENANCE_API_URL ?? "http://localhost:4000";

function log(message) {
  console.log(`[smoke] ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.arrayBuffer();

  if (!response.ok) {
    const details = body && typeof body === "object" && "error" in body ? body.error : response.statusText;
    fail(`${options.method ?? "GET"} ${path} failed: ${response.status} ${details}`);
  }

  return { response, body };
}

async function isServerRunning() {
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isServerRunning()) {
    log(`Using running API at ${baseUrl}`);
    return;
  }

  fail(`API is not running at ${baseUrl}. Start the app with "npm run dev" before running the smoke test.`);
}

async function runSmokeTest() {
  await ensureServer();

  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `smoke-${suffix}@example.com`;
  const password = "SmokeTest123!";

  log("Registering test user");
  const register = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  const token = register.body.token;
  assert(token, "Register response did not include a token");

  log("Logging in");
  const login = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  assert(login.body.token, "Login response did not include a token");

  log("Updating user settings");
  const settings = await request("/api/user/settings", {
    method: "PUT",
    token,
    body: JSON.stringify({ language: "fi", theme: "light" })
  });
  assert(settings.body.language === "fi", "Language setting was not updated");
  assert(settings.body.theme === "light", "Theme setting was not updated");

  log("Creating vehicle");
  const car = await request("/api/cars", {
    method: "POST",
    token,
    body: JSON.stringify({
      name: `Smoke Vehicle ${suffix}`,
      brand: "Skoda",
      model: "Superb iV Combi",
      year: 2020
    })
  });
  const carId = car.body.id;
  assert(Number.isInteger(carId), "Created vehicle did not include an id");

  log("Creating maintenance record");
  const maintenance = await request(`/api/maintenance/${carId}`, {
    method: "POST",
    token,
    body: JSON.stringify({
      date: "2026-04-25",
      kilometers: 20000,
      title: "Scheduled maintenance",
      description: "Oil change and basic inspection",
      cost: 150,
      type: "maintenance",
      currency: "EUR"
    })
  });
  assert(maintenance.body.type === "maintenance", "Maintenance record type was incorrect");

  log("Creating repair record");
  const repair = await request(`/api/maintenance/${carId}`, {
    method: "POST",
    token,
    body: JSON.stringify({
      date: "2026-04-26",
      kilometers: 30000,
      title: "Body repair",
      description: "Front fender repair",
      cost: 300,
      type: "repair",
      currency: "EUR"
    })
  });
  assert(repair.body.type === "repair", "Repair record type was incorrect");

  log("Reading vehicle history");
  const history = await request(`/api/maintenance/${carId}`, { token });
  assert(Array.isArray(history.body), "History response was not an array");
  assert(history.body.length === 2, `Expected 2 records, got ${history.body.length}`);
  assert(history.body.some((record) => record.type === "maintenance"), "Maintenance record was missing from history");
  assert(history.body.some((record) => record.type === "repair"), "Repair record was missing from history");

  log("Reading vehicle list and cost summary");
  const cars = await request("/api/cars", { token });
  const createdCar = cars.body.find((item) => item.id === carId);
  assert(createdCar, "Created vehicle was missing from vehicle list");
  assert(createdCar.recordCount === 2, "Vehicle record count was incorrect");
  assert(createdCar.totalCost === 450, `Expected total cost 450, got ${createdCar.totalCost}`);

  log("Downloading PDF report");
  const pdf = await request(`/api/export/pdf/${carId}`, {
    token,
    headers: { Accept: "application/pdf" }
  });
  assert(pdf.response.headers.get("content-type")?.includes("application/pdf"), "PDF response content type was incorrect");
  assert(pdf.body.byteLength > 0, "PDF response was empty");

  log("Cleaning up test vehicle");
  await request(`/api/cars/${carId}`, { method: "DELETE", token });

  log("Smoke test passed");
}

try {
  await runSmokeTest();
} catch (error) {
  console.error(`[smoke] Smoke test failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
