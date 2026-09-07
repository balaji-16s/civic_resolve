from fastapi.testclient import TestClient
from server import app
import json
from pathlib import Path
from datetime import datetime, timezone

client = TestClient(app)

DATA_DIR = Path("backend/data")
USERS_FILE = DATA_DIR / "users.json"
COMPLAINTS_FILE = DATA_DIR / "complaints.json"

def _clean_files():
    if USERS_FILE.exists():
        USERS_FILE.unlink()
    if COMPLAINTS_FILE.exists():
        COMPLAINTS_FILE.unlink()

def _seed_users():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    data = [{
        "_id": "sample-demo-user",
        "name": "Demo Citizen",
        "email": "demo@civicresolve.gov",
        "phone": "9876543000",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }]
    with open(USERS_FILE, "w") as f:
        json.dump(data, f)

def _make_citizen_user(email, name, phone):
    from server import uuid, _hash_password
    uid = uuid.uuid4().hex
    server_module = __import__("server")
    server_module.users_collection.clear()
    server_module.complaints_collection.clear()
    server_module.users_collection.append({
        "_id": uid,
        "name": name,
        "email": email,
        "phone": phone,
        "passwordHash": _hash_password("password123"),
        "createdAt": datetime.now(timezone.utc),
    })
    server_module._save_json(USERS_FILE, server_module.users_collection)
    return uid

def _login_citizen(email):
    resp = client.post("/api/auth/signin", json={"email": email, "password": "password123"})
    assert resp.status_code == 200, resp.json()
    return resp.json()["token"]

def test_auto_assign_on_create():
    _clean_files()
    _seed_users()
    uid = _make_citizen_user("alice@example.com", "Alice", "9876543001")
    token = _login_citizen("alice@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post("/api/complaints", json={
        "issueType": "garbage",
        "description": "Test",
        "location": "18.0,80.0",
        "contactName": "Alice",
        "contactPhone": "9876543001",
    }, headers=headers)
    assert resp.status_code == 201, resp.json()
    comp = resp.json()
    assert comp.get("assignedOfficer") is not None, "expected auto-assigned officer"
    assert comp.get("officerPhone") is not None
    # With no existing complaints, the alphabetically-first officer for municipal should be "Officer Arun"
    assert comp["assignedOfficer"] == "Officer Arun", f"expected Officer Arun, got {comp['assignedOfficer']}"

