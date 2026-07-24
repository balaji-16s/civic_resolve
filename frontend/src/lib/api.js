const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

function getToken() {
  try {
    // Try regular user token first
    const raw = localStorage.getItem("civicUser");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) return parsed.token;
    }
    // Fall back to department user token
    const deptRaw = localStorage.getItem("civicDeptUser");
    if (deptRaw) {
      const parsed = JSON.parse(deptRaw);
      if (parsed?.token) return parsed.token;
    }
    return null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.detail || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export function checkEmail(email) {
  return request("/auth/check-email", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function govLogin(username, password) {
  return request("/auth/gov-login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function signup(email, password, name, phone) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name, phone }),
  });
}

export function signin(email, password) {
  return request("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function sendOtp(email) {
  return request("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(email, otp, name, phone, password) {
  return request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp, name, phone, password }),
  });
}

export function setPassword(email, otp, password) {
  return request("/auth/set-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, password }),
  });
}

export function getMe() {
  return request("/auth/me");
}

// ── Complaints ────────────────────────────────────────────────────────────
export function getAllComplaints() {
  return request("/complaints");
}

export function getMyComplaints() {
  return request("/complaints/my");
}

export function createComplaint(data) {
  return request("/complaints", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateComplaintStatus(id, status) {
  return request(`/complaints/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// ── Forgot Password ──────────────────────────────────────────────────────
export function forgotPassword(email) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(email, otp, password) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, password }),
  });
}

// ── Department ────────────────────────────────────────────────────────────
export function deptLogin(username, password) {
  return request("/auth/dept-login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getDeptComplaints() {
  return request("/dept/complaints");
}

export function updateDeptComplaintStatus(id, status) {
  return request(`/dept/complaints/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function assignOfficer(complaintId, officerUsername) {
  return request(`/dept/complaints/${complaintId}/assign`, {
    method: "PUT",
    body: JSON.stringify({ officerUsername }),
  });
}

export function getDeptOfficers() {
  return request("/dept/officers");
}

// ── AI Insights ────────────────────────────────────────────────────────────
export function getInsights() {
  return request("/insights");
}

export function suggestOfficers(complaintId) {
  return request(`/dept/complaints/${complaintId}/suggest-officers`);
}
