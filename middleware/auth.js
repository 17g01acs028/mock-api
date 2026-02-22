const { admins } = require("../db");

const SESSIONS = {}; // token → admin id

function createToken(adminId) {
  const token = `ncba_${adminId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  SESSIONS[token] = adminId;
  return token;
}

function requireAuth(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token || !SESSIONS[token]) {
    return res.status(401).json({ status: "error", code: "UNAUTHORIZED", message: "Missing or invalid token" });
  }
  const admin = admins[SESSIONS[token]];
  if (!admin) return res.status(401).json({ status: "error", code: "UNAUTHORIZED", message: "Session expired" });
  req.admin = admin;
  next();
}

function destroyToken(token) {
  delete SESSIONS[token];
}

module.exports = { createToken, requireAuth, destroyToken };
