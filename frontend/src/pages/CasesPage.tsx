import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getUserFromToken, clearToken } from "../lib/auth";

const VISA_OPTIONS = [
  "Visa học nghề",
  "Visa 8 tháng",
  "Visa 18a",
  "Visa 18b",
  "Visa 19c.2",
  "Visa khác",
];

const VISA_STATUS_OPTIONS = [
  "Hoàn tất",
  "Vẫn thiếu hồ sơ",
  "Đã lăn tay",
  "Đã có visum",
  "Chưa đủ 8 tháng",
];

type CaseItem = {
  id: number;
  fullName: string;
  dob?: string | null;
  jobTitle?: string | null; // Loại visa
  phone?: string | null;
  city?: string | null;
  visaStatus?: string | null;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "#f3f4f6",
        color: "#111827",
        fontSize: 14,
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}

function formatDobVN(dob?: string | null) {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return dob;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// Input create: user nhập dd.MM.yyyy hoặc yyyy-mm-dd
// convert về YYYY-MM-DD gửi backend (để new Date(...) parse ổn)
function normalizeDobInputToISO(dateStr: string): string | undefined {
  const s = dateStr.trim();
  if (!s) return undefined;

  // dd.MM.yyyy
  const m1 = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m1) {
    const dd = m1[1].padStart(2, "0");
    const mm = m1[2].padStart(2, "0");
    const yyyy = m1[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // yyyy-mm-dd
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return s;

  // fallback: thử parse
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CasesPage() {
  const nav = useNavigate();
  const me = getUserFromToken();

  const canCreate = me?.role === "ADMIN" || me?.role === "STAFF";
  const canManage = me?.role === "ADMIN" || me?.role === "STAFF";

  const [items, setItems] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // search
  const [qName, setQName] = useState("");
  const [qCity, setQCity] = useState("");

  // Create form toggle
  const [openCreate, setOpenCreate] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState(""); // user nhập dd.MM.yyyy
  const [jobTitle, setJobTitle] = useState(""); // loại visa
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [visaStatus, setVisaStatus] = useState(VISA_STATUS_OPTIONS[1]); // default: "Vẫn thiếu hồ sơ"

  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  function onLogout() {
    clearToken();
    nav("/login");
  }

  async function loadCases() {
    setLoading(true);
    setErr(null);
    try {
      const data = await api.getCases();
      const list = Array.isArray(data) ? data : data?.items;
      setItems(list ?? []);
    } catch (e: any) {
      setErr(e?.message || "Không tải được danh sách hồ sơ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  const filteredItems = useMemo(() => {
    const nameNeedle = qName.trim().toLowerCase();
    const cityNeedle = qCity.trim().toLowerCase();

    return items.filter((c) => {
      const okName = !nameNeedle || (c.fullName || "").toLowerCase().includes(nameNeedle);
      const okCity = !cityNeedle || (c.city || "").toLowerCase().includes(cityNeedle);
      return okName && okCity;
    });
  }, [items, qName, qCity]);

  async function submitCreate() {
    if (!fullName.trim()) {
      setCreateErr("Vui lòng nhập họ tên");
      return;
    }

    const dobISO = normalizeDobInputToISO(dob);
    if (dob.trim() && !dobISO) {
      setCreateErr("Ngày sinh không đúng định dạng. Dùng dd.MM.yyyy hoặc YYYY-MM-DD");
      return;
    }

    setCreating(true);
    setCreateErr(null);
    try {
      const created = await api.createCase({
        fullName: fullName.trim(),
        dob: dobISO,
        jobTitle: jobTitle.trim() || undefined, // loại visa
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        visaStatus: visaStatus || undefined,
      });

      setFullName("");
      setDob("");
      setJobTitle("");
      setPhone("");
      setCity("");
      setVisaStatus(VISA_STATUS_OPTIONS[1]);
      setOpenCreate(false);

      await loadCases();

      if (created?.id) nav(`/cases/${created.id}`);
    } catch (e: any) {
      setCreateErr(e?.message || "Tạo hồ sơ thất bại");
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(caseId: number, fullName: string) {
    const ok = window.confirm(`Xoá hồ sơ "${fullName}"?\nHành động này không thể hoàn tác.`);
    if (!ok) return;

    try {
      await api.deleteCase(caseId);
      await loadCases();
    } catch (e: any) {
      alert(e?.message || "Xoá thất bại");
    }
  }

  async function onChangeStatus(caseId: number, newStatus: string) {
    try {
      // optimistic update
      setItems((prev) => prev.map((x) => (x.id === caseId ? { ...x, visaStatus: newStatus } : x)));
      await api.updateCase(caseId, { visaStatus: newStatus });
    } catch (e: any) {
      alert(e?.message || "Cập nhật trạng thái thất bại");
      await loadCases();
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        margin: 0,
        padding: "24px 32px",
        fontFamily: "system-ui",
        background: "#f9fafb",
        color: "#111827",
        boxSizing: "border-box",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Hồ sơ</h1>
          <Badge>Tổng: {filteredItems.length}/{items.length}</Badge>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#374151", fontSize: 14, fontWeight: 700 }}>
            {me?.email ?? ""} {me?.role ? `(${me.role})` : ""}
          </span>

          <button
            onClick={loadCases}
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
            }}
          >
            {loading ? "Đang tải..." : "Làm mới"}
          </button>

          <button
            onClick={onLogout}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontWeight: 900,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Company title (center) */}
      <div
        style={{
          textAlign: "center",
          margin: "12px 0 20px",
          padding: "10px 12px",
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 1000, letterSpacing: 0.6 }}>
          CÔNG TY TNHH TƯ VẤN VÀ DỊCH VỤ VISA ĐỨC PHÚC
        </div>
      </div>

      {/* Search bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <input
          placeholder="Tìm theo họ tên..."
          value={qName}
          onChange={(e) => setQName(e.target.value)}
          style={{
            flex: "1 1 280px",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: 16,
            fontWeight: 700,
          }}
        />
        <input
          placeholder="Tìm theo nhà hàng..."
          value={qCity}
          onChange={(e) => setQCity(e.target.value)}
          style={{
            flex: "1 1 220px",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: 16,
            fontWeight: 700,
          }}
        />
        <button
          onClick={() => {
            setQName("");
            setQCity("");
          }}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontWeight: 900,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Xoá lọc
        </button>
      </div>

      {/* Create Case (toggle) */}
      {canCreate && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            marginBottom: 14,
          }}
        >
          {!openCreate ? (
            <button
              onClick={() => {
                setOpenCreate(true);
                setCreateErr(null);
                setTimeout(() => {
                  (document.getElementById("create-fullname") as HTMLInputElement | null)?.focus();
                }, 0);
              }}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #111827",
                background: "#111827",
                color: "#fff",
                fontWeight: 1000,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              + Tạo hồ sơ
            </button>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 1000, fontSize: 16 }}>Tạo hồ sơ mới</div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 1.2fr auto auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <input
                  id="create-fullname"
                  placeholder="Họ tên *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCreate();
                    if (e.key === "Escape") setOpenCreate(false);
                  }}
                />

                <input
                  placeholder="Ngày sinh (dd.MM.yyyy)"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                />

                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  <option value="">— Chọn loại visa —</option>
                  {VISA_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                />

                <input
                  placeholder="Nhà hàng"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                />

                <select
                  value={visaStatus}
                  onChange={(e) => setVisaStatus(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {VISA_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={submitCreate}
                  disabled={creating}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid #2563eb",
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 1000,
                    cursor: creating ? "not-allowed" : "pointer",
                    fontSize: 15,
                  }}
                >
                  {creating ? "Đang tạo..." : "Tạo"}
                </button>

                <button
                  onClick={() => {
                    setOpenCreate(false);
                    setCreateErr(null);
                  }}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    fontWeight: 1000,
                    cursor: "pointer",
                    fontSize: 15,
                  }}
                >
                  Huỷ
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
                    fontWeight: 800,
                  }}
                >
                  {createErr}
                </div>
              )}

              <div style={{ color: "#6b7280", fontSize: 13, fontWeight: 700 }}>
                Gợi ý: Nhấn <b>Enter</b> để tạo • Nhấn <b>Esc</b> để huỷ
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {err && (
        <div
          style={{
            marginBottom: 14,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "10px 12px",
            borderRadius: 12,
            fontWeight: 800,
          }}
        >
          {err}
        </div>
      )}

      {/* List */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #e5e7eb",
            background: "#fafafa",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <b style={{ fontSize: 16 }}>Danh sách hồ sơ</b>
          {!canCreate && (
            <span style={{ color: "#6b7280", fontWeight: 700 }}>
              Bạn đang là <b>{me?.role}</b>. Chức năng tạo hồ sơ bị tắt.
            </span>
          )}
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed", // ✅ không scroll ngang
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", color: "#6b7280", fontSize: 12 }}>
              <th style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb", width: "20%" }}>Họ tên</th>
              <th style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb", width: "10%" }}>Ngày sinh</th>
              <th style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb", width: "14%" }}>Số điện thoại</th>
              <th style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb", width: "14%" }}>Thành phố</th>
              <th style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb", width: "16%" }}>Loại Visa</th>
              <th style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb", width: "14%" }}>Trạng thái</th>
              <th style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb", width: "12%" }}>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: "14px 14px", color: "#6b7280", fontWeight: 700 }}>
                  Đang tải...
                </td>
              </tr>
            )}

            {!loading && filteredItems.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "14px 14px", color: "#6b7280", fontWeight: 700 }}>
                  Không tìm thấy hồ sơ.
                </td>
              </tr>
            )}

            {filteredItems.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td
                  style={{
                    padding: "14px 14px",
                    fontWeight: 1000,
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                  }}
                >
                  <Link
                    to={`/cases/${c.id}`}
                    style={{ color: "#111827", textDecoration: "none" }}
                  >
                    {c.fullName}
                  </Link>
                </td>

                <td style={{ padding: "14px 14px", fontWeight: 800, color: "#374151" }}>
                  {formatDobVN(c.dob)}
                </td>

                <td style={{ padding: "14px 14px", fontWeight: 800, color: "#374151", wordBreak: "break-word" }}>
                  {c.phone ?? "—"}
                </td>

                <td style={{ padding: "14px 14px", fontWeight: 800, color: "#374151", wordBreak: "break-word" }}>
                  {c.city ?? "—"}
                </td>

                <td style={{ padding: "14px 14px", fontWeight: 800, color: "#374151", wordBreak: "break-word" }}>
                  {c.jobTitle ?? "—"}
                </td>

                <td style={{ padding: "14px 14px" }}>
                  {canManage ? (
                    <select
                      value={c.visaStatus ?? VISA_STATUS_OPTIONS[1]}
                      onChange={(e) => onChangeStatus(c.id, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        fontWeight: 900,
                      }}
                    >
                      {VISA_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontWeight: 900, color: "#374151" }}>
                      {c.visaStatus ?? "—"}
                    </div>
                  )}
                </td>

                <td style={{ padding: "14px 14px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Link
                      to={`/cases/${c.id}`}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        textDecoration: "none",
                        fontWeight: 1000,
                        color: "#111827",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      Mở
                    </Link>

                    {canManage && (
                      <button
                        onClick={() => onDelete(c.id, c.fullName)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#b91c1c",
                          fontWeight: 1000,
                          cursor: "pointer",
                        }}
                      >
                        Xoá
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
