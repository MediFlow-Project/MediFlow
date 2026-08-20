require("dotenv").config();

const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Raihan
app.use("/api/auth", require("./routes/auth"));
app.use("/api/me", require("./routes/me"));
app.use("/api/specialties", require("./routes/specialties"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/queues", require("./routes/queues"));
app.use("/api/doctor", require("./routes/doctor"));
app.use("/api/admin/specialties", require("./routes/admin/specialties"));
app.use("/api/admin/doctors", require("./routes/admin/doctors"));
app.use("/api/admin/schedules", require("./routes/admin/schedules"));
app.use("/api/admin/appointments", require("./routes/admin/appointments"));

// Salsa
app.use("/api/appointments", require("./routes/messages"));
app.use("/api/doctor", require("./routes/consultations"));
app.use("/api/invoices", require("./routes/invoices"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/chatbot", require("./routes/chatbot"));
app.use("/api/chats", require("./routes/chats"));
app.use("/api/admin/medicines", require("./routes/admin/medicines"));
app.use("/api/admin/invoices", require("./routes/admin/invoices"));
app.use("/api/admin/dashboard", require("./routes/admin/dashboard"));

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

app.use(errorHandler);

module.exports = app;
