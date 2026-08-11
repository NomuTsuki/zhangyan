import React from "react";
import { createRoot } from "react-dom/client";
import { PlayerApp } from "./PlayerApp.tsx";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PlayerApp />
  </React.StrictMode>,
);
