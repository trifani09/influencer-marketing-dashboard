import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Command,
  Download,
  Ellipsis,
  Filter,
  Gauge,
  Heart,
  Instagram,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ProfileImport from "./ProfileImport";
import type { ImportedProfile } from "./profileTypes";
import { useAuth } from "./Auth";

type Influencer = {
  id: number;
  name: string;
  handle: string;
  platform: string;
  niche: string;
  country: string;
  followers: number;
  views: number;
  engagement: number;
  price: number;
  email: string;
  color: string;
  initials: string;
  status: string;
  externalProfile?: ImportedProfile;
  notes?: string;
  campaignIds?: number[];
};
type Campaign = {
  id: number;
  name: string;
  brand: string;
  goal: string;
  budget: number;
  spent: number;
  start: string;
  end: string;
  status: string;
  creators: number;
  color: string;
};
const starterPeople: Influencer[] = [
  {
    id: 1,
    name: "Sofia Laurent",
    handle: "@sofialaurent",
    platform: "Instagram",
    niche: "Beauty",
    country: "France",
    followers: 284000,
    views: 86400,
    engagement: 4.8,
    price: 2400,
    email: "sofia@example.com",
    color: "#ead4c8",
    initials: "SL",
    status: "Active",
  },
  {
    id: 2,
    name: "Marcus Chen",
    handle: "@marcuscreates",
    platform: "TikTok",
    niche: "Lifestyle",
    country: "United States",
    followers: 512000,
    views: 241000,
    engagement: 6.2,
    price: 3800,
    email: "marcus@example.com",
    color: "#c9d9d4",
    initials: "MC",
    status: "Active",
  },
  {
    id: 3,
    name: "Amara Okafor",
    handle: "@amara.studio",
    platform: "Instagram",
    niche: "Fashion",
    country: "United Kingdom",
    followers: 176000,
    views: 52900,
    engagement: 5.4,
    price: 1800,
    email: "amara@example.com",
    color: "#e8d8b8",
    initials: "AO",
    status: "Active",
  },
  {
    id: 4,
    name: "Diego Rivera",
    handle: "@diegorivera",
    platform: "YouTube",
    niche: "Travel",
    country: "Mexico",
    followers: 428000,
    views: 162000,
    engagement: 3.9,
    price: 4200,
    email: "diego@example.com",
    color: "#d5d1e8",
    initials: "DR",
    status: "Active",
  },
  {
    id: 5,
    name: "Hana Kim",
    handle: "@hanakim.daily",
    platform: "TikTok",
    niche: "Beauty",
    country: "South Korea",
    followers: 936000,
    views: 385000,
    engagement: 7.1,
    price: 5600,
    email: "hana@example.com",
    color: "#ead4df",
    initials: "HK",
    status: "Active",
  },
  {
    id: 6,
    name: "Olivia Bennett",
    handle: "@livbyolivia",
    platform: "Instagram",
    niche: "Lifestyle",
    country: "Australia",
    followers: 128000,
    views: 41800,
    engagement: 4.1,
    price: 1250,
    email: "olivia@example.com",
    color: "#d8e1bd",
    initials: "OB",
    status: "Review",
  },
  {
    id: 7,
    name: "Ravi Patel",
    handle: "@ravi.eats",
    platform: "YouTube",
    niche: "Food",
    country: "India",
    followers: 342000,
    views: 116000,
    engagement: 5.7,
    price: 3100,
    email: "ravi@example.com",
    color: "#edd3b8",
    initials: "RP",
    status: "Active",
  },
  {
    id: 8,
    name: "Lena Fischer",
    handle: "@lenafischer",
    platform: "Instagram",
    niche: "Fashion",
    country: "Germany",
    followers: 694000,
    views: 203000,
    engagement: 3.6,
    price: 4900,
    email: "lena@example.com",
    color: "#d5dfeb",
    initials: "LF",
    status: "Active",
  },
];
const starterCampaigns: Campaign[] = [
  {
    id: 1,
    name: "Summer, Naturally",
    brand: "Aesop",
    goal: "Brand awareness",
    budget: 24000,
    spent: 16800,
    start: "Jun 02",
    end: "Jul 14",
    status: "Active",
    creators: 8,
    color: "#d7e5db",
  },
  {
    id: 2,
    name: "The Everyday Edit",
    brand: "COS",
    goal: "Product launch",
    budget: 18500,
    spent: 18500,
    start: "May 12",
    end: "Jun 08",
    status: "Completed",
    creators: 6,
    color: "#e9dfce",
  },
  {
    id: 3,
    name: "Made for Moving",
    brand: "On Running",
    goal: "Conversions",
    budget: 32000,
    spent: 12800,
    start: "Jun 18",
    end: "Aug 02",
    status: "Active",
    creators: 12,
    color: "#d8d8e9",
  },
  {
    id: 4,
    name: "A Little More Color",
    brand: "Glossier",
    goal: "Engagement",
    budget: 12000,
    spent: 2400,
    start: "Jul 01",
    end: "Jul 28",
    status: "Planned",
    creators: 5,
    color: "#efd9dc",
  },
];
const trends = [
  { month: "Jan", reach: 38, engagement: 31 },
  { month: "Feb", reach: 48, engagement: 39 },
  { month: "Mar", reach: 42, engagement: 34 },
  { month: "Apr", reach: 58, engagement: 45 },
  { month: "May", reach: 53, engagement: 41 },
  { month: "Jun", reach: 72, engagement: 54 },
  { month: "Jul", reach: 65, engagement: 51 },
  { month: "Aug", reach: 84, engagement: 65 },
  { month: "Sep", reach: 76, engagement: 59 },
  { month: "Oct", reach: 93, engagement: 72 },
  { month: "Nov", reach: 87, engagement: 68 },
  { month: "Dec", reach: 100, engagement: 81 },
];
const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Discovery", icon: Sparkles },
  { label: "Influencers", icon: Users },
  { label: "Campaigns", icon: Target },
  { label: "Calculator", icon: Gauge },
  { label: "Analytics", icon: Activity },
];
const money = (n: number) => "$" + n.toLocaleString("en-US");
const compact = (n: number) =>
  n >= 1e6
    ? (n / 1e6).toFixed(1) + "M"
    : n >= 1e3
      ? Math.round(n / 1000) + "K"
      : String(n);
const followerMetric = (p: Influencer) =>
  p.externalProfile ? p.externalProfile.followerCount : p.followers;
const engagementMetric = (p: Influencer) =>
  p.externalProfile ? p.externalProfile.engagementRate : p.engagement;
