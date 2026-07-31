import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import HighFidelityApp from "./HighFidelityApp";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("High-fidelity application root was not found");
}

createRoot(root).render(
  <StrictMode>
    <HighFidelityApp />
  </StrictMode>,
);
