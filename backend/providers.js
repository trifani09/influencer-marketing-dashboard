import { parseProfileUrl } from "./profile-url.js";
import { profileFixtures } from "./fixtures/profiles.js";

export class ProviderError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.status = status;
  }
}

const timeoutSignal = () => AbortSignal.timeout(8000);
const nullableNumber = (value) =>
  Number.isFinite(Number(value)) && value !== null && value !== ""
    ? Number(value)
    : null;
const nullableString = (value) =>
  typeof value === "string" && value.length ? value : null;

export function normalizeProfile(
  raw,
  {
    platform,
    requested,
    provider,
    creatorId = null,
    retrievalStatus = "success",
    providerWarning = null,
  },
) {
  const username = nullableString(raw.username)
    ?.replace(/^@/, "")
    .toLowerCase();
  if (!username)
    throw new ProviderError(
      "PROFILE_UNAVAILABLE",
      "The provider did not return a usable profile.",
      404,
    );
  if (requested && username !== requested.username)
    throw new ProviderError(
      "AUTHORIZATION_MISMATCH",
      "The authorized account does not match the profile URL.",
      403,
    );
  const recentContent = Array.isArray(raw.recentContent)
    ? raw.recentContent.slice(0, 12).map((item) => ({
        id: nullableString(item.id),
        url: nullableString(item.url),
        caption: nullableString(item.caption),
        publishedAt: nullableString(item.publishedAt),
        mediaType: nullableString(item.mediaType),
        views: nullableNumber(item.views),
        likes: nullableNumber(item.likes),
        comments: nullableNumber(item.comments),
        shares: nullableNumber(item.shares),
      }))
    : [];
  const followerCount = nullableNumber(raw.followerCount);
  const interactionTotals = recentContent.reduce(
    (sum, item) =>
      item.likes !== null && item.comments !== null
        ? sum + item.likes + item.comments
        : sum,
    0,
  );
  const completeEngagementSample =
    recentContent.length > 0 &&
    recentContent.every(
      (item) => item.likes !== null && item.comments !== null,
    );
  return {
    platform,
    username,
    displayName: nullableString(raw.displayName),
    profileUrl: requested?.profileUrl || nullableString(raw.profileUrl),
    profilePictureUrl: nullableString(raw.profilePictureUrl),
    bio: nullableString(raw.bio),
    followerCount,
    followingCount: nullableNumber(raw.followingCount),
    contentCount: nullableNumber(raw.contentCount),
    recentContent,
    engagementRate:
      completeEngagementSample && followerCount > 0
        ? Number(
            (
              (interactionTotals / recentContent.length / followerCount) *
              100
            ).toFixed(2),
          )
        : null,
    lastRefreshedAt: new Date().toISOString(),
    dataSource: provider,
    retrievalStatus,
    providerWarning,
    providerCreatorId: creatorId,
    provenance: {
      platform: "provider",
      username: "provider",
      displayName: raw.displayName ? "provider" : null,
      profile: "provider",
      followerCount: raw.followerCount != null ? "provider" : null,
      followingCount: raw.followingCount != null ? "provider" : null,
      contentCount: raw.contentCount != null ? "provider" : null,
      recentContent: recentContent.length ? "provider" : null,
      engagementRate: completeEngagementSample ? "calculated" : null,
    },
  };
}

export function getProviderStatus(env = process.env) {
  const provider = env.PROFILE_PROVIDER || "official";
  const instagramMode = env.INSTAGRAM_API_MODE || "business-discovery";
  const mockEnabled = provider === "mock" && env.NODE_ENV !== "production";
  return {
    provider: mockEnabled ? "mock" : provider,
    mockEnabled,
    tiktok:
      provider === "third-party"
        ? Boolean(
            env.CREATOR_DATA_PROVIDER_URL && env.CREATOR_DATA_PROVIDER_TOKEN,
          )
        : Boolean(
            env.TIKTOK_CLIENT_KEY &&
            env.TIKTOK_CLIENT_SECRET &&
            env.TIKTOK_REDIRECT_URI,
          ),
    instagramMode,
    instagram:
      provider === "third-party"
        ? Boolean(
            env.CREATOR_DATA_PROVIDER_URL && env.CREATOR_DATA_PROVIDER_TOKEN,
          )
        : instagramMode === "instagram-login"
          ? Boolean(
              env.INSTAGRAM_APP_ID &&
              env.INSTAGRAM_APP_SECRET &&
              env.INSTAGRAM_REDIRECT_URI &&
              env.INSTAGRAM_GRAPH_API_VERSION,
            )
          : Boolean(
              env.META_APP_ID &&
              env.META_APP_SECRET &&
              env.META_REDIRECT_URI &&
              env.META_GRAPH_API_VERSION,
            ),
  };
}

