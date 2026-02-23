const { admins, users } = require("../db");

const SESSIONS = {}; // token → { id, type: 'admin' | 'user' }

function createToken(id, type = 'admin') {
  const token = `ncba_${id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  SESSIONS[token] = { id, type };
  return token;
}

function requireAuth(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.replace("Bearer ", "").trim();

  if (!token || !SESSIONS[token]) {
    return res.status(401).json({
      status: "error",
      code: "UNAUTHORIZED",
      message: "Missing or invalid token. Please login first."
    });
  }

  const session = SESSIONS[token];
  if (session.type === 'admin') {
    const admin = admins[session.id];
    if (!admin) return res.status(401).json({ status: "error", code: "UNAUTHORIZED", message: "Session expired" });
    req.admin = admin;
    req.userType = 'admin';
  } else {
    const user = users[session.id];
    if (!user) return res.status(401).json({ status: "error", code: "UNAUTHORIZED", message: "Session expired" });
    req.user = user;
    req.userType = 'user';
  }

  next();
}

function destroyToken(token) {
  delete SESSIONS[token];
}

module.exports = { createToken, requireAuth, destroyToken };
