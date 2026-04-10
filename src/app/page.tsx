"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LandingPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const referralSource = searchParams.get("ref") || undefined;
    const referredBy = searchParams.get("r") || undefined;

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, referralSource, referredBy }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.error?.toLowerCase().includes("already")) {
          setError("You're already on the list!");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      if (data.referralCode) {
        window.location.href = `/welcome?code=${data.referralCode}`;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            One link. Every client. Zero chaos.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Give your freelance clients a branded portal for files, invoices,
            messages, and updates — powered by AI that handles the admin you
            hate.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="you@freelancer.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground w-full focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-accent hover:bg-accent-light text-white font-semibold rounded-lg px-6 py-3 transition w-full sm:w-auto whitespace-nowrap disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Get Early Access"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}
          {success && !error && (
            <p className="mt-4 text-sm text-green-400">Redirecting...</p>
          )}

          <p className="mt-4 text-sm text-muted">
            Free during early access. $19/mo after launch.
          </p>
        </div>
      </section>

      {/* Pain */}
      <section className="pt-0 pb-8">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
          <p className="text-muted leading-relaxed">
            You&apos;re sending contracts in email, files in Google Drive,
            invoices through Stripe, and updates over Slack.
          </p>
          <p className="text-muted leading-relaxed">
            Your client has no idea where anything is. Neither do you.
          </p>
          <p className="text-muted leading-relaxed">
            You look scattered. You&apos;re not — your tools are.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-3xl mb-3">📁</div>
              <h3 className="text-lg font-semibold mb-2">
                One link, everything organized
              </h3>
              <p className="text-muted leading-relaxed">
                Contracts, invoices, files, and messages — your clients get one
                branded portal instead of a scattered mess.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="text-lg font-semibold mb-2">
                AI writes the boring stuff
              </h3>
              <p className="text-muted leading-relaxed">
                Project updates, invoice reminders, status summaries — drafted
                by AI, sent by you in one click.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-3xl mb-3">💸</div>
              <h3 className="text-lg font-semibold mb-2">
                Get paid without chasing
              </h3>
              <p className="text-muted leading-relaxed">
                Built-in invoicing with automatic reminders. No more awkward
                follow-up emails.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="text-lg font-semibold mb-2">
                Your brand, not ours
              </h3>
              <p className="text-muted leading-relaxed">
                Custom colors, logo, and subdomain. Clients see your brand — you
                look like an agency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-16">
        <p className="text-center text-muted text-sm px-6">
          Built for freelance designers, developers, copywriters, photographers,
          and consultants.
        </p>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <LandingPage />
    </Suspense>
  );
}
