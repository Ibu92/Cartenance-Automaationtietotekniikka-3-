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
    cars: "Vehicles",
    addCar: "Add vehicle",
    maintenance: "Maintenance",
    repair: "Repair",
    settings: "Settings",
    logout: "Logout",
    save: "Save",
    delete: "Delete",
    cancel: "Cancel",
    costs: "Costs",
    reminders: "Reminders",
    photos: "Photos",
    serviceLink: "Service link",
    export: "Export"
  },
  fi: {
    cars: "Ajoneuvot",
    addCar: "Lisää ajoneuvo",
    maintenance: "Huolto",
    repair: "Korjaus",
    settings: "Asetukset",
    logout: "Kirjaudu ulos",
    save: "Tallenna",
    delete: "Poista",
    cancel: "Peruuta",
    costs: "Kulut",
    reminders: "Muistutukset",
    photos: "Kuvat",
    serviceLink: "Huoltolinkki",
    export: "Vie"
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
