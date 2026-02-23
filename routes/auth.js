const router = require("express").Router();
const { admins, users, branches } = require("../db");
const { createToken, destroyToken } = require("../middleware/auth");

// POST /auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ status: "error", code: "MISSING_FIELDS", message: "username and password required" });

  // 1. Try Admin Login first
  const admin = Object.values(admins).find(a => a.username === username && a.password === password);
  if (admin) {
    console.log(`[NCBA Auth] Admin login: ${username}`);
    const token = createToken(admin.id, 'admin');
    return res.json({
      status: "success",
      data: {
        token,
        token_type: "Bearer",
        admin: { id: admin.id, name: admin.name, role: admin.role },
      },
    });
  }

  // 2. Try Customer API Login
  const user = Object.values(users).find(u =>
    (u.email === username || u.id_number === username) && u.password === password
  );

  if (user) {
    console.log(`[NCBA Auth] Customer login: ${username}`);
    const token = createToken(user.id, 'user');
    const branchName = branches[user.branch_id]?.name || "Local Branch";
    return res.json({
      status: "success",
      data: {
        access_token: token,
        refresh_token: "rt_" + token.substring(0, 20),
        token_type: "Bearer",
        expires_in: 3600,
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          branch: branchName,
          roles: ["customer"],
          mfa_enabled: true
        }
      }
    });
  }

  return res.status(401).json({ status: "error", code: "INVALID_CREDENTIALS", message: "Invalid username or password" });
});

// POST /auth/refresh
router.post("/refresh", (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ status: "error", message: "refresh_token required" });
  }
  res.json({
    access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.new_token_here.sig",
    expires_in: 3600
  });
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  const token = (req.headers["authorization"] || "").replace("Bearer ", "").trim();
  destroyToken(token);
  res.json({ status: "success", message: "Logged out" });
});

module.exports = router;
