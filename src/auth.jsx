import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "./lib/supabase";
import { loadAllData, resetCache } from "./lib/store";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const C = { bg: "#0B0805", panel: "#171009", neon: "#FF6A00", neon2: "#FFB36B", text: "#F3ECE6", dim: "#A89486", line: "rgba(255,150,80,.22)" };

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [phase, setPhase] = useState("init"); // init | setup | nosession | loading | ready | error
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) { setPhase("setup"); return; }
    supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => handleSession(s));
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line
  }, []);

  async function handleSession(s) {
    setSession(s);
    if (!s) { setProfile(null); resetCache(); setPhase("nosession"); return; }
    setPhase("loading");
    try {
      const { data: prof, error } = await supabase.from("profiles").select("*").eq("id", s.user.id).maybeSingle();
      if (error) throw error;
      if (!prof) { setErr("Tvoj účet ešte nemá priradený profil. Kontaktuj administrátora."); await supabase.auth.signOut(); setPhase("nosession"); return; }
      if (prof.is_active === false) { setErr("Tvoj účet je deaktivovaný. Kontaktuj administrátora."); await supabase.auth.signOut(); setPhase("nosession"); return; }
      await loadAllData();
      setProfile(prof);
      setPhase("ready");
    } catch (e) { setErr(e.message || String(e)); setPhase("error"); }
  }

  const signOut = () => supabase.auth.signOut();
  const refreshProfile = () => session && handleSession(session);

  if (phase === "setup") return <SetupNotice />;
  if (phase === "init" || phase === "loading") return <Splash text="Načítavam…" />;
  if (phase === "error") return <Splash text={"Chyba: " + err} onRetry={() => window.location.reload()} />;
  if (phase === "nosession") return <Login notice={err} />;

  return (
    <AuthCtx.Provider value={{ session, profile, signOut, refreshProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(140deg,#05060d,#140B06 60%,#23120A)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Helvetica Neue',Arial,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 26, boxShadow: "0 12px 40px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 22 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${C.neon},#FF3D00)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 0 18px ${C.neon}66` }}>⚡</div>
          <div>
            <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 19, color: "#fff", lineHeight: 1.1 }}>Cafe Paradise</div>
            <div style={{ fontSize: 9, color: C.neon2, letterSpacing: ".24em", textTransform: "uppercase", fontWeight: 700 }}>Service Manager</div>
          </div>
        </div>
        {children}
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 10, color: C.dim }}>
          powered by <b style={{ color: C.neon }}>⚡ MediaVolt</b>
        </div>
      </div>
    </div>
  );
}

function Login({ notice }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pwd });
    if (error) { setErr(error.message === "Invalid login credentials" ? "Nesprávny email alebo heslo." : error.message); setBusy(false); }
    // úspech => onAuthStateChange prepne na appku
  };

  const inp = { width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 9, border: `1px solid ${C.line}`, background: "#0E0A06", color: C.text, fontSize: 14, outline: "none", marginBottom: 10 };

  return (
    <Shell>
      <form onSubmit={submit}>
        <div style={{ fontSize: 13, color: C.dim, marginBottom: 14 }}>Prihlás sa do systému</div>
        {notice && <div style={{ background: "rgba(224,69,47,.14)", border: "1px solid rgba(224,69,47,.4)", color: "#FFB4A8", fontSize: 11.5, borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>{notice}</div>}
        <input style={inp} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        <input style={inp} type="password" placeholder="Heslo" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="current-password" required />
        {err && <div style={{ color: "#FFB4A8", fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <button type="submit" disabled={busy} style={{ width: "100%", padding: 12, borderRadius: 9, border: "none", fontWeight: 800, fontSize: 14, cursor: busy ? "default" : "pointer", color: "#fff", background: `linear-gradient(135deg,${C.neon},#FF3D00)`, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Prihlasujem…" : "Prihlásiť sa"}
        </button>
      </form>
    </Shell>
  );
}

function Splash({ text, onRetry }) {
  return (
    <Shell>
      <div style={{ textAlign: "center", color: C.dim, fontSize: 13, padding: "10px 0" }}>{text}</div>
      {onRetry && <button onClick={onRetry} style={{ width: "100%", marginTop: 12, padding: 11, borderRadius: 9, border: `1px solid ${C.line}`, background: "transparent", color: C.neon2, fontWeight: 700, cursor: "pointer" }}>Skúsiť znova</button>}
    </Shell>
  );
}

function SetupNotice() {
  const code = { background: "#0E0A06", border: `1px solid ${C.line}`, borderRadius: 6, padding: "2px 6px", color: C.neon2, fontSize: 12 };
  return (
    <Shell>
      <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: "#fff" }}>Chýba pripojenie na databázu</div>
        Nastav v projekte (lokálne v <span style={code}>.env</span>, na Verceli v Environment Variables) tieto premenné a reštartuj:
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={code}>VITE_SUPABASE_URL</span>
          <span style={code}>VITE_SUPABASE_ANON_KEY</span>
        </div>
        <div style={{ marginTop: 12, fontSize: 11.5, color: C.dim }}>Hodnoty nájdeš v Supabase → Project Settings → API. Postup je v súbore README.md.</div>
      </div>
    </Shell>
  );
}
