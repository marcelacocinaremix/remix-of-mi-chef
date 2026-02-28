import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";

// Initialize AdMob as early as possible so ads have time to load
async function initAdMob() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize({ initializeForTesting: false });
    console.log("[AdMob] Initialized successfully");
  } catch (e) {
    console.warn("[AdMob] Initialization failed:", e);
  }
}

initAdMob();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
