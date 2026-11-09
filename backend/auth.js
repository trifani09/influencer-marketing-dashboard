import { ProviderError } from "./providers.js";

const authTimeout = () => AbortSignal.timeout(5000);

export async function authenticateRequest(req, env, fetchImpl = fetch) {
  const authorization = req.headers.authorization || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    throw new ProviderError(
      "AUTHENTICATION_REQUIRED",
      "Sign in to use this feature.",
      401,
    );
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new ProviderError(
      "AUTH_SETUP_REQUIRED",
      "Configure Supabase Auth on the backend before using profile import.",
      503,
    );
  }

  let response;
  try {
    const userUrl = new URL("/auth/v1/user", env.SUPABASE_URL);
    response = await fetchImpl(userUrl, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        authorization: `Bearer ${token}`,
      },
      redirect: "error",
      signal: authTimeout(),
    });
  } catch (error) {
    throw new ProviderError(
      "AUTH_PROVIDER_UNAVAILABLE",
      error.name === "TimeoutError"
        ? "Authentication service timed out. Retry in a moment."
        : "Authentication service could not be reached.",
      503,
    );
  }

  if (!response.ok) {
    throw new ProviderError(
      "AUTHENTICATION_REQUIRED",
      "Your sign-in session is invalid or has expired. Sign in again.",
      401,
    );
  }

  let user;
  try {
    user = await response.json();
  } catch {
    throw new ProviderError(
      "AUTH_PROVIDER_ERROR",
      "Authentication service returned an invalid response.",
      502,
    );
  }

  if (typeof user.id !== "string" || !user.id) {
    throw new ProviderError(
      "AUTHENTICATION_REQUIRED",
      "Your sign-in session is invalid. Sign in again.",
      401,
    );
  }

  return user;
}
