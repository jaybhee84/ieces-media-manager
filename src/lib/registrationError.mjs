export async function registrationErrorMessage(error, data) {
  if (typeof data?.error === "string") return data.error;
  const response = error?.context;
  if (typeof response?.clone === "function") {
    try {
      const body = await response.clone().json();
      if (typeof body?.error === "string") return body.error;
      if (typeof body?.message === "string") return body.message;
    } catch {
      // Gateways may return a non-JSON body. Keep a useful fallback.
    }
    return `Registration failed (HTTP ${response.status}). Please try again or contact your administrator.`;
  }
  return error?.message || "Registration failed. Please try again.";
}
