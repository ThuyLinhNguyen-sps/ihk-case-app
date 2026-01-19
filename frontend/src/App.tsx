import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CasesPage from "./pages/CasesPage";
import CaseDetailPage from "./pages/CaseDetailPage";
import { getToken, isTokenExpired, clearToken } from "./lib/auth";

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
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/cases"
        element={
          <RequireAuth>
            <CasesPage />
          </RequireAuth>
        }
      />

      <Route
        path="/cases/:id"
        element={
          <RequireAuth>
            <CaseDetailPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/cases" replace />} />
    </Routes>
  );
}
