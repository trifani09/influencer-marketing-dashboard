import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "./app.js";
import { ProviderError } from "./providers.js";

async function withServer(options, run) {
  const server = createApiServer({
    authenticate: async () => ({ id: "fixture-user" }),
    ...options,
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(base);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}
const post = (base, url) =>
  fetch(`${base}/api/profiles/fetch`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer fixture-user-token",
    },
    body: JSON.stringify({ url }),
  });

test("accepts valid Instagram and TikTok profile URLs and rejects unsupported links", async () => {
  const env = { PROFILE_PROVIDER: "mock", NODE_ENV: "test" };
  await withServer({ env }, async (base) => {
    const instagram = await post(
      base,
      "https://www.instagram.com/samplecreator/",
    );
    const tiktok = await post(base, "https://www.tiktok.com/@samplecreator");
    const reel = await post(base, "https://www.instagram.com/reel/abc123/");
    const other = await post(base, "https://example.com/@samplecreator");
    assert.equal(instagram.status, 200);
    assert.equal((await instagram.json()).profile.platform, "Instagram");
    assert.equal(tiktok.status, 200);
    assert.equal((await tiktok.json()).profile.platform, "TikTok");
    assert.equal(reel.status, 400);
    assert.equal(other.status, 400);
  });
});

test("reports missing provider credentials instead of fabricating a profile", async () => {
  await withServer({ env: { PROFILE_PROVIDER: "official" } }, async (base) => {
    const response = await post(base, "https://www.tiktok.com/@someone");
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.error.code, "SETUP_REQUIRED");
    assert.equal(body.profile, undefined);
  });
});

test("blocks profile requests when the user is not authenticated", async () => {
  await withServer(
    {
      authenticate: async () => {
        throw new ProviderError(
          "AUTHENTICATION_REQUIRED",
          "Sign in to use this feature.",
          401,
        );
      },
    },
    async (base) => {
      const response = await post(
        base,
        "https://www.instagram.com/samplecreator/",
      );
      const body = await response.json();
      assert.equal(response.status, 401);
      assert.equal(body.error.code, "AUTHENTICATION_REQUIRED");
    },
  );
});

test("returns account authorization URL when official API credentials exist but consent is missing", async () => {
  const states = new Map();
  const env = {
    PROFILE_PROVIDER: "official",
    TIKTOK_CLIENT_KEY: "test-client",
    TIKTOK_CLIENT_SECRET: "test-secret",
    TIKTOK_REDIRECT_URI: "https://app.test/api/oauth/tiktok/callback",
  };
  await withServer({ env, states }, async (base) => {
    const response = await post(base, "https://www.tiktok.com/@someone");
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error.code, "AUTH_REQUIRED");
    const authorizationUrl = new URL(body.error.authorizationUrl);
    assert.equal(authorizationUrl.hostname, "www.tiktok.com");
    assert.ok(authorizationUrl.searchParams.get("state"));
    assert.equal(states.size, 1);
    assert.equal([...states.values()][0].userId, "fixture-user");
  });
});

test("returns provider authorization errors safely from the OAuth callback", async () => {
  const states = new Map([
    [
      "known-state",
      {
        platform: "Instagram",
        requested: {
          platform: "Instagram",
          username: "creator",
          profileUrl: "https://www.instagram.com/creator/",
        },
        createdAt: 100,
      },
    ],
  ]);
  await withServer(
    {
      env: { APP_ORIGIN: "http://localhost:5173" },
      states,
      clock: () => 101,
      authorizedFetcher: async () => {
        throw new ProviderError(
          "PROVIDER_AUTHORIZATION",
          "Instagram authorization failed or required scopes are missing.",
          403,
        );
      },
    },
    async (base) => {
      const response = await fetch(
        `${base}/api/oauth/instagram/callback?code=fixture-code&state=known-state`,
      );
      const body = await response.text();
      assert.equal(response.status, 200);
      assert.match(body, /creator-profile-import-error/);
      assert.match(
        body,
        /Instagram authorization failed or required scopes are missing/,
      );
      assert.equal(states.has("known-state"), false);
    },
  );
});

test("reports unavailable profiles and only returns known, labeled local fixtures", async () => {
  await withServer(
    { env: { PROFILE_PROVIDER: "mock", NODE_ENV: "test" } },
    async (base) => {
      const missing = await post(
        base,
        "https://www.tiktok.com/@unknowncreator",
      );
      assert.equal(missing.status, 404);
      assert.equal((await missing.json()).error.code, "PROFILE_UNAVAILABLE");
      const success = await post(base, "https://www.tiktok.com/@samplecreator");
      const profile = (await success.json()).profile;
      assert.equal(success.status, 200);
      assert.equal(profile.dataSource, "local-fixture");
      assert.equal(profile.provenance.profile, "provider");
      assert.match(profile.bio, /local fixture/i);
    },
  );
});
