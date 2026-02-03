import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

const defaultForm = {
  phone: "",
  email: "",
  homeAddress: "",
  heightCm: "",
  eyeColor: "",
  religion: "",
  maritalStatus: "DOC_THAN",
  marriageDate: "",
  divorceDate: "",
  currentCompany: "",
  companyAddress: "",
  graduatedSchool: "",
  major: "",
  bigAssets: "",
  familyMembers: [],
  familyJobsIncome: [],
  travelHistory: [],
  educationHistory: [],
  workHistory: [],
};

export default function CaseVisaProfilePage() {
  const { id } = useParams();
  const caseId = Number(id);

  const [form, setForm] = useState<any>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(caseId) || caseId <= 0) {
      setErr("CaseId không hợp lệ.");
      setLoading(false);
      return;
    }

    setErr(null);
    setLoading(true);

    api
      .getVisaProfile(caseId)
      .then((data) => {
        setForm(data ?? defaultForm);
      })
      .catch((e: any) => setErr(e?.message || "Không tải được Visa Profile"))
      .finally(() => setLoading(false));
  }, [caseId]);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  }

  async function onSave() {
    if (!Number.isFinite(caseId) || caseId <= 0) return;
    setSaving(true);
    setErr(null);
    try {
      await api.saveVisaProfile(caseId, form);
      alert("Đã lưu Visa Profile");
    } catch (e: any) {
      setErr(e?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div style={{ padding: "24px 32px", background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <Link
            to={`/cases/${caseId}`}
            style={{ textDecoration: "none", fontWeight: 900, color: "#374151" }}
          >
            ← Quay lại hồ sơ #{caseId}
          </Link>

          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 1000 }}>
            Visa Profile (TIẾNG VIỆT)
          </h1>

          {err && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: "12px 14px",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 900,
                maxWidth: 900,
              }}
            >
              {err}
            </div>
          )}
        </div>

        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #111827",
            background: "#111827",
            color: "#fff",
            fontWeight: 1000,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            height: 44,
          }}
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>

      {/* SECTION: Thông tin cá nhân */}
      <div
        style={{
          marginTop: 18,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          maxWidth: 900,
        }}
      >
        <h2 style={{ marginTop: 0 }}>1) Thông tin cá nhân</h2>

        <Field label="Số điện thoại">
          <input name="phone" value={form.phone || ""} onChange={onChange} />
        </Field>

        <Field label="Email">
          <input name="email" value={form.email || ""} onChange={onChange} />
        </Field>

        <Field label="Địa chỉ nhà">
          <textarea name="homeAddress" value={form.homeAddress || ""} onChange={onChange} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="Chiều cao (cm)">
            <input name="heightCm" value={form.heightCm || ""} onChange={onChange} />
          </Field>
          <Field label="Màu mắt">
            <input name="eyeColor" value={form.eyeColor || ""} onChange={onChange} />
          </Field>
          <Field label="Tôn giáo">
            <input name="religion" value={form.religion || ""} onChange={onChange} />
          </Field>
        </div>

        <Field label="Tình trạng hôn nhân">
          <select
            name="maritalStatus"
            value={form.maritalStatus || "DOC_THAN"}
            onChange={(e) => setForm((p: any) => ({ ...p, maritalStatus: e.target.value }))}
          >
            <option value="DOC_THAN">Độc thân</option>
            <option value="KET_HON">Đã kết hôn</option>
            <option value="LY_HON">Ly hôn</option>
          </select>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Ngày kết hôn (nếu có)">
            <input type="date" name="marriageDate" value={form.marriageDate || ""} onChange={onChange} />
          </Field>
          <Field label="Ngày ly hôn (nếu có)">
            <input type="date" name="divorceDate" value={form.divorceDate || ""} onChange={onChange} />
          </Field>
        </div>
      </div>

      {/* SECTION: Công việc hiện tại */}
      <div
        style={{
          marginTop: 18,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          maxWidth: 900,
        }}
      >
        <h2 style={{ marginTop: 0 }}>2) Công việc hiện tại</h2>

        <Field label="Công ty đang làm việc">
          <input name="currentCompany" value={form.currentCompany || ""} onChange={onChange} />
        </Field>

        <Field label="Địa chỉ công ty">
          <input name="companyAddress" value={form.companyAddress || ""} onChange={onChange} />
        </Field>
      </div>

      {/* SECTION: Tốt nghiệp */}
      <div
        style={{
          marginTop: 18,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          maxWidth: 900,
        }}
      >
        <h2 style={{ marginTop: 0 }}>3) Tốt nghiệp</h2>

        <Field label="Trường / hệ tốt nghiệp (ĐH / CĐ / Trung cấp / Trường nghề)">
          <input name="graduatedSchool" value={form.graduatedSchool || ""} onChange={onChange} />
        </Field>

        <Field label="Chuyên ngành (nếu có)">
          <input name="major" value={form.major || ""} onChange={onChange} />
        </Field>
      </div>

      {/* SECTION: Tài sản */}
      <div
        style={{
          marginTop: 18,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          maxWidth: 900,
        }}
      >
        <h2 style={{ marginTop: 0 }}>4) Tài sản</h2>

        <Field label="Tài sản lớn (sổ đỏ, nhà, xe...)">
          <textarea name="bigAssets" value={form.bigAssets || ""} onChange={onChange} />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
      <div style={{ fontWeight: 900, color: "#374151" }}>{label}</div>
      <div
        style={{
          display: "grid",
        }}
      >
        {children}
      </div>
      <style>{`
        input, textarea, select {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          font-size: 15px;
          font-weight: 800;
          width: 100%;
          box-sizing: border-box;
          background: #fff;
        }
        textarea { min-height: 90px; resize: vertical; }
      `}</style>
    </div>
  );
}