export async function fetchFromConfiguredProvider(
  url,
  { env = process.env, fetchImpl = fetch } = {},
) {
  const requested = parseProfileUrl(url);
  const selected = env.PROFILE_PROVIDER || "official";
  if (selected === "mock") {
    if (env.NODE_ENV === "production")
      throw new ProviderError(
        "SETUP_REQUIRED",
        "The local mock provider is disabled in production.",
        503,
      );
    const key = `${requested.platform}:@${requested.username}`;
    const fixture = profileFixtures[key];
    if (!fixture)
      throw new ProviderError(
        "PROFILE_UNAVAILABLE",
        "No local fixture exists for this URL. The mock provider never fabricates arbitrary profiles.",
        404,
      );
    return normalizeProfile(fixture, {
      platform: requested.platform,
      requested,
      provider: "local-fixture",
    });
  }
  if (selected === "third-party") {
    if (!env.CREATOR_DATA_PROVIDER_URL || !env.CREATOR_DATA_PROVIDER_TOKEN)
      throw new ProviderError(
        "SETUP_REQUIRED",
        "Configure the approved third-party provider URL and server-side token.",
        503,
      );
    let endpoint;
    try {
      endpoint = new URL(env.CREATOR_DATA_PROVIDER_URL);
    } catch {
      throw new ProviderError(
        "SETUP_REQUIRED",
        "The configured third-party provider URL is invalid.",
        503,
      );
    }
    if (
      endpoint.protocol !== "https:" &&
      env.NODE_ENV !== "development" &&
      env.NODE_ENV !== "test"
    )
      throw new ProviderError(
        "SETUP_REQUIRED",
        "The third-party provider must use HTTPS.",
        503,
      );
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.CREATOR_DATA_PROVIDER_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          profileUrl: requested.profileUrl,
          platform: requested.platform,
        }),
        signal: timeoutSignal(),
        redirect: "error",
      });
    } catch (error) {
      if (error.name === "TimeoutError")
        throw new ProviderError(
          "PROVIDER_TIMEOUT",
          "The profile provider timed out. Retry in a moment.",
          504,
        );
      throw new ProviderError(
        "PROVIDER_UNAVAILABLE",
        "The profile provider could not be reached.",
        502,
      );
    }
    if (response.status === 404)
      throw new ProviderError(
        "PROFILE_UNAVAILABLE",
        "The configured provider could not find this profile.",
        404,
      );
    if (response.status === 401 || response.status === 403)
      throw new ProviderError(
        "PROVIDER_AUTHORIZATION",
        "The configured provider denied this request. Check authorization and account access.",
        403,
      );
    if (response.status === 429)
      throw new ProviderError(
        "RATE_LIMITED",
        "The provider rate limit was reached. Retry later.",
        429,
      );
    if (!response.ok)
      throw new ProviderError(
        "PROVIDER_ERROR",
        "The profile provider returned an error.",
        502,
      );
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new ProviderError(
        "PROVIDER_ERROR",
        "The provider response was not valid JSON.",
        502,
      );
    }
    return normalizeProfile(payload.profile || payload, {
      platform: requested.platform,
      requested,
      provider: "third-party",
      creatorId: payload.creatorId || null,
    });
  }
  const status = getProviderStatus(env);
  if (!status[requested.platform.toLowerCase()])
    throw new ProviderError(
      "SETUP_REQUIRED",
      `${requested.platform} API credentials and configuration are missing. Configure the server environment, then retry.`,
      503,
    );
  if (
    requested.platform === "Instagram" &&
    (env.INSTAGRAM_API_MODE || "business-discovery") === "business-discovery"
  )
    throw new ProviderError(
      "AUTH_REQUIRED",
      "Connect a Meta login with a Facebook Page linked to an Instagram Business/Creator account. Business Discovery can then query eligible public professional profiles.",
      401,
    );
  throw new ProviderError(
    "AUTH_REQUIRED",
    `Authorize the ${requested.platform} account owner to retrieve profile data. A URL alone cannot access this account.`,
    401,
  );
}

