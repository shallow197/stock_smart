async function request(method, url, body, token) {
  const headers = { Accept: "application/json" };
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 204) return null;
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof data === "object" && data?.message ? data.message : "Erreur API.";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (url, token) => request("GET", url, undefined, token),
  post: (url, body, token) => request("POST", url, body, token),
  put: (url, body, token) => request("PUT", url, body, token),
  del: (url, token) => request("DELETE", url, undefined, token),
};

