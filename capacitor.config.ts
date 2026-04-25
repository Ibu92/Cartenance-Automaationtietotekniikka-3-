import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cartenance.app",
  appName: "Cartenance",
  webDir: "client/dist",
  server: {
    androidScheme: "https"
  }
};

export default config;
