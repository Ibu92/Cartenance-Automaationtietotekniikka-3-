import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "./state";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { CarsPage } from "./pages/CarsPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { ServicePersonnelPage } from "./pages/ServicePersonnelPage";
import { DownloadPage } from "./pages/DownloadPage";
import "./styles.css";

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useApp();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/service/:carId" element={<ServicePersonnelPage />} />
      <Route path="/download" element={<Protected><DownloadPage /></Protected>} />
      <Route path="/cars/:carId" element={<Protected><MaintenancePage /></Protected>} />
      <Route path="/" element={<Protected><CarsPage /></Protected>} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}
