import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getUserFromToken } from "../lib/auth";

type CaseItem = {
  id: number;
  fullName: string;
  dob?: string | null;
  jobTitle?: string | null;
  createdAt?: string | null;
};

function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "blue" | "green" | "red";
}) {
  const map: Record<string, React.CSSProperties> = {
    gray: { background: "#f3f4f6", color: "#374151", borderColor: "#e5e7eb" },
    blue: { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" },
    green: { background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" },
    red: { background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        border: "1px solid",
        fontSize: 12,
        fontWeight: 700,
        ...map[tone],
      }}
    >
      {children}
    </span>
  );
}

export default function CaseListPage() {
  const nav = useNavigate();
  const me = getUserFromToken();
  const canCreate = me?.role === "ADMIN" || me?.role === "STAFF";

  const [items, setItems] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // create form toggle
  const [openCreate, setOpenCreate] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  const total = items.length;

  const headerRight = useMemo(() => {
    const email = (me as any)?.email ?? "";
    const role = (me as any)?.role ?? "";
    if (!email && !role) return null;
    return (
      <span style={{ color: "#6b7280", fontSize: 14 }}>
        {email} {role ? `(${role})` : ""}
      </span>
    );
  }, [me]);

  async function loadCases() {
    setLoading(true);
    setErr(null);
    try {
      const data = await api.getCases();
      // backend có thể trả array hoặc {items:[]}
      const list = Array.isArray(data) ? data : data?.items;
      setItems(list ?? []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  async function submitCreate() {
    if (!fullName.trim()) {
      setCreateErr("Full name is required");
      return;
    }

    setCreating(true);
    setCreateErr(null);
    try {
      const created = await api.createCase({
        fullName: fullName.trim(),
        dob: dob.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
      });

      // reset + close
      setFullName("");
      setDob("");
      setJobTitle("");
      setOpenCreate(false);

      // reload list
      await loadCases();

      // jump to detail if id exists
      if (created?.id) nav(`/cases/${created.id}`);
    } catch (e: any) {
      setCreateErr(e?.message || "Create case failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "28px auto",
        padding: "0 16px",
        fontFamily: "system-ui",
        color: "#111827",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Cases</h2>
          <Badge tone="gray">Total: {total}</Badge>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {headerRight}
          <button
            onClick={loadCases}
            disabled={loading}
            style={{
              padding: "9px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Create Case section (toggle) */}
      {canCreate && (
        <div
          style={{
            marginTop: 14,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 14,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          {!openCreate ? (
            <button
              onClick={() => {
                setOpenCreate(true);
                setCreateErr(null);
                // auto focus feel: form open, user type immediately
                setTimeout(() => {
                  const el = document.getElementById("create-fullname") as HTMLInputElement | null;
                  el?.focus();
                }, 0);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #111827",
                background: "#111827",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              + Create Case
            </button>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 900 }}>Create Case</div>
                <Badge tone="blue">Admin/Staff</Badge>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1.5fr auto auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <input
                  id="create-fullname"
                  placeholder="Full name *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCreate();
                    if (e.key === "Escape") setOpenCreate(false);
                  }}
                />

                <input
                  placeholder="DOB (YYYY-MM-DD)"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCreate();
                    if (e.key === "Escape") setOpenCreate(false);
                  }}
                />

                <input
                  placeholder="Job title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCreate();
                    if (e.key === "Escape") setOpenCreate(false);
                  }}
                />

                <button
                  onClick={submitCreate}
                  disabled={creating}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #2563eb",
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: creating ? "not-allowed" : "pointer",
                  }}
                >
                  {creating ? "Creating..." : "Create"}
                </button>

                <button
                  onClick={() => {
                    setOpenCreate(false);
                    setCreateErr(null);
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    fontWeight: 800,
                  }}
                >
                  Cancel
                </button>
              </div>

              {createErr && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    padding: "10px 12px",
                    borderRadius: 12,
                    fontSize: 14,
                  }}
                >
                  {createErr}
                </div>
              )}

              <div style={{ color: "#6b7280", fontSize: 13 }}>
                Tip: Press <b>Enter</b> to create • <b>Esc</b> to cancel
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {err && (
        <div
          style={{
            marginTop: 14,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "10px 12px",
            borderRadius: 12,
          }}
        >
          {err}
        </div>
      )}

      {/* List card */}
      <div
        style={{
          marginTop: 14,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
          <b>Case list</b>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#6b7280", fontSize: 12 }}>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>Name</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>DOB</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>Job title</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} style={{ padding: "14px 16px", color: "#6b7280" }}>
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "14px 16px", color: "#6b7280" }}>
                    No cases yet.
                  </td>
                </tr>
              )}

              {items.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 900 }}>
                    <Link to={`/cases/${c.id}`} style={{ color: "#111827", textDecoration: "none" }}>
                      {c.fullName}
                    </Link>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#374151" }}>{c.dob ?? "-"}</td>
                  <td style={{ padding: "14px 16px", color: "#374151" }}>{c.jobTitle ?? "-"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <Link
                      to={`/cases/${c.id}`}
                      style={{
                        display: "inline-block",
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        textDecoration: "none",
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!canCreate && (
          <div style={{ padding: "12px 16px", color: "#6b7280", borderTop: "1px solid #e5e7eb" }}>
            You are <b>{me?.role}</b>. Create Case is disabled.
          </div>
        )}
      </div>
    </div>
  );
}
