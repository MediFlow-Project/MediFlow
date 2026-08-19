const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`MediFlow API listening on http://localhost:${port}`);
});

module.exports = app;
