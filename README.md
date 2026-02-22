# NCBA Bank Admin API v2.0

Admin portal + REST API for managing bank customers, accounts, branches, deposit products, and standing orders.

## Setup

```bash
npm install
npm start
# dev with auto-reload:
npm run dev
```

- **API** → `http://localhost:3000/v1`
- **Admin Portal** → `http://localhost:3000`

### 🔒 Admin Security
To prevent unauthorized access, hardcoded credentials have been removed. You must create an admin user on your server before logging in:

```bash
# Usage: node scripts/setup-admin.js <username> <password> [display_name]
node scripts/setup-admin.js admin your_secure_password
```

---

## What you can manage via the Admin Portal UI

| Section | Operations |
|---------|-----------|
| **Branches** | Register, edit, deactivate |
| **Deposit Types** | Configure types (FD, Call, High Yield, etc.), rates, terms |
| **Users** | Register customers, update KYC status |
| **Accounts** | Open withdrawable (current/savings/cheque) or deposit accounts |
| **Standing Orders** | Register instructions, view list, cancel |

---

## REST API Reference

All endpoints require `Authorization: Bearer <token>` (get token from `/v1/auth/login`).

### Auth
```
POST /v1/auth/login     { username, password }
POST /v1/auth/logout
```

### Branches
```
GET    /v1/branches              ?status=active&region=Nairobi
GET    /v1/branches/:id
POST   /v1/branches              { code*, name*, address*, region*, phone, email, manager }
PUT    /v1/branches/:id          { name, address, region, phone, email, manager, status }
DELETE /v1/branches/:id          → soft deactivate
```

### Deposit Types
```
GET    /v1/deposit-types         ?status=active
GET    /v1/deposit-types/:id
POST   /v1/deposit-types         { code*, name*, currency*, base_rate*, min_amount, max_amount, min_term_days, max_term_days, withholding_tax_rate, auto_renew_default }
PUT    /v1/deposit-types/:id
DELETE /v1/deposit-types/:id     → soft deactivate
```

### Users
```
GET    /v1/users                 ?status=active&branch_id=br-0001&kyc_status=verified&q=john
GET    /v1/users/:id
GET    /v1/users/:id/accounts    ?account_type=withdrawable|deposit
POST   /v1/users                 { first_name*, last_name*, email*, phone*, id_type*, id_number*, branch_id*, date_of_birth, gender, address, kra_pin }
PUT    /v1/users/:id             { first_name, last_name, email, phone, address, branch_id, kra_pin, kyc_status, status }
DELETE /v1/users/:id             → soft deactivate
```

### Accounts
```
GET    /v1/accounts              ?user_id=&account_type=withdrawable|deposit&status=active&branch_id=
GET    /v1/accounts/:id
POST   /v1/accounts              (see below)
PUT    /v1/accounts/:id          { balance, principal, rate, term_days, value_date, maturity_date, status }
DELETE /v1/accounts/:id          → close account
```

**Open Withdrawable Account:**
```json
{
  "user_id": "usr-0001",
  "account_type": "withdrawable",
  "account_subtype": "current",
  "currency": "KES",
  "balance": 0,
  "branch_id": "br-0001"
}
```

**Open Deposit Account:**
```json
{
  "user_id": "usr-0001",
  "account_type": "deposit",
  "deposit_type_id": "dt-0001",
  "currency": "KES",
  "principal": 500000,
  "rate": 9.5,
  "term_days": 90,
  "value_date": "2026-03-01",
  "maturity_date": "2026-06-01"
}
```

### Standing Orders
```
GET    /v1/standing-orders       ?user_id=&status=active&currency=KES
GET    /v1/standing-orders/:id
POST   /v1/standing-orders       { user_id*, debit_account_id*, frequency*, first_payment_date*, currency*, amount*, amount_words*, beneficiary.name*, ... }
PUT    /v1/standing-orders/:id   { amount, frequency, last_payment_date, beneficiary, charge_type, status }
DELETE /v1/standing-orders/:id   → cancel
```

**Full Standing Order body:**
```json
{
  "user_id": "usr-0001",
  "debit_account_id": "acc-0001",
  "frequency": "monthly",
  "first_payment_date": "2026-03-01",
  "regular_payment_date": 1,
  "last_payment_date": "2027-03-01",
  "currency": "KES",
  "amount": 50000,
  "amount_words": "Fifty Thousand Kenya Shillings",
  "remittance_mode": "telegraphic_transfer",
  "charge_type": "SHA",
  "details_of_payment": "Monthly rent",
  "beneficiary": {
    "name": "Jane Otieno",
    "account_number": "0200123456789",
    "bank_name": "Equity Bank Kenya",
    "swift_code": "EQBLKENA",
    "country": "KE"
  }
}
```

---

---

## 🎨 Mock Studio: Advanced API Interception

The **Mock Studio** (accessible via the "Dynamic Mocks" sidebar menu) allows you to create sophisticated API simulations with conditional logic.

### Features:
- **Rule Engine**: Return different responses based on request headers, query params, or body fields.
- **Programmable Logic**: Use JavaScript logic for both request validation and dynamic response generation.
- **Network Simulation**: Configure latency (ms) and random failure rates.

### 💡 Pro-Tip: The "Echo" Endpoint
Want to see exactly what your app is sending to the API? 
1. Create a new mock and click the **"Body"** tab.
2. Click **"💻 Make Programmable"**.
3. Use this script:
   ```javascript
   // script
   return {
     receivedAt: new Date().toISOString(),
     method: req.method,
     headers: req.headers,
     body: req.body,
     query: req.query
   };
   ```
4. Save it. Now, whenever you hit that endpoint, it will "Echo" back your request in a clean JSON format!

---

## Seed Data

Pre-loaded on startup:
- **3 Branches**: Westlands, CBD, Kisumu
- **3 Deposit Types**: Fixed Deposit (9.5%), Call Deposit (6%), High Yield FD (10.5%)
- **2 Users**: John Mwangi, Grace Achieng
- **4 Accounts**: 2 current + 1 savings + 1 FD deposit

---

## Notes
- Data is **in-memory** — restarting resets everything
- CORS is open (`*`) for local dev / workflow tool integration
- All deletes are **soft** (status changes, not removed)
