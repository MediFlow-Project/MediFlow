const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");
const router = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.use("/api", router);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

app.use(errorHandler);

module.exports = app;
