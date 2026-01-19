export type UserPayload = {
  sub: number;
  email: string;
  role: "ADMIN" | "STAFF" | "VIEWER";
  exp: number;
  iat: number;
};

const TOKEN_KEY = "ihk_token";

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// decode JWT payload (no verify; frontend only)
export function getUserFromToken(): UserPayload | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
  

}
export function isTokenExpired(leewaySeconds = 10): boolean {
  const user = getUserFromToken();
  if (!user?.exp) return false; // nếu không có exp thì coi như chưa biết
  const now = Math.floor(Date.now() / 1000);
  return now >= user.exp - leewaySeconds;
}

export function ensureValidTokenOrLogout() {
  if (isTokenExpired()) {
    clearToken();
    window.location.href = "/login";
  }
}

