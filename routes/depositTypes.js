const router = require("express").Router();
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

// GET /deposit-types
router.get("/", requireAuth, (req, res) => {
  const { status } = req.query;
  let list = Object.values(db.depositTypes);
  if (status) list = list.filter(d => d.status === status);
  res.json({ status: "success", data: list, total: list.length });
});

// GET /deposit-types/:id
router.get("/:id", requireAuth, (req, res) => {
  const d = db.depositTypes[req.params.id];
  if (!d) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Deposit type not found" });
  res.json({ status: "success", data: d });
});

// POST /deposit-types
router.post("/", requireAuth, (req, res) => {
  const {
    code, name, description, currency,
    min_amount, max_amount, min_term_days, max_term_days,
    base_rate, withholding_tax_rate, auto_renew_default,
  } = req.body;

  const errors = [];
  if (!code) errors.push({ field: "code", message: "Code is required" });
  if (!name) errors.push({ field: "name", message: "Name is required" });
  if (!currency) errors.push({ field: "currency", message: "Currency is required" });
  if (base_rate === undefined) errors.push({ field: "base_rate", message: "Base rate (%) is required" });
  if (errors.length) return res.status(422).json({ status: "error", code: "VALIDATION_ERROR", errors });

  if (Object.values(db.depositTypes).find(d => d.code === code))
    return res.status(409).json({ status: "error", code: "DUPLICATE_CODE", message: `Code ${code} already exists` });

  const id = db.seq(db.depositTypes, "dt");
  const dt = {
    id, code, name, description: description||null, currency,
    min_amount: min_amount||0, max_amount: max_amount||null,
    min_term_days: min_term_days||null, max_term_days: max_term_days||null,
    base_rate: parseFloat(base_rate),
    withholding_tax_rate: withholding_tax_rate||15,
    auto_renew_default: auto_renew_default||false,
    status: "active", created_at: db.now(),
  };
  db.depositTypes[id] = dt;
  res.status(201).json({ status: "success", data: dt });
});

// PUT /deposit-types/:id
router.put("/:id", requireAuth, (req, res) => {
  const d = db.depositTypes[req.params.id];
  if (!d) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Deposit type not found" });
  const allowed = ["name","description","min_amount","max_amount","min_term_days","max_term_days","base_rate","withholding_tax_rate","auto_renew_default","status"];
  allowed.forEach(k => { if (req.body[k] !== undefined) d[k] = req.body[k]; });
  d.updated_at = db.now();
  res.json({ status: "success", data: d });
});

// DELETE /deposit-types/:id
router.delete("/:id", requireAuth, (req, res) => {
  const d = db.depositTypes[req.params.id];
  if (!d) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Deposit type not found" });
  d.status = "inactive";
  d.updated_at = db.now();
  res.json({ status: "success", message: "Deposit type deactivated" });
});

module.exports = router;
