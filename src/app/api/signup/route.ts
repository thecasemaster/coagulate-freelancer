import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResend } from "@/lib/resend";
import crypto from "crypto";

function generateReferralCode(): string {
  return crypto.randomBytes(4).toString("hex").slice(0, 6);
}

function buildEmail1Html(body: string): string {
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

export async function POST(request: NextRequest) {
  try {
    const { email, referralSource, referredBy } = await request.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingLead } = await getSupabaseAdmin()
      .from("leads")
      .select("id")
      .eq("email", email)
      .single();

    if (existingLead) {
      return NextResponse.json(
        { error: "You're already on the list!" },
        { status: 409 }
      );
    }

    // Generate referral code
    const referralCode = generateReferralCode();

    // Insert lead
    const { data: lead, error: insertError } = await getSupabaseAdmin()
      .from("leads")
      .insert({
        email,
        referral_source: referralSource || null,
        referred_by: referredBy || null,
        referral_code: referralCode,
      })
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    // Send Email 1
    const emailBody = `Hey \u2014 thanks for signing up. Quick background on what this is and why.

I kept watching freelancers (myself included) cobble together 5+ tools to manage a single client. Email for contracts, Drive for files, Stripe for invoices, Slack for messages. The client has no idea where anything lives. You spend half your time on admin instead of the work you're actually good at.

So we're building a simple AI-powered portal. One link per client. Files, invoices, messages, updates \u2014 all in one place, branded to look like yours. The AI handles drafting updates, chasing late payments, and summarizing project status so you don't have to.

That's it. Nothing bloated. Nothing enterprise.

One thing that would genuinely help us: reply to this email with the one client management task you hate the most. Not what you think we want to hear \u2014 the real one. We read every reply.

Talk soon.`;

    const { data: emailData, error: emailError } = await getResend().emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "You're on the list \u2014 here's what we're building",
      html: buildEmail1Html(emailBody),
    });

    if (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    // Log email
    if (emailData?.id) {
      await getSupabaseAdmin().from("email_logs").insert({
        lead_id: lead.id,
        email_number: 1,
        resend_id: emailData.id,
      });
    }

    return NextResponse.json({ referralCode });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