async function fetchJson(fetchImpl, url, options, label) {
  let response;
  try {
    response = await fetchImpl(url, {
      ...options,
      signal: timeoutSignal(),
      redirect: "error",
    });
  } catch (error) {
    if (error.name === "TimeoutError")
      throw new ProviderError(
        "PROVIDER_TIMEOUT",
        `${label} timed out. Please retry.`,
        504,
      );
    throw new ProviderError(
      "PROVIDER_UNAVAILABLE",
      `${label} could not be reached.`,
      502,
    );
  }
  let payload = {};
  try {
    payload = await response.json();
  } catch {}
  if (response.status === 429)
    throw new ProviderError(
      "RATE_LIMITED",
      `${label} rate limit reached. Retry later.`,
      429,
    );
  if (!response.ok || payload.error) {
    const auth =
      response.status === 401 ||
      response.status === 403 ||
      payload.error?.type === "OAuthException";
    throw new ProviderError(
      auth
        ? "PROVIDER_AUTHORIZATION"
        : response.status === 404
          ? "PROFILE_UNAVAILABLE"
          : "PROVIDER_ERROR",
      auth
        ? `${label} authorization failed or required scopes are missing.`
        : response.status === 404
          ? "The authorized profile is unavailable."
          : `${label} could not return the requested profile fields. Check scopes and API access.`,
      auth ? 403 : response.status === 404 ? 404 : 502,
    );
  }
  return payload;
}

