import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ModalProvider } from "@/contexts/ModalContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </StrictMode>,
);
