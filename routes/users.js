const router = require("express").Router();
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

// GET /me
router.get("/me", requireAuth, (req, res) => {
  if (req.userType !== 'user' || !req.user) {
    return res.status(403).json({ status: "error", code: "FORBIDDEN", message: "Customer account required for this endpoint" });
  }
  res.json({ status: "success", data: enrichUser(req.user) });
});

// GET /users
router.get("/", requireAuth, (req, res) => {
  const { status, branch_id, kyc_status, q } = req.query;
  let list = Object.values(db.users).map(u => enrichUser(u));
  if (status) list = list.filter(u => u.status === status);
  if (branch_id) list = list.filter(u => u.branch_id === branch_id);
  if (kyc_status) list = list.filter(u => u.kyc_status === kyc_status);
  if (q) {
    const s = q.toLowerCase();
    list = list.filter(u =>
      u.first_name.toLowerCase().includes(s) ||
      u.last_name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.id_number.includes(s) ||
      u.customer_number.toLowerCase().includes(s)
    );
  }
  res.json({ status: "success", data: list, total: list.length });
});

// GET /users/:id
router.get("/:id", requireAuth, (req, res) => {
  const u = db.users[req.params.id];
  if (!u) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "User not found" });
  res.json({ status: "success", data: enrichUser(u) });
});

// GET /users/:id/accounts
router.get("/:id/accounts", requireAuth, (req, res) => {
  const u = db.users[req.params.id];
  if (!u) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "User not found" });
  const { account_type } = req.query;
  let accs = Object.values(db.accounts).filter(a => a.user_id === req.params.id);
  if (account_type) accs = accs.filter(a => a.account_type === account_type);
  accs = accs.map(a => enrichAccount(a));
  res.json({ status: "success", data: accs, total: accs.length });
});

// POST /users
router.post("/", requireAuth, (req, res) => {
  const { first_name, last_name, email, phone, id_type, id_number, date_of_birth, gender, address, branch_id, kra_pin, password } = req.body;
  const errors = [];
  if (!first_name) errors.push({ field: "first_name", message: "First name is required" });
  if (!last_name) errors.push({ field: "last_name", message: "Last name is required" });
  if (!email) errors.push({ field: "email", message: "Email is required" });
  if (!phone) errors.push({ field: "phone", message: "Phone is required" });
  if (!id_type) errors.push({ field: "id_type", message: "ID type is required" });
  if (!id_number) errors.push({ field: "id_number", message: "ID number is required" });
  if (!branch_id) errors.push({ field: "branch_id", message: "Branch is required" });
  if (errors.length) return res.status(422).json({ status: "error", code: "VALIDATION_ERROR", errors });

  if (!db.branches[branch_id])
    return res.status(422).json({ status: "error", code: "INVALID_BRANCH", message: "Branch not found" });
  if (Object.values(db.users).find(u => u.email === email))
    return res.status(409).json({ status: "error", code: "DUPLICATE_EMAIL", message: "Email already registered" });
  if (Object.values(db.users).find(u => u.id_number === id_number))
    return res.status(409).json({ status: "error", code: "DUPLICATE_ID", message: "ID number already registered" });

  const id = db.seq(db.users, "usr");
  const custNum = `CIF-${String(Object.keys(db.users).length + 1000).padStart(6, "0")}`;
  const user = {
    id, customer_number: custNum, first_name, last_name, email, phone,
    id_type, id_number, date_of_birth: date_of_birth || null,
    gender: gender || null, address: address || null,
    branch_id, kra_pin: kra_pin || null, password: password || "12345",
    kyc_status: "pending", status: "active", created_at: db.now(),
  };
  db.users[id] = user;
  res.status(201).json({ status: "success", data: enrichUser(user) });
});

// PUT /users/:id
router.put("/:id", requireAuth, (req, res) => {
  const u = db.users[req.params.id];
  if (!u) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "User not found" });
  const allowed = ["first_name", "last_name", "email", "phone", "address", "branch_id", "kra_pin", "kyc_status", "status", "gender", "date_of_birth", "password"];
  allowed.forEach(k => { if (req.body[k] !== undefined) u[k] = req.body[k]; });
  u.updated_at = db.now();
  res.json({ status: "success", data: enrichUser(u) });
});

// DELETE /users/:id  (soft delete)
router.delete("/:id", requireAuth, (req, res) => {
  const u = db.users[req.params.id];
  if (!u) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "User not found" });
  u.status = "inactive";
  u.updated_at = db.now();
  res.json({ status: "success", message: "User deactivated" });
});

function enrichUser(u) {
  const branch = db.branches[u.branch_id];
  return { ...u, branch_name: branch ? branch.name : null };
}

function enrichAccount(a) {
  const branch = db.branches[a.branch_id];
  const user = db.users[a.user_id];
  const depType = a.deposit_type_id ? db.depositTypes[a.deposit_type_id] : null;
  return {
    ...a,
    account_holder: user ? `${user.first_name} ${user.last_name}` : null,
    branch_name: branch ? branch.name : null,
    deposit_type_name: depType ? depType.name : null,
  };
}

module.exports = router;
