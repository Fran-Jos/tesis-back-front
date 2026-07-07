const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 4173);
const root = path.join(__dirname, "frontend-dist");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("No se pudo leer el archivo solicitado.");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    response.end(content);
  });
}

http
  .createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, `http://localhost:${port}`).pathname);
    const normalizedPath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
    let filePath = path.join(root, normalizedPath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Acceso no permitido.");
      return;
    }

    fs.stat(filePath, (error, stats) => {
      if (!error && stats.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      fs.access(filePath, fs.constants.R_OK, (accessError) => {
        sendFile(response, accessError ? path.join(root, "index.html") : filePath);
      });
    });
  })
  .listen(port, () => {
    console.log(`Frontend disponible en http://localhost:${port}`);
    console.log("Recuerda iniciar tambien el backend antes de iniciar sesion.");
  });
