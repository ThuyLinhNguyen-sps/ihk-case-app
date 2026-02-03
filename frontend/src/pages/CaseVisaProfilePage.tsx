import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

/** =========================
 * Types
 * ========================= */
type MaritalStatus = "DOC_THAN" | "KET_HON" | "LY_HON";

type FamilyMember = {
  fullName: string;
  dob: string; // YYYY-MM-DD
  hometown: string;
  relation: "BO" | "ME" | "VO_CHONG" | "CON" | "ANH_CHI_EM" | "KHAC";
};

type FamilyJobIncome = {
  relation: "BO" | "ME" | "VO_CHONG" | "CON" | "ANH_CHI_EM" | "KHAC";
  job: string;
  income: string; // để text cho dễ nhập (VD: 15tr/tháng)
  details: string;
};

type TravelItem = {
  country: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  purpose: "DU_LICH" | "XKLĐ" | "HOC_TAP" | "CONG_TAC" | "KHAC";
  illegalStay: boolean; // có bị bất hợp pháp không
  notes: string;
};

type EducationItem = {
  level: "TIEU_HOC" | "TRUNG_HOC" | "THPT" | "TRUNG_CAP" | "CAO_DANG" | "DAI_HOC" | "KHAC";
  fromYear: string; // YYYY hoặc YYYY-MM
  toYear: string;
  schoolName: string;
  address: string;
  major: string;
  notes: string;
};

type WorkItem = {
  fromYear: string; // YYYY-MM hoặc YYYY
  toYear: string;
  company: string;
  address: string;
  position: string;
  notes: string;
};

type VisaProfileForm = {
  phone: string;
  email: string;
  homeAddress: string;

  heightCm: string; // input text
  eyeColor: string;
  religion: string;
  maritalStatus: MaritalStatus;
  marriageDate: string; // YYYY-MM-DD
  divorceDate: string; // YYYY-MM-DD

  currentCompany: string;
  companyAddress: string;

  graduatedSchool: string;
  major: string;

  bigAssets: string;

  familyMembers: FamilyMember[];
  familyJobsIncome: FamilyJobIncome[];
  travelHistory: TravelItem[];
  educationHistory: EducationItem[];
  workHistory: WorkItem[];
};

/** =========================
 * Default Form
 * ========================= */
