// Summary reminders for the counselor on shift. Called every 10 minutes by a database schedule (pg_cron).
// For each shift (morning 09–17, night 17–09) two reminders are sent, at the times set in the app's settings,
// to whoever is on shift: the counselor who clocked in, or else the one on the roster.
// No reminder is sent when that counselor already wrote a summary for the shift.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const TZ = "Asia/Jerusalem";
const WINDOW_MIN = 30; // a reminder is due from its time until 30 minutes later
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function israelNow() {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}
const addDays = (d: string, n: number) => { const t = new Date(d + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const hm = (t: string) => { const [a, b] = String(t || "0:0").split(":").map(Number); return (a || 0) * 60 + (b || 0); };

Deno.serve(async (req) => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    // only the database schedule may call this: it sends the key kept in app_secrets
    const { data: sec } = await db.from("app_secrets").select("v").eq("k", "cron").maybeSingle();
    if (!sec?.v || req.headers.get("x-cron-key") !== sec.v) return json(401, { error: "not allowed" });

    const now = israelNow();
    const { data: setDoc } = await db.from("docs").select("body").eq("path", "meta/settings").maybeSingle();
    const rem = ((setDoc?.body as any)?.remind) || { day: ["13:00", "16:00"], evening: ["22:00", "08:00"] };

    // candidate reminders: shift date is today or yesterday (a night shift ends the next morning)
    const due: { date: string; kind: "day" | "evening"; i: number }[] = [];
    for (const back of [0, 1]) {
      const sd = addDays(now.date, -back);
      for (const kind of ["day", "evening"] as const) {
        (rem[kind] || []).forEach((t: string, i: number) => {
          // night reminders before 17:00 belong to the morning after
          const day = kind === "evening" && hm(t) < hm("17:00") ? addDays(sd, 1) : sd;
          if (day !== now.date) return;
          const diff = now.min - hm(t);
          if (diff >= 0 && diff < WINDOW_MIN) due.push({ date: sd, kind, i });
        });
      }
    }
    if (!due.length) return json(200, { due: 0 });

    const months = [...new Set(due.map((d) => d.date.slice(0, 7)))];
    const { data: rosters } = await db.from("docs").select("path, body").in("path", months.map((m) => "roster/" + m));
    const roster: Record<string, any> = {};
    (rosters ?? []).forEach((r: any) => Object.assign(roster, r.body?.e || {}));
    const dates = [...new Set(due.flatMap((d) => [d.date, addDays(d.date, 1)]))];
    const { data: shifts } = await db.from("docs").select("body").eq("collection", "shifts").in("body->>date", dates);
    const { data: sums } = await db.from("docs").select("body").eq("collection", "summaries").in("body->>date", dates);
    const { data: notes } = await db.from("docs").select("body").eq("collection", "notes").in("body->>date", dates);
    const { data: links } = await db.from("docs").select("path, body").eq("collection", "links");
    const { data: subs } = await db.from("push_subs").select("*");
    const userStaff = new Map<string, string>((links ?? []).map((l: any) => [String(l.path).slice(6), l.body?.staff]));

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT") ?? "https://ariel12434-43422.github.io/retorno-english-program/",
      Deno.env.get("VAPID_PUBLIC_KEY") ?? "BJ9UEI92vgYNkxy3ift5gpz0oTtJAFicFQw6Ej1T9eOztvEE4IUBS8g7xDIg9kXxER-ndvDVyQhdOvplaqTgY0U",
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const out: unknown[] = [];
    for (const d of due) {
      const mark = `mgr/remind/${d.date}-${d.kind}-${d.i}`;
      const { data: done } = await db.from("docs").select("path").eq("path", mark).maybeSingle();
      if (done) continue;
      // who is on this shift: clocked in first, roster second
      const clocked = (shifts ?? []).map((s: any) => s.body).find((b: any) => b && b.date === d.date && b.kind === d.kind && b.status !== "rejected");
      const staff = clocked?.staff || roster[d.date]?.[d.kind] || "";
      let sent = 0, skipped = "";
      if (!staff) skipped = "nobody on shift";
      else {
        const ds = [d.date, addDays(d.date, 1)];
        const wrote = (sums ?? []).some((s: any) => s.body?.author === staff && ds.includes(s.body?.date)) ||
          (notes ?? []).some((n: any) => n.body?.author === staff && n.body?.kind === "daily" && n.body?.source !== "whatsapp" && ds.includes(n.body?.date));
        if (wrote) skipped = "summary already written";
        else {
          const last = d.i === (rem[d.kind] || []).length - 1;
          const payload = JSON.stringify({
            title: last ? "תזכורת: סיכום משמרת" : "תזכורת: סיכום משמרת – אמצע המשמרת",
            body: last ? "המשמרת מסתיימת בקרוב – לא לשכוח לכתוב סיכום." : "זה זמן טוב לכתוב את סיכום המשמרת עד עכשיו.",
            url: "#summary", tag: `remind-${d.date}-${d.kind}`,
          });
          for (const s of (subs ?? []).filter((x: any) => userStaff.get(x.user_id) === staff)) {
            try { await webpush.sendNotification(s.sub, payload, { TTL: 3600, urgency: "normal" }); sent++; }
            catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await db.from("push_subs").delete().eq("endpoint", s.endpoint); }
          }
          if (!sent) skipped = "no phone with notifications on";
        }
      }
      await db.from("docs").upsert({ path: mark, collection: "mgr/remind", body: { at: new Date().toISOString(), staff, sent, skipped } });
      out.push({ ...d, staff, sent, skipped });
    }
    return json(200, { due: due.length, out });
  } catch (e) {
    return json(500, { error: String((e as Error)?.message ?? e) });
  }
});
