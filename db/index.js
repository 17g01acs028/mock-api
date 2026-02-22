// ─── IN-MEMORY DATABASE ──────────────────────────────────────────────────────
// All data lives here. Restart = reset. Swap this file with a real DB adapter later.

const { v4: uuidv4 } = require("uuid");

function id() { return uuidv4(); }
function now() { return new Date().toISOString(); }
function seq(collection, prefix) {
  const n = String(Object.keys(collection).length + 1).padStart(4, "0");
  return `${prefix}-${n}`;
}

// ─── SEED ────────────────────────────────────────────────────────────────────
const branches = {
  "br-0001": {
    id: "br-0001", code: "WL001", name: "Westlands Branch",
    address: "Westlands Road, Nairobi", region: "Nairobi",
    phone: "+254711111001", email: "westlands@ncbabank.co.ke",
    manager: "Peter Kamande", status: "active", created_at: now(),
  },
  "br-0002": {
    id: "br-0002", code: "CBD002", name: "CBD Branch",
    address: "Kenyatta Avenue, Nairobi", region: "Nairobi",
    phone: "+254711111002", email: "cbd@ncbabank.co.ke",
    manager: "Mary Wanjiku", status: "active", created_at: now(),
  },
  "br-0003": {
    id: "br-0003", code: "KSM003", name: "Kisumu Branch",
    address: "Oginga Odinga Street, Kisumu", region: "Nyanza",
    phone: "+254711111003", email: "kisumu@ncbabank.co.ke",
    manager: "John Otieno", status: "active", created_at: now(),
  },
};

const depositTypes = {
  "dt-0001": {
    id: "dt-0001", code: "FD", name: "Fixed Deposit",
    description: "Standard fixed-term deposit with interest paid at maturity",
    min_amount: 10000, max_amount: null, currency: "KES",
    min_term_days: 30, max_term_days: 365,
    base_rate: 9.5, withholding_tax_rate: 15,
    auto_renew_default: true, status: "active", created_at: now(),
  },
  "dt-0002": {
    id: "dt-0002", code: "CD", name: "Call Deposit",
    description: "Flexible deposit with 7 days notice for withdrawal",
    min_amount: 50000, max_amount: null, currency: "KES",
    min_term_days: 7, max_term_days: null,
    base_rate: 6.0, withholding_tax_rate: 15,
    auto_renew_default: false, status: "active", created_at: now(),
  },
  "dt-0003": {
    id: "dt-0003", code: "HYFD", name: "High Yield FD",
    description: "Fixed deposit with monthly interest payment",
    min_amount: 100000, max_amount: null, currency: "KES",
    min_term_days: 90, max_term_days: 730,
    base_rate: 10.5, withholding_tax_rate: 15,
    auto_renew_default: true, status: "active", created_at: now(),
  },
};

// Users
const users = {
  "usr-0001": {
    id: "usr-0001", customer_number: "CIF-001001",
    first_name: "John", last_name: "Mwangi",
    email: "john.mwangi@email.com", phone: "+254712345678",
    id_type: "national_id", id_number: "12345678", password: "Secure@1234",
    date_of_birth: "1985-06-15", gender: "male",
    address: "P.O. Box 1234-00100, Nairobi",
    branch_id: "br-0001", kra_pin: "A001234567B",
    kyc_status: "verified", status: "active", created_at: now(),
  },
  "usr-0002": {
    id: "usr-0002", customer_number: "CIF-001002",
    first_name: "Grace", last_name: "Achieng",
    email: "grace.achieng@email.com", phone: "+254723456789",
    id_type: "national_id", id_number: "23456789", password: "Secure@1234",
    date_of_birth: "1990-03-22", gender: "female",
    address: "P.O. Box 2345-00200, Nairobi",
    branch_id: "br-0002", kra_pin: "A002345678C",
    kyc_status: "verified", status: "active", created_at: now(),
  },
};

// Accounts (deposit = term accounts, withdrawable = current/savings)
const accounts = {
  "acc-0001": {
    id: "acc-0001", account_number: "1000000001",
    user_id: "usr-0001", branch_id: "br-0001",
    account_type: "withdrawable", account_subtype: "current",
    currency: "KES", balance: 458230.50, status: "active",
    opened_date: "2020-01-15", created_at: now(),
  },
  "acc-0002": {
    id: "acc-0002", account_number: "1000000002",
    user_id: "usr-0001", branch_id: "br-0001",
    account_type: "withdrawable", account_subtype: "savings",
    currency: "KES", balance: 120000.00, status: "active",
    opened_date: "2020-01-15", created_at: now(),
  },
  "acc-0003": {
    id: "acc-0003", account_number: "2000000001",
    user_id: "usr-0001", branch_id: "br-0001",
    account_type: "deposit", deposit_type_id: "dt-0001",
    currency: "KES", principal: 500000, balance: 500000,
    rate: 9.5, term_days: 90,
    value_date: "2026-01-01", maturity_date: "2026-04-01",
    status: "active", opened_date: "2026-01-01", created_at: now(),
  },
  "acc-0004": {
    id: "acc-0004", account_number: "1000000003",
    user_id: "usr-0002", branch_id: "br-0002",
    account_type: "withdrawable", account_subtype: "current",
    currency: "KES", balance: 95000.00, status: "active",
    opened_date: "2021-06-10", created_at: now(),
  },
};

// Standing orders
const standingOrders = {};

// Deposits (placements)
const deposits = {};

// Admin users (for the portal login)
const admins = {};

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

let dbState = {
  branches, depositTypes, users, accounts, standingOrders, deposits, admins,
  dynamicMocks: {}
};

if (fs.existsSync(DB_PATH)) {
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    // Merge loaded data
    Object.keys(dbState).forEach(key => {
      if (data[key]) Object.assign(dbState[key], data[key]);
    });
  } catch (e) {
    console.error("Error loading db.json", e);
  }
}

let lastSavedState = '';

function save() {
  const currentStateString = JSON.stringify(dbState, null, 2);
  if (currentStateString !== lastSavedState) {
    fs.writeFileSync(DB_PATH, currentStateString, 'utf8');
    lastSavedState = currentStateString;
  }
}

// Auto-save every 5 seconds
setInterval(save, 5000);

module.exports = {
  branches: dbState.branches,
  depositTypes: dbState.depositTypes,
  users: dbState.users,
  accounts: dbState.accounts,
  standingOrders: dbState.standingOrders,
  deposits: dbState.deposits,
  admins: dbState.admins,
  dynamicMocks: dbState.dynamicMocks,
  id, now, save,
  seq(collection, prefix) {
    const n = String(Object.keys(collection).length + 1).padStart(4, "0");
    return `${prefix}-${n}`;
  },
};