export async function fetchAuthorizedProfile(
  platform,
  requested,
  code,
  { env = process.env, fetchImpl = fetch } = {},
) {
  if (platform === "TikTok") {
    const token = await fetchJson(
      fetchImpl,
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: env.TIKTOK_CLIENT_KEY,
          client_secret: env.TIKTOK_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: env.TIKTOK_REDIRECT_URI,
        }),
      },
      "TikTok token exchange",
    );
    if (!token.access_token || !token.scope)
      throw new ProviderError(
        "PROVIDER_AUTHORIZATION",
        "TikTok did not return the required user authorization.",
        403,
      );
    const fields =
      "open_id,username,display_name,avatar_url,bio_description,profile_deep_link,follower_count,following_count,video_count";
    const info = await fetchJson(
      fetchImpl,
      `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
      { headers: { authorization: `Bearer ${token.access_token}` } },
      "TikTok user info",
    );
    const user = info.data?.user || {};
    let recentContent = [];
    let retrievalStatus = "success";
    let providerWarning = null;
    if (token.scope?.split(",").includes("video.list")) {
      const videoFields =
        "id,title,video_description,create_time,share_url,view_count,like_count,comment_count,share_count";
      try {
        const videos = await fetchJson(
          fetchImpl,
          `https://open.tiktokapis.com/v2/video/list/?fields=${videoFields}`,
          {
            method: "POST",
            headers: {
              authorization: `Bearer ${token.access_token}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({ max_count: 12 }),
          },
          "TikTok public videos",
        );
        recentContent = (videos.data?.videos || []).map((video) => ({
          id: video.id,
          url: video.share_url,
          caption: video.video_description || video.title,
          publishedAt: Number.isFinite(video.create_time)
            ? new Date(video.create_time * 1000).toISOString()
            : null,
          mediaType: "VIDEO",
          views: video.view_count,
          likes: video.like_count,
          comments: video.comment_count,
          shares: video.share_count,
        }));
      } catch (error) {
        if (error.code === "RATE_LIMITED") throw error;
        retrievalStatus = "partial";
        providerWarning =
          "TikTok profile was retrieved, but recent videos were unavailable for the authorized scopes.";
      }
    }
    return normalizeProfile(
      {
        username: user.username,
        displayName: user.display_name,
        profileUrl: user.profile_deep_link,
        profilePictureUrl: user.avatar_url,
        bio: user.bio_description,
        followerCount: user.follower_count,
        followingCount: user.following_count,
        contentCount: user.video_count,
        recentContent,
      },
      {
        platform,
        requested,
        provider: "tiktok-api",
        creatorId: user.open_id || null,
        retrievalStatus,
        providerWarning,
      },
    );
  }
  if (platform === "Instagram") {
    if (
      (env.INSTAGRAM_API_MODE || "business-discovery") === "business-discovery"
    ) {
      const version = env.META_GRAPH_API_VERSION;
      const metaBase = `https://graph.facebook.com/${encodeURIComponent(version)}`;
      const tokenUrl = new URL(`${metaBase}/oauth/access_token`);
      tokenUrl.search = new URLSearchParams({
        client_id: env.META_APP_ID,
        client_secret: env.META_APP_SECRET,
        redirect_uri: env.META_REDIRECT_URI,
        code,
      }).toString();
      const userToken = await fetchJson(
        fetchImpl,
        tokenUrl,
        {},
        "Meta authorization code exchange",
      );
      if (!userToken.access_token)
        throw new ProviderError(
          "PROVIDER_AUTHORIZATION",
          "Meta did not return an access token.",
          403,
        );
      const pagesUrl = new URL(`${metaBase}/me/accounts`);
      pagesUrl.searchParams.set(
        "fields",
        "id,name,instagram_business_account{id,username}",
      );
      const pages = await fetchJson(
        fetchImpl,
        pagesUrl,
        { headers: { authorization: `Bearer ${userToken.access_token}` } },
        "Meta connected pages lookup",
      );
      const linkedPage = (pages.data || []).find(
        (page) => page.instagram_business_account?.id,
      );
      if (!linkedPage)
        throw new ProviderError(
          "ACCOUNT_NOT_LINKED",
          "This Facebook login has no Instagram Business/Creator account linked to an accessible Facebook Page. Connect a professional Instagram account in Meta Business settings and retry.",
          403,
        );
      const ownIgId = linkedPage.instagram_business_account.id;
      const targetFields =
        "username,name,biography,profile_picture_url,followers_count,follows_count,media_count,media.limit(12){id,caption,media_type,permalink,timestamp,like_count,comments_count,view_count}";
      const discoveryUrl = new URL(
        `${metaBase}/${encodeURIComponent(ownIgId)}`,
      );
      discoveryUrl.searchParams.set(
        "fields",
        `business_discovery.username(${requested.username}){${targetFields}}`,
      );
      const result = await fetchJson(
        fetchImpl,
        discoveryUrl,
        { headers: { authorization: `Bearer ${userToken.access_token}` } },
        "Instagram Business Discovery",
      );
      const discovered = result.business_discovery;
      if (!discovered?.username)
        throw new ProviderError(
          "PROFILE_UNAVAILABLE",
          "Meta Business Discovery returned no eligible public profile. The target may be personal, private, unavailable, or outside the permission granted to this app.",
          404,
        );
      const recentContent = (discovered.media?.data || []).map((item) => ({
        id: item.id,
        url: item.permalink,
        caption: item.caption,
        publishedAt: item.timestamp,
        mediaType: item.media_type,
        views: item.view_count,
        likes: item.like_count,
        comments: item.comments_count,
        shares: null,
      }));
      return normalizeProfile(
        {
          username: discovered.username,
          displayName: discovered.name,
          profileUrl: requested.profileUrl,
          profilePictureUrl: discovered.profile_picture_url,
          bio: discovered.biography,
          followerCount: discovered.followers_count,
          followingCount: discovered.follows_count,
          contentCount: discovered.media_count,
          recentContent,
        },
        {
          platform,
          requested,
          provider: "meta-business-discovery",
          creatorId: discovered.id || null,
        },
      );
    }
    const tokenForm = new URLSearchParams({
      client_id: env.INSTAGRAM_APP_ID,
      client_secret: env.INSTAGRAM_APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: env.INSTAGRAM_REDIRECT_URI,
      code,
    });
    const token = await fetchJson(
      fetchImpl,
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: tokenForm,
      },
      "Instagram token exchange",
    );
    const apiBase = `https://graph.instagram.com/${encodeURIComponent(env.INSTAGRAM_GRAPH_API_VERSION)}`;
    if (!token.access_token)
      throw new ProviderError(
        "PROVIDER_AUTHORIZATION",
        "Instagram did not return an access token.",
        403,
      );
    const profileUrl = new URL(`${apiBase}/me`);
    profileUrl.searchParams.set(
      "fields",
      "id,user_id,username,name,account_type,followers_count,follows_count,media_count,biography,profile_picture_url",
    );
    let info;
    try {
      info = await fetchJson(
        fetchImpl,
        profileUrl,
        { headers: { authorization: `Bearer ${token.access_token}` } },
        "Instagram profile lookup",
      );
    } catch (error) {
      if (error.code !== "PROVIDER_ERROR") throw error;
      // Instagram Login exposes a narrower basic field set than Facebook Login. Retry only its documented basics.
      profileUrl.searchParams.set(
        "fields",
        "user_id,username,account_type,media_count",
      );
      info = await fetchJson(
        fetchImpl,
        profileUrl,
        { headers: { authorization: `Bearer ${token.access_token}` } },
        "Instagram basic profile lookup",
      );
    }
    let recentContent = [];
    let retrievalStatus = "success";
    let providerWarning = null;
    try {
      const mediaUrl = new URL(`${apiBase}/me/media`);
      mediaUrl.searchParams.set(
        "fields",
        "id,caption,media_type,permalink,timestamp,like_count,comments_count",
      );
      mediaUrl.searchParams.set("limit", "12");
      const media = await fetchJson(
        fetchImpl,
        mediaUrl,
        { headers: { authorization: `Bearer ${token.access_token}` } },
        "Instagram public media",
      );
      recentContent = (media.data || []).map((item) => ({
        id: item.id,
        url: item.permalink,
        caption: item.caption,
        publishedAt: item.timestamp,
        mediaType: item.media_type,
        views: null,
        likes: item.like_count,
        comments: item.comments_count,
        shares: null,
      }));
    } catch (error) {
      if (error.code === "RATE_LIMITED") throw error;
      retrievalStatus = "partial";
      providerWarning =
        "Instagram profile was retrieved, but recent media was unavailable for this account or permission set.";
    }
    return normalizeProfile(
      {
        username: info.username,
        displayName: info.name,
        profileUrl: requested.profileUrl,
        profilePictureUrl: info.profile_picture_url,
        bio: info.biography,
        followerCount: info.followers_count,
        followingCount: info.follows_count,
        contentCount: info.media_count,
        recentContent,
      },
      {
        platform,
        requested,
        provider: "instagram-api",
        creatorId: info.id || info.user_id || token.user_id || null,
        retrievalStatus,
        providerWarning,
      },
    );
  }
  throw new ProviderError(
    "UNSUPPORTED_PLATFORM",
    "This social platform is not supported.",
    400,
  );
}

