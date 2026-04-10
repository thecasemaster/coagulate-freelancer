import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("admin_auth")?.value;

  if (adminAuth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ authenticated: false });
  }

  const data = request.nextUrl.searchParams.get("data");

  if (data === "dashboard") {
    const { data: leads } = await getSupabaseAdmin()
      .from("leads")
      .select("*");

    const { data: emailLogs } = await getSupabaseAdmin()
      .from("email_logs")
      .select("*");

    const allLeads = leads || [];
    const totalSignups = allLeads.length;

    const wouldPayCount = allLeads.filter(
      (l) => l.payment_intent === "yes"
    ).length;
    const wouldPayRate =
      totalSignups > 0
        ? Math.round((wouldPayCount / totalSignups) * 100)
        : 0;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const signupsThisWeek = allLeads.filter(
      (l) => new Date(l.created_at) >= oneWeekAgo
    ).length;

    const referralSignups = allLeads.filter(
      (l) => l.referred_by !== null
    ).length;

    return NextResponse.json({
      leads: allLeads,
      emailLogs: emailLogs || [],
      totalSignups,
      wouldPayRate,
      signupsThisWeek,
      referralSignups,
    });
  }

  return NextResponse.json({ authenticated: true });
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Wrong password" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_auth", password, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
