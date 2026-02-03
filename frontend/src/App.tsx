import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CasesPage from "./pages/CasesPage";
import CaseDetailPage from "./pages/CaseDetailPage";
import { getToken, isTokenExpired, clearToken } from "./lib/auth";
import CaseVisaProfilePage from "./pages/CaseVisaProfilePage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getToken();

  // Không có token
  if (!token) return <Navigate to="/login" replace />;

  // Có token nhưng hết hạn
  if (isTokenExpired()) {
    clearToken();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* ✅ Trang gốc luôn về login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/cases"
        element={
          <RequireAuth>
            <CasesPage />
          </RequireAuth>
        }
      />
      <Route path="/cases/:id/visa-profile" element={<CaseVisaProfilePage />} />
<div style={{position:'fixed',bottom:10,right:10,background:'red',color:'#fff',padding:8,zIndex:99999}}>
  BUILD_MARK_2026_02_03
</div>
      <Route
        path="/cases/:id"
        element={
          <RequireAuth>
            <CaseDetailPage />
          </RequireAuth>
        }
      />

      {/* ✅ Bất kỳ route lạ cũng về login (KHÔNG về /cases) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
// force redeploy