export function buildAuthorizationUrl(
  platform,
  requested,
  state,
  env = process.env,
) {
  if (platform === "TikTok") {
    const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
    url.search = new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY,
      response_type: "code",
      scope: "user.info.basic,user.info.profile,user.info.stats,video.list",
      redirect_uri: env.TIKTOK_REDIRECT_URI,
      state,
    }).toString();
    return url.toString();
  }
  if (
    (env.INSTAGRAM_API_MODE || "business-discovery") === "business-discovery"
  ) {
    const version = env.META_GRAPH_API_VERSION;
    const url = new URL(
      `https://www.facebook.com/${encodeURIComponent(version)}/dialog/oauth`,
    );
    url.search = new URLSearchParams({
      client_id: env.META_APP_ID,
      redirect_uri: env.META_REDIRECT_URI,
      response_type: "code",
      scope: "instagram_basic,pages_show_list,pages_read_engagement",
      state,
    }).toString();
    return url.toString();
  }
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.search = new URLSearchParams({
    client_id: env.INSTAGRAM_APP_ID,
    redirect_uri: env.INSTAGRAM_REDIRECT_URI,
    response_type: "code",
    scope: "instagram_business_basic",
    state,
    enable_fb_login: "0",
    force_authentication: "1",
  }).toString();
  return url.toString();
}

export function platformConfigured(platform, env = process.env) {
  const status = getProviderStatus(env);
  return status[platform.toLowerCase()];
}
