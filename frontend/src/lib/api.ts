import { getToken } from "./auth";

const BASE = import.meta.env.VITE_API_BASE;

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // handle errors nicely
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
    jobTitle?: string; // loại visa
    phone?: string;
    city?: string;
    visaStatus?: string;
    restaurantName?: string;  // trạng thái visa (VN text hoặc enum key)
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
      jobTitle: string; // loại visa
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

  // download as blob (default docs)
  downloadDocument: async (caseId: number, type: string) => {
    const token = getToken();
    const res = await fetch(`${BASE}/cases/${caseId}/documents/${type}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    return res.blob();
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

  // download as blob (custom docs)
  downloadCustomDocument: async (caseId: number, docId: number) => {
    const token = getToken();
    const res = await fetch(
      `${BASE}/cases/${caseId}/custom-documents/${docId}/download`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    return res.blob();
  },
};
