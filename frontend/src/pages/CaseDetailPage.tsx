import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { getUserFromToken } from "../lib/auth";

type Doc = {
  id: number;
  type: string;
  required: boolean;
  translationRequired: boolean;
  fileName: string | null;
  filePath: string | null;
  uploadedAt: string | null;
  uploadedBy: number | null;
};

type CustomDoc = {
  id: number;
  title: string;
  required: boolean;
  fileName: string | null;
  filePath: string | null;
  uploadedAt: string | null;
  uploadedBy: number | null;
};

const DOC_TYPE_LABEL_VI: Record<string, string> = {
  APPLICATION_FORM: "Đơn đăng ký",
  DIPLOMA_AND_SUBJECTS: "Bằng cấp & Bảng điểm / Danh sách môn học",
  IDENTITY_PROOF: "Giấy tờ tùy thân (CCCD/Hộ chiếu)",
  CV: "CV / Sơ yếu lý lịch",
  INTENT_TO_WORK_PROOF: "Giấy chứng minh ý định làm việc",
  PROOF_WORK_EXPERIENCE: "Chứng minh kinh nghiệm làm việc",
  OTHER_QUALIFICATIONS: "Chứng chỉ / Bằng cấp khác",
  TRAINING_CURRICULUM: "Khung chương trình đào tạo",
};

