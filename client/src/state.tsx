import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Currency, Language, Theme, User } from "./types";
import { api } from "./lib/api";

type AppState = {
  token: string | null;
  user: User | null;
  t: (key: string) => string;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const dict: Record<Language, Record<string, string>> = {
  en: {
    addCar: "Add vehicle",
    addFirstRecord: "Add first record",
    addRecord: "Add record",
    all: "All",
    backToVehicles: "Vehicles",
    brand: "Brand",
    cancel: "Cancel",
    cars: "Vehicles",
    carsLead: "Track service history, costs, and due dates.",
    close: "Close",
    cost: "Cost",
    costs: "Costs",
    currency: "Currency",
    dark: "Dark",
    date: "Date",
    days: "days",
    delete: "Delete",
    description: "Description",
    download: "Download",
    downloadPhoto: "Download photo",
    english: "English",
    export: "Export",
    exports: "Exports",
    finnish: "Finnish",
    kilometers: "Kilometers",
    language: "Language",
    light: "Light",
    loadingVehicle: "Loading vehicle",
    logout: "Logout",
    maintenance: "Maintenance",
    maintenanceFileSuffix: "maintenance",
    model: "Model",
    name: "Name",
    nextMaintenance: "Next maintenance",
    openPhoto: "Open photo",
    openVehicle: "Open",
    photos: "Photos",
    projectZip: "Project ZIP",
    projectZipDescription: "Source archive without node_modules, uploads, or local database data.",
    records: "records",
    repair: "Repair",
    repairCost: "repair",
    save: "Save",
    serviceCost: "service",
    settings: "Settings",
    system: "System",
    target: "target",
    theme: "Theme",
    title: "Title",
    type: "Type",
    year: "Year"
  },
  fi: {
    addCar: "Lisää ajoneuvo",
    addFirstRecord: "Lisää ensimmäinen merkintä",
    addRecord: "Lisää merkintä",
    all: "Kaikki",
    backToVehicles: "Ajoneuvot",
    brand: "Merkki",
    cancel: "Peruuta",
    cars: "Ajoneuvot",
    carsLead: "Seuraa huoltohistoriaa, kuluja ja määräaikoja.",
    close: "Sulje",
    cost: "Hinta",
    costs: "Kulut",
    currency: "Valuutta",
    dark: "Tumma",
    date: "Päivä",
    days: "päivää",
    delete: "Poista",
    description: "Kuvaus",
    download: "Lataa",
    downloadPhoto: "Lataa kuva",
    english: "Englanti",
    export: "Vie",
    exports: "Viennit",
    finnish: "Suomi",
    kilometers: "Kilometrit",
    language: "Kieli",
    light: "Vaalea",
    loadingVehicle: "Ladataan ajoneuvoa",
    logout: "Kirjaudu ulos",
    maintenance: "Huolto",
    maintenanceFileSuffix: "huoltoraportti",
    model: "Malli",
    name: "Nimi",
    nextMaintenance: "Seuraava huolto",
    openPhoto: "Avaa kuva",
    openVehicle: "Avaa",
    photos: "Kuvat",
    projectZip: "Projektin ZIP",
    projectZipDescription: "Lähdekoodiarkisto ilman node_modules-kansiota, latauksia tai paikallista tietokantaa.",
    records: "merkintää",
    repair: "Korjaus",
    repairCost: "korjaukset",
    save: "Tallenna",
    serviceCost: "huollot",
    settings: "Asetukset",
    system: "Järjestelmä",
    target: "tavoite",
    theme: "Teema",
    title: "Otsikko",
    type: "Tyyppi",
    year: "Vuosi"
  }
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = user?.theme === "system" || !user?.theme ? "" : user.theme;
  }, [user?.theme]);

  const login = (nextToken: string, nextUser: User) => {
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    const nextUser = await api<User>("/api/user/settings", { token });
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const value = useMemo(() => ({
    token,
    user,
    login,
    logout,
    refreshUser,
    t: (key: string) => dict[user?.language ?? "en"][key] ?? key
  }), [token, user]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
