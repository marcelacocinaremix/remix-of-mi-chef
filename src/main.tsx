import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";

// AdMob App ID: ca-app-pub-2070932144567614~2284749809 (used in AndroidManifest only)
// Banner Ad Unit:       ca-app-pub-2070932144567614/7836431130
// Interstitial Ad Unit: ca-app-pub-2070932144567614/7133653740

async function initAdMob() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize({
      initializeForTesting: false,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
      maxAdContentRating: "G",
    });
    console.log("[AdMob] Initialized successfully");
  } catch (e) {
    console.warn("[AdMob] Initialization failed:", e);
  }
}

// Initialize AdMob before rendering so ads have maximum time to load
initAdMob().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});

