import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { authenticateRequest } from "./auth.js";
import { parseProfileUrl, ProfileUrlError } from "./profile-url.js";
import {
  buildAuthorizationUrl,
  fetchAuthorizedProfile,
  fetchFromConfiguredProvider,
  getProviderStatus,
  platformConfigured,
  ProviderError,
} from "./providers.js";

const json = (res, status, data) => {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(data));
};
const html = (res, content) => {
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "content-security-policy":
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
  });
  res.end(content);
};
const oauthPopupResponse = (res, env, data) => {
  const targetOrigin = JSON.stringify(
    env.APP_ORIGIN || "http://localhost:5173",
  ).replaceAll("<", "\\u003c");
  const payload = JSON.stringify(data).replaceAll("<", "\\u003c");
  const message =
    data.type === "creator-profile-import"
      ? "Profile data received. You can close this window."
      : data.error?.message ||
        "Authorization could not be completed. Return to the dashboard and retry.";
  const visibleMessage = message.replace(/[&<>"']/g, (char) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char],
  );
  return html(
    res,
    `<!doctype html><meta charset="utf-8"><title>Social profile authorization</title><p>${visibleMessage}</p><script>history.replaceState(null,'',location.pathname);if(window.opener){window.opener.postMessage(${payload},${targetOrigin});setTimeout(()=>window.close(),700)}</script>`,
  );
};
const addCorsHeaders = (req, res, env) => {
  const origin = req.headers.origin;
  const allowedOrigin = env.APP_ORIGIN || "http://localhost:5173";
  if (origin && origin === allowedOrigin) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
    res.setHeader(
      "access-control-allow-headers",
      "content-type, authorization",
    );
    res.setHeader("access-control-max-age", "600");
    res.setHeader("vary", "Origin");
  }
};

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16_384)
      throw new ProviderError(
        "INVALID_REQUEST",
        "Request body is too large.",
        413,
      );
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ProviderError(
      "INVALID_REQUEST",
      "Send a valid JSON request body.",
      400,
    );
  }
}

export function createApiServer({
  env = process.env,
  fetchImpl = fetch,
  clock = () => Date.now(),
  states = new Map(),
  profileFetcher = fetchFromConfiguredProvider,
  authorizedFetcher = fetchAuthorizedProfile,
  authenticate = authenticateRequest,
} = {}) {
  const requests = new Map();
  const limitRequest = (req) => {
    const key = req.socket.remoteAddress || "unknown";
    const now = clock();
    const recent = (requests.get(key) || []).filter(
      (time) => now - time < 60_000,
    );
    if (recent.length >= 30) return false;
    recent.push(now);
    requests.set(key, recent);
    return true;
  };
  return createServer(async (req, res) => {
    addCorsHeaders(req, res, env);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    const url = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`,
    );
    if (!url.pathname.startsWith("/api/"))
      return json(res, 404, {
        error: { code: "NOT_FOUND", message: "Route not found." },
      });
    if (!limitRequest(req))
      return json(res, 429, {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Wait a minute and retry.",
        },
      });
    try {
      if (req.method === "GET" && url.pathname === "/api/config")
        return json(res, 200, getProviderStatus(env));
      if (req.method === "POST" && url.pathname === "/api/profiles/fetch") {
        req.authUser = await authenticate(req, env, fetchImpl);
        const body = await readBody(req);
        if (typeof body.url !== "string")
          throw new ProviderError(
            "INVALID_PROFILE_URL",
            "Enter a TikTok or Instagram profile URL.",
            400,
          );
        const requested = parseProfileUrl(body.url);
        try {
          const profile = await profileFetcher(requested.profileUrl, {
            env,
            fetchImpl,
          });
          return json(res, 200, { profile });
        } catch (error) {
          if (
            error.code === "AUTH_REQUIRED" &&
            platformConfigured(requested.platform, env) &&
            (env.PROFILE_PROVIDER || "official") === "official"
          ) {
            const state = randomBytes(24).toString("hex");
            states.set(state, {
              requested,
              createdAt: clock(),
              platform: requested.platform,
              userId: req.authUser.id,
            });
            return json(res, error.status || 401, {
              error: {
                code: error.code,
                message: error.message,
                authorizationUrl: buildAuthorizationUrl(
                  requested.platform,
                  requested,
                  state,
                  env,
                ),
              },
            });
          }
          throw error;
        }
      }
      const oauthCallback = url.pathname.match(
        /^\/api\/oauth\/(tiktok|instagram)\/callback$/,
      );
      if (req.method === "GET" && oauthCallback) {
        const state = url.searchParams.get("state");
        const entry = state && states.get(state);
        if (state) states.delete(state);
        if (
          !entry ||
          entry.platform.toLowerCase() !== oauthCallback[1] ||
          clock() - entry.createdAt > 600_000
        )
          throw new ProviderError(
            "OAUTH_STATE_INVALID",
            "This authorization request expired. Start again from the dashboard.",
            400,
          );
        if (url.searchParams.has("error") || !url.searchParams.has("code"))
          return oauthPopupResponse(res, env, {
            type: "creator-profile-import-error",
            error: {
              code: "PROVIDER_AUTHORIZATION",
              message:
                "Account authorization was declined or could not be completed.",
            },
          });
        try {
          const profile = await authorizedFetcher(
            entry.platform,
            entry.requested,
            url.searchParams.get("code"),
            { env, fetchImpl },
          );
          return oauthPopupResponse(res, env, {
            type: "creator-profile-import",
            profile,
          });
        } catch (error) {
          const known =
            error instanceof ProviderError
              ? error
              : new ProviderError(
                  "PROVIDER_ERROR",
                  "The social platform could not return this profile.",
                  502,
                );
          return oauthPopupResponse(res, env, {
            type: "creator-profile-import-error",
            error: { code: known.code, message: known.message },
          });
        }
      }
      return json(res, 404, {
        error: { code: "NOT_FOUND", message: "Route not found." },
      });
    } catch (error) {
      if (error instanceof ProfileUrlError)
        return json(res, 400, {
          error: { code: error.code, message: error.message },
        });
      if (error instanceof ProviderError)
        return json(res, error.status, {
          error: {
            code: error.code,
            message: error.message,
            retryable: [
              "RATE_LIMITED",
              "PROVIDER_TIMEOUT",
              "PROVIDER_UNAVAILABLE",
            ].includes(error.code),
          },
        });
      console.error("[profile-api]", error?.name || "Error");
      return json(res, 500, {
        error: {
          code: "INTERNAL_ERROR",
          message:
            "The profile request failed unexpectedly. Retry or contact your administrator.",
        },
      });
    }
  });
}
