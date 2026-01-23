import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

export default function LoginPage() {
  const nav = useNavigate();

  // ✅ Username mặc định
  const [email, setEmail] = useState("visaducphuc.");
  // ✅ Password KHÔNG mặc định
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ chỉ khi user bấm nút thì mới điền mật khẩu
  function fillDefaultPassword() {
    setPassword("admin1234");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email.trim() || !password) {
      setErr("Vui lòng nhập (hoặc bấm nút điền) mật khẩu để đăng nhập.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      const token = res?.access_token || res?.token;
      if (!token) throw new Error("Không nhận được token từ server.");

      setToken(token);

      // ✅ đăng nhập xong xoá password khỏi UI
      setPassword("");

      nav("/cases");
    } catch (e: any) {
      setErr(e?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 16,
        fontFamily: "system-ui",
        background: "#f8fafc",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        }}
        autoComplete="off"
      >
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
          Đăng nhập
        </div>
        <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 14 }}>
          Vui lòng đăng nhập để xem hồ sơ
        </div>

        {err && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "10px 12px",
              borderRadius: 12,
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            {err}
          </div>
        )}

        <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: "#111827" }}>
            Tên đăng nhập
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tên đăng nhập"
            type="text"
            autoComplete="username"
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              outline: "none",
              fontSize: 14,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6, marginBottom: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: "#111827" }}>
            Mật khẩu
          </span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu hoặc bấm nút bên dưới"
            type="password"
            autoComplete="current-password"
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              outline: "none",
              fontSize: 14,
            }}
          />
        </label>

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button
            type="button"
            onClick={fillDefaultPassword}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Điền mật khẩu mặc định
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #111827",
              background: "#111827",
              color: "#fff",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </div>

        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Gợi ý: Bạn có thể nhập mật khẩu thủ công hoặc bấm <b>“Điền mật khẩu mặc định”</b>.
        </div>
      </form>
    </div>
  );
}
