const router = require("express").Router();
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

// GET /admins
router.get("/", requireAuth, (req, res) => {
    const list = Object.values(db.admins);
    res.json({ status: "success", data: list, total: list.length });
});

// POST /admins
router.post("/", requireAuth, (req, res) => {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password) {
        return res.status(400).json({ status: "error", message: "name, username, and password required" });
    }
    if (Object.values(db.admins).find(a => a.username === username)) {
        return res.status(409).json({ status: "error", message: "Username already exists" });
    }

    const id = db.seq(db.admins, "adm");
    const newAdmin = { id, name, username, password, role: role || "admin" };
    db.admins[id] = newAdmin;
    res.status(201).json({ status: "success", data: newAdmin });
});

// PUT /admins/:id
router.put("/:id", requireAuth, (req, res) => {
    const admin = db.admins[req.params.id];
    if (!admin) return res.status(404).json({ status: "error", message: "Admin not found" });

    const { name, username, password, role } = req.body;
    if (name) admin.name = name;
    if (username) admin.username = username;
    if (password) admin.password = password;
    if (role) admin.role = role;

    res.json({ status: "success", data: admin });
});

// DELETE /admins/:id
router.delete("/:id", requireAuth, (req, res) => {
    const admin = db.admins[req.params.id];
    if (!admin) return res.status(404).json({ status: "error", message: "Admin not found" });

    delete db.admins[req.params.id];
    res.json({ status: "success", message: "Admin deleted" });
});

module.exports = router;
