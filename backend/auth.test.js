import test from "node:test";
import assert from "node:assert/strict";
import { authenticateRequest } from "./auth.js";
import { ProviderError } from "./providers.js";

const request = (authorization) => ({ headers: { authorization } });

test("verifies the bearer token with Supabase Auth and returns the user", async () => {
  let requestedUrl;
  const user = { id: "user-fixture", email: "creator@example.com" };
  const result = await authenticateRequest(
    request("Bearer fixture-access-token"),
    {
      SUPABASE_URL: "https://project-fixture.supabase.co",
      SUPABASE_ANON_KEY: "fixture-publishable-key",
    },
    async (url, options) => {
      requestedUrl = String(url);
      assert.equal(
        options.headers.authorization,
        "Bearer fixture-access-token",
      );
      assert.equal(options.headers.apikey, "fixture-publishable-key");
      return new Response(JSON.stringify(user), { status: 200 });
    },
  );

  assert.equal(
    requestedUrl,
    "https://project-fixture.supabase.co/auth/v1/user",
  );
  assert.deepEqual(result, user);
  assert.equal(JSON.stringify(result).includes("fixture-access-token"), false);
});

test("rejects missing or invalid login sessions", async () => {
  await assert.rejects(
    authenticateRequest(request(undefined), {}, async () => {
      throw new Error("must not call auth without a token");
    }),
    (error) =>
      error instanceof ProviderError &&
      error.code === "AUTHENTICATION_REQUIRED" &&
      error.status === 401,
  );

  await assert.rejects(
    authenticateRequest(
      request("Bearer invalid-token"),
      {
        SUPABASE_URL: "https://project-fixture.supabase.co",
        SUPABASE_ANON_KEY: "fixture-key",
      },
      async () => new Response("{}", { status: 401 }),
    ),
    (error) => error.code === "AUTHENTICATION_REQUIRED" && error.status === 401,
  );
});

test("reports missing server-side Supabase configuration without leaking credentials", async () => {
  await assert.rejects(
    authenticateRequest(request("Bearer fixture-token"), {}, async () => {
      throw new Error("must not call auth without configuration");
    }),
    (error) =>
      error.code === "AUTH_SETUP_REQUIRED" &&
      error.status === 503 &&
      !error.message.includes("fixture-token"),
  );
});
