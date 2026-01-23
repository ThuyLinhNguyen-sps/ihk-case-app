import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

export default function LoginPage() {
  const nav = useNavigate();

  // ✅ Email vẫn mặc định như bạn muốn
  const [email, setEmail] = useState("admin@demo.com");

  // ✅ Password KHÔNG tự điền
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ user phải bấm nút để điền mật khẩu chuẩn
  function fillPassword() {
    setPassword("Admin123!");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // ✅ bắt buộc có password
    if (!password) {
      setErr('Vui lòng bấm "Điền mật khẩu" hoặc tự nhập mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(email, password);
      setToken(res.access_token);

      // ✅ đăng nhập xong xoá password khỏi ô
      setPassword("");

      nav("/cases");
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", fontFamily: "system-ui" }}>
      <h2>IHK Case App – Login</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            autoComplete="username"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Bấm "Điền mật khẩu" hoặc tự nhập'
            style={{ width: "100%", padding: 8 }}
            autoComplete="current-password"
          />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={fillPassword}
            disabled={loading}
            style={{ padding: 10, flex: 1 }}
          >
            Điền mật khẩu
          </button>

          <button disabled={loading} style={{ padding: 10, flex: 1 }}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
      </form>
    </div>
  );
}
