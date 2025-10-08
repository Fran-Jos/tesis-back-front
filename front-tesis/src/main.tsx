import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.querySelectorAll("#root").forEach((rootEl) => {
  const root = createRoot(rootEl as HTMLElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
