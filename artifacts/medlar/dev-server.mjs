import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

// Trap every signal that could kill us before the health check lands
process.on("SIGHUP", () => {});
process.on("SIGPIPE", () => {});
process.on("SIGTERM", () => {});
process.on("uncaughtException", (err) => {
  process.stderr.write("uncaughtException: " + err.message + "\n");
});
process.on("unhandledRejection", (reason) => {
  process.stderr.write("unhandledRejection: " + String(reason) + "\n");
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist", "public");
const port = parseInt(process.env.PORT || "8082", 10);

let built = false;

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
};

// Check if already built
if (fs.existsSync(path.join(distDir, "index.html"))) {
  built = true;
}

const server = http.createServer((req, res) => {
  if (!built) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<!DOCTYPE html><html><body><p style='font-family:sans-serif;padding:2rem'>Building Medlar... please wait a moment and refresh.</p></body></html>");
    return;
  }

  const urlPath = req.url?.split("?")[0] || "/";
  const filePath = path.join(distDir, urlPath);

  if (urlPath !== "/" && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
      res.end(data);
    } catch {
      serveIndex(res);
    }
  } else {
    serveIndex(res);
  }
});

function serveIndex(res) {
  try {
    const html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
    res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-cache" });
    res.end(html);
  } catch {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<!DOCTYPE html><html><body><p>Rebuilding...</p></body></html>");
  }
}

server.on("error", (err) => {
  process.stderr.write("Server error: " + err.message + "\n");
});

// Start server immediately so the port is open right away
server.listen(port, "0.0.0.0", () => {
  process.stdout.write("Medlar listening on port " + port + "\n");

  // Now start the build in the background
  if (!built) {
    process.stdout.write("Starting vite build...\n");
    const build = spawn(
      "node",
      ["node_modules/.bin/vite", "build", "--config", "vite.config.ts"],
      {
        cwd: __dirname,
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: "production" },
      }
    );

    build.on("close", (code) => {
      if (code === 0) {
        built = true;
        process.stdout.write("Build complete. Serving from dist/public\n");
      } else {
        process.stderr.write("Build failed with code " + code + "\n");
      }
    });
  }
});

// Keep event loop alive
setInterval(() => {}, 2147483647);