function typeLabelVI(type: string) {
  return DOC_TYPE_LABEL_VI[type] ?? type.replaceAll("_", " ").toLowerCase();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "red" | "green" | "blue" | "amber";
}) {
  const map: Record<string, React.CSSProperties> = {
    gray: { background: "#f3f4f6", color: "#374151", borderColor: "#e5e7eb" },
    red: { background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" },
    green: { background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" },
    blue: { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" },
    amber: { background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        border: "1px solid",
        fontSize: 14,
        fontWeight: 900,
        lineHeight: 1.6,
        ...map[tone],
      }}
    >
      {children}
    </span>
  );
}

export default function CaseDetailPage() {
  const { id } = useParams();
  const caseId = Number(id);
  const me = getUserFromToken();

  const canUpload = me?.role === "ADMIN" || me?.role === "STAFF";

  const [docs, setDocs] = useState<Doc[]>([]);
  const [customDocs, setCustomDocs] = useState<CustomDoc[]>([]);
  const [missing, setMissing] = useState<number>(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // add custom doc form
  const [newTitle, setNewTitle] = useState("");
  const [newRequired, setNewRequired] = useState(false);

  const uploadedCount = useMemo(() => {
    const a = docs.filter((d) => !!d.filePath).length;
    const b = customDocs.filter((d) => !!d.filePath).length;
    return a + b;
  }, [docs, customDocs]);

  const totalCount = docs.length + customDocs.length;

  async function load() {
    if (!Number.isFinite(caseId) || caseId <= 0) {
      setErr("CaseId không hợp lệ.");
      return;
    }

    setErr(null);
    setLoading(true);
    try {
      const res = await api.getChecklist(caseId);
      setDocs(res.documents ?? []);
      setCustomDocs(res.customDocuments ?? []);
      setMissing(res.missingRequired ?? 0);
    } catch (e: any) {
      setErr(e?.message || "Không tải được danh sách tài liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ===== DEFAULT DOCS =====
  async function onUploadDefault(type: string, file: File) {
    setBusyKey(`d:${type}`);
    try {
      await api.uploadDocument(caseId, type, file);
      await load();
    } catch (e: any) {
      alert(e?.message || "Upload thất bại");
    } finally {
      setBusyKey(null);
    }
  }

  async function onDownloadDefault(type: string, fileName?: string | null) {
    setBusyKey(`d:${type}`);
    try {
      const blob = await api.downloadDocument(caseId, type);
      await downloadBlob(blob, fileName || `${type}.bin`);
    } catch (e: any) {
      alert(e?.message || "Download thất bại");
    } finally {
      setBusyKey(null);
    }
  }

  // ===== CUSTOM DOCS =====
  async function onAddCustom() {
    if (!newTitle.trim()) return alert("Vui lòng nhập tên tài liệu");
    setBusyKey("add-custom");
    try {
      await api.addCustomDocument(caseId, {
        title: newTitle.trim(),
        required: newRequired,
      });
      setNewTitle("");
      setNewRequired(false);
      await load();
    } catch (e: any) {
      alert(e?.message || "Thêm tài liệu thất bại");
    } finally {
      setBusyKey(null);
    }
  }

  async function onDeleteCustom(docId: number, title: string) {
    const ok = window.confirm(`Xoá tài liệu "${title}"?`);
    if (!ok) return;
    setBusyKey(`c:del:${docId}`);
    try {
      await api.deleteCustomDocument(caseId, docId);
      await load();
    } catch (e: any) {
      alert(e?.message || "Xoá tài liệu thất bại");
    } finally {
      setBusyKey(null);
    }
  }

  async function onUploadCustom(docId: number, file: File) {
    setBusyKey(`c:up:${docId}`);
    try {
      await api.uploadCustomDocument(caseId, docId, file);
      await load();
    } catch (e: any) {
      alert(e?.message || "Upload thất bại");
    } finally {
      setBusyKey(null);
    }
  }

  async function onDownloadCustom(docId: number, fileName?: string | null) {
    setBusyKey(`c:dl:${docId}`);
    try {
      const blob = await api.downloadCustomDocument(caseId, docId);
      await downloadBlob(blob, fileName || `custom-${docId}.bin`);
    } catch (e: any) {
      alert(e?.message || "Download thất bại");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        margin: 0,
        padding: "24px 32px",
        fontFamily:
          'system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
        background: "#f9fafb",
        color: "#111827",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <Link
            to="/cases"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#374151",
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 900,
            }}
          >
            ← Quay lại danh sách hồ sơ
          </Link>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 1000 }}>
              Hồ sơ #{caseId} — Tài liệu
            </h1>

            {missing > 0 ? (
              <Badge tone="red">Thiếu bắt buộc: {missing}</Badge>
            ) : (
              <Badge tone="green">Đã đủ tài liệu bắt buộc</Badge>
            )}

            <Badge tone="gray">
              Đã tải lên: {uploadedCount}/{totalCount || 0}
            </Badge>

            <Badge tone="blue">Vai trò: {me?.role ?? "UNKNOWN"}</Badge>
          </div>

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

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 1000,
              fontSize: 15,
            }}
          >
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {/* ===== Custom docs ===== */}
      <div
        style={{
          marginTop: 18,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 1000 }}>
            Tài liệu bổ sung (tự thêm / xoá)
          </div>
          {!canUpload && (
            <div style={{ color: "#6b7280", fontWeight: 800 }}>
              Bạn chỉ có quyền xem / tải xuống.
            </div>
          )}
        </div>

        {canUpload && (
          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nhập tên tài liệu cần thêm..."
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                minWidth: 320,
                fontSize: 15,
                fontWeight: 800,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAddCustom();
              }}
            />
            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                fontWeight: 900,
              }}
            >
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
              />
              Bắt buộc
            </label>

            <button
              onClick={onAddCustom}
              disabled={busyKey === "add-custom" || loading}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #111827",
                background: "#111827",
                color: "#fff",
                fontWeight: 1000,
                cursor:
                  busyKey === "add-custom" || loading ? "not-allowed" : "pointer",
                fontSize: 15,
                opacity: busyKey === "add-custom" || loading ? 0.7 : 1,
              }}
            >
              {busyKey === "add-custom" ? "Đang thêm..." : "+ Thêm tài liệu"}
            </button>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", color: "#6b7280", fontSize: 12 }}>
                <th
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #e5e7eb",
                    width: "22%",
                  }}
                >
                  Tên tài liệu
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #e5e7eb",
                    width: "12%",
                  }}
                >
                  Bắt buộc
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #e5e7eb",
                    width: "14%",
                  }}
                >
                  Trạng thái
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #e5e7eb",
                    width: "22%",
                  }}
                >
                  Tệp
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #e5e7eb",
                    width: "18%",
                  }}
                >
                  Thời gian
                </th>
                <th
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #e5e7eb",
                    width: "12%",
                  }}
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {customDocs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "14px 14px",
                      color: "#6b7280",
                      fontWeight: 800,
                    }}
                  >
                    Chưa có tài liệu bổ sung.
                  </td>
                </tr>
              ) : (
                customDocs.map((d) => {
                  const uploaded = !!d.filePath;
                  const isBusy =
                    busyKey === `c:up:${d.id}` ||
                    busyKey === `c:dl:${d.id}` ||
                    busyKey === `c:del:${d.id}`;

                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td
                        style={{
                          padding: "14px 14px",
                          fontWeight: 1000,
                          wordBreak: "break-word",
                        }}
                      >
                        {d.title}
                      </td>
                      <td style={{ padding: "14px 14px" }}>
                        {d.required ? (
                          <Badge tone="amber">Có</Badge>
                        ) : (
                          <Badge tone="gray">Không</Badge>
                        )}
                      </td>
                      <td style={{ padding: "14px 14px" }}>
                        {uploaded ? (
                          <Badge tone="green">Đã tải lên</Badge>
                        ) : d.required ? (
                          <Badge tone="red">Thiếu</Badge>
                        ) : (
                          <Badge tone="gray">Chưa có</Badge>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "14px 14px",
                          wordBreak: "break-word",
                        }}
                      >
                        {d.fileName ?? "—"}
                      </td>
                      <td style={{ padding: "14px 14px", fontWeight: 800 }}>
                        {formatDate(d.uploadedAt)}
                      </td>
                      <td style={{ padding: "14px 14px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            disabled={!uploaded || isBusy}
                            onClick={() => onDownloadCustom(d.id, d.fileName)}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid #e5e7eb",
                              background: uploaded ? "#fff" : "#f9fafb",
                              fontWeight: 1000,
                              cursor:
                                !uploaded || isBusy ? "not-allowed" : "pointer",
                              opacity: !uploaded ? 0.7 : 1,
                            }}
                          >
                            Tải xuống
                          </button>

                          {canUpload && (
                            <label
                              style={{
                                padding: "10px 12px",
                                borderRadius: 12,
                                border: "1px solid #111827",
                                background: "#111827",
                                color: "#fff",
                                fontWeight: 1000,
                                cursor: isBusy ? "not-allowed" : "pointer",
                                opacity: isBusy ? 0.7 : 1,
                              }}
                            >
                              Tải lên
                              <input
                                type="file"
                                style={{ display: "none" }}
                                disabled={isBusy}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) onUploadCustom(d.id, f);
                                  e.currentTarget.value = "";
                                }}
                              />
                            </label>
                          )}

                          {canUpload && (
                            <button
                              disabled={isBusy}
                              onClick={() => onDeleteCustom(d.id, d.title)}
                              style={{
                                padding: "10px 12px",
                                borderRadius: 12,
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                fontWeight: 1000,
                                cursor: isBusy ? "not-allowed" : "pointer",
                                opacity: isBusy ? 0.7 : 1,
                              }}
                            >
                              Xoá
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Default IHK docs ===== */}
      <div
        style={{
          marginTop: 18,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            padding: "16px 16px",
            borderBottom: "1px solid #e5e7eb",
            background: "#fafafa",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 1000, fontSize: 18 }}>
            Checklist IHK (mặc định)
          </div>
          {!canUpload && (
            <div style={{ color: "#6b7280", fontWeight: 800 }}>
              Bạn chỉ có quyền xem / tải xuống.
            </div>
          )}
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", color: "#6b7280", fontSize: 12 }}>
              <th
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid #e5e7eb",
                  width: "22%",
                }}
              >
                Tài liệu
              </th>
              <th
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid #e5e7eb",
                  width: "12%",
                }}
              >
                Bắt buộc
              </th>
              <th
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid #e5e7eb",
                  width: "14%",
                }}
              >
                Dịch DE
              </th>
              <th
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid #e5e7eb",
                  width: "14%",
                }}
              >
                Trạng thái
              </th>
              <th
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid #e5e7eb",
                  width: "26%",
                }}
              >
                Tệp
              </th>
              <th
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid #e5e7eb",
                  width: "12%",
                }}
              >
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {docs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "14px 14px",
                    color: "#6b7280",
                    fontWeight: 800,
                  }}
                >
                  Không có dữ liệu checklist.
                </td>
              </tr>
            ) : (
              docs.map((d) => {
                const uploaded = !!d.filePath;
                const isBusy = busyKey === `d:${d.type}`;

                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td
                      style={{
                        padding: "14px 14px",
                        fontWeight: 1000,
                        wordBreak: "break-word",
                      }}
                    >
                      {typeLabelVI(d.type)}
                    </td>
                    <td style={{ padding: "14px 14px" }}>
                      {d.required ? (
                        <Badge tone="amber">Có</Badge>
                      ) : (
                        <Badge tone="gray">Không</Badge>
                      )}
                    </td>
                    <td style={{ padding: "14px 14px" }}>
                      {d.translationRequired ? (
                        <Badge tone="blue">Cần</Badge>
                      ) : (
                        <span style={{ color: "#6b7280" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 14px" }}>
                      {uploaded ? (
                        <Badge tone="green">Đã tải lên</Badge>
                      ) : d.required ? (
                        <Badge tone="red">Thiếu</Badge>
                      ) : (
                        <Badge tone="gray">Chưa có</Badge>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "14px 14px",
                        wordBreak: "break-word",
                      }}
                    >
                      {d.fileName ?? "—"}
                      {d.uploadedAt ? (
                        <div style={{ color: "#6b7280", fontWeight: 800, marginTop: 4, fontSize: 12 }}>
                          {formatDate(d.uploadedAt)}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: "14px 14px" }}>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          disabled={!uploaded || isBusy}
                          onClick={() => onDownloadDefault(d.type, d.fileName)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px solid #e5e7eb",
                            background: uploaded ? "#fff" : "#f9fafb",
                            fontWeight: 1000,
                            cursor: !uploaded || isBusy ? "not-allowed" : "pointer",
                            opacity: !uploaded ? 0.7 : 1,
                          }}
                        >
                          {isBusy ? "..." : "Tải xuống"}
                        </button>

                        {canUpload && (
                          <label
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid #111827",
                              background: "#111827",
                              color: "#fff",
                              fontWeight: 1000,
                              cursor: isBusy ? "not-allowed" : "pointer",
                              opacity: isBusy ? 0.7 : 1,
                            }}
                          >
                            Tải lên
                            <input
                              type="file"
                              style={{ display: "none" }}
                              disabled={isBusy}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onUploadDefault(d.type, f);
                                e.currentTarget.value = "";
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 800 }}>
          Gợi ý: ADMIN/STAFF có thể tải lên. VIEWER chỉ xem và tải xuống.
        </div>
      </div>
    </div>
  );
}
