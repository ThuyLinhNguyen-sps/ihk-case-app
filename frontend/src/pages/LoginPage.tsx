import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

export default function LoginPage() {
  const nav = useNavigate();

  // Email mặc định như bạn muốn
  const [email, setEmail] = useState("admin@demo.com");

  // Password luôn khởi tạo rỗng
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ chặn autofill: password input sẽ readOnly cho tới khi user click vào
  const [pwEditable, setPwEditable] = useState(false);
  const pwRef = useRef<HTMLInputElement | null>(null);

  // ✅ ép trắng password ngay khi mount (trường hợp browser vừa autofill xong)
  useEffect(() => {
    setPassword("");
    // nếu browser lỡ điền vào DOM, mình xóa luôn DOM value
    const t = setTimeout(() => {
      if (pwRef.current) pwRef.current.value = "";
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function fillPasswordByClick() {
    setPwEditable(true);
    setPassword("Admin123!");
    // focus vào input để user thấy rõ
    setTimeout(() => pwRef.current?.focus(), 0);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!password) {
      setErr('Vui lòng bấm "Điền mật khẩu" hoặc tự nhập mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(email, password);
      setToken(res.access_token);

      // xóa password khỏi UI sau khi login
      setPassword("");
      if (pwRef.current) pwRef.current.value = "";

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

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 12 }}
        autoComplete="off"
      >
        {/* ✅ 2 field “mồi” để browser autofill vào đây thay vì ô thật */}
        <input
          type="text"
          name="fake-username"
          autoComplete="username"
          tabIndex={-1}
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            height: 0,
            width: 0,
            opacity: 0,
          }}
        />
        <input
          type="password"
          name="fake-password"
          autoComplete="current-password"
          tabIndex={-1}
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            height: 0,
            width: 0,
            opacity: 0,
          }}
        />

        <label style={{ display: "grid", gap: 6 }}>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            autoComplete="off"
            inputMode="email"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Password
          <input
            ref={pwRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Bấm "Điền mật khẩu" hoặc tự nhập'
            style={{ width: "100%", padding: 8 }}
            // ✅ mẹo chính: new-password để browser không auto fill
            autoComplete="new-password"
            // ✅ chặn autofill bơm giá trị: chỉ mở khi user click/focus
            readOnly={!pwEditable}
            onFocus={() => setPwEditable(true)}
            onClick={() => setPwEditable(true)}
          />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={fillPasswordByClick}
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
