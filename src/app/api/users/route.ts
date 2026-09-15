import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createAnonClient } from "@supabase/supabase-js";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Verifies the caller's bearer token belongs to an admin profile. */
async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  const anon = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: userData, error } = await anon.auth.getUser(token);
  if (error || !userData.user) return null;

  const svc = serviceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return userData.user;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Sirf admin ijazat rakhte hain." }, { status: 403 });

  const svc = serviceClient();
  const { data: profiles } = await svc.from("profiles").select("*").order("created_at");
  const { data: authUsers } = await svc.auth.admin.listUsers();

  const merged = (profiles ?? []).map((p) => ({
    ...p,
    email: authUsers?.users.find((u) => u.id === p.id)?.email ?? "",
  }));

  return NextResponse.json({ users: merged });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Sirf admin ijazat rakhte hain." }, { status: 403 });

  const body = await req.json();
  const { full_name, email, password } = body as { full_name: string; email: string; password: string };

  if (!full_name?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Naam, email aur kam az kam 6 harfon ka password zaroori hai." },
      { status: 400 }
    );
  }

  const svc = serviceClient();
  const { data, error } = await svc.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim() },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user });
}
