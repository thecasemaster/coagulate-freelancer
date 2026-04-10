import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const { data: lead } = await getSupabaseAdmin()
    .from("leads")
    .select("id")
    .eq("referral_code", code)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ valid: true });
}

export async function POST(request: NextRequest) {
  try {
    const { code, freelancerType, paymentIntent } = await request.json();

    const { error } = await getSupabaseAdmin()
      .from("leads")
      .update({
        freelancer_type: freelancerType,
        payment_intent: paymentIntent,
      })
      .eq("referral_code", code);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Intent update error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
