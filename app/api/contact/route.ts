import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const schema = z.object({
  name:    z.string().min(1, "Name is required").max(100),
  email:   z.string().email("Invalid email address"),
  message: z.string().min(1, "Message is required").max(2000),
});

// In-memory rate limit: 3 submissions per IP per hour.
// Resets on cold start — acceptable for a portfolio contact form.
const rl = new Map<string, { count: number; resetAt: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const e   = rl.get(ip);
  if (!e || now > e.resetAt) { rl.set(ip, { count: 1, resetAt: now + 3_600_000 }); return false; }
  if (e.count >= 3) return true;
  e.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many requests — try again in an hour." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email, message } = parsed.data;

  if (!process.env.RESEND_API_KEY) {
    // No API key in this environment — signal client to open mailto instead
    return NextResponse.json({ fallback: true });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    "Portfolio Contact <onboarding@resend.dev>",
      to:      "manpatel0649@gmail.com",
      replyTo: email,
      subject: `Portfolio contact from ${name}`,
      text:    `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] Resend error:", err);
    return NextResponse.json({ error: "Failed to send — please try the mailto link below." }, { status: 500 });
  }
}
