"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Lead {
  email: string;
  freelancer_type: string;
  would_pay: string;
  referral_source: string | null;
  referred_by: string | null;
  created_at: string;
}

interface EmailLog {
  email: string;
  email_number: number;
  sent_at: string;
}

interface DashboardData {
  leads: Lead[];
  emailLogs: EmailLog[];
  totalSignups: number;
  wouldPayRate: number;
  signupsThisWeek: number;
  referralSignups: number;
}

type SortField =
  | "email"
  | "freelancer_type"
  | "would_pay"
  | "referral_source"
  | "referred_by"
  | "created_at"
  | "emails_sent";
type SortDir = "asc" | "desc";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Check auth on mount
  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  // Fetch dashboard data once authenticated
  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/admin?data=dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const body = await res.json().catch(() => null);
        setLoginError(body?.error || "Wrong password");
      }
    } catch {
      setLoginError("Network error");
    } finally {
      setLoggingIn(false);
    }
  };

  // Derived chart data
  const signupsOverTime = useMemo(() => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    data.leads.forEach((l) => {
      const date = l.created_at?.slice(0, 10);
      if (date) counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [data]);

  const typeBreakdown = useMemo(() => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    data.leads.forEach((l) => {
      const t = l.freelancer_type || "Unknown";
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [data]);

  const paymentIntent = useMemo(() => {
    if (!data) return [];
    const counts: Record<string, number> = { yes: 0, maybe: 0, no: 0 };
    data.leads.forEach((l) => {
      const v = (l.would_pay || "").toLowerCase();
      if (v in counts) counts[v]++;
    });
    return Object.entries(counts).map(([intent, count]) => ({ intent, count }));
  }, [data]);

  const trafficSources = useMemo(() => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    data.leads.forEach((l) => {
      if (l.referral_source) {
        counts[l.referral_source] = (counts[l.referral_source] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([source, count]) => ({ source, count }));
  }, [data]);

  const emailsSentByLead = useMemo(() => {
    if (!data) return new Map<string, number>();
    const m = new Map<string, number>();
    data.emailLogs.forEach((log) => {
      m.set(log.email, (m.get(log.email) || 0) + 1);
    });
    return m;
  }, [data]);

  const emailStatsByNumber = useMemo(() => {
    if (!data) return [];
    const counts: Record<number, number> = {};
    data.emailLogs.forEach((log) => {
      counts[log.email_number] = (counts[log.email_number] || 0) + 1;
    });
    return [1, 2, 3, 4].map((n) => ({
      emailNumber: n,
      count: counts[n] || 0,
    }));
  }, [data]);

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    let leads = data.leads;
    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter((l) => l.email?.toLowerCase().includes(q));
    }
    const sorted = [...leads].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortField === "emails_sent") {
        aVal = emailsSentByLead.get(a.email) || 0;
        bVal = emailsSentByLead.get(b.email) || 0;
      } else if (sortField === "created_at") {
        aVal = a.created_at || "";
        bVal = b.created_at || "";
      } else {
        aVal = (a[sortField as keyof Lead] as string) || "";
        bVal = (b[sortField as keyof Lead] as string) || "";
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, search, sortField, sortDir, emailsSentByLead]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  // ---- Auth check loading ----
  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#09090b" }}>
        <p style={{ color: "#a1a1aa" }}>Loading...</p>
      </div>
    );
  }

  // ---- Password Gate ----
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#09090b" }}>
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-xl border p-8 space-y-4"
          style={{ background: "#18181b", borderColor: "#27272a" }}
        >
          <h1 className="text-xl font-semibold text-center" style={{ color: "#fafafa" }}>
            Admin Dashboard
          </h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2"
            style={{
              background: "#09090b",
              borderColor: "#27272a",
              color: "#fafafa",
              // @ts-expect-error CSS custom property for focus ring
              "--tw-ring-color": "#6d28d9",
            }}
          />
          {loginError && (
            <p className="text-sm text-red-400">{loginError}</p>
          )}
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "#6d28d9", color: "#fafafa" }}
          >
            {loggingIn ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  // ---- Dashboard Loading ----
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#09090b" }}>
        <p style={{ color: "#a1a1aa" }}>Loading dashboard...</p>
      </div>
    );
  }

  // ---- Dashboard ----
  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: "#09090b", color: "#fafafa" }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Row 1 — Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Signups" value={data.totalSignups.toLocaleString()} />
          <MetricCard label="&quot;Would Pay&quot; Rate" value={`${Math.round(data.wouldPayRate * 100)}%`} />
          <MetricCard label="Signups This Week" value={data.signupsThisWeek.toLocaleString()} />
          <MetricCard label="Referral Signups" value={data.referralSignups.toLocaleString()} />
        </div>

        {/* Row 2 — Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Signups Over Time">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={signupsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fafafa" }}
                  labelStyle={{ color: "#a1a1aa" }}
                />
                <Line type="monotone" dataKey="count" stroke="#6d28d9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Freelancer Type Breakdown">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={typeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="type" tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fafafa" }}
                  labelStyle={{ color: "#a1a1aa" }}
                />
                <Bar dataKey="count" fill="#6d28d9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3 — More Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Payment Intent Distribution">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={paymentIntent}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="intent" tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fafafa" }}
                  labelStyle={{ color: "#a1a1aa" }}
                />
                <Bar dataKey="count" fill="#6d28d9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Traffic Sources">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trafficSources}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="source" tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fafafa" }}
                  labelStyle={{ color: "#a1a1aa" }}
                />
                <Bar dataKey="count" fill="#6d28d9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 4 — Lead Table */}
        <div className="rounded-xl border p-6 space-y-4" style={{ background: "#18181b", borderColor: "#27272a" }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-semibold">Leads</h2>
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-sm outline-none w-full max-w-xs"
              style={{ background: "#09090b", borderColor: "#27272a", color: "#fafafa" }}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "#a1a1aa" }}>
                  {(
                    [
                      ["email", "Email"],
                      ["freelancer_type", "Type"],
                      ["would_pay", "Payment Intent"],
                      ["referral_source", "Referral Source"],
                      ["referred_by", "Referred By"],
                      ["created_at", "Signup Date"],
                      ["emails_sent", "Emails Sent"],
                    ] as [SortField, string][]
                  ).map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className="text-left py-2 pr-4 font-medium cursor-pointer select-none whitespace-nowrap hover:opacity-80"
                    >
                      {label}
                      {sortIndicator(field)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "#27272a" }}>
                    <td className="py-2 pr-4">{lead.email}</td>
                    <td className="py-2 pr-4" style={{ color: "#a1a1aa" }}>
                      {lead.freelancer_type}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "#a1a1aa" }}>
                      {lead.would_pay}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "#a1a1aa" }}>
                      {lead.referral_source || "—"}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "#a1a1aa" }}>
                      {lead.referred_by || "—"}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap" style={{ color: "#a1a1aa" }}>
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "#a1a1aa" }}>
                      {emailsSentByLead.get(lead.email) || 0}
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center" style={{ color: "#a1a1aa" }}>
                      No leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 5 — Email Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {emailStatsByNumber.map((stat) => (
            <MetricCard
              key={stat.emailNumber}
              label={`Email ${stat.emailNumber} Sent`}
              value={stat.count.toLocaleString()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: "#18181b", borderColor: "#27272a" }}
    >
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1" style={{ color: "#a1a1aa" }}>
        {label}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: "#18181b", borderColor: "#27272a" }}
    >
      <h3 className="text-sm font-medium mb-4" style={{ color: "#a1a1aa" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
