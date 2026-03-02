const path = require("path");
// Always load the server-local .env, even when the process is started from the repo root.
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const workspaceRoutes = require("./routes/workspaceRoutes");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error:", err));

app.use("/api/workspaces", workspaceRoutes);

app.get("/", (req, res) => {
  res.send("server is running");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
