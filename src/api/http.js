import axios from "axios";
import { enqueue, getQueue, removeFromQueue } from "./offlineQueue";

const BASE = import.meta.env.VITE_API_BASE_URL || "https://pesatrack.alwaysdata.net/api";

const http = axios.create({ baseURL: BASE });

// Auth endpoints that must never trigger the refresh interceptor
const AUTH_URLS = ["/auth/login/", "/auth/register/", "/auth/refresh/", "/auth/me/"];

// ── Attach token ─────────────────────────────────────────────────────────────
http.interceptors.request.use(c => {
  const t = localStorage.getItem("access");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

// ── Response interceptor ─────────────────────────────────────────────────────
http.interceptors.response.use(r => r, async e => {
  const orig = e.config;
  const isAuthUrl = AUTH_URLS.some(u => orig.url?.includes(u));
  const isNetworkError = !e.response;

  // 401 on a non-auth endpoint → try refresh once
  if (e.response?.status === 401 && !orig._retry && !isAuthUrl) {
    orig._retry = true;
    const refresh = localStorage.getItem("refresh");
    if (refresh) {
      try {
        const { data } = await axios.post(`${BASE}/auth/refresh/`, { refresh });
        localStorage.setItem("access", data.access);
        orig.headers.Authorization = `Bearer ${data.access}`;
        return http(orig);
      } catch {
        // Refresh failed — clear tokens and redirect
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(e);
      }
    } else {
      // No refresh token at all — just reject, let AuthContext handle it
      return Promise.reject(e);
    }
  }

  // Offline: queue mutations (non-auth only)
  const isMutation = ["post", "patch", "put", "delete"].includes(orig.method?.toLowerCase());
  if (isNetworkError && isMutation && !isAuthUrl) {
    await enqueue({
      method: orig.method,
      url: orig.url,
      data: orig.data,
      headers: { Authorization: orig.headers?.Authorization },
    });
    return Promise.resolve({ data: { _queued: true }, status: 202 });
  }

  return Promise.reject(e);
});

// ── Replay offline queue when back online ────────────────────────────────────
async function replayQueue() {
  const items = await getQueue();
  if (!items.length) return;
  for (const item of items) {
    try {
      await axios({
        method: item.method,
        url: `${BASE}${item.url}`,
        data: item.data,
        headers: { ...item.headers, "Content-Type": "application/json" },
      });
      await removeFromQueue(item.id);
    } catch {
      // Leave in queue if still failing
    }
  }
  window.dispatchEvent(new CustomEvent("pesatrack:synced"));
}

window.addEventListener("online", replayQueue);

export default http;
export { replayQueue };
