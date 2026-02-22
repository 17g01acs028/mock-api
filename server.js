const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ─── ROUTES ─────────────────────────────────────────────────────────────────
app.use("/v1/auth", require("./routes/auth"));
app.use("/v1/admins", require("./routes/admins"));
app.use("/v1/branches", require("./routes/branches"));
app.use("/v1/deposit-types", require("./routes/depositTypes"));
app.use("/v1/users", require("./routes/users"));
app.use("/v1/accounts", require("./routes/accounts"));
app.use("/v1/standing-orders", require("./routes/standingOrders"));
app.use("/v1/dynamic-mocks", require("./routes/dynamicMocks"));

// ─── DYNAMIC MOCK INTERCEPTOR ────────────────────────────────────────────────
app.use(require("./middleware/dynamicMockHandler"));

// ─── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: "error", code: "NOT_FOUND", message: `${req.method} ${req.path} not found` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🏦  NCBA Admin API  →  http://localhost:${PORT}/v1`);
  console.log(`🖥️   Admin Portal   →  http://localhost:${PORT}`);
  console.log(`📚  API Docs       →  http://localhost:${PORT}/docs.html`);
  console.log(`\n  Login: admin / admin123\n`);
});
