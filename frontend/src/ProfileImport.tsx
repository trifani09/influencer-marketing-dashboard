import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Instagram,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import type { ImportedProfile, SocialPlatform } from "./profileTypes";
import { useAuth } from "./Auth";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

type Props = {
  onClose: () => void;
  onSave: (profile: ImportedProfile) => void;
  onManual?: () => void;
  initialUrl?: string;
  refresh?: boolean;
};
type ApiError = {
  code: string;
  message: string;
  authorizationUrl?: string;
  retryable?: boolean;
};
function detectPlatform(value: string): SocialPlatform | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    const path = url.pathname.split("/").filter(Boolean);
    if (
      ["tiktok.com", "www.tiktok.com", "m.tiktok.com"].includes(host) &&
      path.length === 1 &&
      /^@[a-z0-9._]{2,24}$/i.test(path[0])
    )
      return "TikTok";
    if (
      ["instagram.com", "www.instagram.com"].includes(host) &&
      path.length === 1 &&
      /^[a-z0-9._]{1,30}$/i.test(path[0])
    )
      return "Instagram";
  } catch {
    return null;
  }
  return null;
}
const display = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === ""
    ? "Not provided by provider"
    : typeof value === "number"
      ? value.toLocaleString()
      : value;

export default function ProfileImport({
  onClose,
  onSave,
  onManual,
  initialUrl = "",
  refresh = false,
}: Props) {
  const { session } = useAuth();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ImportedProfile | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [apiOffline, setApiOffline] = useState(false);
  const [instagramMode, setInstagramMode] = useState("business-discovery");
  const platform = useMemo(() => detectPlatform(url), [url]);
  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/config`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((config) => {
        if (active) {
          setApiOffline(false);
          setInstagramMode(config.instagramMode || "business-discovery");
        }
      })
      .catch(() => {
        if (active) setApiOffline(true);
      });
    const receive = (event: MessageEvent) => {
      const allowedOrigin = API_BASE
        ? new URL(API_BASE).origin
        : window.location.origin;

      if (event.origin !== allowedOrigin) return;
      if (event.data?.type === "creator-profile-import") {
        setPreview(event.data.profile as ImportedProfile);
        setError(null);
        setBusy(false);
      }
      if (event.data?.type === "creator-profile-import-error") {
        setError(event.data.error as ApiError);
        setBusy(false);
      }
    };
    window.addEventListener("message", receive);
    return () => {
      active = false;
      window.removeEventListener("message", receive);
    };
  }, []);
  async function fetchProfile(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      const response = await fetch(`${API_BASE}/api/profiles/fetch`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error as ApiError);
        return;
      }
      setPreview(body.profile as ImportedProfile);
    } catch {
      setError({
        code: "API_UNAVAILABLE",
        message: "Cannot reach the profile API. Start it with npm run dev:api.",
      });
    } finally {
      setBusy(false);
    }
  }
  function authorize() {
    if (!error?.authorizationUrl) return;
    window.open(
      new URL(
        error.authorizationUrl,
        API_BASE || window.location.origin,
      ).toString(),
      "social-profile-authorization",
      "popup,width=650,height=760",
    );
  }
  const sourceLabel =
    preview?.dataSource === "local-fixture"
      ? "LOCAL TEST FIXTURE"
      : preview?.dataSource === "third-party"
        ? "THIRD-PARTY PROVIDER"
        : preview?.dataSource === "tiktok-api"
          ? "TIKTOK API"
          : preview?.dataSource === "meta-business-discovery"
            ? "META BUSINESS DISCOVERY"
            : "INSTAGRAM API";
  const authorizeLabel =
    platform === "Instagram" && instagramMode === "business-discovery"
      ? "Connect with Meta"
      : `Authorize ${platform || "social"} account`;
  return (
    <div
      className="modal-backdrop import-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal import-modal"
        aria-labelledby="profile-import-title"
      >
        <header className="modal-head">
          <div>
            <div className="eyebrow">
              CREATOR DATA · {refresh ? "REFRESH" : "IMPORT"}
            </div>
            <h2 id="profile-import-title">
              {refresh ? "Refresh profile data" : "Add influencer"}
            </h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        {apiOffline && (
          <div className="import-alert warning">
            <AlertCircle size={16} />
            <span>
              Profile API is not running. Start it with{" "}
              <code>npm run dev:api</code>; this form will not fabricate profile
              data.
            </span>
          </div>
        )}
        <form className="import-url-form" onSubmit={fetchProfile}>
          <label htmlFor="social-profile-url">
            TikTok or Instagram profile URL
          </label>
          <div className="import-url-control">
            <Search size={16} />
            <input
              id="social-profile-url"
              type="url"
              required
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
                setPreview(null);
              }}
              placeholder="https://www.instagram.com/username/"
            />
            <button className="button button-dark" disabled={busy || !platform}>
              {busy ? (
                <>
                  <LoaderCircle size={15} className="spin" /> Fetching
                </>
              ) : (
                <>
                  <RefreshCw size={14} />{" "}
                  {refresh ? "Refresh" : "Fetch profile"}
                </>
              )}
            </button>
          </div>
          <div className="import-url-hint">
            {platform ? (
              <span className="detected-platform">
                {platform === "TikTok" ? (
                  <Video size={13} />
                ) : (
                  <Instagram size={13} />
                )}{" "}
                {platform} profile detected
              </span>
            ) : (
              <span>
                Paste a profile link. Post, reel, and unsupported URLs are
                rejected.
              </span>
            )}
          </div>
        </form>
        <div className="authorization-note">
          <ShieldCheck size={16} />
          <span>
            Profile access follows the platform’s account authorization and API
            permissions. Public profile URLs alone do not grant API access.
          </span>
        </div>
        {error && (
          <div
            className={`import-alert ${error.code === "AUTH_REQUIRED" ? "warning" : "error"}`}
          >
            <AlertCircle size={16} />
            <div>
              <b>
                {error.code === "SETUP_REQUIRED"
                  ? "Provider setup required"
                  : error.code === "AUTH_REQUIRED"
                    ? "Account authorization required"
                    : error.code === "PROFILE_UNAVAILABLE"
                      ? "Profile unavailable"
                      : error.code === "RATE_LIMITED"
                        ? "Rate limit reached"
                        : "Could not fetch profile"}
              </b>
              <span>{error.message}</span>
              {error.authorizationUrl && (
                <button
                  className="button button-dark auth-button"
                  type="button"
                  onClick={authorize}
                >
                  {authorizeLabel} <ExternalLink size={13} />
                </button>
              )}
              {error.retryable && (
                <button
                  className="retry-button"
                  type="button"
                  onClick={() => fetchProfile()}
                >
                  Retry request
                </button>
              )}
            </div>
          </div>
        )}
        {preview && (
          <div className="profile-preview">
            <div className="preview-heading">
              <CheckCircle2 size={17} />
              <div>
                <b>Profile data retrieved</b>
                <span>Review provider-returned fields before saving.</span>
              </div>
              <span className="source-badge">{sourceLabel}</span>
            </div>
            <div className="preview-card">
              {preview.profilePictureUrl ? (
                <img
                  className="preview-picture"
                  src={preview.profilePictureUrl}
                  alt=""
                />
              ) : (
                <div className="preview-picture preview-fallback">
                  {preview.platform === "TikTok" ? (
                    <Video size={21} />
                  ) : (
                    <Instagram size={21} />
                  )}
                </div>
              )}
              <div className="preview-title">
                <b>{preview.displayName || preview.username}</b>
                <span>
                  @{preview.username} · {preview.platform}
                </span>
                <a href={preview.profileUrl} target="_blank" rel="noreferrer">
                  Open profile <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div className="preview-fields">
              <div>
                <span>Followers</span>
                <b>{display(preview.followerCount)}</b>
              </div>
              <div>
                <span>Following</span>
                <b>{display(preview.followingCount)}</b>
              </div>
              <div>
                <span>Posts / videos</span>
                <b>{display(preview.contentCount)}</b>
              </div>
              <div>
                <span>Engagement rate</span>
                <b>
                  {preview.engagementRate === null
                    ? "Unavailable"
                    : `${preview.engagementRate}%`}
                  <small>
                    {preview.engagementRate === null
                      ? "No complete recent-content sample"
                      : "Calculated from provider content"}
                  </small>
                </b>
              </div>
              <div className="wide">
                <span>Bio</span>
                <b>{display(preview.bio)}</b>
              </div>
              <div>
                <span>Last refreshed</span>
                <b>
                  <Clock3 size={12} />{" "}
                  {new Date(preview.lastRefreshedAt).toLocaleString()}
                </b>
              </div>
              <div>
                <span>Recent public content</span>
                <b>
                  {preview.recentContent.length
                    ? `${preview.recentContent.length} items returned`
                    : "Not provided by provider"}
                </b>
              </div>
            </div>
            <p className="provenance-note">
              Profile fields come from <b>{sourceLabel}</b>. Missing metrics
              remain unavailable. Engagement is calculated only when recent
              likes, comments, and follower count are present.
            </p>
          </div>
        )}
        <footer className="modal-actions import-actions">
          {!refresh && onManual && (
            <button type="button" className="manual-link" onClick={onManual}>
              Add details manually instead
            </button>
          )}
          <button
            type="button"
            className="button button-outline"
            onClick={onClose}
          >
            Cancel
          </button>
          {preview && (
            <button
              className="button button-dark"
              onClick={() => onSave(preview)}
            >
              <Plus size={15} />
              {refresh ? "Update profile data" : "Save to influencer database"}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
