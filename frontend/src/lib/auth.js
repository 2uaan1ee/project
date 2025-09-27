export function getToken() {
  return localStorage.getItem("token");
}
export function setToken(token) {
  localStorage.setItem("token", token);
}
export function clearToken() {
  localStorage.removeItem("token");
}

/** fetch có gắn Authorization: Bearer <token> */

export async function authFetch(input, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res = await fetch(input, { ...options, headers });

  // nếu access token hết hạn -> thử refresh 1 lần
  if (res.status === 401) {
    const r = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    if (r.ok) {
      const { token: newToken } = await r.json();
      if (newToken) setToken(newToken);
      const h2 = { ...(options.headers || {}), Authorization: `Bearer ${newToken}` };
      res = await fetch(input, { ...options, headers: h2 });
    }
  }
  return res;
}
  