// Client API léger basé sur fetch (aucune dépendance externe).
const TOKEN_KEY = "ecostock_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors || {};
  }
}

async function request(method, path, body, { isForm = false } = {}) {
  const headers = { Accept: "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    payload = body; // multipart : le navigateur gère le Content-Type
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload });
  } catch (e) {
    throw new ApiError("Connexion au serveur impossible.", 0);
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
    }
    const message = data?.message || "Une erreur est survenue.";
    throw new ApiError(message, res.status, data?.errors);
  }

  return data;
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, b, o) => request("POST", p, b, o),
  put: (p, b) => request("PUT", p, b),
  del: (p) => request("DELETE", p),
  // POST multipart (uploads)
  upload: (p, formData) => request("POST", p, formData, { isForm: true }),
};
