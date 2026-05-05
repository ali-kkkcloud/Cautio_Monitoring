"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const RANGE_TABS = ["today", "week", "month", "all"];
const RANGE_LABELS = { today: "Today", week: "This Week", month: "This Month", all: "All Time" };

function StatCard({ label, value, color = "var(--accent)", icon }) {
  return (
    <div className="card p-5 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
          <p className="text-3xl font-bold" style={{ color }}>{value ?? "—"}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function ClientSubmitRow({ client, hour, onSubmit }) {
  const [vehicles, setVehicles] = useState("");
  const [alerts, setAlerts] = useState("");
  const [fatigue, setFatigue] = useState("No");
  const [fatigueCount, setFatigueCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!vehicles && !alerts && fatigue === "No") {
      setError("Enter at least one value");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: client,
          misalignmentVehicles: vehicles,
          alertCount: parseInt(alerts) || 0,
          fatigueStatus: fatigue,
          fatigueCount: parseInt(fatigueCount) || 0,
          hour,
        }),
      });
      const data = await res.json();
      if (data.success) { setDone(true); onSubmit && onSubmit(); }
      else setError(data.error || "Failed");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium"
        style={{ background: "#0a1f12", border: "1px solid #1a4a2a", color: "var(--accent)" }}>
        ✓ {client} — Submitted
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{client}</span>
        {error && <span className="text-xs" style={{ color: "#f87171" }}>{error}</span>}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Misalign Vehicles</label>
          <input placeholder="MH01AB, MH02CD..." value={vehicles} onChange={e => setVehicles(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Alert Count</label>
          <input type="number" min="0" placeholder="0" value={alerts} onChange={e => setAlerts(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Fatigue Alert</label>
          <select value={fatigue} onChange={e => setFatigue(e.target.value)}>
            <option>No</option>
            <option>Yes</option>
          </select>
        </div>
        {fatigue === "Yes" && (
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Fatigue Count</label>
            <input type="number" min="1" placeholder="0" value={fatigueCount} onChange={e => setFatigueCount(e.target.value)} />
          </div>
        )}
      </div>
      <button className="btn-primary text-xs px-4 py-2" onClick={handleSubmit} disabled={loading}>
        {loading ? "Submitting..." : "Submit →"}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [range, setRange] = useState("today");
  const [stats, setStats] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [currentHour, setCurrentHour] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [clock, setClock] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Live clock in IST
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const ist = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
      }).format(now);
      const hour = parseInt(new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata", hour: "numeric", hour12: false
      }).format(now));
      setClock(ist.toUpperCase());
      setCurrentHour(hour);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/stats?range=${range}`);
      const data = await res.json();
      setStats(data);
    } catch {}
    setLoadingStats(false);
  }, [range]);

  const fetchSchedule = useCallback(async () => {
    setLoadingSchedule(true);
    try {
      const res = await fetch("/api/schedule");
      const data = await res.json();
      setSchedule(data);
    } catch {}
    setLoadingSchedule(false);
  }, []);

  useEffect(() => { if (status === "authenticated") fetchStats(); }, [fetchStats, status]);
  useEffect(() => { if (status === "authenticated") fetchSchedule(); }, [fetchSchedule, status]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="text-sm pulse" style={{ color: "var(--accent)" }}>Loading...</div>
      </div>
    );
  }

  const emp = session?.user;
  const shift = emp?.shift;

  const TIME_SLOT_LABELS = {
    7: "7:00–8:00 AM", 8: "8:00–9:00 AM", 9: "9:00–10:00 AM", 10: "10:00–11:00 AM",
    11: "11:00–12:00 PM", 12: "12:00–1:00 PM", 13: "1:00–2:00 PM", 14: "2:00–3:00 PM",
    15: "3:00–4:00 PM", 16: "4:00–5:00 PM", 17: "5:00–6:00 PM", 18: "6:00–7:00 PM",
    19: "7:00–8:00 PM", 20: "8:00–9:00 PM", 21: "9:00–10:00 PM", 22: "10:00–11:00 PM",
    23: "11:00–12:00 AM", 0: "12:00–1:00 AM", 1: "1:00–2:00 AM", 2: "2:00–3:00 AM",
    3: "3:00–4:00 AM", 4: "4:00–5:00 AM", 5: "5:00–6:00 AM", 6: "6:00–7:00 AM",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Fixed header */}
      <header style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="var(--accent)" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold">Cautio</div>
            <div className="text-xs tracking-widest" style={{ color: "var(--accent)" }}>FLEET INTELLIGENCE</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>IST</div>
            <div className="text-sm font-mono font-bold" style={{ color: "var(--accent)" }}>{clock}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{emp?.employeeName}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {shift?.isNight ? "🌙 Night Shift" : "☀️ Day Shift"} · {shift?.start}:00–{shift?.end}:00
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs px-3 py-2 rounded-lg transition-colors"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="pt-24 px-4 pb-8 max-w-7xl mx-auto">
        {/* CLIENT · INFANTS style breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--accent)" }}>
            <span>EMPLOYEE</span><span>·</span><span>{emp?.employeeName?.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Fleet Safety <span style={{ color: "var(--accent)" }}>Dashboard,</span> At a Glance
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Real-time monitoring performance across all your assigned clients.
          </p>
        </div>

        {/* Range tabs */}
        <div className="flex gap-2 mb-6">
          {RANGE_TABS.map(tab => (
            <button key={tab}
              onClick={() => setRange(tab)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: range === tab ? "var(--accent)" : "var(--bg-card)",
                color: range === tab ? "#000" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}>
              {RANGE_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="MISALIGNMENTS" value={loadingStats ? "..." : stats?.totals?.misalignments ?? 0} icon="⚠️" />
          <StatCard label="TOTAL ALERTS" value={loadingStats ? "..." : stats?.totals?.alerts ?? 0} icon="🚨" color="#fbbf24" />
          <StatCard label="FATIGUE ALERTS" value={loadingStats ? "..." : stats?.totals?.fatigue ?? 0} icon="😴" color="#c084fc" />
          <StatCard label="CLIENTS ACTIVE" value={loadingStats ? "..." : stats?.clientBreakdown?.length ?? 0} icon="🚗" color="#60a5fa" />
        </div>

        {/* Current Schedule */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Current Time Slot</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {currentHour !== null ? TIME_SLOT_LABELS[currentHour] : "Loading..."}
              </p>
            </div>
            <button onClick={fetchSchedule}
              className="text-xs px-3 py-2 rounded-lg"
              style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              ↻ Refresh
            </button>
          </div>

          {loadingSchedule ? (
            <div className="card p-6 text-center text-sm pulse" style={{ color: "var(--text-muted)" }}>
              Loading your schedule...
            </div>
          ) : schedule?.message ? (
            <div className="card p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              {schedule.message}
            </div>
          ) : !schedule?.clients?.length ? (
            <div className="card p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              ✅ No clients assigned for this time slot, or shift not active.
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.clients.map(client => (
                <ClientSubmitRow
                  key={client}
                  client={client}
                  hour={currentHour}
                  onSubmit={fetchStats}
                />
              ))}
            </div>
          )}
        </div>

        {/* Client Breakdown Table */}
        {stats?.clientBreakdown?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Client Breakdown — {RANGE_LABELS[range]}</h2>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--bg-card2)", borderBottom: "1px solid var(--border)" }}>
                      {["Client", "Misalignments", "Alerts", "Fatigue"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest"
                          style={{ color: "var(--text-muted)" }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.clientBreakdown.map((row, i) => (
                      <tr key={row.client}
                        style={{ borderBottom: "1px solid var(--border)", background: i % 2 ? "var(--bg-card2)" : "transparent" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{row.client}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded text-xs font-bold"
                            style={{ background: row.misalignments > 0 ? "#1a2e1a" : "transparent", color: row.misalignments > 0 ? "var(--accent)" : "var(--text-muted)" }}>
                            {row.misalignments}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded text-xs font-bold"
                            style={{ background: row.alerts > 0 ? "#2a2010" : "transparent", color: row.alerts > 0 ? "#fbbf24" : "var(--text-muted)" }}>
                            {row.alerts}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded text-xs font-bold"
                            style={{ background: row.fatigue > 0 ? "#1a1030" : "transparent", color: row.fatigue > 0 ? "#c084fc" : "var(--text-muted)" }}>
                            {row.fatigue}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {stats?.recent && (
          <div>
            <h2 className="text-lg font-bold mb-4">Recent Submissions</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: "Misalignments", data: stats.recent.misalignments, color: "var(--accent)", icon: "⚠️" },
                { title: "Alerts", data: stats.recent.alerts, color: "#fbbf24", icon: "🚨" },
                { title: "Fatigue", data: stats.recent.fatigue, color: "#c084fc", icon: "😴" },
              ].map(({ title, data, color, icon }) => (
                <div key={title} className="card p-4">
                  <div className="text-xs font-semibold tracking-widest mb-3" style={{ color }}>
                    {icon} {title.toUpperCase()}
                  </div>
                  {data?.length === 0 ? (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>No entries</p>
                  ) : (
                    <div className="space-y-2">
                      {(data || []).slice(0, 5).map((item, i) => (
                        <div key={i} className="text-xs p-2 rounded" style={{ background: "var(--bg-card2)" }}>
                          <div className="font-medium" style={{ color: "var(--text-primary)" }}>{item.client}</div>
                          <div style={{ color: "var(--text-muted)" }}>
                            {item.timeSlot} · {item.vehicles || `Count: ${item.count}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
