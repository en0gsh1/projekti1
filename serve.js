// Server i vogël statik për zhvillim: node serve.js  →  http://localhost:5174
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5174;
const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".md": "text/plain",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(__dirname, urlPath === "/" ? "index.html" : urlPath);
    if (!file.startsWith(__dirname)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
      if (err) return res.writeHead(404).end("Not found");
      res.writeHead(200, {
        "Content-Type": (TYPES[path.extname(file)] || "application/octet-stream") + "; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Kuzhina Kosovare → http://localhost:${PORT}`));
