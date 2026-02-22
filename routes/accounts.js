const router = require("express").Router();
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

function enrichAccount(a) {
  const branch = db.branches[a.branch_id];
  const user = db.users[a.user_id];
  const depType = a.deposit_type_id ? db.depositTypes[a.deposit_type_id] : null;
  return {
    ...a,
    account_holder: user ? `${user.first_name} ${user.last_name}` : null,
    customer_number: user ? user.customer_number : null,
    branch_name: branch ? branch.name : null,
    deposit_type_name: depType ? depType.name : null,
  };
}

function genAccountNumber(type) {
  const prefix = type === "deposit" ? "2" : "1";
  const existing = Object.values(db.accounts).filter(a => a.account_type === type).length;
  return `${prefix}${String(existing + 1).padStart(9, "0")}`;
}

// GET /accounts
router.get("/", requireAuth, (req, res) => {
  const { user_id, account_type, account_subtype, deposit_type_id, status, branch_id } = req.query;
  let list = Object.values(db.accounts).map(enrichAccount);
  if (user_id) list = list.filter(a => a.user_id === user_id);
  if (account_type) list = list.filter(a => a.account_type === account_type);
  if (account_subtype) list = list.filter(a => a.account_subtype === account_subtype);
  if (deposit_type_id) list = list.filter(a => a.deposit_type_id === deposit_type_id);
  if (status) list = list.filter(a => a.status === status);
  if (branch_id) list = list.filter(a => a.branch_id === branch_id);
  res.json({ status: "success", data: list, total: list.length });
});

// GET /accounts/:id
router.get("/:id", requireAuth, (req, res) => {
  const a = db.accounts[req.params.id];
  if (!a) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Account not found" });
  res.json({ status: "success", data: enrichAccount(a) });
});

// POST /accounts — create a withdrawable or deposit account
router.post("/", requireAuth, (req, res) => {
  const {
    user_id, branch_id, account_type, account_subtype,
    deposit_type_id, currency, balance,
    // deposit-specific
    principal, rate, term_days, value_date, maturity_date,
    opened_date,
  } = req.body;

  const errors = [];
  if (!user_id) errors.push({ field: "user_id", message: "user_id is required" });
  if (!account_type) errors.push({ field: "account_type", message: "account_type is required: withdrawable | deposit" });
  if (!currency) errors.push({ field: "currency", message: "currency is required" });
  if (account_type === "withdrawable" && !account_subtype)
    errors.push({ field: "account_subtype", message: "account_subtype required for withdrawable: current | savings | cheque" });
  if (account_type === "deposit" && !deposit_type_id)
    errors.push({ field: "deposit_type_id", message: "deposit_type_id is required for deposit accounts" });

  if (errors.length) return res.status(422).json({ status: "error", code: "VALIDATION_ERROR", errors });
  if (!db.users[user_id]) return res.status(422).json({ status: "error", code: "INVALID_USER", message: "User not found" });
  if (branch_id && !db.branches[branch_id]) return res.status(422).json({ status: "error", code: "INVALID_BRANCH", message: "Branch not found" });
  if (deposit_type_id && !db.depositTypes[deposit_type_id]) return res.status(422).json({ status: "error", code: "INVALID_DEPOSIT_TYPE", message: "Deposit type not found" });

  const resolvedBranch = branch_id || db.users[user_id].branch_id;
  const id = db.seq(db.accounts, "acc");
  const accNum = genAccountNumber(account_type);

  const account = {
    id,
    account_number: accNum,
    user_id,
    branch_id: resolvedBranch,
    account_type,
    currency,
    status: "active",
    opened_date: opened_date || db.now().slice(0,10),
    created_at: db.now(),
    // withdrawable specific
    ...(account_type === "withdrawable" ? {
      account_subtype,
      balance: balance || 0,
    } : {}),
    // deposit specific
    ...(account_type === "deposit" ? {
      deposit_type_id,
      principal: principal || 0,
      balance: principal || 0,
      rate: rate || null,
      term_days: term_days || null,
      value_date: value_date || null,
      maturity_date: maturity_date || null,
    } : {}),
  };

  db.accounts[id] = account;
  res.status(201).json({ status: "success", data: enrichAccount(account) });
});

// PUT /accounts/:id
router.put("/:id", requireAuth, (req, res) => {
  const a = db.accounts[req.params.id];
  if (!a) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Account not found" });
  const allowed = ["balance","principal","rate","term_days","value_date","maturity_date","status","branch_id"];
  allowed.forEach(k => { if (req.body[k] !== undefined) a[k] = req.body[k]; });
  a.updated_at = db.now();
  res.json({ status: "success", data: enrichAccount(a) });
});

// DELETE /accounts/:id
router.delete("/:id", requireAuth, (req, res) => {
  const a = db.accounts[req.params.id];
  if (!a) return res.status(404).json({ status: "error", code: "NOT_FOUND", message: "Account not found" });
  a.status = "closed";
  a.updated_at = db.now();
  res.json({ status: "success", message: "Account closed" });
});

module.exports = router;
