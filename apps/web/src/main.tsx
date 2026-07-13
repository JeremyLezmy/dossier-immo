import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import { calculateDossier } from "@dossier-immo/calculations";
import { renderBankDocument } from "@dossier-immo/document";
import { completeDemoDossier } from "@dossier-immo/fixtures";

const parameters = new URLSearchParams(window.location.search);
if (parameters.get("print-fixture") === "complete") {
  document.open();
  document.write(renderBankDocument(completeDemoDossier, calculateDossier(completeDemoDossier)));
  document.close();
} else {
  const root = document.getElementById("root");
  if (!root) throw new Error("Point de montage React introuvable.");
  createRoot(root).render(<StrictMode><App /></StrictMode>);
}
