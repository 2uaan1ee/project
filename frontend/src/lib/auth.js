// src/lib/auth.js
export function getToken() {
  return sessionStorage.getItem("token");
}

export function setToken(token) {
  sessionStorage.setItem("token", token);
}

export function clearToken() {
  sessionStorage.removeItem("token");
}

/** fetch có gắn Authorization: Bearer <token>, tự refresh 1 lần khi 401 */
export async function authFetch(input, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res = await fetch(input, { ...options, headers });

  // ===== Nếu access token hết hạn =====
  if (res.status === 401) {
    try {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // cần gửi cookie refresh_token
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.token) {
          setToken(data.token);

          // Gửi lại request ban đầu với token mới
          const newHeaders = {
            ...(options.headers || {}),
            Authorization: `Bearer ${data.token}`,
          };
          res = await fetch(input, { ...options, headers: newHeaders });
        } else {
          // Nếu không có token mới => clear token và logout
          handleAutoLogout();
        }
      } else {
        // refresh token hết hạn hoặc bị revoke
        handleAutoLogout();
      }
    } catch (err) {
      console.error("authFetch refresh error:", err);
      handleAutoLogout();
    }
  }

  return res;
}

/** ✅ Gọi khi refresh token không còn hợp lệ hoặc server trả 401 */
function handleAutoLogout() {
  clearToken();
  if (typeof window !== "undefined") {
    // tránh lỗi SSR
    window.location.href = "/auth/login";
  }
}

/** ✅ API logout phía client (xoá cookie refresh token) */
export async function apiLogout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.warn("Logout API failed:", err);
  } finally {
    clearToken();
  }
}
