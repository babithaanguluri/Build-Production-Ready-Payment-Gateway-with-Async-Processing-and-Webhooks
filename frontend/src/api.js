const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8000/api/v1"
    : "http://gateway_api:8000/api/v1";

const API_KEY = "key_test_abc123";
const API_SECRET = "secret_test_xyz789";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": API_KEY,
      "X-Api-Secret": API_SECRET,
    },
    ...options, // Allow overriding method/body
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.description || "API error");
  }

  return res.json();
}

export const getDashboardStats = () =>
  apiFetch("/dashboard/stats");

export const getTransactions = () =>
  apiFetch("/dashboard/transactions");

export const getWebhooks = (limit = 10, offset = 0) =>
  apiFetch(`/webhooks?limit=${limit}&offset=${offset}`);

export const retryWebhook = (id) =>
  apiFetch(`/webhooks/${id}/retry`, { method: "POST" });

export const getMerchantConfig = () => apiFetch("/dashboard/config");
export const updateMerchantConfig = (data) =>
  apiFetch("/dashboard/config", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const regenerateSecret = () =>
  apiFetch("/dashboard/regenerate-secret", { method: "POST" });

export const sendTestWebhook = () =>
  apiFetch("/webhooks/test", { method: "POST" });