const defaultForm: VisaProfileForm = {
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

/** =========================
 * Helpers
 * ========================= */
function toDateInputValue(v: any) {
  if (!v) return "";
  // nếu đã là YYYY-MM-DD thì giữ
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeFromApi(data: any): VisaProfileForm {
  if (!data) return { ...defaultForm };

  return {
    ...defaultForm,
    ...data,
    heightCm: data?.heightCm != null ? String(data.heightCm) : "",
    marriageDate: toDateInputValue(data?.marriageDate),
    divorceDate: toDateInputValue(data?.divorceDate),
    familyMembers: Array.isArray(data?.familyMembers) ? data.familyMembers : [],
    familyJobsIncome: Array.isArray(data?.familyJobsIncome) ? data.familyJobsIncome : [],
    travelHistory: Array.isArray(data?.travelHistory) ? data.travelHistory : [],
    educationHistory: Array.isArray(data?.educationHistory) ? data.educationHistory : [],
    workHistory: Array.isArray(data?.workHistory) ? data.workHistory : [],
  };
}

function cleanPayloadForSave(form: VisaProfileForm) {
  return {
    ...form,
    heightCm: form.heightCm ? Number(form.heightCm) : null,
    marriageDate: form.marriageDate || null,
    divorceDate: form.divorceDate || null,
  };
}

function labelRelation(v: FamilyMember["relation"] | FamilyJobIncome["relation"]) {
  const map: Record<string, string> = {
    BO: "Bố",
    ME: "Mẹ",
    VO_CHONG: "Vợ/Chồng",
    CON: "Con",
    ANH_CHI_EM: "Anh/Chị/Em",
    KHAC: "Khác",
  };
  return map[v] ?? v;
}

/** =========================
 * Page
 * ========================= */
export default function CaseVisaProfilePage() {
  const { id } = useParams();
  const caseId = Number(id);

  const [form, setForm] = useState<VisaProfileForm>({ ...defaultForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const completeness = useMemo(() => {
    // chỉ ước lượng nhanh: bao nhiêu field basic có dữ liệu
    const basicFields = [
      form.phone,
      form.email,
      form.homeAddress,
      form.currentCompany,
      form.companyAddress,
      form.graduatedSchool,
      form.bigAssets,
    ];
    const filled = basicFields.filter((x) => String(x || "").trim().length > 0).length;
    return { filled, total: basicFields.length };
  }, [form]);

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
      .then((data: any) => setForm(normalizeFromApi(data)))
      .catch((e: any) => setErr(e?.message || "Không tải được Visa Profile"))
      .finally(() => setLoading(false));
  }, [caseId]);

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value } as VisaProfileForm));
  }

  async function onSave() {
    if (!Number.isFinite(caseId) || caseId <= 0) return;
    setSaving(true);
    setErr(null);

    try {
      const payload = cleanPayloadForSave(form);
      await api.saveVisaProfile(caseId, payload);

      // refetch để chắc chắn refresh thấy dữ liệu
      const fresh = await api.getVisaProfile(caseId);
      setForm(normalizeFromApi(fresh));

      alert("Đã lưu Visa Profile");
    } catch (e: any) {
      setErr(e?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  // ====== ARRAY HELPERS ======
  function updateArray<K extends keyof VisaProfileForm>(
    key: K,
    idx: number,
    patch: Partial<VisaProfileForm[K] extends (infer U)[] ? U : never>,
  ) {
    setForm((prev) => {
      const arr = (prev[key] as any[]) ?? [];
      const next = arr.map((item, i) => (i === idx ? { ...item, ...patch } : item));
      return { ...prev, [key]: next };
    });
  }

  function addItem<K extends keyof VisaProfileForm>(key: K, item: any) {
    setForm((prev) => {
      const arr = (prev[key] as any[]) ?? [];
      return { ...prev, [key]: [...arr, item] };
    });
  }

  function removeItem<K extends keyof VisaProfileForm>(key: K, idx: number) {
    setForm((prev) => {
      const arr = (prev[key] as any[]) ?? [];
      return { ...prev, [key]: arr.filter((_, i) => i !== idx) };
    });
  }

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div style={pageWrap}>
      <Header
        caseId={caseId}
        saving={saving}
        onSave={onSave}
        err={err}
        filled={completeness.filled}
        total={completeness.total}
      />

      {/* 1) Thông tin cá nhân */}
      <Card title="1) Thông tin cá nhân">
        <Field label="Số điện thoại">
          <input name="phone" value={form.phone || ""} onChange={onChange} />
        </Field>

        <Field label="Email">
          <input name="email" value={form.email || ""} onChange={onChange} />
        </Field>

        <Field label="Địa chỉ nhà">
          <textarea name="homeAddress" value={form.homeAddress || ""} onChange={onChange} />
        </Field>

        <Grid cols={3}>
          <Field label="Chiều cao (cm)">
            <input name="heightCm" value={form.heightCm || ""} onChange={onChange} />
          </Field>
          <Field label="Màu mắt">
            <input name="eyeColor" value={form.eyeColor || ""} onChange={onChange} />
          </Field>
          <Field label="Tôn giáo">
            <input name="religion" value={form.religion || ""} onChange={onChange} />
          </Field>
        </Grid>

        <Field label="Tình trạng hôn nhân">
          <select name="maritalStatus" value={form.maritalStatus} onChange={onChange}>
            <option value="DOC_THAN">Độc thân</option>
            <option value="KET_HON">Đã kết hôn</option>
            <option value="LY_HON">Ly hôn</option>
          </select>
        </Field>

        <Grid cols={2}>
          <Field label="Ngày kết hôn (nếu có)">
            <input type="date" name="marriageDate" value={form.marriageDate || ""} onChange={onChange} />
          </Field>
          <Field label="Ngày ly hôn (nếu có)">
            <input type="date" name="divorceDate" value={form.divorceDate || ""} onChange={onChange} />
          </Field>
        </Grid>
      </Card>

      {/* 2) Công việc hiện tại */}
      <Card title="2) Công việc hiện tại">
        <Field label="Công ty đang làm việc">
          <input name="currentCompany" value={form.currentCompany || ""} onChange={onChange} />
        </Field>

        <Field label="Địa chỉ công ty">
          <input name="companyAddress" value={form.companyAddress || ""} onChange={onChange} />
        </Field>
      </Card>

      {/* 3) Tốt nghiệp */}
      <Card title="3) Tốt nghiệp">
        <Field label="Trường / hệ tốt nghiệp (ĐH / CĐ / Trung cấp / Trường nghề)">
          <input name="graduatedSchool" value={form.graduatedSchool || ""} onChange={onChange} />
        </Field>

        <Field label="Chuyên ngành (nếu có)">
          <input name="major" value={form.major || ""} onChange={onChange} />
        </Field>
      </Card>

      {/* 4) Tài sản */}
      <Card title="4) Tài sản">
        <Field label="Tài sản lớn (sổ đỏ, nhà, xe...)">
          <textarea name="bigAssets" value={form.bigAssets || ""} onChange={onChange} />
        </Field>
      </Card>

      {/* 5) Thành viên gia đình */}
      <Card
        title="5) Họ tên, ngày sinh, quê quán của bố/mẹ/vợ chồng/con"
        right={
          <button
            style={btnAdd}
            onClick={() =>
              addItem("familyMembers", {
                fullName: "",
                dob: "",
                hometown: "",
                relation: "BO",
              } satisfies FamilyMember)
            }
          >
            + Thêm
          </button>
        }
      >
        {form.familyMembers.length === 0 ? (
          <Empty>Chưa có dữ liệu. Bấm “+ Thêm” để nhập.</Empty>
        ) : (
          form.familyMembers.map((m, idx) => (
            <Row key={idx}>
              <Grid cols={2}>
                <Field label="Quan hệ">
                  <select
                    value={m.relation}
                    onChange={(e) => updateArray("familyMembers", idx, { relation: e.target.value as any })}
                  >
                    <option value="BO">Bố</option>
                    <option value="ME">Mẹ</option>
                    <option value="VO_CHONG">Vợ/Chồng</option>
                    <option value="CON">Con</option>
                    <option value="ANH_CHI_EM">Anh/Chị/Em</option>
                    <option value="KHAC">Khác</option>
                  </select>
                </Field>

                <Field label="Họ tên">
                  <input
                    value={m.fullName}
                    onChange={(e) => updateArray("familyMembers", idx, { fullName: e.target.value })}
                  />
                </Field>
              </Grid>

              <Grid cols={2}>
                <Field label="Ngày sinh">
                  <input
                    type="date"
                    value={m.dob || ""}
                    onChange={(e) => updateArray("familyMembers", idx, { dob: e.target.value })}
                  />
                </Field>
                <Field label="Quê quán">
                  <input
                    value={m.hometown}
                    onChange={(e) => updateArray("familyMembers", idx, { hometown: e.target.value })}
                  />
                </Field>
              </Grid>

              <div style={rowActions}>
                <button style={btnRemove} onClick={() => removeItem("familyMembers", idx)}>
                  Xoá dòng
                </button>
              </div>
            </Row>
          ))
        )}
      </Card>

      {/* 6) Công việc + thu nhập gia đình */}
      <Card
        title="6) Công việc + thu nhập của bố/mẹ/vợ chồng (chi tiết)"
        right={
          <button
            style={btnAdd}
            onClick={() =>
              addItem("familyJobsIncome", {
                relation: "BO",
                job: "",
                income: "",
                details: "",
              } satisfies FamilyJobIncome)
            }
          >
            + Thêm
          </button>
        }
      >
        {form.familyJobsIncome.length === 0 ? (
          <Empty>Chưa có dữ liệu. Bấm “+ Thêm” để nhập.</Empty>
        ) : (
          form.familyJobsIncome.map((x, idx) => (
            <Row key={idx}>
              <Grid cols={3}>
                <Field label="Đối tượng">
                  <select
                    value={x.relation}
                    onChange={(e) =>
                      updateArray("familyJobsIncome", idx, { relation: e.target.value as any })
                    }
                  >
                    <option value="BO">Bố</option>
                    <option value="ME">Mẹ</option>
                    <option value="VO_CHONG">Vợ/Chồng</option>
                    <option value="CON">Con</option>
                    <option value="ANH_CHI_EM">Anh/Chị/Em</option>
                    <option value="KHAC">Khác</option>
                  </select>
                </Field>

                <Field label="Công việc">
                  <input value={x.job} onChange={(e) => updateArray("familyJobsIncome", idx, { job: e.target.value })} />
                </Field>

                <Field label="Thu nhập (ví dụ: 15tr/tháng)">
                  <input
                    value={x.income}
                    onChange={(e) => updateArray("familyJobsIncome", idx, { income: e.target.value })}
                  />
                </Field>
              </Grid>

              <Field label="Mô tả chi tiết">
                <textarea
                  value={x.details}
                  onChange={(e) => updateArray("familyJobsIncome", idx, { details: e.target.value })}
                />
              </Field>

              <div style={rowActions}>
                <button style={btnRemove} onClick={() => removeItem("familyJobsIncome", idx)}>
                  Xoá dòng
                </button>
              </div>
            </Row>
          ))
        )}
      </Card>

      {/* 7) Lịch sử đi nước ngoài */}
      <Card
        title="7) Đã từng đi những nước nào? Thời gian đi/về, diện, bất hợp pháp?"
        right={
          <button
            style={btnAdd}
            onClick={() =>
              addItem("travelHistory", {
                country: "",
                fromDate: "",
                toDate: "",
                purpose: "DU_LICH",
                illegalStay: false,
                notes: "",
              } satisfies TravelItem)
            }
          >
            + Thêm
          </button>
        }
      >
        {form.travelHistory.length === 0 ? (
          <Empty>Chưa có dữ liệu. Bấm “+ Thêm” để nhập.</Empty>
        ) : (
          form.travelHistory.map((t, idx) => (
            <Row key={idx}>
              <Grid cols={2}>
                <Field label="Quốc gia">
                  <input
                    value={t.country}
                    onChange={(e) => updateArray("travelHistory", idx, { country: e.target.value })}
                  />
                </Field>

                <Field label="Diện đi">
                  <select
                    value={t.purpose}
                    onChange={(e) => updateArray("travelHistory", idx, { purpose: e.target.value as any })}
                  >
                    <option value="DU_LICH">Du lịch</option>
                    <option value="XKLĐ">XKLĐ</option>
                    <option value="HOC_TAP">Học tập</option>
                    <option value="CONG_TAC">Công tác</option>
                    <option value="KHAC">Khác</option>
                  </select>
                </Field>
              </Grid>

              <Grid cols={2}>
                <Field label="Từ ngày">
                  <input
                    type="date"
                    value={t.fromDate || ""}
                    onChange={(e) => updateArray("travelHistory", idx, { fromDate: e.target.value })}
                  />
                </Field>
                <Field label="Đến ngày">
                  <input
                    type="date"
                    value={t.toDate || ""}
                    onChange={(e) => updateArray("travelHistory", idx, { toDate: e.target.value })}
                  />
                </Field>
              </Grid>

              <label style={checkLine}>
                <input
                  type="checkbox"
                  checked={!!t.illegalStay}
                  onChange={(e) => updateArray("travelHistory", idx, { illegalStay: e.target.checked })}
                />
                Có bị bất hợp pháp / quá hạn không?
              </label>

              <Field label="Ghi chú">
                <textarea
                  value={t.notes || ""}
                  onChange={(e) => updateArray("travelHistory", idx, { notes: e.target.value })}
                />
              </Field>

              <div style={rowActions}>
                <button style={btnRemove} onClick={() => removeItem("travelHistory", idx)}>
                  Xoá dòng
                </button>
              </div>
            </Row>
          ))
        )}
      </Card>

      {/* 8) Học vấn */}
      <Card
        title="8) Học vấn (nhiều dòng)"
        right={
          <button
            style={btnAdd}
            onClick={() =>
              addItem("educationHistory", {
                level: "TIEU_HOC",
                fromYear: "",
                toYear: "",
                schoolName: "",
                address: "",
                major: "",
                notes: "",
              } satisfies EducationItem)
            }
          >
            + Thêm
          </button>
        }
      >
        {form.educationHistory.length === 0 ? (
          <Empty>Chưa có dữ liệu. Bấm “+ Thêm” để nhập.</Empty>
        ) : (
          form.educationHistory.map((ed, idx) => (
            <Row key={idx}>
              <Grid cols={3}>
                <Field label="Bậc học">
                  <select
                    value={ed.level}
                    onChange={(e) => updateArray("educationHistory", idx, { level: e.target.value as any })}
                  >
                    <option value="TIEU_HOC">Tiểu học</option>
                    <option value="TRUNG_HOC">Trung học</option>
                    <option value="THPT">THPT</option>
                    <option value="TRUNG_CAP">Trung cấp</option>
                    <option value="CAO_DANG">Cao đẳng</option>
                    <option value="DAI_HOC">Đại học</option>
                    <option value="KHAC">Khác</option>
                  </select>
                </Field>
                <Field label="Từ năm (YYYY hoặc YYYY-MM)">
                  <input
                    value={ed.fromYear}
                    onChange={(e) => updateArray("educationHistory", idx, { fromYear: e.target.value })}
                  />
                </Field>
                <Field label="Đến năm (YYYY hoặc YYYY-MM)">
                  <input
                    value={ed.toYear}
                    onChange={(e) => updateArray("educationHistory", idx, { toYear: e.target.value })}
                  />
                </Field>
              </Grid>

              <Field label="Tên trường">
                <input
                  value={ed.schoolName}
                  onChange={(e) => updateArray("educationHistory", idx, { schoolName: e.target.value })}
                />
              </Field>

              <Field label="Địa chỉ">
                <input
                  value={ed.address}
                  onChange={(e) => updateArray("educationHistory", idx, { address: e.target.value })}
                />
              </Field>

              <Field label="Chuyên ngành (nếu có)">
                <input
                  value={ed.major}
                  onChange={(e) => updateArray("educationHistory", idx, { major: e.target.value })}
                />
              </Field>

              <Field label="Ghi chú">
                <textarea
                  value={ed.notes}
                  onChange={(e) => updateArray("educationHistory", idx, { notes: e.target.value })}
                />
              </Field>

              <div style={rowActions}>
                <button style={btnRemove} onClick={() => removeItem("educationHistory", idx)}>
                  Xoá dòng
                </button>
              </div>
            </Row>
          ))
        )}
      </Card>

      {/* 9) Công việc */}
      <Card
        title="9) Công việc (nhiều dòng)"
        right={
          <button
            style={btnAdd}
            onClick={() =>
              addItem("workHistory", {
                fromYear: "",
                toYear: "",
                company: "",
                address: "",
                position: "",
                notes: "",
              } satisfies WorkItem)
            }
          >
            + Thêm
          </button>
        }
      >
        {form.workHistory.length === 0 ? (
          <Empty>Chưa có dữ liệu. Bấm “+ Thêm” để nhập.</Empty>
        ) : (
          form.workHistory.map((w, idx) => (
            <Row key={idx}>
              <Grid cols={2}>
                <Field label="Từ năm (YYYY hoặc YYYY-MM)">
                  <input
                    value={w.fromYear}
                    onChange={(e) => updateArray("workHistory", idx, { fromYear: e.target.value })}
                  />
                </Field>
                <Field label="Đến năm (YYYY hoặc YYYY-MM)">
                  <input
                    value={w.toYear}
                    onChange={(e) => updateArray("workHistory", idx, { toYear: e.target.value })}
                  />
                </Field>
              </Grid>

              <Grid cols={2}>
                <Field label="Công ty">
                  <input
                    value={w.company}
                    onChange={(e) => updateArray("workHistory", idx, { company: e.target.value })}
                  />
                </Field>
                <Field label="Chức vụ">
                  <input
                    value={w.position}
                    onChange={(e) => updateArray("workHistory", idx, { position: e.target.value })}
                  />
                </Field>
              </Grid>

              <Field label="Địa chỉ công ty">
                <input
                  value={w.address}
                  onChange={(e) => updateArray("workHistory", idx, { address: e.target.value })}
                />
              </Field>

              <Field label="Ghi chú">
                <textarea
                  value={w.notes}
                  onChange={(e) => updateArray("workHistory", idx, { notes: e.target.value })}
                />
              </Field>

              <div style={rowActions}>
                <button style={btnRemove} onClick={() => removeItem("workHistory", idx)}>
                  Xoá dòng
                </button>
              </div>
            </Row>
          ))
        )}
      </Card>

      <div style={{ height: 40 }} />
    </div>
  );
}

/** =========================
 * UI Components
 * ========================= */
function Header({
  caseId,
  saving,
  onSave,
  err,
  filled,
  total,
}: {
  caseId: number;
  saving: boolean;
  onSave: () => void;
  err: string | null;
  filled: number;
  total: number;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "grid", gap: 10 }}>
        <Link to={`/cases/${caseId}`} style={{ textDecoration: "none", fontWeight: 900, color: "#374151" }}>
          ← Quay lại hồ sơ #{caseId}
        </Link>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 1000 }}>Visa Profile (TIẾNG VIỆT)</h1>
          <span style={badgeGray}>
            Tóm tắt: {filled}/{total} mục cơ bản
          </span>
        </div>

        {err && (
          <div style={errBox}>
            {err}
          </div>
        )}
      </div>

      <button onClick={onSave} disabled={saving} style={btnSave}>
        {saving ? "Đang lưu..." : "Lưu"}
      </button>
    </div>
  );
}

