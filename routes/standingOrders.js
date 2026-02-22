const router = require("express").Router();
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

function enrich(o) {
  const user = db.users[o.user_id];
  const debitAcc = db.accounts[o.debit_account_id];
  return {
    ...o,
    customer_name: user ? `${user.first_name} ${user.last_name}` : null,
    customer_number: user ? user.customer_number : null,
    debit_account_number: debitAcc ? debitAcc.account_number : null,
  };
}

// GET /standing-orders
router.get("/", requireAuth, (req, res) => {
  const { user_id, status, currency } = req.query;
  let list = Object.values(db.standingOrders).map(enrich);
  if (user_id) list = list.filter(o => o.user_id === user_id);
  if (status) list = list.filter(o => o.status === status);
  if (currency) list = list.filter(o => o.currency === currency);
  res.json({ status: "success", data: list, total: list.length });
});

// GET /standing-orders/:id
router.get("/:id", requireAuth, (req, res) => {
  const o = db.standingOrders[req.params.id];
  if (!o) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Standing order not found" });
  res.json({ status: "success", data: enrich(o) });
});

// POST /standing-orders
router.post("/", requireAuth, (req, res) => {
  const {
    user_id, debit_account_id, action,
    frequency, first_payment_date, regular_payment_date, last_payment_date,
    currency, amount, amount_words,
    remittance_mode, charge_type, details_of_payment,
    beneficiary,
  } = req.body;

  const errors = [];
  if (!user_id) errors.push({ field: "user_id", message: "user_id is required" });
  if (!debit_account_id) errors.push({ field: "debit_account_id", message: "debit_account_id is required" });
  if (!frequency) errors.push({ field: "frequency", message: "frequency is required" });
  if (!first_payment_date) errors.push({ field: "first_payment_date", message: "first_payment_date is required" });
  if (!currency) errors.push({ field: "currency", message: "currency is required" });
  if (!amount) errors.push({ field: "amount", message: "amount is required" });
  if (!amount_words) errors.push({ field: "amount_words", message: "amount_words is required" });
  if (!beneficiary?.name) errors.push({ field: "beneficiary.name", message: "beneficiary name is required" });
  if (errors.length) return res.status(422).json({ status: "error", code: "VALIDATION_ERROR", errors });

  if (!db.users[user_id]) return res.status(422).json({ status: "error", code: "INVALID_USER", message: "User not found" });
  const debitAcc = db.accounts[debit_account_id];
  if (!debitAcc) return res.status(422).json({ status: "error", code: "INVALID_ACCOUNT", message: "Debit account not found" });
  if (debitAcc.user_id !== user_id) return res.status(422).json({ status: "error", code: "ACCOUNT_MISMATCH", message: "Account does not belong to user" });
  if (debitAcc.account_type !== "withdrawable") return res.status(422).json({ status: "error", code: "WRONG_ACCOUNT_TYPE", message: "Standing orders must be linked to a withdrawable account" });

  const id = db.seq(db.standingOrders, "so");
  const seqN = id.split("-")[1];
  const so = {
    id, reference_number: `NCB/SO/${new Date().getFullYear()}/${seqN}`,
    user_id, debit_account_id,
    action: action || "new",
    frequency, first_payment_date,
    regular_payment_date: regular_payment_date || null,
    last_payment_date: last_payment_date || null,
    next_payment_date: first_payment_date,
    currency, amount: parseFloat(amount), amount_words,
    remittance_mode: remittance_mode || "telegraphic_transfer",
    charge_type: charge_type || "SHA",
    details_of_payment: details_of_payment || null,
    beneficiary,
    status: "active",
    created_at: db.now(),
  };
  db.standingOrders[id] = so;
  res.status(201).json({ status: "success", data: enrich(so) });
});

// PUT /standing-orders/:id
router.put("/:id", requireAuth, (req, res) => {
  const o = db.standingOrders[req.params.id];
  if (!o) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Standing order not found" });
  if (o.status === "cancelled") return res.status(409).json({ status: "error", code: "ALREADY_CANCELLED", message: "Cannot amend a cancelled order" });
  const allowed = ["amount","amount_words","frequency","last_payment_date","details_of_payment","beneficiary","charge_type","status"];
  allowed.forEach(k => { if (req.body[k] !== undefined) o[k] = req.body[k]; });
  o.updated_at = db.now();
  res.json({ status: "success", data: enrich(o) });
});

// DELETE /standing-orders/:id
router.delete("/:id", requireAuth, (req, res) => {
  const o = db.standingOrders[req.params.id];
  if (!o) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Standing order not found" });
  o.status = "cancelled";
  o.cancelled_at = db.now();
  res.json({ status: "success", message: "Standing order cancelled", data: o });
});

module.exports = router;
