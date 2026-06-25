// Vercel serverless funkcia na správu používateľov (len pre admina).
// Používa SUPABASE_SERVICE_ROLE_KEY (tajný, len na serveri) na vytvorenie/zmazanie auth účtov.
// POST   -> vytvor používateľa (email, password, full_name, role, permissions)
// DELETE -> zmaž používateľa (id)
// PATCH  -> reset hesla (id, password)
//
// Env premenné (Vercel → Settings → Environment Variables):
//   SUPABASE_URL                = https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   = (Service role key z Supabase → Settings → API)

import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function parseBody(req) {
  if (!req.body) return {};
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

async function getAdminContext(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: prof } = await admin.from("profiles").select("role").eq("id", data.user.id).single();
  if (!prof || prof.role !== "admin") return null;
  return { admin, caller: data.user };
}

export default async function handler(req, res) {
  if (!URL || !SERVICE_KEY) {
    return res.status(500).json({ error: "Na serveri chýbajú SUPABASE_URL alebo SUPABASE_SERVICE_ROLE_KEY." });
  }

  const ctx = await getAdminContext(req);
  if (!ctx) return res.status(403).json({ error: "Prístup len pre administrátora." });
  const { admin } = ctx;

  try {
    if (req.method === "POST") {
      const { email, password, full_name, role, permissions } = parseBody(req);
      if (!email || !password) return res.status(400).json({ error: "Chýba email alebo heslo." });
      const { data: created, error } = await admin.auth.admin.createUser({
        email: String(email).trim(),
        password,
        email_confirm: true,
      });
      if (error) throw error;
      const { error: pErr } = await admin.from("profiles").upsert({
        id: created.user.id,
        email: String(email).trim(),
        full_name: full_name || "",
        role: role || "staff",
        permissions: permissions || {},
        is_active: true,
      });
      if (pErr) throw pErr;
      return res.status(200).json({ ok: true, id: created.user.id });
    }

    if (req.method === "DELETE") {
      const { id } = parseBody(req);
      if (!id) return res.status(400).json({ error: "Chýba id." });
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      await admin.from("profiles").delete().eq("id", id);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "PATCH") {
      const { id, password } = parseBody(req);
      if (!id || !password) return res.status(400).json({ error: "Chýba id alebo heslo." });
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Nepodporovaná metóda." });
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }
}