function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={card}>
      <div style={cardHeader}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {right ? <div>{right}</div> : null}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
      <div style={{ fontWeight: 900, color: "#374151" }}>{label}</div>
      <div style={{ display: "grid" }}>{children}</div>

      {/* global input style */}
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

function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  const style: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: cols === 2 ? "1fr 1fr" : "1fr 1fr 1fr",
    gap: 12,
  };
  return <div style={style}>{children}</div>;
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={rowBox}>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ color: "#6b7280", fontWeight: 800 }}>{children}</div>;
}

/** =========================
 * Styles
 * ========================= */
const pageWrap: React.CSSProperties = {
  padding: "24px 32px",
  background: "#f9fafb",
  minHeight: "100vh",
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
  color: "#111827",
};

const card: React.CSSProperties = {
  marginTop: 18,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  maxWidth: 980,
};

const cardHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
};

const rowBox: React.CSSProperties = {
  border: "1px dashed #e5e7eb",
  borderRadius: 14,
  padding: 12,
  marginBottom: 12,
  background: "#fafafa",
};

const rowActions: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 6,
};

const btnSave: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "#fff",
  fontWeight: 1000,
  cursor: "pointer",
  height: 44,
  opacity: 1,
};

const btnAdd: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "#fff",
  fontWeight: 1000,
  cursor: "pointer",
};

const btnRemove: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: 1000,
  cursor: "pointer",
};

const errBox: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  padding: "12px 14px",
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 900,
  maxWidth: 980,
};

const badgeGray: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  color: "#374151",
  fontSize: 13,
  fontWeight: 900,
};

const checkLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 900,
  color: "#374151",
  marginBottom: 12,
};