const viewsMetric = (p: Influencer) =>
  p.externalProfile
    ? p.externalProfile.recentContent.some((item) => item.views !== null)
      ? Math.round(
          p.externalProfile.recentContent.reduce(
            (sum, item) => sum + (item.views || 0),
            0,
          ) /
            p.externalProfile.recentContent.filter(
              (item) => item.views !== null,
            ).length,
        )
      : null
    : p.views;
const displayMetric = (
  value: number | null,
  formatter: (n: number) => string,
) => (value === null ? "—" : formatter(value));
function Avatar({ p, size = 40 }: { p: Influencer; size?: number }) {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: p.color,
        fontSize: size * 0.3,
      }}
    >
      {p.externalProfile?.profilePictureUrl ? (
        <img src={p.externalProfile.profilePictureUrl} alt="" />
      ) : (
        p.initials
      )}
    </span>
  );
}
function App() {
  const { user, signOut } = useAuth();
  const peopleStorageKey = `creatorly-people:${user.id}`;
  const campaignsStorageKey = `creatorly-campaigns:${user.id}`;
  const [people, setPeople] = useState<Influencer[]>(
    () =>
      JSON.parse(localStorage.getItem(peopleStorageKey) || "null") ||
      starterPeople,
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>(
    () =>
      JSON.parse(localStorage.getItem(campaignsStorageKey) || "null") ||
      starterCampaigns,
  );
  const [page, setPage] = useState("Calculator"),
    [query, setQuery] = useState(""),
    [platform, setPlatform] = useState("All platforms"),
    [modal, setModal] = useState(""),
    [selected, setSelected] = useState<Influencer | null>(null),
    [mobileOpen, setMobileOpen] = useState(false),
    [notice, setNotice] = useState(""),
    [analysisQuery, setAnalysisQuery] = useState(""),
    [analysisPerson, setAnalysisPerson] = useState<Influencer | null>(null),
    [refreshTarget, setRefreshTarget] = useState<number | null>(null),
    [refreshUrl, setRefreshUrl] = useState("");
  const [calc, setCalc] = useState({
    followers: "25000",
    likes: "1840",
    comments: "96",
    shares: "0",
    views: "0",
    includeShares: false,
  });
  const filtered = useMemo(
    () =>
      people.filter(
        (p) =>
          (p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.handle.toLowerCase().includes(query.toLowerCase()) ||
            p.niche.toLowerCase().includes(query.toLowerCase())) &&
          (platform === "All platforms" || p.platform === platform),
      ),
    [people, query, platform],
  );
  const followers = people.reduce((s, p) => s + (followerMetric(p) || 0), 0),
    engagements = people
      .map(engagementMetric)
      .filter((value): value is number => value !== null),
    avgEng = engagements.reduce((s, n) => s + n, 0) / (engagements.length || 1),
    budget = campaigns.reduce((s, c) => s + c.budget, 0),
    views = people.reduce((s, p) => s + (viewsMetric(p) || 0), 0);
  function persistPeople(next: Influencer[]) {
    setPeople(next);
    localStorage.setItem(peopleStorageKey, JSON.stringify(next));
  }
  function persistCampaigns(next: Campaign[]) {
    setCampaigns(next);
    localStorage.setItem(campaignsStorageKey, JSON.stringify(next));
  }
  function toast(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2600);
  }
  function exportCsv() {
    const rows = [
      [
        "Name",
        "Username",
        "Platform",
        "Profile URL",
        "Niche",
        "Country",
        "Followers",
        "Average views",
        "Engagement rate",
        "Rate card",
        "Email",
        "Data source",
        "Last updated",
      ],
      ...people.map((p) => [
        p.name,
        p.handle,
        p.platform,
        p.externalProfile?.profileUrl || "",
        p.niche,
        p.country,
        p.externalProfile?.followerCount ??
          (p.externalProfile ? "" : p.followers),
        viewsMetric(p) ?? "",
        engagementMetric(p) ?? "",
        p.price || "",
        p.email,
        p.externalProfile?.dataSource || "manual/sample",
        p.externalProfile?.lastRefreshedAt || "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "influencers.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Influencer CSV exported");
  }
  function addPerson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name"));
    const p: Influencer = {
      id: Date.now(),
      name,
      handle: String(f.get("handle")),
      platform: String(f.get("platform")),
      niche: String(f.get("niche")),
      country: String(f.get("country")),
      followers: Number(f.get("followers")),
      views: 0,
      engagement: Number(f.get("engagement")),
      price: Number(f.get("price")),
      email: String(f.get("email")),
      color: "#ded9cd",
      initials: name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
      status: "Review",
    };
    persistPeople([p, ...people]);
    setModal("");
    toast("Influencer added to your database");
  }
  function saveImportedProfile(profile: ImportedProfile) {
    const normalize = (value: string) =>
      value.trim().replace(/\/$/, "").toLowerCase();
    const duplicate = people.find(
      (p) =>
        p.id === refreshTarget ||
        (p.externalProfile?.platform === profile.platform &&
          ((p.externalProfile.providerCreatorId &&
            profile.providerCreatorId &&
            p.externalProfile.providerCreatorId ===
              profile.providerCreatorId) ||
            normalize(p.externalProfile.profileUrl) ===
              normalize(profile.profileUrl))),
    );
    const old = duplicate;
    const availableViews = profile.recentContent
      .map((item) => item.views)
      .filter((n): n is number => n !== null);
    const averageViews = availableViews.length
      ? Math.round(
          availableViews.reduce((sum, n) => sum + n, 0) / availableViews.length,
        )
      : (old?.views ?? 0);
    const displayName = profile.displayName || profile.username;
    const merged: Influencer = {
      id: old?.id || Date.now(),
      name: displayName,
      handle: `@${profile.username}`,
      platform: profile.platform,
      niche: old?.niche || "",
      country: old?.country || "",
      followers: profile.followerCount ?? old?.followers ?? 0,
      views: averageViews,
      engagement: profile.engagementRate ?? old?.engagement ?? 0,
      price: old?.price ?? 0,
      email: old?.email ?? "",
      color: old?.color || "#d7e8e5",
      initials: displayName
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
      status: old?.status || "Imported",
      externalProfile: profile,
      notes: old?.notes,
      campaignIds: old?.campaignIds,
    };
    persistPeople(
      old
        ? people.map((p) => (p.id === old.id ? merged : p))
        : [merged, ...people],
    );
    setModal("");
    setRefreshTarget(null);
    setRefreshUrl("");
    setPage("Influencers");
    toast(
      old
        ? "Authorized profile data refreshed"
        : "Profile saved to influencer database",
    );
  }
  function addCampaign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name"));
    persistCampaigns([
      {
        id: Date.now(),
        name,
        brand: String(f.get("brand")),
        goal: String(f.get("goal")),
        budget: Number(f.get("budget")),
        spent: 0,
        start: "Jul 10",
        end: "Aug 10",
        status: "Planned",
        creators: 0,
        color: "#dfe5d8",
      },
      ...campaigns,
    ]);
    setModal("");
    toast("Campaign created");
  }
  const calcInputs = (
    <div className="calc-fields">
      {[
        ["followers", "Followers"],
        ["likes", "Likes"],
        ["comments", "Comments"],
        ["shares", "Shares (optional)"],
        ["views", "Views (optional)"],
      ].map(([key, label]) => (
        <label key={key}>
          {label}
          <input
            type="number"
            min="0"
            value={calc[key as keyof typeof calc] as string}
            onChange={(e) => setCalc({ ...calc, [key]: e.target.value })}
          />
        </label>
      ))}
    </div>
  );
  const rate =
    Number(calc.followers) > 0
      ? ((Number(calc.likes) +
          Number(calc.comments) +
          (calc.includeShares ? Number(calc.shares) : 0)) /
          Number(calc.followers)) *
        100
      : 0;
  const shell = (
    <>
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">N</span>
          <span>Noor Creative</span>
          <button
            className="mobile-close icon-button"
            onClick={() => setMobileOpen(false)}
          >
            <X size={17} />
          </button>
        </div>
        <div className="workspace-label">
          WORKSPACE <ChevronDown size={13} />
        </div>
        <div className="workspace">
          <span className="workspace-icon">N</span>
          <span>
            <b>Noor Creative</b>
            <small>Agency workspace</small>
          </span>
          <Ellipsis size={18} className="muted" />
        </div>
        <div className="nav-title">MENU</div>
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${page === label ? "active" : ""}`}
              onClick={() => {
                setPage(label);
                setMobileOpen(false);
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
              {label === "Campaigns" && <span className="nav-count">4</span>}
            </button>
          ))}
        </nav>
        <div className="nav-title tools-label">WORKSPACE</div>
        <button
          className={`nav-item ${page === "Settings" ? "active" : ""}`}
          onClick={() => setPage("Settings")}
        >
          <Settings size={17} />
          <span>Settings</span>
        </button>
        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="plan-icon">
              <Sparkles size={15} />
            </div>
            <b>A little more room?</b>
            <p>You’re using 78% of your creator limit.</p>
            <div className="progress">
              <i style={{ width: "78%" }} />
            </div>
            <button onClick={() => toast("Plan details are coming soon")}>
              Explore plans <ArrowRight size={14} />
            </button>
          </div>
          <div className="profile-switch">
            <div className="user-avatar">JD</div>
            <span>
              <b>Jamie Davis</b>
              <small>Studio admin</small>
            </span>
            <Ellipsis size={18} className="muted" />
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <div className="backdrop" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
  return (
    <div className="app-shell">
      {shell}
      <main className="main">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <button className="noor-logo" onClick={() => setPage("Overview")}>
            Noor<span> Creative</span>
          </button>
          <nav className="primary-nav">
            <button
              className={page === "Campaigns" ? "selected" : ""}
              onClick={() => setPage("Campaigns")}
            >
              CAMPAIGNS
            </button>
            <button
              className={
                ["Discovery", "Influencers"].includes(page) ? "selected" : ""
              }
              onClick={() => setPage("Discovery")}
            >
              DISCOVERY
            </button>
            <button onClick={() => setPage("Influencers")}>CONTACT</button>
            <button
              onClick={() =>
                toast("Payment tracking will be available in a future version")
              }
            >
              PAYMENT
            </button>
            <button
              className={page === "Settings" ? "selected" : ""}
              onClick={() => setPage("Settings")}
            >
              INTEGRATION
            </button>
          </nav>
          <div className="top-actions">
            <button
              className="icon-button help-button"
              onClick={() => toast("Help center is coming soon")}
            >
              <CircleHelp size={18} />
            </button>
            <button
              className="icon-button bell-button"
              onClick={() => toast("You’re all caught up")}
            >
              <Bell size={18} />
              <i />
            </button>
            <button
              className="noor-user"
              onClick={() => void signOut()}
              title="Keluar"
            >
              <div className="top-avatar">NA</div>
              <span>
                <b>{user.email?.split("@")[0] || "Account"}</b>
                <small>{user.email}</small>
              </span>
              <ChevronDown size={13} />
            </button>
          </div>
        </header>
        <nav className="feature-nav">
          <button
            className={
              ["Discovery", "Influencers", "Overview"].includes(page)
                ? "selected"
                : ""
            }
            onClick={() => setPage("Discovery")}
          >
            Influencer Search
          </button>
          <button
            onClick={() => {
              setPage("Discovery");
              toast("Lookalike discovery uses your saved creators");
            }}
          >
            Influencer Lookalike
          </button>
          <button
            onClick={() => {
              setPage("Discovery");
              toast("Content search is available for your local creator list");
            }}
          >
            Content Search
          </button>
          <button
            className={page === "Analytics" ? "selected" : ""}
            onClick={() => setPage("Analytics")}
          >
            Brand Tagged Tracking
          </button>
          <button
            className={page === "Calculator" ? "selected" : ""}
            onClick={() => setPage("Calculator")}
          >
            Engagement Calculator
          </button>
          <button
            onClick={() => {
              setRefreshTarget(null);
              setRefreshUrl("");
              setPage("Import");
            }}
          >
            Add influencer
          </button>
        </nav>
        <div className="page-wrap">
          {page === "Overview" && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-mark">✳</span> YOUR CREATOR
                    WORKSPACE
                  </div>
                  <h1>
                    Good morning, Jamie <span className="wave">✳</span>
                  </h1>
                  <p>
                    Here’s what’s happening across your creator partnerships.
                  </p>
                </div>
                <button
                  className="button button-dark"
                  onClick={() => setModal("campaign")}
                >
                  <Plus size={16} /> New campaign
                </button>
              </div>
              <div className="metric-grid">
                {[
                  {
                    label: "Total influencers",
                    value: people.length.toString(),
                    change: "+12.8%",
                    icon: Users,
                    tint: "peach",
                    desc: "vs. last month",
                  },
                  {
                    label: "Campaigns",
                    value: campaigns.length.toString(),
                    change: "+2 this month",
                    icon: Target,
                    tint: "sage",
                    desc: "across all brands",
                  },
                  {
                    label: "Avg. engagement",
                    value: avgEng.toFixed(1) + "%",
                    change: "+0.6%",
                    icon: Heart,
                    tint: "lavender",
                    desc: "vs. last month",
                  },
                  {
                    label: "Total reach",
                    value: compact(followers),
                    change: "+18.4%",
                    icon: Video,
                    tint: "butter",
                    desc: "combined followers",
                  },
                ].map((m) => (
                  <div className="metric-card" key={m.label}>
                    <div className="metric-top">
                      <span>{m.label}</span>
                      <span className={`metric-icon ${m.tint}`}>
                        <m.icon size={16} />
                      </span>
                    </div>
                    <div className="metric-value">{m.value}</div>
                    <div className="metric-foot">
                      <span className="positive">
                        <ArrowUpRight size={14} />
                        {m.change}
                      </span>
                      <span>{m.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dashboard-grid">
                <section className="panel performance-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Campaign performance</h2>
                      <p>Reach and engagement across your campaigns</p>
                    </div>
                    <button
                      className="select-button"
                      onClick={() => setPage("Analytics")}
                    >
                      Last 12 months <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="chart-legend">
                    <strong>
                      8.42M <span>total reach</span>
                    </strong>
                    <strong className="engage-legend">
                      5.8% <span>avg. engagement</span>
                    </strong>
                  </div>
                  <div className="chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trends}
                        margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="reachFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#f1768d"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="95%"
                              stopColor="#f1768d"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#573542" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#c5aab3", fontSize: 13 }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#c5aab3", fontSize: 13 }}
                        />
                        <Tooltip
                          contentStyle={{
                            border: "1px solid #48222f",
                            borderRadius: 12,
                            fontSize: 14,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="reach"
                          stroke="#f1768d"
                          strokeWidth={2.5}
                          fill="url(#reachFill)"
                        />
                        <Area
                          type="monotone"
                          dataKey="engagement"
                          stroke="#ffa1b1"
                          strokeWidth={2}
                          fill="transparent"
                          strokeDasharray="4 4"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <section className="panel channel-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Platform mix</h2>
                      <p>Creator audience by platform</p>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => setPage("Discovery")}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </div>
                  <div className="platform-list">
                    {["Instagram", "TikTok", "YouTube"].map((name, i) => {
                      const subset = people.filter((p) => p.platform === name),
                        total = subset.reduce(
                          (a, p) => a + (followerMetric(p) || 0),
                          0,
                        );
                      return (
                        <div className="platform-row" key={name}>
                          <span className={`platform-symbol platform-${i}`}>
                            {i === 0 ? (
                              <Instagram size={17} />
                            ) : i === 1 ? (
                              <Video size={17} />
                            ) : (
                              <Command size={17} />
                            )}
                          </span>
                          <span className="platform-name">
                            {name}
                            <small>{subset.length} creators</small>
                          </span>
                          <div className="platform-bar">
                            <i
                              style={{
                                width: `${Math.max(10, (total / (followers || 1)) * 100)}%`,
                                background: ["#f1768d", "#714052", "#50303d"][
                                  i
                                ],
                              }}
                            />
                          </div>
                          <b>{compact(total)}</b>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mini-note">
                    <span className="note-spark">✳</span>
                    <span>
                      <b>Instagram is your top channel</b>
                      <small>Driving 46% of your total creator reach.</small>
                    </span>
                    <ArrowRight size={15} />
                  </div>
                </section>
              </div>
              <div className="bottom-grid">
                <section className="panel campaigns-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Active campaigns</h2>
                      <p>Keep an eye on what’s in motion</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => setPage("Campaigns")}
                    >
                      View all <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="campaign-list">
                    {campaigns.slice(0, 3).map((c) => (
                      <div className="campaign-row" key={c.id}>
                        <div
                          className="brand-stamp"
                          style={{ background: c.color }}
                        >
                          {c.brand.slice(0, 1)}
                        </div>
                        <div className="campaign-info">
                          <b>{c.name}</b>
                          <small>
                            {c.brand} <span>·</span> {c.creators} creators
                          </small>
                        </div>
                        <div className="campaign-progress">
                          <div>
                            <span>
                              {Math.round((c.spent / c.budget) * 100)}% spent
                            </span>
                            <small>{money(c.budget - c.spent)} left</small>
                          </div>
                          <div className="progress">
                            <i
                              style={{
                                width: `${(c.spent / c.budget) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span
                          className={`status status-${c.status.toLowerCase()}`}
                        >
                          {c.status}
                        </span>
                        <button
                          className="row-more icon-button"
                          onClick={() => toast(`${c.name} · ${c.status}`)}
                        >
                          <Ellipsis size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="panel top-creators">
                  <div className="panel-heading">
                    <div>
                      <h2>Creator spotlight</h2>
                      <p>Your top performers this month</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => setPage("Influencers")}
                    >
                      See all <ArrowRight size={14} />
                    </button>
                  </div>
                  {[...people]
                    .sort(
                      (a, b) =>
                        (engagementMetric(b) ?? -1) -
                        (engagementMetric(a) ?? -1),
                    )
                    .slice(0, 3)
                    .map((p, i) => (
                      <button
                        className="spotlight-row"
                        key={p.id}
                        onClick={() => setSelected(p)}
                      >
                        <span className="rank">0{i + 1}</span>
                        <Avatar p={p} size={38} />
                        <span className="spotlight-name">
                          <b>{p.name}</b>
                          <small>{p.handle}</small>
                        </span>
                        <span className="spotlight-score">
                          <b>
                            {engagementMetric(p) === null
                              ? "—"
                              : `${engagementMetric(p)}%`}
                          </b>
                          <small>engagement</small>
                        </span>
                        <ArrowUpRight size={15} className="muted" />
                      </button>
                    ))}
                </section>
              </div>
              <div className="sample-note">
                <span>
                  <Sparkles size={13} /> Sample workspace
                </span>{" "}
                Metrics and profiles use sample data for demonstration. Connect
                your own records to see your numbers.
              </div>
            </>
          )}
          {["Influencers", "Discovery"].includes(page) && (
            <>
              <div className="welcome-row compact-welcome">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-mark">✳</span> CREATOR NETWORK
                  </div>
                  <h1>
                    {page === "Discovery"
                      ? "Find your next great fit"
                      : "Your influencers"}
                  </h1>
                  <p>
                    {page === "Discovery"
                      ? "Explore your roster and find creators that fit the brief."
                      : "One home for every creator relationship."}
                  </p>
                </div>
                <button
                  className="button button-dark"
                  onClick={() => setModal("influencer")}
                >
                  <Plus size={16} /> Add influencer
                </button>
              </div>
              {page === "Discovery" && (
                <div className="discovery-callout">
                  <Sparkles size={17} />
                  <span>
                    <b>Creator discovery, made thoughtful.</b> Browse your
                    sample roster or add creators you’ve vetted.
                  </span>
                  <button onClick={() => setPage("Influencers")}>
                    Open your database <ArrowRight size={14} />
                  </button>
                </div>
              )}
              <section className="panel directory-panel">
                <div className="directory-toolbar">
                  <div className="search-box">
                    <Search size={17} />
                    <input
                      placeholder="Search creators, niches, handles..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <kbd>⌘ K</kbd>
                  </div>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    <option>All platforms</option>
                    <option>Instagram</option>
                    <option>TikTok</option>
                    <option>YouTube</option>
                  </select>
                  <button
                    className="button button-outline"
                    onClick={() => toast("Showing all saved creators")}
                  >
                    <Filter size={15} /> Filters
                  </button>
                  <div className="toolbar-spacer" />
                  <button className="button button-outline" onClick={exportCsv}>
                    <Download size={15} /> Export
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" aria-label="Select all" />
                        </th>
                        <th>
                          CREATOR <ArrowDownUp size={12} />
                        </th>
                        <th>PLATFORM</th>
                        <th>NICHE</th>
                        <th>
                          FOLLOWERS <ArrowDown size={12} />
                        </th>
                        <th>AVG. VIEWS</th>
                        <th>ENGAGEMENT</th>
                        <th>RATE CARD</th>
                        <th>STATUS</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Select ${p.name}`}
                            />
                          </td>
                          <td>
                            <button
                              className="creator-cell"
                              onClick={() => setSelected(p)}
                            >
                              <Avatar p={p} size={36} />
                              <span>
                                <b>{p.name}</b>
                                <small>{p.handle}</small>
                              </span>
                            </button>
                          </td>
                          <td>
                            <span className="platform-cell">
                              {p.platform === "Instagram" ? (
                                <Instagram size={14} />
                              ) : (
                                <Video size={14} />
                              )}{" "}
                              {p.platform}
                            </span>
                          </td>
                          <td>{p.niche}</td>
                          <td>{displayMetric(followerMetric(p), compact)}</td>
                          <td>{displayMetric(viewsMetric(p), compact)}</td>
                          <td>
                            <span className="engagement-pill">
                              {engagementMetric(p) === null
                                ? "—"
                                : `${engagementMetric(p)}%`}
                            </span>
                          </td>
                          <td>
                            {p.externalProfile && p.price === 0
                              ? "—"
                              : money(p.price)}
                          </td>
                          <td>
                            {p.externalProfile ? (
                              <span
                                className="source-badge"
                                title={`Source: ${p.externalProfile.dataSource}`}
                              >
                                {p.externalProfile.dataSource
                                  .replace("-api", " API")
                                  .replace("-", " ")}
                              </span>
                            ) : (
                              <span
                                className={`status status-${p.status.toLowerCase()}`}
                              >
                                {p.status}
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              className="icon-button"
                              onClick={() => setSelected(p)}
                            >
                              <Ellipsis size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="empty-state">
                      No creators match your search. Try another name or
                      platform.
                    </div>
                  )}
                </div>
                <div className="table-footer">
                  <span>
                    Showing <b>{filtered.length}</b> of <b>{people.length}</b>{" "}
                    creators <span className="sample-tag">Sample data</span>
                  </span>
                  <div>
                    <button className="icon-button disabled">
                      <ChevronLeft size={16} />
                    </button>
                    <button className="page-number">1</button>
                    <button className="icon-button disabled">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
          {page === "Campaigns" && (
            <>
              <div className="welcome-row compact-welcome">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-mark">✳</span> YOUR PARTNERSHIPS
                  </div>
                  <h1>Campaigns, in motion</h1>
                  <p>
                    Plan thoughtful collaborations and keep every detail in
                    view.
                  </p>
                </div>
                <button
                  className="button button-dark"
                  onClick={() => setModal("campaign")}
                >
                  <Plus size={16} /> New campaign
                </button>
              </div>
              <div className="campaign-summary">
                {[
                  ["All campaigns", campaigns.length],
                  [
                    "In progress",
                    campaigns.filter((c) => c.status === "Active").length,
                  ],
                  ["Total budget", money(budget)],
                  [
                    "Budget utilized",
                    money(campaigns.reduce((s, c) => s + c.spent, 0)),
                  ],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <span>{k}</span>
                    <b>{v}</b>
                  </div>
                ))}
              </div>
              <section className="campaign-cards">
                {campaigns.map((c) => (
                  <article className="panel campaign-card" key={c.id}>
                    <div className="campaign-card-top">
                      <div
                        className="brand-stamp large"
                        style={{ background: c.color }}
                      >
                        {c.brand.slice(0, 1)}
                      </div>
                      <span
                        className={`status status-${c.status.toLowerCase()}`}
                      >
                        {c.status}
                      </span>
                      <button
                        className="icon-button"
                        onClick={() => toast(`${c.name} · ${c.goal}`)}
                      >
                        <Ellipsis size={17} />
                      </button>
                    </div>
                    <div className="eyebrow">{c.brand.toUpperCase()}</div>
                    <h2>{c.name}</h2>
                    <p>
                      {c.goal} <span>·</span> {c.creators} creators
                    </p>
                    <div className="campaign-card-meta">
                      <span>
                        <CalendarDays size={14} />
                        {c.start} – {c.end}
                      </span>
                      <b>{money(c.budget)}</b>
                    </div>
                    <div className="progress">
                      <i style={{ width: `${(c.spent / c.budget) * 100}%` }} />
                    </div>
                    <div className="campaign-card-meta muted">
                      <span>{money(c.spent)} spent</span>
                      <span>
                        {Math.round((c.spent / c.budget) * 100)}% utilized
                      </span>
                    </div>
                    <button
                      className="campaign-detail"
                      onClick={() => toast("Campaign details opened")}
                    >
                      View campaign <ArrowRight size={14} />
                    </button>
                  </article>
                ))}
              </section>
            </>
          )}
          {page === "Calculator" && (
            <>
              <section className="noor-calculator-hero">
                <h1>Engagement Calculator</h1>
                <div className="social-marks">
                  <span className="ig-mark">
                    <Instagram size={15} />
                  </span>
                  <span className="tt-mark">♪</span>
                  <span className="yt-mark">▶</span>
                  <span className="fb-mark">f</span>
                </div>
                <p>
                  Enter one or multiple usernames or profile links to get
                  real-time insights
                </p>
                <form
                  className="noor-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const match = people.find(
                      (p) =>
                        p.handle.toLowerCase() ===
                          analysisQuery.toLowerCase() ||
                        p.name.toLowerCase() === analysisQuery.toLowerCase() ||
                        p.handle
                          .toLowerCase()
                          .includes(
                            analysisQuery.replace("@", "").toLowerCase(),
                          ),
                    );
                    if (match) {
                      setAnalysisPerson(match);
                      toast("Showing a matching sample profile");
                    } else
                      toast(
                        "Profile not in sample data. Use manual metrics below.",
                      );
                  }}
                >
                  <Search size={15} />
                  <input
                    value={analysisQuery}
                    onChange={(e) => setAnalysisQuery(e.target.value)}
                    placeholder="Enter one or multiple usernames or profile links to get real-time insights"
                  />
                  <button type="submit">ANALYZE</button>
                </form>
              </section>
              {analysisPerson && (
                <section className="panel noor-result">
                  <div className="noor-profile">
                    <Avatar p={analysisPerson} size={56} />
                    <div>
                      <b>{analysisPerson.name}</b>
                      <span>
                        {analysisPerson.handle} · {analysisPerson.platform} ·
                        SAMPLE DATA
                      </span>
                    </div>
                    <button
                      className="button button-outline"
                      onClick={() => {
                        setAnalysisPerson(null);
                        setSelected(analysisPerson);
                      }}
                    >
                      View profile <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="noor-result-stats">
                    <div>
                      <span>Avg. Engagement Rate</span>
                      <b>{analysisPerson.engagement}%</b>
                    </div>
                    <div>
                      <span>Avg. Engagements</span>
                      <b>
                        {Math.round(
                          (analysisPerson.followers *
                            analysisPerson.engagement) /
                            100,
                        ).toLocaleString()}
                      </b>
                    </div>
                    <div>
                      <span>Avg. Views</span>
                      <b>{analysisPerson.views.toLocaleString()}</b>
                    </div>
                  </div>
                  <div className="chart noor-result-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trends.slice(0, 10)}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#48222f" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="reach"
                          stroke="#f1768d"
                          fill="#f1768d22"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}
              <details className="manual-calculator">
                <summary>
                  Calculate manually from post metrics <ChevronDown size={14} />
                </summary>
                <div className="calculator-layout">
                  <section className="panel calculator-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Enter creator metrics</h2>
                        <p>Use numbers from a recent post or campaign brief.</p>
                      </div>
                    </div>
                    {calcInputs}
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={calc.includeShares}
                        onChange={(e) =>
                          setCalc({ ...calc, includeShares: e.target.checked })
                        }
                      />{" "}
                      Include shares in engagement rate
                    </label>
                    <div className="formula-box">
                      <b>
                        Engagement rate = (likes + comments
                        {calc.includeShares ? " + shares" : ""}) ÷ followers ×
                        100
                      </b>
                      <span>
                        Uses followers as the denominator. For a video-specific
                        rate, use views.
                      </span>
                    </div>
                  </section>
                  <section className="panel result-panel">
                    <span className="metric-icon sage">
                      <Gauge size={17} />
                    </span>
                    <div className="eyebrow">ENGAGEMENT RATE</div>
                    <div className="result-value">
                      {rate.toFixed(2)}
                      <span>%</span>
                    </div>
                    <p>
                      {rate >= 5
                        ? "A strong engagement signal for this audience."
                        : rate >= 3
                          ? "A healthy rate. Compare with similar creators and formats."
                          : "Consider reviewing a few posts for more context."}
                    </p>
                    <div className="result-divider" />
                    <div className="result-detail">
                      <span>Followers</span>
                      <b>{Number(calc.followers).toLocaleString()}</b>
                    </div>
                    <div className="result-detail">
                      <span>Total interactions</span>
                      <b>
                        {(
                          Number(calc.likes) +
                          Number(calc.comments) +
                          (calc.includeShares ? Number(calc.shares) : 0)
                        ).toLocaleString()}
                      </b>
                    </div>
                    <button
                      className="button button-outline full-button"
                      onClick={() => toast("Calculation saved locally")}
                    >
                      Save this calculation <ArrowRight size={15} />
                    </button>
                  </section>
                </div>
                <section className="panel view-calc">
                  <div>
                    <h2>Engagement by views</h2>
                    <p>
                      Useful for video-first platforms like TikTok and YouTube.
                    </p>
                  </div>
                  <b>
                    {Number(calc.views) > 0
                      ? (
                          ((Number(calc.likes) + Number(calc.comments)) /
                            Number(calc.views)) *
                          100
                        ).toFixed(2) + "%"
                      : "Add views above to calculate"}
                  </b>
                  <span>(likes + comments) ÷ views × 100</span>
                </section>
              </details>
            </>
          )}
          {page === "Analytics" && (
            <>
              <div className="welcome-row compact-welcome">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-mark">✳</span> INSIGHTS & REPORTS
                  </div>
                  <h1>See the bigger picture</h1>
                  <p>A thoughtful overview of your creator partnerships.</p>
                </div>
                <button className="button button-outline" onClick={exportCsv}>
                  <Download size={15} /> Export report
                </button>
              </div>
              <div className="metric-grid analytics-metrics">
                {[
                  {
                    label: "Total creator reach",
                    value: compact(followers),
                    icon: Users,
                    tint: "sage",
                  },
                  {
                    label: "Estimated total views",
                    value: compact(views),
                    icon: Video,
                    tint: "peach",
                  },
                  {
                    label: "Avg. engagement rate",
                    value: avgEng.toFixed(1) + "%",
                    icon: Heart,
                    tint: "lavender",
                  },
                  {
                    label: "Campaign investment",
                    value: money(budget),
                    icon: Wallet,
                    tint: "butter",
                  },
                ].map((m) => (
                  <div className="metric-card" key={m.label}>
                    <div className="metric-top">
                      <span>{m.label}</span>
                      <span className={`metric-icon ${m.tint}`}>
                        <m.icon size={16} />
                      </span>
                    </div>
                    <div className="metric-value">{m.value}</div>
                    <div className="metric-foot">
                      <span className="positive">
                        <ArrowUpRight size={14} /> 12.4%
                      </span>
                      <span>vs. previous period</span>
                    </div>
                  </div>
                ))}
              </div>
              <section className="panel performance-panel analytics-chart">
                <div className="panel-heading">
                  <div>
                    <h2>Performance over time</h2>
                    <p>Reach growth and engagement trend by month</p>
                  </div>
                  <button className="select-button">
                    Jan – Dec 2025 <ChevronDown size={14} />
                  </button>
                </div>
                <div className="chart-legend">
                  <strong>
                    8.42M <span>total reach</span>
                  </strong>
                  <strong className="engage-legend">
                    5.8% <span>avg. engagement</span>
                  </strong>
                </div>
                <div className="chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trends}
                      margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="reachFill2"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#f1768d"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f1768d"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#573542" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#c5aab3", fontSize: 13 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#c5aab3", fontSize: 13 }}
                      />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="reach"
                        stroke="#f1768d"
                        strokeWidth={2.5}
                        fill="url(#reachFill2)"
                      />
                      <Area
                        type="monotone"
                        dataKey="engagement"
                        stroke="#ffa1b1"
                        strokeWidth={2}
                        fill="transparent"
                        strokeDasharray="4 4"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <div className="bottom-grid">
                <section className="panel campaigns-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Budget vs. spend</h2>
                      <p>Campaign investment at a glance</p>
                    </div>
                  </div>
                  {campaigns.map((c) => (
                    <div className="budget-row" key={c.id}>
                      <span>{c.name}</span>
                      <b>
                        {money(c.spent)} <small>of {money(c.budget)}</small>
                      </b>
                      <div className="progress">
                        <i
                          style={{ width: `${(c.spent / c.budget) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </section>
                <section className="panel top-creators">
                  <div className="panel-heading">
                    <div>
                      <h2>Top creators</h2>
                      <p>Ranked by engagement rate</p>
                    </div>
                  </div>
                  {[...people]
                    .sort(
                      (a, b) =>
                        (engagementMetric(b) ?? -1) -
                        (engagementMetric(a) ?? -1),
                    )
                    .slice(0, 4)
                    .map((p, i) => (
                      <button
                        className="spotlight-row"
                        key={p.id}
                        onClick={() => setSelected(p)}
                      >
                        <span className="rank">0{i + 1}</span>
                        <Avatar p={p} size={35} />
                        <span className="spotlight-name">
                          <b>{p.name}</b>
                          <small>{p.platform}</small>
                        </span>
                        <span className="spotlight-score">
                          <b>
                            {engagementMetric(p) === null
                              ? "—"
                              : `${engagementMetric(p)}%`}
                          </b>
                        </span>
                      </button>
                    ))}
                </section>
              </div>
              <div className="sample-note">
                <span>
                  <Sparkles size={13} /> Sample workspace
                </span>{" "}
                Historical trend chart is illustrative sample data; other
                metrics are calculated from your local records.
              </div>
            </>
          )}
          {page === "Import" && (
            <ProfileImport
              onClose={() => {
                setPage("Influencers");
                setRefreshTarget(null);
              }}
              onSave={saveImportedProfile}
              onManual={() => {
                setPage("Influencers");
                setModal("influencer");
              }}
              initialUrl={refreshUrl}
              refresh={refreshTarget !== null}
            />
          )}
          {page === "Settings" && (
            <>
              <div className="welcome-row compact-welcome">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-mark">✳</span> PREFERENCES
                  </div>
                  <h1>Workspace settings</h1>
                  <p>Make this space feel like yours.</p>
                </div>
              </div>
              <section className="panel settings-panel">
                <h2>Workspace profile</h2>
                <p>Basic details for your creator partnerships workspace.</p>
                <label>
                  Workspace name
                  <input value="Noor Creative" readOnly />
                </label>
                <label>
                  Default currency
                  <select defaultValue="USD">
                    <option>USD — US Dollar</option>
                    <option>EUR — Euro</option>
                    <option>GBP — British Pound</option>
                  </select>
                </label>
                <label>
                  Data storage
                  <span className="settings-readout">
                    Local browser storage{" "}
                    <span className="status status-active">Connected</span>
                  </span>
                </label>
                <div className="settings-foot">
                  <span>
                    Your influencer and campaign data stays in this browser.
                  </span>
                  <button
                    className="button button-outline"
                    onClick={() => {
                      localStorage.removeItem(peopleStorageKey);
                      localStorage.removeItem(campaignsStorageKey);
                      location.reload();
                    }}
                  >
                    Reset sample workspace
                  </button>
                </div>
              </section>
              <div className="sample-note">
                <span>
                  <Sparkles size={13} /> Local-first workspace
                </span>{" "}
                This MVP stores changes in localStorage. Connect a backend or
                Google Sheets integration when you’re ready to share data across
                your team.
              </div>
            </>
          )}
          <footer className="footer">
            <span>© 2026 Noor Creative</span>
            <span>
              Made for better partnerships{" "}
              <span className="footer-spark">✳</span>
            </span>
          </footer>
        </div>
      </main>
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setModal("")}
        >
          <div className="modal">
            <div className="modal-head">
              <div>
                <div className="eyebrow">ADD TO YOUR WORKSPACE</div>
                <h2>
                  {modal === "influencer"
                    ? "Add an influencer"
                    : "Start a campaign"}
                </h2>
              </div>
              <button className="icon-button" onClick={() => setModal("")}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={modal === "influencer" ? addPerson : addCampaign}>
              {modal === "influencer" ? (
                <>
                  <div className="form-grid">
                    <label>
                      Full name
                      <input
                        required
                        name="name"
                        placeholder="e.g. Alex Morgan"
                      />
                    </label>
                    <label>
                      Username
                      <input required name="handle" placeholder="@username" />
                    </label>
                    <label>
                      Platform
                      <select name="platform">
                        <option>Instagram</option>
                        <option>TikTok</option>
                        <option>YouTube</option>
                      </select>
                    </label>
                    <label>
                      Niche
                      <input required name="niche" placeholder="e.g. Beauty" />
                    </label>
                    <label>
                      Country
                      <input
                        required
                        name="country"
                        placeholder="e.g. Canada"
                      />
                    </label>
                    <label>
                      Followers
                      <input
                        required
                        name="followers"
                        type="number"
                        min="1"
                        placeholder="25000"
                      />
                    </label>
                    <label>
                      Engagement rate (%)
                      <input
                        required
                        name="engagement"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="4.5"
                      />
                    </label>
                    <label>
                      Rate card (USD)
                      <input
                        required
                        name="price"
                        type="number"
                        min="0"
                        placeholder="1200"
                      />
                    </label>
                    <label className="form-wide">
                      Email
                      <input
                        required
                        name="email"
                        type="email"
                        placeholder="creator@example.com"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <div className="form-grid">
                  <label>
                    Campaign name
                    <input
                      required
                      name="name"
                      placeholder="e.g. Summer, Naturally"
                    />
                  </label>
                  <label>
                    Brand or client
                    <input required name="brand" placeholder="e.g. Aesop" />
                  </label>
                  <label>
                    Objective
                    <select name="goal">
                      <option>Brand awareness</option>
                      <option>Product launch</option>
                      <option>Engagement</option>
                      <option>Conversions</option>
                      <option>Content creation</option>
                    </select>
                  </label>
                  <label>
                    Campaign budget (USD)
                    <input
                      required
                      name="budget"
                      type="number"
                      min="1"
                      placeholder="15000"
                    />
                  </label>
                </div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setModal("")}
                >
                  Cancel
                </button>
                <button className="button button-dark">
                  <Plus size={15} />
                  {modal === "influencer"
                    ? "Add influencer"
                    : "Create campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="modal profile-modal">
            <button
              className="icon-button profile-close"
              onClick={() => setSelected(null)}
            >
              <X size={18} />
            </button>
            <div className="profile-hero">
              <Avatar p={selected} size={70} />
              <div>
                <span className="eyebrow">
                  {selected.platform.toUpperCase()} CREATOR
                </span>
                <h2>{selected.name}</h2>
                <p>
                  {selected.handle} <span>·</span> {selected.country}
                </p>
              </div>
            </div>
            <div className="profile-stats">
              <div>
                <span>Followers</span>
                <b>
                  {selected.externalProfile
                    ? displayMetric(
                        selected.externalProfile.followerCount,
                        (n) => n.toLocaleString(),
                      )
                    : selected.followers.toLocaleString()}
                </b>
              </div>
              <div>
                <span>Avg. views</span>
                <b>
                  {selected.externalProfile
                    ? displayMetric(viewsMetric(selected), (n) =>
                        n.toLocaleString(),
                      )
                    : selected.views.toLocaleString()}
                </b>
              </div>
              <div>
                <span>Engagement</span>
                <b>
                  {selected.externalProfile
                    ? displayMetric(
                        selected.externalProfile.engagementRate,
                        (n) => `${n}%`,
                      )
                    : `${selected.engagement}%`}
                </b>
              </div>
            </div>
            <div className="profile-info">
              <span>Display name</span>
              <b>{selected.externalProfile?.displayName || selected.name}</b>
              <span>Bio</span>
              <b>{selected.externalProfile?.bio || "—"}</b>
              <span>Following</span>
              <b>
                {selected.externalProfile
                  ? displayMetric(
                      selected.externalProfile.followingCount,
                      (n) => n.toLocaleString(),
                    )
                  : "—"}
              </b>
              <span>Posts / videos</span>
              <b>
                {selected.externalProfile
                  ? displayMetric(selected.externalProfile.contentCount, (n) =>
                      n.toLocaleString(),
                    )
                  : "—"}
              </b>
              <span>Content niche</span>
              <b>{selected.niche || "—"}</b>
              <span>Rate card</span>
              <b>
                {selected.price > 0
                  ? `${money(selected.price)} per collaboration`
                  : "—"}
              </b>
              <span>Contact</span>
              <b>{selected.email || "—"}</b>
              <span>Campaign history</span>
              <b>
                {selected.id % 2 === 0 ? "2 collaborations" : "1 collaboration"}
              </b>
            </div>
            {selected.externalProfile && (
              <section className="external-profile-meta">
                <div>
                  <span>Data source</span>
                  <b>{selected.externalProfile.dataSource}</b>
                </div>
                <div>
                  <span>Last updated</span>
                  <b>
                    {new Date(
                      selected.externalProfile.lastRefreshedAt,
                    ).toLocaleString()}
                  </b>
                </div>
                <div>
                  <span>Refresh state</span>
                  <b className="refresh-state">
                    {Date.now() -
                      Date.parse(selected.externalProfile.lastRefreshedAt) >
                    7 * 86400000
                      ? "Stale · older than 7 days"
                      : selected.externalProfile.retrievalStatus}
                  </b>
                </div>
                <div className="external-actions">
                  <a
                    href={selected.externalProfile.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open social profile
                  </a>
                  <button
                    className="button button-outline"
                    onClick={() => {
                      setRefreshTarget(selected.id);
                      setRefreshUrl(selected.externalProfile!.profileUrl);
                      setSelected(null);
                      setPage("Import");
                    }}
                  >
                    <RefreshCw size={14} /> Refresh Profile Data
                  </button>
                </div>
              </section>
            )}
            {selected.externalProfile?.recentContent.length ? (
              <section className="external-posts">
                <h3>Recent public content</h3>
                {selected.externalProfile.recentContent.map((item, index) => (
                  <article className="external-post" key={item.id || index}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.mediaType || "Open content"}
                      </a>
                    ) : (
                      <span>{item.mediaType || "Content item"}</span>
                    )}
                    <small>
                      {item.publishedAt?.slice(0, 10) || "Date unavailable"}
                    </small>
                    {item.caption && <p>{item.caption}</p>}
                    <small>
                      Views {item.views ?? "—"} · Likes {item.likes ?? "—"} ·
                      Comments {item.comments ?? "—"} · Shares{" "}
                      {item.shares ?? "—"}
                    </small>
                  </article>
                ))}
              </section>
            ) : null}
            {selected.externalProfile?.providerWarning && (
              <p className="external-warning">
                {selected.externalProfile.providerWarning}
              </p>
            )}
            <div className="modal-actions">
              <button
                className="button button-outline"
                onClick={() => {
                  navigator.clipboard?.writeText(selected.email);
                  toast("Email copied to clipboard");
                }}
              >
                Copy contact
              </button>
              <button
                className="button button-dark"
                onClick={() => {
                  setSelected(null);
                  setPage("Campaigns");
                  toast("Choose a campaign to manage creator assignments");
                }}
              >
                Add to campaign <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
      {notice && (
        <div className="toast">
          <Check size={15} />
          {notice}
        </div>
      )}
    </div>
  );
}
export default App;
