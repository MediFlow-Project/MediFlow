import axios from "axios";

const TOKEN_KEY = "mediflow_token";
const USER_KEY = "mediflow_user";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function persistAuth(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

function apiUrl(path) {
  const base = String(http.defaults.baseURL || "http://localhost:3000/api").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function rejectUnauthorized(status, url) {
  const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register");
  if (status === 401 && !isAuthCall) {
    clearAuthStorage();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
  }
}

http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.transformRequest = [(data) => data];
    if (typeof config.headers.setContentType === "function") {
      config.headers.setContentType(false);
    } else if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    rejectUnauthorized(error.response?.status, error.config?.url || "");
    return Promise.reject(error);
  }
);

export async function sendJsonOrForm(method, path, data) {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const headers = {};
    const token = getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(apiUrl(path), { method: method.toUpperCase(), headers, body: data });
    const payload = await response.json().catch(() => ({}));
    rejectUnauthorized(response.status, path);
    if (!response.ok) {
      const error = new Error(payload.error || "Terjadi kesalahan. Coba lagi.");
      error.response = { status: response.status, data: payload };
      throw error;
    }
    return { data: payload };
  }
  return http.request({ method, url: path, data });
}
