const express = require("express");
const path = require("path");
const app = express();

const ROUTE_PREFIX = (process.env.ROUTE_PREFIX || "").replace(/\/+$/, "");
if (ROUTE_PREFIX) console.log(`🚀 Using route prefix: ${ROUTE_PREFIX}`);

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ─── ROUTES ─────────────────────────────────────────────────────────────────
const v1 = express.Router();
v1.use("/auth", require("./routes/auth"));
v1.use("/admins", require("./routes/admins"));
v1.use("/branches", require("./routes/branches"));
v1.use("/deposit-types", require("./routes/depositTypes"));
v1.use("/users", require("./routes/users"));
v1.use("/accounts", require("./routes/accounts"));
v1.use("/standing-orders", require("./routes/standingOrders"));
v1.use("/dynamic-mocks", require("./routes/dynamicMocks"));

// Mount API and static files under prefix
app.use(`${ROUTE_PREFIX}/v1`, v1);
app.use(ROUTE_PREFIX || "/", express.static(path.join(__dirname, "public")));

// ─── DYNAMIC MOCK INTERCEPTOR ────────────────────────────────────────────────
// Catch-all for mocks. If prefix exists, it catches everything else under that prefix.
const interceptor = require("./middleware/dynamicMockHandler");
if (ROUTE_PREFIX) {
  app.use(ROUTE_PREFIX, interceptor);
} else {
  app.use(interceptor);
}

// ─── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: "error", code: "NOT_FOUND", message: `${req.method} ${req.path} not found` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  const base = `http://localhost:${PORT}${ROUTE_PREFIX}`;
  console.log(`\n🏦  NCBA Admin API  →  ${base}/v1`);
  console.log(`🖥️   Admin Portal   →  ${base}`);
  console.log(`📚  API Docs       →  ${base}/docs.html\n`);
});
