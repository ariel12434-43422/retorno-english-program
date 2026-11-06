// Receives new leads from LeadManager ("שידור לידים"): POST as form, JSON or XML-free GET.
// The address carries a secret key (?k=…) kept in app_secrets; anything else is refused.
// Each lead is saved as lm/<id>, the managers and the staff allowed in meta/leadaccess get a phone
// notification at once, and a notice in the app's notification center.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, GET, OPTIONS" };
const out = (status: number, body: unknown) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { ...cors, "Content-Type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json" } });

async function vapidKeys(db: any): Promise<{ publicKey: string; privateKey: string }> {
  const read = async () => { const { data } = await db.from("app_secrets").select("v").eq("k", "vapid").maybeSingle(); return data?.v ? JSON.parse(data.v) : null; };
  let k = await read();
  if (!k) { const g = webpush.generateVAPIDKeys(); await db.from("app_secrets").upsert({ k: "vapid", v: JSON.stringify(g) }, { onConflict: "k", ignoreDuplicates: true }); k = await read(); }
  return k;
}

// flatten whatever LeadManager sends into "key → text"
function flat(o: any, pre = "", acc: Record<string, string> = {}) {
  if (o == null) return acc;
  if (typeof o !== "object") { acc[pre || "value"] = String(o); return acc; }
  for (const [k, v] of Object.entries(o)) {
    const key = pre ? `${pre}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flat(v, key, acc); else acc[key] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
  }
  return acc;
}
const norm = (s: string) => s.toLowerCase().replace(/[\s_\-."'״׳]/g, "");
function pick(f: Record<string, string>, ...cands: string[]) {
  const keys = Object.keys(f);
  for (const c of cands) { const k = keys.find((x) => norm(x) === norm(c) || norm(x.split(".").pop()!) === norm(c)); if (k && f[k]?.trim()) return f[k].trim(); }
  for (const c of cands) { const k = keys.find((x) => norm(x).includes(norm(c))); if (k && f[k]?.trim()) return f[k].trim(); }
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = new URL(req.url);
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: sec } = await db.from("app_secrets").select("v").eq("k", "leads").maybeSingle();
    const key = url.searchParams.get("k") || req.headers.get("x-lead-key") || "";
    if (!sec?.v || key !== sec.v) return out(401, "not allowed");

    // read the lead, whatever the format
    let body: any = {};
    const ct = req.headers.get("content-type") || "";
    const text = req.method === "GET" ? "" : await req.text();
    if (text) {
      if (ct.includes("json") || /^\s*[\[{]/.test(text)) { try { body = JSON.parse(text); } catch { body = { raw: text }; } }
      else { const sp = new URLSearchParams(text); sp.forEach((v, k) => (body[k] = v)); if (!Object.keys(body).length) body = { raw: text }; }
    }
    url.searchParams.forEach((v, k) => { if (k !== "k") body[k] = v; });
    if (Array.isArray(body)) body = body[0] ?? {};
    const f = flat(body);
    if (url.searchParams.get("ping")) return out(200, "OK");

    const first = pick(f, "firstname", "first_name", "שם פרטי"), last = pick(f, "lastname", "last_name", "שם משפחה");
    const lead = {
      lmId: pick(f, "leadid", "lead_id", "id", "מספר ליד", "מזהה"),
      name: pick(f, "fullname", "full_name", "name", "שם מלא", "שם") || [first, last].filter(Boolean).join(" "),
      phone: pick(f, "phone", "טלפון", "mobile", "cellphone", "נייד", "tel"),
      email: pick(f, "email", "דוא\"ל", "דואל", "מייל", "mail"),
      campaign: pick(f, "campaign", "קמפיין", "campaignname"),
      channel: pick(f, "channel", "ערוץ", "source", "מקור", "supplier", "ספק"),
      status: pick(f, "status", "סטטוס"),
      country: pick(f, "country", "מדינה"),
      message: pick(f, "notes", "הערות", "message", "comments", "תוכן", "content", "description"),
      when: pick(f, "מתי נוח", "besttime", "preferredtime"),
      lmDate: pick(f, "createdate", "date", "תאריך", "createdon"),
    };
    const id = (lead.lmId || crypto.randomUUID()).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || crypto.randomUUID();
    const path = "lm/" + id;
    const { data: old } = await db.from("docs").select("body").eq("path", path).maybeSingle();
    const now = new Date().toISOString();
    const test = !!url.searchParams.get("test");
    const doc = old?.body
      ? { ...old.body, ...lead, fields: f, updatedAt: now }
      : { id, ...lead, fields: f, at: now, st: "new", log: [], test };
    await db.from("docs").upsert({ path, collection: "lm", body: doc });
    if (old?.body) return out(200, "OK");

    // who to tell: the managers and the staff allowed to see leads
    const { data: acc } = await db.from("docs").select("body").eq("path", "meta/leadaccess").maybeSingle();
    const { data: staffDoc } = await db.from("docs").select("body").eq("path", "meta/staff").maybeSingle();
    const list: any[] = (staffDoc?.body as any)?.list ?? [];
    const to = [...new Set([...list.filter((s) => s.role === "manager").map((s) => s.id), ...(((acc?.body as any)?.staff) ?? [])])];
    const title = `📥 ליד חדש${lead.name ? ": " + lead.name : ""}`;
    const sub = [lead.channel, lead.campaign].filter(Boolean).join(" · ") || "LeadManager";
    const nid = "n" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    // the notice itself says only that a lead arrived; the details are in the leads screen
    await db.from("docs").upsert({ path: "notices/" + nid, collection: "notices", body: { id: nid, to, kind: "lead", title: "📥 ליד חדש נכנס", body: sub, link: { view: "leads", lead: id }, at: now, from: "system" } });

    const keys = await vapidKeys(db);
    webpush.setVapidDetails("https://ariel12434-43422.github.io/retorno-english-program/", keys.publicKey, keys.privateKey);
    const { data: links } = await db.from("docs").select("path, body").eq("collection", "links");
    const staffOfUser = new Map<string, string>((links ?? []).map((l: any) => [String(l.path).slice(6), l.body?.staff]));
    const { data: subs } = await db.from("push_subs").select("*");
    let sent = 0;
    for (const s of (subs ?? []).filter((x: any) => to.includes(staffOfUser.get(x.user_id) ?? ""))) {
      try { await webpush.sendNotification(s.sub, JSON.stringify({ title, body: sub, url: "#leads", tag: "lead-" + id, urgent: true }), { TTL: 86400, urgency: "high" }); sent++; }
      catch (e: any) { if ([400, 403, 404, 410].includes(e?.statusCode)) await db.from("push_subs").delete().eq("endpoint", s.endpoint); }
    }
    return out(200, "OK");
  } catch (e) {
    return out(500, "error: " + String((e as Error)?.message ?? e));
  }
});
