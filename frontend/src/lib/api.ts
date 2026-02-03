import { getToken, clearToken } from "./auth";

const BASE = import.meta.env.VITE_API_BASE;

function forceLogout() {
  clearToken();
  // đưa về /login ngay cả khi đang ở deep route
  window.location.href = "/login";
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // ✅ nếu token hết hạn / không hợp lệ
  if (res.status === 401 || res.status === 403) {
    forceLogout();
    throw new Error("Unauthorized");
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data;
}

// download blob helper (giữ y chang hành vi cũ, có auth + forceLogout)
async function downloadBlobWithAuth(path: string) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401 || res.status === 403) {
    forceLogout();
    throw new Error("Unauthorized");
  }

  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.blob();
}

export const api = {
  // ===== AUTH =====
  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  // ===== CASES =====
  getCases: () => request("/cases"),

  createCase: (data: {
    fullName: string;
    dob?: string; // "YYYY-MM-DD"
    jobTitle?: string; // loại visa / job title
    phone?: string;
    city?: string;
    visaStatus?: string;
    restaurantName?: string;
  }) =>
    request("/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  updateCase: (
    caseId: number,
    data: Partial<{
      fullName: string;
      dob: string; // "YYYY-MM-DD"
      jobTitle: string;
      phone: string;
      city: string;
      visaStatus: string;
      restaurantName: string;
    }>,
  ) =>
    request(`/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  deleteCase: (caseId: number) =>
    request(`/cases/${caseId}`, {
      method: "DELETE",
    }),

  // ===== CHECKLIST =====
  getChecklist: (caseId: number) => request(`/cases/${caseId}/checklist`),

  // ===== DEFAULT DOCS =====
  uploadDocument: async (caseId: number, type: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request(`/cases/${caseId}/documents/${type}/upload`, {
      method: "POST",
      body: form,
    });
  },

  downloadDocument: async (caseId: number, type: string) => {
    return downloadBlobWithAuth(`/cases/${caseId}/documents/${type}/download`);
  },

  // ===== CUSTOM DOCS =====
  addCustomDocument: (
    caseId: number,
    data: { title: string; required?: boolean },
  ) =>
    request(`/cases/${caseId}/custom-documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  deleteCustomDocument: (caseId: number, docId: number) =>
    request(`/cases/${caseId}/custom-documents/${docId}`, {
      method: "DELETE",
    }),

  uploadCustomDocument: async (caseId: number, docId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request(`/cases/${caseId}/custom-documents/${docId}/upload`, {
      method: "POST",
      body: form,
    });
  },

  downloadCustomDocument: async (caseId: number, docId: number) => {
    return downloadBlobWithAuth(
      `/cases/${caseId}/custom-documents/${docId}/download`,
    );
  },

  // ===== VISA PROFILE (NEW) =====
  getVisaProfile: (caseId: number) => request(`/cases/${caseId}/visa-profile`),

  saveVisaProfile: (caseId: number, data: any) =>
    request(`/cases/${caseId}/visa-profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};
