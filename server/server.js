const fs = require("fs");
const path = require("path");
// Always load the server-local .env, even when the process is started from the repo root.
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const connectDB = require("./db");
const transliterationRoutes = require("./routes/transliterationRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const { createRateLimit } = require("./utils/rateLimit");

const app = express();
const clientDistPath = path.join(__dirname, "../client/dist");
const hasBuiltClient = fs.existsSync(clientDistPath);
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(
  "/api",
  createRateLimit({
    windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.API_RATE_LIMIT_MAX) || 240,
    keyPrefix: "api",
  })
);
app.use("/api/transliteration", transliterationRoutes);
app.use("/api/workspaces", workspaceRoutes);

if (hasBuiltClient) {
  app.use(express.static(clientDistPath));

  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.send("server is running");
  });
}

async function startServer() {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
