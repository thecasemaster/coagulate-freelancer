"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const FREELANCER_TYPES = [
  { label: "Design", value: "design" },
  { label: "Development", value: "development" },
  { label: "Copywriting", value: "copywriting" },
  { label: "Photography/Video", value: "photography_video" },
  { label: "Consulting", value: "consulting" },
  { label: "Other", value: "other" },
] as const;

const PAYMENT_OPTIONS = [
  { label: "Yes, take my money", value: "yes" },
  { label: "Maybe — depends on features", value: "maybe" },
  { label: "Probably not", value: "no" },
] as const;

type FreelancerType = (typeof FREELANCER_TYPES)[number]["value"];
type PaymentIntent = (typeof PAYMENT_OPTIONS)[number]["value"];

function Pill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full border cursor-pointer transition ${
        selected
          ? "bg-accent border-accent text-white"
          : "border-border bg-card hover:border-accent"
      }`}
    >
      {label}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-accent-light inline-block"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function WelcomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");

  const [validated, setValidated] = useState(false);
  const [freelancerType, setFreelancerType] = useState<FreelancerType | null>(
    null
  );
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Validate code on mount
  useEffect(() => {
    if (!code) {
      router.replace("/");
      return;
    }

    fetch(`/api/intent?code=${encodeURIComponent(code)}`)
      .then((res) => {
        if (!res.ok) {
          router.replace("/");
        } else {
          setValidated(true);
        }
      })
      .catch(() => {
        router.replace("/");
      });
  }, [code, router]);

  // Auto-submit when both questions are answered
  const submit = useCallback(
    async (type: FreelancerType, intent: PaymentIntent) => {
      if (!code) return;
      setSubmitting(true);
      try {
        await fetch("/api/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            freelancerType: type,
            paymentIntent: intent,
          }),
        });
      } catch {
        // best effort — still show share section
      } finally {
        setSubmitting(false);
        setSubmitted(true);
      }
    },
    [code]
  );

  useEffect(() => {
    if (freelancerType && paymentIntent && !submitted && !submitting) {
      submit(freelancerType, paymentIntent);
    }
  }, [freelancerType, paymentIntent, submitted, submitting, submit]);

  const referralLink = `https://coagulate.dev?r=${code}`;

  const shareText = `I just signed up for early access to an AI client portal for freelancers. One link for all client files, invoices, and messages. Check it out: ${referralLink}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareLinkedIn() {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (!validated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto py-24 px-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          You&apos;re in.
        </h1>
        <p className="mt-4 text-muted leading-relaxed">
          We&apos;ll email you as soon as early access opens. Two quick questions
          so we can build this for you, not at you:
        </p>

        {/* Question 1 */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">
            What kind of freelance work do you do?
          </h2>
          <div className="flex flex-wrap gap-3">
            {FREELANCER_TYPES.map((option) => (
              <Pill
                key={option.value}
                label={option.label}
                selected={freelancerType === option.value}
                onClick={() => setFreelancerType(option.value)}
              />
            ))}
          </div>
        </div>

        {/* Question 2 */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">
            If this existed today at $19/mo, would you pay for it?
          </h2>
          <div className="flex flex-wrap gap-3">
            {PAYMENT_OPTIONS.map((option) => (
              <Pill
                key={option.value}
                label={option.label}
                selected={paymentIntent === option.value}
                onClick={() => setPaymentIntent(option.value)}
              />
            ))}
          </div>
        </div>

        {/* Submitting state */}
        {submitting && (
          <div className="mt-10 flex items-center gap-3">
            <Spinner />
            <span className="text-muted text-sm">Saving your answers...</span>
          </div>
        )}

        {/* Confirmation + Share */}
        {submitted && (
          <div className="mt-12 space-y-8">
            <p className="text-green-400 font-medium">
              Thanks — that actually shapes what we build first.
            </p>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Know a freelancer drowning in tabs? Send them this:
              </h3>
              <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <code className="font-mono text-sm text-foreground flex-1 truncate">
                  {referralLink}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-sm px-3 py-1.5 rounded-md border border-border hover:border-accent transition whitespace-nowrap"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={shareLinkedIn}
                className="bg-card border border-border hover:border-accent rounded-lg px-4 py-2 text-sm font-medium transition"
              >
                Share on LinkedIn
              </button>
              <button
                type="button"
                onClick={shareTwitter}
                className="bg-card border border-border hover:border-accent rounded-lg px-4 py-2 text-sm font-medium transition"
              >
                Share on X
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Welcome() {
  return (
    <Suspense>
      <WelcomePage />
    </Suspense>
  );
}
