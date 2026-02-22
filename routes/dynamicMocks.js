const router = require("express").Router();
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

// GET /dynamic-mocks
router.get("/", requireAuth, (req, res) => {
    const list = Object.values(db.dynamicMocks);
    res.json({ status: "success", data: list, total: list.length });
});

// POST /dynamic-mocks
router.post("/", requireAuth, (req, res) => {
    const { name, method, path, status_code, response_body, headers, rules, latency, fail_rate } = req.body;

    if (!name || !method || !path) {
        return res.status(400).json({ status: "error", message: "name, method, and path are required" });
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const normalizedMethod = method.toUpperCase();

    // Check for duplicates
    const isDuplicate = Object.values(db.dynamicMocks).some(m =>
        m.method === normalizedMethod && m.path === normalizedPath
    );

    if (isDuplicate) {
        return res.status(409).json({
            status: "error",
            message: `Mock already exists for ${normalizedMethod} ${normalizedPath}`
        });
    }

    const id = db.seq(db.dynamicMocks, "mock");
    const newMock = {
        id,
        name,
        method: normalizedMethod,
        path: normalizedPath,
        status_code: parseInt(status_code) || 200,
        response_body: response_body || {},
        headers: headers || { "Content-Type": "application/json" },
        rules: rules || [],
        latency: parseInt(latency) || 0,
        fail_rate: parseInt(fail_rate) || 0,
        active: true,
        created_at: db.now()
    };

    db.dynamicMocks[id] = newMock;
    db.save();
    res.status(201).json({ status: "success", data: newMock });
});

// PUT /dynamic-mocks/:id
router.put("/:id", requireAuth, (req, res) => {
    const mock = db.dynamicMocks[req.params.id];
    if (!mock) return res.status(404).json({ status: "error", message: "Mock not found" });

    const { name, method, path, status_code, response_body, headers, active, rules, latency, fail_rate } = req.body;

    const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : mock.path;
    const normalizedMethod = method ? method.toUpperCase() : mock.method;

    // Check for duplicates (excluding current mock)
    const isDuplicate = Object.values(db.dynamicMocks).some(m =>
        m.id !== req.params.id &&
        m.method === normalizedMethod &&
        m.path === normalizedPath
    );

    if (isDuplicate) {
        return res.status(409).json({
            status: "error",
            message: `Another mock already exists for ${normalizedMethod} ${normalizedPath}`
        });
    }

    if (name) mock.name = name;
    if (method) mock.method = normalizedMethod;
    if (path) mock.path = normalizedPath;
    if (status_code !== undefined) mock.status_code = parseInt(status_code);
    if (response_body !== undefined) mock.response_body = response_body;
    if (headers !== undefined) mock.headers = headers;
    if (active !== undefined) mock.active = !!active;
    if (rules !== undefined) mock.rules = rules;
    if (latency !== undefined) mock.latency = parseInt(latency);
    if (fail_rate !== undefined) mock.fail_rate = parseInt(fail_rate);

    mock.updated_at = db.now();
    db.save();
    res.json({ status: "success", data: mock });
});

// DELETE /dynamic-mocks/:id
router.delete("/:id", requireAuth, (req, res) => {
    if (!db.dynamicMocks[req.params.id]) {
        return res.status(404).json({ status: "error", message: "Mock not found" });
    }

    delete db.dynamicMocks[req.params.id];
    db.save();
    res.json({ status: "success", message: "Mock deleted" });
});

module.exports = router;
