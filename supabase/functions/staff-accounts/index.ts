// Staff sign-in accounts, managed by the manager only.
//   { action: "set", staff_id, username, password?, manager }  - create the account or change its username/password
//   { action: "remove", staff_id }                              - delete the account of a staff member
// A username is stored as the sign-in email "<username>@staff.retorno.app".
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const DOMAIN = "staff.retorno.app";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const toEmail = (u: string) => (u.includes("@") ? u : `${u}@${DOMAIN}`).toLowerCase();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json(401, { error: "not signed in" });
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const me = (user.email ?? "").toLowerCase();
    const { data: adm } = await db.from("app_admins").select("email").ilike("email", me);
    if (!(adm ?? []).length) return json(403, { error: "managers only" });

    const p = await req.json();
    const sid = String(p.staff_id ?? "");
    if (!sid) return json(400, { error: "staff_id missing" });

    // the account currently tied to this staff member, if any
    const { data: cur } = await db.from("app_members").select("email").eq("staff_id", sid);
    let oldEmail = cur && cur[0] ? String(cur[0].email).toLowerCase() : null;
    if (!oldEmail) {
      // the manager editing their own record before it has a username
      const { data: mine } = await db.from("docs").select("body").eq("path", "links/" + user.id).maybeSingle();
      if ((mine?.body as any)?.staff === sid) oldEmail = me;
    }
    const findUser = async (email: string) => {
      for (let page = 1; page < 20; page++) {
        const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        const u = data.users.find((x) => (x.email ?? "").toLowerCase() === email);
        if (u || data.users.length < 200) return u ?? null;
      }
      return null;
    };
    const dropAccount = async (email: string) => {
      const u = await findUser(email);
      if (u) {
        await db.from("docs").delete().eq("path", "links/" + u.id);
        await db.from("push_subs").delete().eq("user_id", u.id);
        await db.auth.admin.deleteUser(u.id);
      }
      await db.from("app_members").delete().eq("email", email);
      await db.from("app_admins").delete().eq("email", email);
    };

    if (p.action === "remove") {
      if (oldEmail && oldEmail !== me) await dropAccount(oldEmail);
      return json(200, { ok: true });
    }

    if (p.action !== "set") return json(400, { error: "unknown action" });
    const username = String(p.username ?? "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(username) && !/^\S+@\S+\.\S+$/.test(username)) return json(400, { error: "bad username" });
    const email = toEmail(username);
    const password = p.password ? String(p.password) : "";
    if (password && password.length < 6) return json(400, { error: "short password" });

    // the username must not belong to another staff member
    const { data: taken } = await db.from("app_members").select("staff_id").eq("email", email);
    if (taken && taken[0] && taken[0].staff_id && taken[0].staff_id !== sid) return json(409, { error: "username taken" });

    let u = await findUser(email);
    if (!u) {
      if (oldEmail && oldEmail !== email) {
        // rename: move the existing account to the new username
        const old = await findUser(oldEmail);
        if (old) {
          const attrs: Record<string, unknown> = { email, email_confirm: true };
          if (password) attrs.password = password;
          const { data, error } = await db.auth.admin.updateUserById(old.id, attrs);
          if (error) throw error;
          u = data.user;
          await db.from("app_members").delete().eq("email", oldEmail);
          await db.from("app_admins").delete().eq("email", oldEmail);
        }
      }
      if (!u) {
        if (!password) return json(400, { error: "password needed" });
        const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
        if (error) throw error;
        u = data.user;
      }
    } else if (password) {
      const { error } = await db.auth.admin.updateUserById(u.id, { password });
      if (error) throw error;
    }

    await db.from("app_members").upsert({ email, staff_id: sid });
    if (p.manager) await db.from("app_admins").upsert({ email });
    else if (email !== me) await db.from("app_admins").delete().eq("email", email);
    // tie the account to the staff member, so they go straight in
    await db.from("docs").upsert({ path: "links/" + u!.id, collection: "links", body: { staff: sid } });
    return json(200, { ok: true, username });
  } catch (e) {
    return json(500, { error: String((e as Error)?.message ?? e) });
  }
});