def test_officer_removal_reassign():
    _clean_files()
    _seed_users()
    uid = _make_citizen_user("alice@example.com", "Alice", "9876543001")
    token = _login_citizen("alice@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    # create complaint
    resp = client.post("/api/complaints", json={
        "issueType": "garbage",
        "description": "Test",
        "location": "18.0,80.0",
        "contactName": "Alice",
        "contactPhone": "9876543001",
    }, headers=headers)
    assert resp.status_code == 201
    comp_id_first = resp.json()["id"]
    # login as municipal head
    resp = client.post("/api/auth/dept-login", json={"username": "municipal_head", "password": "head@123"})
    assert resp.status_code == 200
    head_token = resp.json()["token"]
    head_headers = {"Authorization": f"Bearer {head_token}"}
    # remove municipal_officer_1 (Rajesh) — ensure there is an active complaint assigned to Rajesh
    # create a complaint manually assigned to Rajesh
    now = datetime.now(timezone.utc)
    server_module = __import__("server")
    server_module.complaints_collection.append({
        "_id": server_module.uuid.uuid4().hex,
        "userId": uid,
        "userName": "Alice",
        "userEmail": "alice@example.com",
        "userPhone": "9876543001",
        "issueType": "garbage",
        "severity": "low",
        "description": "rajesh complaint",
        "location": "18.0,80.0",
        "status": "pending",
        "assignedDepartment": "Municipal Department",
        "assignedDeptSlug": "municipal",
        "assignedOfficer": "Officer Rajesh",
        "officerPhone": "9876543211",
        "submittedAt": now,
        "workStartedAt": None,
        "delayNotifiedAt": None,
        "apologySentAt": None,
        "escalatedAt": None,
    })
    server_module._save_json(server_module.COMPLAINTS_FILE, server_module.complaints_collection)
    comp_id_rajesh = server_module.complaints_collection[-1]["_id"]
    resp = client.delete("/api/dept/officers/municipal_officer_1", headers=head_headers)
    assert resp.status_code == 200, resp.json()
    body = resp.json()
    assert body.get("reassignedComplaintIds") is not None
    assert comp_id_rajesh in body["reassignedComplaintIds"], "expected rajesh complaint to be reassigned"
    # Verify the complaint now has a new assignee
    server_module.complaints_collection = server_module._load_json(
        server_module.COMPLAINTS_FILE,
        [],
        convert_dates=["submittedAt", "workStartedAt", "delayNotifiedAt", "apologySentAt", "escalatedAt"]
    )
    reassigned = [c for c in server_module.complaints_collection if c["_id"] == comp_id_rajesh][0]
    assert reassigned["assignedOfficer"] != "Officer Rajesh", "expected reassignment"

def test_gov_access_rejected():
    _clean_files()
    _seed_users()
    uid = _make_citizen_user("alice@example.com", "Alice", "9876543001")
    token = _login_citizen("alice@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    # Try accessing dept/my-complaints with gov token -> should fail with 401 Not a department user
    resp = client.post("/api/auth/gov-login", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200, resp.json()
    gov_token = resp.json()["token"]
    gov_headers = {"Authorization": f"Bearer {gov_token}"}
    resp = client.get("/api/dept/my-complaints", headers=gov_headers)
    assert resp.status_code == 401, f"expected 401, got {resp.status_code} {resp.json()}"


def _create_complaint(headers, description="Test", location="18.0,80.0"):
    resp = client.post("/api/complaints", json={
        "issueType": "garbage",
        "description": description,
        "location": location,
        "contactName": "Alice",
        "contactPhone": "9876543001",
    }, headers=headers)
    assert resp.status_code == 201, resp.json()
    return resp.json()


def test_officer_only_sees_own_complaints():
    _clean_files()
    _seed_users()
    uid = _make_citizen_user("alice@example.com", "Alice", "9876543001")
    token = _login_citizen("alice@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Two complaints auto-assign to different officers (workload-balanced)
    comp_arun = _create_complaint(headers, "First garbage pile")
    comp_meena = _create_complaint(headers, "Second garbage pile")
    assert comp_arun["assignedOfficer"] == "Officer Arun"
    assert comp_meena["assignedOfficer"] != "Officer Arun"

    # Login as municipal officer Arun
    resp = client.post("/api/auth/dept-login", json={"username": "municipal_officer_3", "password": "officer@123"})
    assert resp.status_code == 200, resp.json()
    officer_token = resp.json()["token"]
    officer_headers = {"Authorization": f"Bearer {officer_token}"}

    # Officer only sees their own complaints via the dept queue endpoint
    resp = client.get("/api/dept/complaints", headers=officer_headers)
    assert resp.status_code == 200, resp.json()
    ids = [c["id"] for c in resp.json()]
    assert comp_arun["id"] in ids, "officer should see their own assigned complaint"
    assert comp_meena["id"] not in ids, "officer must NOT see another officer's complaint"

    # Officer cannot update a complaint assigned to someone else
    resp = client.put(f"/api/dept/complaints/{comp_meena['id']}/status",
                      json={"status": "in-progress"}, headers=officer_headers)
    assert resp.status_code == 403, f"expected 403, got {resp.status_code} {resp.text}"

    # Head still sees the whole department queue with officer workload counts
    resp = client.post("/api/auth/dept-login", json={"username": "municipal_head", "password": "head@123"})
    assert resp.status_code == 200, resp.json()
    head_token = resp.json()["token"]
    head_headers = {"Authorization": f"Bearer {head_token}"}
    resp = client.get("/api/dept/officers", headers=head_headers)
    assert resp.status_code == 200, resp.json()
    officer_stats = {o["username"]: o for o in resp.json()["officers"]}
    assert "activeComplaints" in officer_stats["municipal_officer_3"], "dept officers should include workload counts"
    assert officer_stats["municipal_officer_3"]["activeComplaints"] >= 1


def test_gov_overview_and_head_edit():
    _clean_files()
    _seed_users()
    resp = client.post("/api/auth/gov-login", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200, resp.json()
    gov_token = resp.json()["token"]
    gov_headers = {"Authorization": f"Bearer {gov_token}"}

    # Overview returns records for every department (head + officer + complaint stats)
    resp = client.get("/api/gov/departments", headers=gov_headers)
    assert resp.status_code == 200, resp.json()
    departments = {d["deptSlug"]: d for d in resp.json()["departments"]}
    assert "municipal" in departments
    assert departments["municipal"]["head"]["username"] == "municipal_head"
    assert departments["municipal"]["officerCount"] > 0
    assert "complaints" in departments["municipal"]

    # Gov can edit a department head's details
    resp = client.put("/api/gov/departments/municipal/head", json={
        "username": "municipal_head",
        "name": "Municipal Commissioner Updated",
        "phone": "9876543299",
    }, headers=gov_headers)
    assert resp.status_code == 200, resp.json()
    assert resp.json()["head"]["name"] == "Municipal Commissioner Updated"

    # Officers list includes workload counts for gov records too
    resp = client.get("/api/gov/departments/municipal/officers", headers=gov_headers)
    assert resp.status_code == 200, resp.json()
    officers = resp.json()["officers"]
    assert len(officers) > 0, "expected municipal officers in records"
    assert all("activeComplaints" in o and "resolvedCount" in o for o in officers), \
        "gov officer records should include workload counts"
