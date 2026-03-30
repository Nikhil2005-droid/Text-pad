const fs = require("fs");
const path = require("path");
// Always load the server-local .env, even when the process is started from the repo root.
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const connectDB = require("./db");
const workspaceRoutes = require("./routes/workspaceRoutes");

const app = express();
const clientDistPath = path.join(__dirname, "../client/dist");
const hasBuiltClient = fs.existsSync(clientDistPath);

app.use(cors());
app.use(express.json());
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
