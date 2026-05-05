"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const EMPLOYEE_NAMES = [
  "Sunil", "Ali", "Mahesh", "Ritanjali", "Nesiya", "BRINDA", "GUNASAGARI",
  "Rakesh", "RISHI", "Shashi", "Naveen", "Hariprasad", "HARI", "KIRAN", "CHANDAN", "MANTU",
];

export default function LoginPage() {
  const [selected, setSelected] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    if (!selected || !password) { setError("Select your name and enter password"); return; }
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      username: selected,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) router.push("/dashboard");
    else setError("Invalid credentials. Contact your admin.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-primary)" }}>
      {/* Background grid */}
      <div className="fixed inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <div className="relative w-full max-w-md fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-green"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="var(--accent)" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Cautio
          </h1>
          <p className="text-sm font-semibold tracking-widest mt-1" style={{ color: "var(--accent)" }}>
            FLEET INTELLIGENCE
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 glow-green">
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            Sign In
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Select your name to access your dashboard
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                EMPLOYEE NAME
              </label>
              <select value={selected} onChange={e => setSelected(e.target.value)}>
                <option value="">-- Select your name --</option>
                {EMPLOYEE_NAMES.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                PASSWORD
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-sm p-3 rounded-lg" style={{ background: "#1a0a0a", border: "1px solid #3d1111", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-3 text-sm" disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          Cautio Fleet Intelligence · Secured
        </p>
      </div>
    </div>
  );
}
