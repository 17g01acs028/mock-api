const db = require("../db");

/**
 * Advanced Rule Evaluator for Mock Studio
 * Checks conditions against Request (Query, Params, Headers, Body)
 * Now supports JavaScript programmable checks!
 */
function evaluateRule(rule, req) {
    if (!rule.conditions || !rule.conditions.length) return true;

    return rule.conditions.every(cond => {
        const { source, key, operator, value } = cond;
        let actualValue;

        // Programmable JavaScript check
        if (source === 'script') {
            try {
                const scriptRaw = value.replace(/\\n/g, '\n');
                const scriptFunc = new Function('req', scriptRaw.includes('return') ? scriptRaw : `return (${scriptRaw})`);
                return !!scriptFunc(req);
            } catch (e) {
                console.error(`[STU] Script Error: ${e.message}`);
                return false;
            }
        }

        // Get value from standard sources
        if (source === 'query') actualValue = req.query[key];
        else if (source === 'header') actualValue = req.headers[key.toLowerCase()];
        else if (source === 'body') actualValue = req.body ? req.body[key] : undefined;
        else if (source === 'param') actualValue = req.params[key];

        // Basic Operators
        switch (operator) {
            case 'equals': return String(actualValue) === String(value);
            case 'not_equals': return String(actualValue) !== String(value);
            case 'contains': return String(actualValue || '').includes(String(value));
            case 'exists': return actualValue !== undefined && actualValue !== null;
            case 'not_exists': return actualValue === undefined || actualValue === null;
            case 'regex': try { return new RegExp(value).test(String(actualValue || '')); } catch (e) { return false; }
            default: return false;
        }
    });
}

/**
 * Executes a dynamic response script if applicable
 */
function processResponse(response, req) {
    if (typeof response === 'string' && response.startsWith('// script')) {
        try {
            const scriptBody = response.replace('// script', '').trim().replace(/\\n/g, '\n');
            const scriptFunc = new Function('req', scriptBody.includes('return') ? scriptBody : `return (${scriptBody})`);
            return scriptFunc(req);
        } catch (e) {
            console.error(`[STU] Response Script Error: ${e.message}`);
            return { error: "Response Script Error", details: e.message };
        }
    }
    return response;
}

/**
 * Middleware to intercept and serve dynamic mocks with Rule Engine logic.
 */
async function dynamicMockHandler(req, res, next) {
    const method = req.method.toUpperCase();
    const path = req.path;

    // Find a matching active mock
    const mock = Object.values(db.dynamicMocks).find(m =>
        m.active &&
        m.method === method &&
        m.path === path
    );

    if (mock) {
        // 1. Simulate Latency
        if (mock.latency > 0) {
            await new Promise(resolve => setTimeout(resolve, mock.latency));
        }

        // 2. Random Fail Rate
        if (mock.fail_rate > 0 && Math.random() * 100 < mock.fail_rate) {
            console.log(`[STU] Random Fail: ${method} ${path}`);
            return res.status(500).json({ status: "error", message: "Randomly simulated server error" });
        }

        // 3. Evaluate Rules
        let responseBody = mock.response_body || {};
        let statusCode = mock.status_code || 200;
        let headers = mock.headers || {};

        if (mock.rules && mock.rules.length > 0) {
            for (const rule of mock.rules) {
                if (evaluateRule(rule, req)) {
                    console.log(`[STU] Rule Triggered: "${rule.name}" for ${method} ${path}`);
                    if (rule.response) {
                        if (rule.response.body !== undefined) responseBody = rule.response.body;
                        if (rule.response.status_code !== undefined) statusCode = rule.response.status_code;
                        if (rule.response.headers) headers = { ...headers, ...rule.response.headers };
                    }
                    break; // Use the first matching rule
                }
            }
        }

        // 4. Process Dynamic Response (if enabled via // script prefix)
        // We check if the body is a string (which it might be if it's a script)
        // or if the user explicitly provided a script string in the JSON field.
        if (typeof responseBody === 'string' && responseBody.trim().startsWith('// script')) {
            responseBody = processResponse(responseBody, req);
        } else if (responseBody && typeof responseBody === 'object' && responseBody.__script) {
            // Alternative format if JSON doesn't allow raw script strings easily
            responseBody = processResponse('// script ' + responseBody.__script, req);
        }

        console.log(`[STU] Serving: ${method} ${path} -> ${statusCode}`);

        // Apply headers
        Object.keys(headers).forEach(key => res.setHeader(key, headers[key]));

        return res.status(statusCode).json(responseBody);
    }

    next();
}

module.exports = dynamicMockHandler;
