// Sends phone notifications.
//   audience "managers"            - anyone may ask (used for "needs approval")
//   audience "counselors" | "all"  - managers only
//   audience { staff: [ids] }      - managers; staff too for app alerts (tag "ntc-" / "sched-")
//   audience "self"                - the caller's own devices (test notification)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
// the notification keys live in the database (app_secrets), created once by the server: nobody has to copy them
async function vapidKeys(db: any): Promise<{ publicKey: string; privateKey: string }> {
  const read = async () => { const { data } = await db.from("app_secrets").select("v").eq("k", "vapid").maybeSingle(); return data?.v ? JSON.parse(data.v) : null; };
  let k = await read();
  if (!k) { const g = webpush.generateVAPIDKeys(); await db.from("app_secrets").upsert({ k: "vapid", v: JSON.stringify(g) }, { onConflict: "k", ignoreDuplicates: true }); k = await read(); }
  return k;
}
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const p = await req.json();
    const keys = await vapidKeys(createClient(url, service));
    if (p.getKey) return json(200, { publicKey: keys.publicKey });
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

    const aud = p.audience;
    // staff may notify managers, and may tell the counselor on shift about a schedule change they made
    const tag = String(p.tag || "");
    const appAlert = aud && Array.isArray(aud.staff) && aud.staff.length <= 40 && (tag.startsWith("ntc-") || tag.startsWith("sched-"));
    if (aud !== "managers" && aud !== "self" && !isAdmin && !appAlert) return json(403, { error: "managers only" });

    const { data: links } = await db.from("docs").select("path, body").eq("collection", "links");
    const { data: staffDoc } = await db.from("docs").select("body").eq("path", "meta/staff").maybeSingle();
    const roles = new Map<string, string>(((staffDoc?.body as any)?.list ?? []).map((s: any) => [s.id, s.role]));
    const userStaff = new Map<string, string>((links ?? []).map((l: any) => [String(l.path).slice(6), l.body?.staff]));
    const { data: subs } = await db.from("push_subs").select("*");

    const targets = (subs ?? []).filter((s: any) => {
      if (aud === "self") return s.user_id === user.id;
      if (s.user_id === user.id) return false;
      const sid = userStaff.get(s.user_id);
      if (aud === "managers") return admins.has(String(s.email ?? "").toLowerCase()) || roles.get(sid ?? "") === "manager";
      if (aud === "counselors") return roles.get(sid ?? "") === "counselor";
      if (aud === "all") return true;
      if (aud && Array.isArray(aud.staff)) return !!sid && aud.staff.includes(sid);
      return false;
    });

    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") ?? "https://ariel12434-43422.github.io/retorno-english-program/", keys.publicKey, keys.privateKey);
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
        // gone, or registered with an older key: drop it; the phone re-registers itself when the app opens
        if ([400, 403, 404, 410].includes(e?.statusCode)) await db.from("push_subs").delete().eq("endpoint", s.endpoint);
      }
    }
    return json(200, { sent, targets: targets.length, failed: targets.length - sent });
  } catch (e) {
    return json(500, { error: String(e) });
  }
});
