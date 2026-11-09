import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAuthorizationUrl,
  fetchAuthorizedProfile,
  getProviderStatus,
  ProviderError,
} from "./providers.js";

test("maps a fixture TikTok OAuth/API response without exposing the fixture access token", async () => {
  const requested = {
    platform: "TikTok",
    username: "samplecreator",
    profileUrl: "https://www.tiktok.com/@samplecreator",
  };
  const responses = [
    {
      access_token: "fixture-only-token",
      scope: "user.info.basic,user.info.profile,user.info.stats",
      open_id: "fixture-open-id",
    },
    {
      data: {
        user: {
          open_id: "fixture-open-id",
          username: "samplecreator",
          display_name: "Fixture Creator",
          avatar_url: null,
          bio_description: "Test fixture, not a live account.",
          follower_count: 456,
          following_count: 78,
          video_count: 9,
        },
      },
    },
  ];
  const fetchImpl = async (url, options) => {
    if (String(url).includes("/oauth/token/"))
      assert.ok(
        options.headers.authorization !== "Bearer fixture-only-token",
        "token exchange must not receive a bearer token",
      );
    else
      assert.equal(options.headers.authorization, "Bearer fixture-only-token");
    return new Response(JSON.stringify(responses.shift()), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const profile = await fetchAuthorizedProfile(
    "TikTok",
    requested,
    "fixture-oauth-code",
    {
      env: {
        TIKTOK_CLIENT_KEY: "fixture-key",
        TIKTOK_CLIENT_SECRET: "fixture-secret",
        TIKTOK_REDIRECT_URI: "https://app.test/callback",
      },
      fetchImpl,
    },
  );
  assert.equal(profile.username, "samplecreator");
  assert.equal(profile.followerCount, 456);
  assert.equal(profile.dataSource, "tiktok-api");
  assert.equal(profile.provenance.followerCount, "provider");
  assert.equal(JSON.stringify(profile).includes("fixture-only-token"), false);
});

test("rejects an authorized account that does not match the requested profile URL", async () => {
  const requested = {
    platform: "TikTok",
    username: "samplecreator",
    profileUrl: "https://www.tiktok.com/@samplecreator",
  };
  const responses = [
    {
      access_token: "fixture-token",
      scope: "user.info.basic,user.info.profile,user.info.stats",
    },
    {
      data: {
        user: {
          open_id: "different-id",
          username: "someoneelse",
          display_name: "Different Account",
        },
      },
    },
  ];
  await assert.rejects(
    fetchAuthorizedProfile("TikTok", requested, "fixture-code", {
      env: {
        TIKTOK_CLIENT_KEY: "key",
        TIKTOK_CLIENT_SECRET: "secret",
        TIKTOK_REDIRECT_URI: "https://app.test/callback",
      },
      fetchImpl: async () =>
        new Response(JSON.stringify(responses.shift()), { status: 200 }),
    }),
    (error) =>
      error instanceof ProviderError && error.code === "AUTHORIZATION_MISMATCH",
  );
});

test("uses Meta Business Discovery to retrieve an eligible public professional profile", async () => {
  const requested = {
    platform: "Instagram",
    username: "zhanglimei",
    profileUrl: "https://www.instagram.com/zhanglimei/",
  };
  const responses = [
    {
      access_token: "fixture-meta-user-token",
      token_type: "bearer",
      expires_in: 3600,
    },
    {
      data: [
        {
          id: "page-fixture",
          instagram_business_account: {
            id: "caller-ig-fixture",
            username: "agencyfixture",
          },
        },
      ],
    },
    {
      business_discovery: {
        id: "target-fixture",
        username: "zhanglimei",
        name: "Zhang Limei (fixture)",
        biography: "Synthetic API fixture.",
        profile_picture_url: null,
        followers_count: 1200,
        follows_count: 300,
        media_count: 7,
        media: {
          data: [
            {
              id: "post-fixture",
              caption: "Fixture post",
              media_type: "IMAGE",
              permalink: "https://www.instagram.com/p/fixture/",
              timestamp: "2026-01-01T00:00:00+0000",
              like_count: 120,
              comments_count: 8,
            },
          ],
        },
      },
    },
  ];
  const fetchImpl = async (url, options) => {
    const href = String(url);
    if (href.includes("/oauth/access_token"))
      assert.equal(options.headers?.authorization, undefined);
    else
      assert.equal(
        options.headers.authorization,
        "Bearer fixture-meta-user-token",
      );
    if (href.includes("/caller-ig-fixture"))
      assert.match(
        new URL(href).searchParams.get("fields"),
        /business_discovery\.username\(zhanglimei\)/,
      );
    return new Response(JSON.stringify(responses.shift()), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const env = {
    INSTAGRAM_API_MODE: "business-discovery",
    META_APP_ID: "fixture-app",
    META_APP_SECRET: "fixture-secret",
    META_REDIRECT_URI: "https://app.test/api/oauth/instagram/callback",
    META_GRAPH_API_VERSION: "v25.0",
  };
  const profile = await fetchAuthorizedProfile(
    "Instagram",
    requested,
    "fixture-meta-code",
    { env, fetchImpl },
  );
  assert.equal(profile.username, "zhanglimei");
  assert.equal(profile.followerCount, 1200);
  assert.equal(profile.dataSource, "meta-business-discovery");
  assert.equal(profile.recentContent[0].likes, 120);
  assert.equal(
    JSON.stringify(profile).includes("fixture-meta-user-token"),
    false,
  );
});

test("Business Discovery setup uses Facebook Login and needs a linked professional account configuration", () => {
  const env = {
    INSTAGRAM_API_MODE: "business-discovery",
    META_APP_ID: "app",
    META_APP_SECRET: "secret",
    META_REDIRECT_URI: "https://app.test/callback",
    META_GRAPH_API_VERSION: "v25.0",
  };
  assert.equal(getProviderStatus(env).instagram, true);
  const authorize = new URL(
    buildAuthorizationUrl(
      "Instagram",
      { username: "zhanglimei" },
      "state-fixture",
      env,
    ),
  );
  assert.equal(authorize.hostname, "www.facebook.com");
  assert.match(authorize.searchParams.get("scope"), /instagram_basic/);
  assert.match(authorize.searchParams.get("scope"), /pages_show_list/);
});
