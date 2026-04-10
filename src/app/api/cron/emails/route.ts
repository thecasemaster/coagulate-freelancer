import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResend } from "@/lib/resend";

function wrapEmailHtml(body: string): string {
  const paragraphs = body
    .split("\n\n")
    .map((p) => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${p}</p>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 580px; margin: 0 auto; padding: 40px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #1a1a1a;">
    ${paragraphs}
  </div>
</body>
</html>`.trim();
}

interface EmailTemplate {
  emailNumber: number;
  daysAfterSignup: number;
  subject: string;
  body: string | ((referralCode: string) => string);
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    emailNumber: 1,
    daysAfterSignup: 0,
    subject: "You're on the list \u2014 here's what we're building",
    body: `Hey \u2014 thanks for signing up. Quick background on what this is and why.

I kept watching freelancers (myself included) cobble together 5+ tools to manage a single client. Email for contracts, Drive for files, Stripe for invoices, Slack for messages. The client has no idea where anything lives. You spend half your time on admin instead of the work you're actually good at.

So we're building a simple AI-powered portal. One link per client. Files, invoices, messages, updates \u2014 all in one place, branded to look like yours. The AI handles drafting updates, chasing late payments, and summarizing project status so you don't have to.

That's it. Nothing bloated. Nothing enterprise.

One thing that would genuinely help us: reply to this email with the one client management task you hate the most. Not what you think we want to hear \u2014 the real one. We read every reply.

Talk soon.`,
  },
  {
    emailNumber: 2,
    daysAfterSignup: 7,
    subject: "What 100+ freelancers told us they hate most",
    body: `Last week we asked everyone on this list one question: what's the client management task you hate most?

The answers fell into three buckets.

Chasing invoices and feeling awkward about it.

Digging through email threads to find a file or decision.

Sending "just checking in" updates that take 20 minutes to write and say nothing.

That last one surprised us \u2014 but it makes sense. Nobody teaches you how to write professional project updates. You either spend too long on them or skip them entirely and hope the client doesn't notice.

This is exactly the kind of thing AI handles well. Draft a status update from your project activity, you review it in 10 seconds, hit send. The client thinks you're incredibly organized. You didn't do anything.

We're designing around these three pain points first. If there's something we're missing, reply and tell us.`,
  },
  {
    emailNumber: 3,
    daysAfterSignup: 14,
    subject: "Sneak peek \u2014 here's what the portal looks like",
    body: (referralCode: string) => {
      const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL}?r=${referralCode}`;
      return `We've been heads-down building and wanted to show you where things stand.

[Screenshot/mockup coming soon]

This is what your client sees when they click their portal link. Their files, invoices, messages, and project timeline \u2014 all under your brand. No login wall, no app to download, no confusion.

We're opening early access to a small group soon. People on this list get first priority.

One ask: if you know another freelancer who'd want in, forward this email or send them this link: ${referralLink}

No gimmicks \u2014 we just want to make sure we're building for the right people.`;
    },
  },
  {
    emailNumber: 4,
    daysAfterSignup: 21,
    subject: "Honest question \u2014 should we keep building this?",
    body: `We're about to make the call on whether to go all-in on this or shelve it. Your input matters more than you think.

Three questions \u2014 takes 30 seconds:

1. If this launched tomorrow at $19/mo, would you sign up?
2. What's the one feature that would make it a no-brainer?
3. What would make you say no even if everything else was perfect?

Just reply to this email with your answers. No form, no survey link. We'll read every single one.

Whatever we decide, we'll let you know. Thanks for being here from the start.`,
  },
];

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: leads } = await getSupabaseAdmin().from("leads").select("*");

    if (!leads || leads.length === 0) {
      return NextResponse.json({ sent: 0, details: [] });
    }

    const { data: allEmailLogs } = await getSupabaseAdmin()
      .from("email_logs")
      .select("*");

    const emailLogs = allEmailLogs || [];
    const now = new Date();
    let totalSent = 0;
    const details: { leadId: string; emailNumber: number; success: boolean }[] =
      [];

    for (const lead of leads) {
      const leadLogs = emailLogs.filter((log) => log.lead_id === lead.id);
      const sentEmailNumbers = new Set(leadLogs.map((log) => log.email_number));
      const signupDate = new Date(lead.created_at);
      const daysSinceSignup = Math.floor(
        (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      for (const template of EMAIL_TEMPLATES) {
        if (daysSinceSignup < template.daysAfterSignup) continue;
        if (sentEmailNumbers.has(template.emailNumber)) continue;

        try {
          const bodyText =
            typeof template.body === "function"
              ? template.body(lead.referral_code)
              : template.body;

          const { data: emailData, error: emailError } =
            await getResend().emails.send({
              from: process.env.EMAIL_FROM!,
              to: lead.email,
              subject: template.subject,
              html: wrapEmailHtml(bodyText),
            });

          if (emailError) {
            console.error(
              `Failed to send email ${template.emailNumber} to ${lead.email}:`,
              emailError
            );
            details.push({
              leadId: lead.id,
              emailNumber: template.emailNumber,
              success: false,
            });
            continue;
          }

          await getSupabaseAdmin().from("email_logs").insert({
            lead_id: lead.id,
            email_number: template.emailNumber,
            resend_id: emailData?.id || null,
          });

          totalSent++;
          details.push({
            leadId: lead.id,
            emailNumber: template.emailNumber,
            success: true,
          });
        } catch (err) {
          console.error(
            `Error sending email ${template.emailNumber} to ${lead.email}:`,
            err
          );
          details.push({
            leadId: lead.id,
            emailNumber: template.emailNumber,
            success: false,
          });
        }
      }
    }

    return NextResponse.json({ sent: totalSent, details });
  } catch (error) {
    console.error("Cron email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
