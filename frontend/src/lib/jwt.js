export function decodeJwt(token) {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (err) {
    console.warn("decodeJwt failed", err);
    return null;
  }
}
