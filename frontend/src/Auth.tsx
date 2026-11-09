import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { ArrowRight, LockKeyhole, Mail, Sparkles } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

type AuthContextValue = {
  session: Session;
  user: Session["user"];
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function LoginScreen({ client }: { client: SupabaseClient | null }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        const { error: loginError } = await client.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) throw loginError;
      } else {
        const { data, error: signupError } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });

        if (signupError) throw signupError;

        if (!data.session) {
          setMessage("Cek email kamu untuk menyelesaikan verifikasi akun.");
        }
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Login gagal. Coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-brand-panel">
        <div className="auth-brand-mark">
          Noor<span> Creative</span>
        </div>
        <div className="auth-brand-copy">
          <span className="auth-eyebrow">CREATOR PARTNERSHIPS</span>
          <h1>Better partnerships start here.</h1>
          <p>Kelola kreator, kampanye, dan insight dalam satu ruang kerja.</p>
        </div>
        <div className="auth-brand-footer">
          <Sparkles size={16} /> Creator partnerships, made clearer.
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <span className="auth-mobile-brand">
            Noor<span> Creative</span>
          </span>
          <span className="auth-eyebrow">YOUR WORKSPACE</span>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Masuk untuk melanjutkan ke dashboard kamu."
              : "Daftar untuk mulai menggunakan dashboard."}
          </p>

          {!client && (
            <div className="auth-notice" role="status">
              Login belum tersambung. Isi <code>VITE_SUPABASE_URL</code> dan{" "}
              <code>VITE_SUPABASE_ANON_KEY</code> di <code>frontend/.env</code>,
              lalu jalankan ulang frontend dengan <code>npm run dev</code> dari
              folder <code>frontend</code>.
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="auth-email">Email</label>
            <div className="auth-input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input
                autoComplete="email"
                id="auth-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                required
                type="email"
                value={email}
              />
            </div>

            <label htmlFor="auth-password">Password</label>
            <div className="auth-input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                id="auth-password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                required
                type="password"
                value={password}
              />
            </div>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="auth-success" role="status">
                {message}
              </p>
            )}

            <button
              className="auth-submit"
              disabled={!client || busy}
              type="submit"
            >
              {busy
                ? "Memproses..."
                : mode === "login"
                  ? "Masuk ke dashboard"
                  : "Buat akun"}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setMessage("");
              }}
              type="button"
            >
              {mode === "login" ? "Daftar" : "Masuk"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useMemo(
    () =>
      supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null,
    [],
  );
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(client));

  useEffect(() => {
    if (!client) return;

    let active = true;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setSession(null);
      else setSession(data.session);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  if (!client) return <LoginScreen client={null} />;
  if (loading) {
    return <main className="auth-loading">Memeriksa sesi login...</main>;
  }
  if (!session) return <LoginScreen client={client} />;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session.user,
        signOut: async () => {
          await client.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth)
    throw new Error("useAuth must be used inside an authenticated app.");
  return auth;
}
