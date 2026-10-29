// Sends phone notifications.
//   audience "managers"            - anyone may ask (used for "needs approval")
//   audience "counselors" | "all"  - managers only
//   audience { staff: [ids] }      - managers only (messages to chosen people)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const caller = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json(401, { error: "not signed in" });

    const db = createClient(url, service);
    const email = (user.email ?? "").toLowerCase();
    const { data: adm } = await db.from("app_admins").select("email");
    const admins = new Set((adm ?? []).map((r) => String(r.email).toLowerCase()));
    const isAdmin = admins.has(email);
    const { data: mem } = await db.from("app_members").select("email").ilike("email", email);
    if (!isAdmin && !(mem ?? []).length) return json(403, { error: "not a member" });

    const p = await req.json();
    const aud = p.audience;
    if (aud !== "managers" && !isAdmin) return json(403, { error: "managers only" });

    const { data: links } = await db.from("docs").select("path, body").eq("collection", "links");
    const { data: staffDoc } = await db.from("docs").select("body").eq("path", "meta/staff").maybeSingle();
    const roles = new Map<string, string>(((staffDoc?.body as any)?.list ?? []).map((s: any) => [s.id, s.role]));
    const userStaff = new Map<string, string>((links ?? []).map((l: any) => [String(l.path).slice(6), l.body?.staff]));
    const { data: subs } = await db.from("push_subs").select("*");

    const targets = (subs ?? []).filter((s: any) => {
      if (s.user_id === user.id) return false;
      const sid = userStaff.get(s.user_id);
      if (aud === "managers") return admins.has(String(s.email ?? "").toLowerCase()) || roles.get(sid ?? "") === "manager";
      if (aud === "counselors") return roles.get(sid ?? "") === "counselor";
      if (aud === "all") return true;
      if (aud && Array.isArray(aud.staff)) return !!sid && aud.staff.includes(sid);
      return false;
    });

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );
    const payload = JSON.stringify({
      title: String(p.title ?? "").slice(0, 120),
      body: String(p.body ?? "").slice(0, 300),
      url: typeof p.url === "string" ? p.url : "./",
      tag: p.tag,
      urgent: !!p.urgent,
    });
    let sent = 0;
    for (const s of targets) {
      try {
        await webpush.sendNotification(s.sub, payload, { TTL: 86400, urgency: p.urgent ? "high" : "normal" });
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) await db.from("push_subs").delete().eq("endpoint", s.endpoint);
      }
    }
    return json(200, { sent, targets: targets.length });
  } catch (e) {
    return json(500, { error: String(e) });
  }
});
