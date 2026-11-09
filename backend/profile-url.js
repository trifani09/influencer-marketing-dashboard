const hosts = {
  TikTok: new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]),
  Instagram: new Set(["instagram.com", "www.instagram.com"]),
};

export function parseProfileUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new ProfileUrlError("Enter a valid TikTok or Instagram profile URL.");
  }
  if (url.protocol !== "https:")
    throw new ProfileUrlError("Use a secure https profile URL.");
  const platform = Object.entries(hosts).find(([, values]) =>
    values.has(url.hostname.toLowerCase()),
  )?.[0];
  if (!platform)
    throw new ProfileUrlError(
      "Only TikTok and Instagram profile URLs are supported.",
    );
  const segments = url.pathname.split("/").filter(Boolean);
  let username;
  if (
    platform === "TikTok" &&
    segments.length === 1 &&
    /^@[A-Za-z0-9._]{2,24}$/.test(segments[0])
  )
    username = segments[0].slice(1);
  if (
    platform === "Instagram" &&
    segments.length === 1 &&
    /^[A-Za-z0-9._]{1,30}$/.test(segments[0])
  )
    username = segments[0];
  if (!username)
    throw new ProfileUrlError(
      `Enter a ${platform} profile URL, not a post, reel or other link.`,
    );
  username = username.toLowerCase();
  return {
    platform,
    username,
    profileUrl:
      platform === "TikTok"
        ? `https://www.tiktok.com/@${username}`
        : `https://www.instagram.com/${username}/`,
  };
}

export class ProfileUrlError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProfileUrlError";
    this.code = "INVALID_PROFILE_URL";
  }
}
