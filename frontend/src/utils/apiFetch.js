// frontend/src/utils/apiFetch.js
const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

function buildUrl(path) {
    if (API_BASE.startsWith("http")) return `${API_BASE}${path}`;
    const prefix = API_BASE.startsWith("/") ? "" : "/";
    return `${prefix}${API_BASE}${path}`;
}

function getToken() {
    return sessionStorage.getItem("token") || "";
}
function setToken(t) {
    if (t) sessionStorage.setItem("token", t);
}

async function refreshAccessToken(signal) {
    const url = buildUrl("/auth/refresh");

    // POST
    try {
        const res = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            signal,
        });
        if (res.ok) {
            const data = await res.json();
            if (data?.token) setToken(data.token);
            return data?.token || null;
        }
    } catch (_) { }

    // GET fallback
    try {
        const res2 = await fetch(url, {
            method: "GET",
            credentials: "include",
            signal,
        });
        if (!res2.ok) return null;
        const data2 = await res2.json();
        if (data2?.token) setToken(data2.token);
        return data2?.token || null;
    } catch (_) {
        return null;
    }
}

export async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const first = await fetch(buildUrl(path), {
        ...options,
        headers,
        credentials: "include",
    });

    if (first.status !== 401) return first;

    const newToken = await refreshAccessToken(options.signal);
    if (!newToken) return first;

    const headers2 = new Headers(options.headers || {});
    headers2.set("Authorization", `Bearer ${newToken}`);

    return fetch(buildUrl(path), {
        ...options,
        headers: headers2,
        credentials: "include",
    });
}
