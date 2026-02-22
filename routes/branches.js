const router = require("express").Router();
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

// GET /branches
router.get("/", requireAuth, (req, res) => {
  const { status, region } = req.query;
  let list = Object.values(db.branches);
  if (status) list = list.filter(b => b.status === status);
  if (region) list = list.filter(b => b.region.toLowerCase().includes(region.toLowerCase()));
  res.json({ status: "success", data: list, total: list.length });
});

// GET /branches/:id
router.get("/:id", requireAuth, (req, res) => {
  const b = db.branches[req.params.id];
  if (!b) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Branch not found" });
  res.json({ status: "success", data: b });
});

// POST /branches
router.post("/", requireAuth, (req, res) => {
  const { name, code, address, region, phone, email, manager } = req.body;
  const errors = [];
  if (!name) errors.push({ field: "name", message: "Branch name is required" });
  if (!code) errors.push({ field: "code", message: "Branch code is required" });
  if (!address) errors.push({ field: "address", message: "Address is required" });
  if (!region) errors.push({ field: "region", message: "Region is required" });
  if (errors.length) return res.status(422).json({ status: "error", code: "VALIDATION_ERROR", errors });

  // Check duplicate code
  if (Object.values(db.branches).find(b => b.code === code))
    return res.status(409).json({ status: "error", code: "DUPLICATE_CODE", message: `Branch code ${code} already exists` });

  const id = db.seq(db.branches, "br");
  const branch = { id, code, name, address, region, phone: phone||null, email: email||null, manager: manager||null, status: "active", created_at: db.now() };
  db.branches[id] = branch;
  res.status(201).json({ status: "success", data: branch });
});

// PUT /branches/:id
router.put("/:id", requireAuth, (req, res) => {
  const b = db.branches[req.params.id];
  if (!b) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Branch not found" });
  const allowed = ["name","address","region","phone","email","manager","status"];
  allowed.forEach(k => { if (req.body[k] !== undefined) b[k] = req.body[k]; });
  b.updated_at = db.now();
  res.json({ status: "success", data: b });
});

// DELETE /branches/:id
router.delete("/:id", requireAuth, (req, res) => {
  if (!db.branches[req.params.id]) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Branch not found" });
  db.branches[req.params.id].status = "inactive";
  db.branches[req.params.id].updated_at = db.now();
  res.json({ status: "success", message: "Branch deactivated" });
});

module.exports = router;
