/**
 * Archivo de arranque de React. Aquí enlazamos nuestro componente `App` con
 * los nodos `<div id="root">` que existan en el documento HTML base.
 */
import { StrictMode } from "react"; // Extiende el ciclo de vida de React para detectar errores potenciales.
import { createRoot } from "react-dom/client"; // API moderna para montar aplicaciones en el DOM.
import App from "./App"; // Nuestro árbol principal de componentes documentado en `App.tsx`.
import "./index.css"; // Hojas de estilo globales que dan el look & feel base de la app.

// Recorremos todos los contenedores raíz que pudiesen existir (soportando micro-frontends o múltiples montajes).
document.querySelectorAll("#root").forEach((rootEl) => {
  // `createRoot` gestiona el renderizado concurrente optimizado de React 18.
  const root = createRoot(rootEl as HTMLElement);
  root.render(
    // `StrictMode` habilita verificaciones adicionales en desarrollo sin afectar producción.
    <StrictMode>
      {/** Renderizamos la aplicación completa con el sistema de rutas y contextos. */}
      <App />
    </StrictMode>,
  );
});
