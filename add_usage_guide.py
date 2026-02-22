import sys

with open('public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add "Usage Guide" button to Mock Studio Header
old_header = '<button class="btn btn-primary" onclick="openModal_mock()">+ New Endpoint</button>'
new_header = """<div style="display:flex; gap:10px">
              <button class="btn btn-emerald" style="background:#059669; border:none" onclick="openModal('usage')">📖 Usage Guide</button>
              <button class="btn btn-primary" onclick="openModal_mock()">+ New Endpoint</button>
            </div>"""
html = html.replace(old_header, new_header)

# 2. Add Usage Modal
usage_modal = """
  <!-- Usage Guide Modal -->
  <div class="modal-overlay" id="modal-usage">
    <div class="modal" style="max-width:800px">
      <div class="modal-header">
        <h2>Mock Studio Usage Guide</h2>
        <button class="close-btn" onclick="closeModal('usage')">×</button>
      </div>
      <div class="modal-body" style="max-height:70vh; overflow-y:auto; padding-right:10px">
        <div class="card" style="margin-bottom:20px; border-left:4px solid var(--emerald)">
          <div class="card-body">
            <h3 style="color:var(--emerald)">⚡ Pro Tip: The Echo Script</h3>
            <p>Use this script in the <strong>Body</strong> tab to see exactly what your app is sending to the API:</p>
            <pre style="background:#111; padding:10px; border-radius:4px; font-size:12px; color:#10b981">
// script
return {
  receivedAt: new Date().toISOString(),
  method: req.method,
  headers: req.headers,
  body: req.body,
  query: req.query
};</pre>
          </div>
        </div>

        <h3>📝 Editor Tabs</h3>
        <ul>
          <li><strong>Body</strong>: Define the default JSON response. Use <code>// script</code> at the start to enable dynamic generation.</li>
          <li><strong>Headers</strong>: Set custom HTTP headers like <code>X-Total-Count</code> or <code>Cache-Control</code>.</li>
          <li><strong>Rules</strong>: Create logic to return different responses based on request data. Rules are checked from top to bottom.</li>
          <li><strong>Config</strong>: Set simulated latency (delay) and random failure rates (500 errors).</li>
        </ul>

        <h3 style="margin-top:20px">💻 Scripting Reference</h3>
        <p>In programmable rules and bodies, you have access to the <code>req</code> object:</p>
        <table style="font-size:12px">
          <tr style="border-bottom:1px solid var(--border)">
            <th style="padding:8px">Field</th>
            <th style="padding:8px">Description</th>
          </tr>
          <tr><td style="padding:8px"><code>req.body</code></td><td style="padding:8px">Parsed request JSON body</td></tr>
          <tr><td style="padding:8px"><code>req.headers</code></td><td style="padding:8px">Request headers (all lowercase)</td></tr>
          <tr><td style="padding:8px"><code>req.query</code></td><td style="padding:8px">URL query parameters</td></tr>
          <tr><td style="padding:8px"><code>req.method</code></td><td style="padding:8px">HTTP method (GET, POST, etc.)</td></tr>
        </table>

        <h3 style="margin-top:20px">💡 Rule Examples</h3>
        <ul style="font-size:13px">
          <li><strong>Check Body</strong>: Set Source to <code>Script</code> and enter: <code>req.body.amount > 5000</code></li>
          <li><strong>Check Header</strong>: Set Source to <code>Header</code>, Key to <code>x-api-key</code>, Operator to <code>not exists</code>.</li>
          <li><strong>Dynamic Body</strong>: Start with <code>// script</code> and <code>return req.body</code> to echo back payload.</li>
        </ul>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="closeModal('usage')">Got it!</button>
      </div>
    </div>
  </div>
"""

# Find where to insert modal (after Branch Modal)
branch_modal_end = '<!-- Branch Modal -->'
html = html.replace(branch_modal_end, usage_modal + branch_modal_end)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
