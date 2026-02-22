import requests
import json
import time

BASE_URL = "http://localhost:3000"

# 1. Login
login_res = requests.post(f"{BASE_URL}/v1/auth/login", json={"username": "admin", "password": "admin123"})
token = login_res.json()["data"]["token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("--- Testing Programmable Rules & Responses ---")

# 2. Create Mock with JS Rule and Dynamic Response
mock_data = {
    "name": "Programmable Mock",
    "method": "POST",
    "path": "/v1/js-test",
    "status_code": 200,
    "response_body": "// script\\nreturn {\\n  status: 'success',\\n  generatedAt: new Date().toISOString(),\\n  message: 'Default Dynamic Response'\\n};",
    "rules": [
        {
            "name": "Check Amount Script",
            "conditions": [
                { "source": "script", "key": "js", "operator": "script", "value": "req.body.amount > 1000" }
            ],
            "response": {
                "status_code": 201,
                "body": "// script\\nreturn { status: 'success', message: 'Big spender detected: ' + req.body.amount };"
            }
        }
    ]
}

create_res = requests.post(f"{BASE_URL}/v1/dynamic-mocks", json=mock_data, headers=headers)
mock_id = create_res.json()["data"]["id"]

# 3. Test Scenarios
print("\n[Scenario 1] Default Dynamic Response (Small Amount)")
r1 = requests.post(f"{BASE_URL}/v1/js-test", json={"amount": 500})
print(f"Status: {r1.status_code}")
print(f"Body: {r1.json()}")
time.sleep(1) # Wait 1s to see timestamp change

print("\n[Scenario 2] Scripted Rule (Big Amount)")
r2 = requests.post(f"{BASE_URL}/v1/js-test", json={"amount": 5000})
print(f"Status: {r2.status_code}")
print(f"Body: {r2.json()}")

print("\n[Scenario 3] Dynamic Content Verification")
r3 = requests.post(f"{BASE_URL}/v1/js-test", json={"amount": 100})
print(f"Status: {r3.status_code}")
print(f"Timestamp 1: {r1.json()['generatedAt']}")
print(f"Timestamp 2: {r3.json()['generatedAt']}")

# 4. Cleanup
requests.delete(f"{BASE_URL}/v1/dynamic-mocks/{mock_id}", headers=headers)
print("\nScripting Verification Complete.")
