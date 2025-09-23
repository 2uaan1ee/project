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
    return fetch(input, { ...options, headers });
  }
  