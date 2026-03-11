// KP Sales Tracker v4.0
// SQL: ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
// SQL: ALTER TABLE companies ADD COLUMN IF NOT EXISTS rebate BOOLEAN DEFAULT FALSE;
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const supabase = createClient(
  "https://fbeqqiimmccprknzrmwk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZXFxaWltbWNjcHJrbnpybXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxOTA5ODIsImV4cCI6MjA4ODc2Njk4Mn0.nmM1GHJZWtbF_Q-npeavMsUZDGyLJ9uDjrWZ2riRs2A"
);

const dbToUser = (r) => ({ id: r.id, username: r.username, email: r.email || "", password: r.password, isAdmin: r.is_admin, companyIds: r.company_ids || [], avatarUrl: r.avatar_url || "", permissions: r.permissions || {} });
const dbToClient = (r) => ({ id: r.id, name: r.name, year: r.year, annualGoal: r.annual_goal, quarters: r.quarters, rebate: r.rebate || false });

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
(function injectGlobal() {
  if (document.getElementById("kp-global")) return;
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp && !vp.content.includes("viewport-fit")) vp.content += ", viewport-fit=cover";
  const css = [
    "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }",
    "html, body { width: 100%; height: 100%; background: #080808; }",
    "#root { width: 100%; min-height: 100vh; }",
    ":root { --sat: env(safe-area-inset-top, 0px); --sab: env(safe-area-inset-bottom, 0px); }",
    ".kp-page { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; background: #080808; }",
    ".kp-hdr { flex-shrink: 0; }",
    ".kp-body { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }",
    ".no-print {}",
    "@media print { .no-print { display: none !important; } body { background: #fff !important; } .print-page { background: #fff !important; color: #111 !important; } }",
  ].join(" ");
  const s = document.createElement("style");
  s.id = "kp-global";
  s.textContent = css;
  document.head.prepend(s);
})();

// ─── PRINT STYLES ─────────────────────────────────────────────────────────────
const PRINT_CSS = "@media print { body { background: #fff !important; } .no-print { display: none !important; } .print-page { background: #fff !important; color: #111 !important; padding: 24px !important; } .print-card { background: #f7f7f7 !important; border: 1px solid #ddd !important; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; } .print-value-green { color: #16a34a !important; } .print-value-red { color: #dc2626 !important; } .print-value-dark { color: #111 !important; } }";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtShort = (v) => { if (v >= 1e6) return "R$ " + (v / 1e6).toFixed(1) + "M"; if (v >= 1e3) return "R$ " + (v / 1e3).toFixed(0) + "K"; return fmt(v); };
const pct = (r, g) => (g === 0 ? 0 : Math.min(100, Math.round((r / g) * 100)));
const fmtDate = (iso) => { if (!iso) return null; const d = new Date(iso); return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); };

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setMob(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return mob;
}

// ─── COLORS ───────────────────────────────────────────────────────────────────
const GREEN = "#22c55e"; const RED = "#ef4444"; const AMBER = "#f59e0b"; const BLUE = "#64b5f6";

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const IS = { width: "100%", background: "#1e1e1e", border: "1px solid #333", borderRadius: 10, padding: "12px 14px", color: "#f0f0f0", fontSize: 15, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };
const BS = { width: "100%", marginTop: 8, background: "linear-gradient(135deg,#e53935,#c62828)", border: "none", borderRadius: 10, padding: "13px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3, boxShadow: "0 4px 20px #e5393533", fontFamily: "'DM Sans', sans-serif" };

// ─── ATOMS ────────────────────────────────────────────────────────────────────
function ProgressBar({ value, thin }) {
  return (
    <div style={{ background: "#242424", borderRadius: 999, height: thin ? 5 : 8, overflow: "hidden", margin: thin ? "4px 0 2px" : "8px 0 4px" }}>
      <div style={{ width: value + "%", height: "100%", background: GREEN, borderRadius: 999, transition: "width .7s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, color: "#e53935", fontWeight: 700, letterSpacing: 2.5, margin: "28px 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 1, background: "#2a1010" }} />
      {children}
      <div style={{ flex: 1, height: 1, background: "#2a1010" }} />
    </div>
  );
}

function FL({ children, mt }) {
  return <div style={{ fontSize: 11, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4, marginTop: mt || 0 }}>{children}</div>;
}

function Avatar({ url, name, size = 36, fs = 16 }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: size / 2.5, objectFit: "cover", flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: size / 2.5, background: "linear-gradient(135deg,#e53935,#c62828)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: fs, flexShrink: 0, color: "#fff", fontWeight: 700 }}>{name?.[0] || "?"}</div>;
}


function Toggle({ on, onChange, label, icon }) {
  return (
    <div onClick={onChange} style={{ cursor: "pointer", background: on ? "#0d1f0d" : "#161616", border: "1px solid " + (on ? "#22c55e55" : "#282828"), borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 12, color: on ? "#22c55e" : "#666", fontWeight: on ? 700 : 400, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      </div>
      <div style={{ width: 34, height: 18, borderRadius: 999, background: on ? "#22c55e" : "#333", position: "relative", flexShrink: 0, transition: "background .2s" }}>
        <div style={{ position: "absolute", top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: 999, background: "#fff", transition: "left .2s" }} />
      </div>
    </div>
  );
}

const loadXLSX = () => new Promise((resolve, reject) => {
  if (window.XLSX) { resolve(window.XLSX); return; }
  const s = document.createElement("script");
  s.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js";
  s.onload = () => resolve(window.XLSX);
  s.onerror = () => reject(new Error("Falha ao carregar SheetJS"));
  document.head.appendChild(s);
});

// Header height accounting for safe area — used as padding-top on all page headers
const HDR_PAD_MOBILE = "max(env(safe-area-inset-top, 0px), 44px)";
const HDR_PAD_DESKTOP = "36px";

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ currentUser, screen, appIcon, onNav, onLogout }) {
  const items = [
    { id: "clients", icon: "🏢", label: "Carteira" },
    { id: "kpi", icon: "📊", label: "Painel KPIs" },
    ...(currentUser.isAdmin ? [{ id: "permissions", icon: "🛡️", label: "Permissões" }] : []),
    { id: "settings", icon: "⚙️", label: "Configurações" },
  ];
  return (
    <div style={{ width: 220, minHeight: "100vh", background: "#0a0a0a", borderRight: "1px solid #181818", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 50, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid #181818" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {appIcon
            ? <img src={appIcon} style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} alt="icon" />
            : <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#e53935,#c62828)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📊</div>}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#f0f0f0" }}>Sales Tracker</div>
            <div style={{ fontSize: 10, color: "#e53935", fontWeight: 700, letterSpacing: 1.5 }}>KP</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 20px 14px", borderBottom: "1px solid #141414", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar url={currentUser.avatarUrl} name={currentUser.username} size={32} fs={14} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{currentUser.username}</div>
          <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>{currentUser.isAdmin ? "Administrador" : "Usuário"}</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "12px 10px" }}>
        {items.map((item) => {
          const active = screen === item.id || (item.id === "clients" && screen === "dashboard");
          return (
            <button key={item.id} onClick={() => onNav(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: active ? "#1a0505" : "transparent", color: active ? "#ff6f61" : "#555", fontSize: 13, fontWeight: active ? 700 : 500, fontFamily: "'DM Sans', sans-serif", marginBottom: 2, borderLeft: active ? "2px solid #e53935" : "2px solid transparent", transition: "all .15s" }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "14px 10px", borderTop: "1px solid #141414" }}>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", color: "#444", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          <span>🚪</span> Sair
        </button>
      </div>
    </div>
  );
}

function DesktopLayout({ children, currentUser, screen, appIcon, onNav, onLogout }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080808" }}>
      <Sidebar currentUser={currentUser} screen={screen} appIcon={appIcon} onNav={onNav} onLogout={onLogout} />
      <div style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ users, appIcon, onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!u || !p) { setErr("Preencha todos os campos."); return; }
    setLoading(true);
    setTimeout(() => {
      const input = u.trim().toLowerCase();
      const found = users.find((x) => (x.username.toLowerCase() === input || (x.email && x.email.toLowerCase() === input)) && x.password === p);
      if (found) onLogin(found);
      else { setErr("Usuário ou senha inválidos."); setLoading(false); }
    }, 600);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: 360, background: "#111", borderRadius: 24, padding: "44px 36px", boxShadow: "0 0 80px #e5393515", border: "1px solid #1e1e1e" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {appIcon
            ? <img src={appIcon} alt="icon" style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px", display: "block", objectFit: "cover" }} />
            : <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#e53935,#c62828)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: "0 4px 28px #e5393540" }}>📊</div>}
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>Sales Tracker</div>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4, letterSpacing: 0.5 }}>KP Representação</div>
        </div>
        <FL>Usuário ou E-mail</FL>
        <input value={u} onChange={(e) => { setU(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="usuário ou e-mail" style={IS} />
        <FL mt={14}>Senha</FL>
        <input type="password" value={p} onChange={(e) => { setP(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••" style={{ ...IS, marginTop: 8 }} />
        {err && <div style={{ color: "#ff6f61", fontSize: 13, marginTop: 10, padding: "8px 12px", background: "#ff6f6111", borderRadius: 8 }}>{err}</div>}
        <button onClick={submit} disabled={loading} style={{ ...BS, marginTop: 20 }}>{loading ? "Entrando..." : "Entrar"}</button>
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function SettingsScreen({ currentUser, appIcon, onUpdateUser, onUpdateAppIcon, isMobile, onBack }) {
  const [name, setName] = useState(currentUser.username);
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [avPrev, setAvPrev] = useState(currentUser.avatarUrl || "");
  const [icoPrev, setIcoPrev] = useState(appIcon || "");
  const avRef = useRef();
  const icoRef = useRef();

  const flash = (ok, t) => { if (ok) { setMsg(t); setErr(""); setTimeout(() => setMsg(""), 2500); } else { setErr(t); setMsg(""); } };
  const readFile = (e, set) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => set(ev.target.result); r.readAsDataURL(f); };
  const saveProfile = () => {
    if (!name.trim()) { flash(false, "Nome não pode ser vazio."); return; }
    if (pass && pass !== pass2) { flash(false, "Senhas não conferem."); return; }
    const ch = { username: name.trim(), avatarUrl: avPrev };
    if (pass) ch.password = pass;
    onUpdateUser(currentUser.id, ch);
    flash(true, "Perfil atualizado com sucesso!");
    setPass(""); setPass2("");
  };

  const hdr = (
    <div className={isMobile ? "kp-hdr" : ""} style={{ background: "#0d0d0d", paddingTop: isMobile ? HDR_PAD_MOBILE : HDR_PAD_DESKTOP, paddingBottom: 22, paddingLeft: isMobile ? 22 : 36, paddingRight: isMobile ? 22 : 36, borderBottom: "1px solid #181818" }}>
      {isMobile && (<button onClick={onBack} style={{ background: "none", border: "none", color: "#e53935", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0, marginBottom: 12, display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>)}
      <div style={{ fontSize: 11, color: "#e53935", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>KP REPRESENTAÇÃO</div>
      <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>⚙️ Configurações</div>
      <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Personalize sua conta</div>
    </div>
  );
  const body = (
    <div style={{ padding: isMobile ? "20px 18px 60px" : "28px 36px", maxWidth: 560 }}>
      {msg && <div style={{ background: "#22c55e18", border: "1px solid #22c55e44", borderRadius: 12, padding: "12px 16px", marginBottom: 18, color: GREEN, fontSize: 13 }}>✅ {msg}</div>}
      {err && <div style={{ background: "#ef444418", border: "1px solid #ef444444", borderRadius: 12, padding: "12px 16px", marginBottom: 18, color: RED, fontSize: 13 }}>⚠️ {err}</div>}
      <div style={{ background: "#111", borderRadius: 16, padding: 22, border: "1px solid #1a1a1a", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 18 }}>👤 Meu Perfil</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {avPrev ? <img src={avPrev} style={{ width: 72, height: 72, borderRadius: 36, objectFit: "cover", border: "2px solid #2a2a2a", flexShrink: 0 }} alt="avatar" />
            : <div style={{ width: 72, height: 72, borderRadius: 36, background: "linear-gradient(135deg,#e53935,#c62828)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{currentUser.username[0]?.toUpperCase()}</div>}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>{currentUser.username}</div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 10 }}>{currentUser.isAdmin ? "Administrador" : "Usuário"}</div>
            <button onClick={() => avRef.current.click()} style={{ padding: "7px 14px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#aaa", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>📷 Alterar foto</button>
            <input ref={avRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => readFile(e, setAvPrev)} />
          </div>
        </div>
        <FL>Nome de usuário</FL>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...IS, marginTop: 6 }} />
        <FL mt={14}>Nova senha</FL>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="deixe em branco para manter" style={{ ...IS, marginTop: 6 }} />
        <FL mt={12}>Confirmar nova senha</FL>
        <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="repita a nova senha" style={{ ...IS, marginTop: 6 }} />
        <button onClick={saveProfile} style={{ ...BS, marginTop: 18 }}>Salvar Perfil</button>
      </div>
      {currentUser.isAdmin && (
        <div style={{ background: "#111", borderRadius: 16, padding: 22, border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 18 }}>🖼️ Ícone do App</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            {icoPrev ? <img src={icoPrev} style={{ width: 64, height: 64, borderRadius: 14, objectFit: "cover", border: "2px solid #2a2a2a" }} alt="app icon" />
              : <div style={{ width: 64, height: 64, borderRadius: 14, background: "linear-gradient(135deg,#e53935,#c62828)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📊</div>}
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Aparece no login e na sidebar</div>
              <button onClick={() => icoRef.current.click()} style={{ padding: "7px 14px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#aaa", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>📁 Escolher imagem</button>
              <input ref={icoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => readFile(e, setIcoPrev)} />
            </div>
          </div>
          <button onClick={() => { onUpdateAppIcon(icoPrev); flash(true, "Ícone do app atualizado!"); }} style={BS}>Salvar Ícone</button>
        </div>
      )}
    </div>
  );
  if (isMobile) return <div className="kp-page" style={{ fontFamily: "'DM Sans', sans-serif" }}>{hdr}<div className="kp-body">{body}</div></div>;
  return <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif" }}>{hdr}{body}</div>;
}


// ─── PERMISSIONS SCREEN ───────────────────────────────────────────────────────
function PermissionsScreen({ users, onUpdatePermissions, isMobile, onBack }) {
  const nonAdmins = users.filter((u) => !u.isAdmin);
  const permDefs = [
    { key: "canAddClient", icon: "🏢", label: "Cadastrar clientes" },
    { key: "canEditClient", icon: "✏️", label: "Editar clientes" },
    { key: "canDeleteClient", icon: "🗑️", label: "Excluir clientes" },
    { key: "canUpdateGoals", icon: "📊", label: "Atualizar metas" },
  ];
  const hdrStyle = { background: "#0d0d0d", paddingTop: isMobile ? HDR_PAD_MOBILE : HDR_PAD_DESKTOP, paddingBottom: 22, paddingLeft: isMobile ? 22 : 36, paddingRight: isMobile ? 22 : 36, borderBottom: "1px solid #181818" };
  const header = (
    <div className={isMobile ? "kp-hdr" : ""} style={hdrStyle}>
      {isMobile && (<button onClick={onBack} style={{ background: "none", border: "none", color: "#e53935", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0, marginBottom: 12, display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>)}
      <div style={{ fontSize: 11, color: "#e53935", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>KP REPRESENTAÇÃO</div>
      <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>🛡️ Permissões</div>
      <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Controle o que cada usuário pode fazer</div>
    </div>
  );
  const body = (
    <div style={{ padding: isMobile ? "20px 18px 60px" : "28px 36px", maxWidth: 720 }}>
      {nonAdmins.length === 0 && (<div style={{ textAlign: "center", padding: "60px 20px", color: "#444" }}><div style={{ fontSize: 36, marginBottom: 10 }}>👥</div><div style={{ fontSize: 15 }}>Nenhum usuário não-admin cadastrado</div></div>)}
      {nonAdmins.map((u) => (
        <div key={u.id} style={{ background: "#111", borderRadius: 16, padding: "18px 20px", border: "1px solid #1a1a1a", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Avatar url={u.avatarUrl} name={u.username} size={40} fs={18} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>{u.username}</div>
              <div style={{ fontSize: 12, color: "#555" }}>{u.email || "sem e-mail"}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 8 }}>
            {permDefs.map(({ key, icon, label }) => (
              <Toggle key={key} on={!!(u.permissions && u.permissions[key])} icon={icon} label={label}
                onChange={() => { const cur = u.permissions || {}; onUpdatePermissions(u.id, { ...cur, [key]: !cur[key] }); }} />
            ))}
          </div>
        </div>
      ))}
      <div style={{ padding: "12px 16px", background: "#0a1a0a", borderRadius: 12, border: "1px solid #22c55e22" }}>
        <div style={{ fontSize: 12, color: "#444" }}>ℹ️ Alterações têm efeito imediato. O admin sempre tem acesso total.</div>
      </div>
    </div>
  );
  if (isMobile) return <div className="kp-page" style={{ fontFamily: "'DM Sans', sans-serif" }}>{header}<div className="kp-body">{body}</div></div>;
  return <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif" }}>{header}{body}</div>;
}

// ─── USER MODAL (admin-only, full CRUD with login info) ──────────────────────
function UserModal({ users, clients, onAdd, onDelete, onUpdateUser, onUpdateUserCompanies, onClose }) {
  const [nu, setNu] = useState("");
  const [ne, setNe] = useState("");
  const [np, setNp] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPass, setEditPass] = useState("");
  const [editErr, setEditErr] = useState("");

  const add = () => {
    if (!nu.trim() || !np.trim()) { setErr("Preencha usuário e senha."); return; }
    if (ne.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ne.trim())) { setErr("E-mail inválido."); return; }
    if (users.find((x) => x.username === nu.trim())) { setErr("Usuário já existe."); return; }
    if (ne.trim() && users.find((x) => x.email && x.email === ne.trim())) { setErr("E-mail já cadastrado."); return; }
    onAdd({ id: Date.now().toString(), username: nu.trim(), email: ne.trim(), password: np.trim(), isAdmin: false, companyIds: [], avatarUrl: "" });
    const n = nu.trim(); setNu(""); setNe(""); setNp(""); setErr(""); setOk("Usuário \"" + n + "\" criado!"); setTimeout(() => setOk(""), 2500);
  };

  const saveEdit = (u) => {
    if (!editName.trim()) { setEditErr("Nome não pode ser vazio."); return; }
    if (users.find((x) => x.username === editName.trim() && x.id !== u.id)) { setEditErr("Esse nome já está em uso."); return; }
    const ch = { username: editName.trim(), email: editEmail.trim() };
    if (editPass.trim()) ch.password = editPass.trim();
    onUpdateUser(u.id, ch);
    setExpanded(null); setOk("Usuário atualizado!"); setTimeout(() => setOk(""), 2500);
  };

  const toggleCompany = (userId, companyId, currentIds) => {
    const next = currentIds.includes(companyId) ? currentIds.filter((id) => id !== companyId) : [...currentIds, companyId];
    onUpdateUserCompanies(userId, next);
  };

  const togglePanel = (uid, mode) => {
    if (expanded && expanded.id === uid && expanded.mode === mode) { setExpanded(null); return; }
    if (mode === "edit") { const u = users.find((x) => x.id === uid); setEditName(u.username); setEditEmail(u.email || ""); setEditPass(""); setEditErr(""); }
    setExpanded({ id: uid, mode });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, fontFamily: "'DM Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#141414", borderRadius: 20, padding: 28, width: 390, border: "1px solid #282828", maxHeight: "88vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f0" }}>👥 Usuários</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        {users.map((u) => (
          <div key={u.id} style={{ background: "#1c1c1c", borderRadius: 12, marginBottom: 8, border: "1px solid #282828", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar url={u.avatarUrl} name={u.username} size={30} fs={13} />
                <div>
                  <div style={{ color: "#f0f0f0", fontSize: 14, fontWeight: 600 }}>{u.username}</div>
                  <div style={{ color: "#555", fontSize: 11 }}>{u.isAdmin ? "Administrador" : u.email ? u.email : (u.companyIds || []).length + " empresa(s)"}</div>
                </div>
              </div>
              {!u.isAdmin && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => togglePanel(u.id, "edit")} style={{ background: expanded && expanded.id === u.id && expanded.mode === "edit" ? "#1a2a1a" : "#282828", border: "1px solid " + (expanded && expanded.id === u.id && expanded.mode === "edit" ? GREEN + "44" : "#383838"), borderRadius: 8, color: "#aaa", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>✏️ Editar</button>
                  <button onClick={() => togglePanel(u.id, "companies")} style={{ background: expanded && expanded.id === u.id && expanded.mode === "companies" ? "#1a1a2a" : "#282828", border: "1px solid " + (expanded && expanded.id === u.id && expanded.mode === "companies" ? BLUE + "44" : "#383838"), borderRadius: 8, color: "#aaa", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>🏢</button>
                  <button onClick={() => onDelete(u.id)} style={{ background: "#1a0a0a", border: "1px solid #e5393533", borderRadius: 8, color: "#ff6f61", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>🗑️</button>
                </div>
              )}
            </div>
            {expanded && expanded.id === u.id && expanded.mode === "edit" && (
              <div style={{ borderTop: "1px solid #282828", padding: 14, background: "#161616" }}>
                <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 10 }}>🔐 DADOS DE ACESSO (visível apenas para o admin)</div>
                <FL>Nome de usuário</FL>
                <input value={editName} onChange={(e) => { setEditName(e.target.value); setEditErr(""); }} style={{ ...IS, marginTop: 5, fontSize: 13, padding: "9px 12px" }} />
                <FL mt={10}>E-mail</FL>
                <input type="email" value={editEmail} onChange={(e) => { setEditEmail(e.target.value); setEditErr(""); }} placeholder="email@exemplo.com" style={{ ...IS, marginTop: 5, fontSize: 13, padding: "9px 12px" }} />
                <FL mt={10}>Nova senha (em branco = manter)</FL>
                <input type="password" value={editPass} onChange={(e) => { setEditPass(e.target.value); setEditErr(""); }} placeholder="••••••" style={{ ...IS, marginTop: 5, fontSize: 13, padding: "9px 12px" }} />
                {editErr && <div style={{ color: RED, fontSize: 11, marginTop: 6 }}>{editErr}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => setExpanded(null)} style={{ flex: 1, padding: "8px", background: "#282828", border: "none", borderRadius: 8, color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                  <button onClick={() => saveEdit(u)} style={{ flex: 1, padding: "8px", background: GREEN, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Salvar</button>
                </div>
              </div>
            )}
            {expanded && expanded.id === u.id && expanded.mode === "companies" && (
              <div style={{ borderTop: "1px solid #282828", padding: "10px 14px", background: "#161616" }}>
                <div style={{ fontSize: 10, color: "#555", marginBottom: 8, letterSpacing: 1 }}>EMPRESAS VISÍVEIS</div>
                {clients.map((c) => {
                  const ids = u.companyIds || [];
                  const active = ids.includes(c.id);
                  return (
                    <div key={c.id} onClick={() => toggleCompany(u.id, c.id, ids)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: active ? "#1a2a1a" : "#1e1e1e", border: "1px solid " + (active ? GREEN + "33" : "#282828") }}>
                      <span style={{ fontSize: 13, color: active ? GREEN : "#888" }}>{c.name}</span>
                      <span style={{ fontSize: 16 }}>{active ? "✓" : "○"}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        <div style={{ height: 1, background: "#1e1e1e", margin: "18px 0" }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 12 }}>Novo Usuário</div>
        <FL>Usuário</FL>
        <input value={nu} onChange={(e) => { setNu(e.target.value); setErr(""); }} placeholder="nome de usuário" style={IS} />
        <FL mt={10}>E-mail (opcional)</FL>
        <input type="email" value={ne} onChange={(e) => { setNe(e.target.value); setErr(""); }} placeholder="email@exemplo.com" style={{ ...IS, marginTop: 6 }} />
        <FL mt={10}>Senha</FL>
        <input value={np} onChange={(e) => { setNp(e.target.value); setErr(""); }} placeholder="senha" style={{ ...IS, marginTop: 6 }} />
        {err && <div style={{ color: "#ff6f61", fontSize: 12, marginTop: 8, padding: "7px 12px", background: "#ff6f6111", borderRadius: 8 }}>{err}</div>}
        {ok && <div style={{ color: GREEN, fontSize: 12, marginTop: 8, padding: "7px 12px", background: "#22c55e11", borderRadius: 8 }}>{ok}</div>}
        <button onClick={add} style={{ ...BS, marginTop: 14 }}>Criar Usuário</button>
      </div>
    </div>
  );
}

// ─── COMPANY MODAL ────────────────────────────────────────────────────────────
function CompanyModal({ existing, onSave, onClose, isAdmin }) {
  const isEdit = !!existing;
  const [name, setName] = useState(isEdit ? existing.name : "");
  const [year, setYear] = useState(isEdit ? String(existing.year) : "2026");
  const [mode, setMode] = useState("quarters");
  const [annual, setAnnual] = useState(isEdit ? String(existing.annualGoal) : "");
  const [qs, setQs] = useState(isEdit ? existing.quarters.map((q) => String(q.goal)) : ["", "", "", ""]);
  const [rebate, setRebate] = useState(isEdit ? (existing.rebate || false) : false);
  const [err, setErr] = useState("");
  const parseNum = (s) => parseFloat(String(s).replace(",", ".")) || 0;
  const setQ = (i, v) => { const a = [...qs]; a[i] = v; setQs(a); };
  const computedGoals = () => {
    if (mode === "annual") { const a = parseNum(annual); return { annualGoal: a, q: [a * 0.25, a * 0.25, a * 0.25, a * 0.25] }; }
    const qv = qs.map(parseNum);
    return { annualGoal: qv.reduce((s, x) => s + x, 0), q: qv };
  };
  const submit = () => {
    if (!name.trim()) { setErr("Informe o nome."); return; }
    const { annualGoal, q } = computedGoals();
    if (annualGoal <= 0) { setErr("Defina metas válidas."); return; }
    const labels = ["1º Trimestre", "2º Trimestre", "3º Trimestre", "4º Trimestre"];
    const quarters = labels.map((label, i) => ({ label, goal: q[i], realized: isEdit ? existing.quarters[i].realized : 0, lastUpdate: isEdit ? existing.quarters[i].lastUpdate : null }));
    onSave({ id: isEdit ? existing.id : Date.now(), name: name.trim(), year: parseInt(year) || 2026, annualGoal, quarters, rebate: isAdmin ? rebate : (isEdit ? (existing.rebate || false) : false) });
    onClose();
  };
  const { annualGoal, q } = computedGoals();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, fontFamily: "'DM Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#141414", borderRadius: 20, padding: 28, width: 380, border: "1px solid #282828", maxHeight: "92vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f0" }}>{isEdit ? "✏️ Editar Empresa" : "🏢 Nova Empresa"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <FL>Nome</FL>
        <input value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} placeholder="ex: Grupo Leão" style={IS} />
        <FL mt={14}>Ano</FL>
        <input value={year} onChange={(e) => setYear(e.target.value)} style={{ ...IS, marginTop: 6 }} />
        <div style={{ display: "flex", gap: 8, margin: "16px 0 12px" }}>
          {["annual", "quarters"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: mode === m ? "linear-gradient(135deg,#e53935,#c62828)" : "#282828", color: mode === m ? "#fff" : "#777", fontFamily: "'DM Sans', sans-serif" }}>
              {m === "annual" ? "Meta Anual" : "Por Trimestre"}
            </button>
          ))}
        </div>
        {mode === "annual" ? (
          <div>
            <FL>Meta Anual (R$)</FL>
            <input value={annual} onChange={(e) => setAnnual(e.target.value)} placeholder="ex: 500000" style={{ ...IS, marginTop: 6 }} />
            {parseNum(annual) > 0 && (
              <div style={{ marginTop: 10, padding: 12, background: "#1a1a1a", borderRadius: 10, border: "1px solid #282828" }}>
                <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>DISTRIBUIÇÃO (25% cada)</div>
                {["1º", "2º", "3º", "4º"].map((l, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginBottom: 3 }}>
                    <span>{l} Tri</span><span style={{ color: "#ccc" }}>{fmt(q[i])}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {["1º Trimestre", "2º Trimestre", "3º Trimestre", "4º Trimestre"].map((l, i) => (
              <div key={l}>
                <FL mt={12}>{l} (R$)</FL>
                <input value={qs[i]} onChange={(e) => setQ(i, e.target.value)} placeholder="ex: 125000" style={{ ...IS, marginTop: 5 }} />
              </div>
            ))}
            {annualGoal > 0 && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "#1a1a1a", borderRadius: 10, border: "1px solid #282828", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#666" }}>Total</span>
                <span style={{ color: GREEN, fontWeight: 700 }}>{fmt(annualGoal)}</span>
              </div>
            )}
          </div>
        )}
        {isAdmin && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #1e1e1e" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <FL>Rebate</FL>
              <div style={{ padding: "2px 8px", background: "#1a0505", border: "1px solid #e5393533", borderRadius: 6, fontSize: 9, color: "#e53935", fontWeight: 700, letterSpacing: 1 }}>🔒 SIGILOSO</div>
            </div>
            <Toggle on={rebate} icon="💰" label="Cliente com rebate" onChange={() => setRebate(!rebate)} />
          </div>
        )}
        {err && <div style={{ color: "#ff6f61", fontSize: 12, marginTop: 10, padding: "7px 12px", background: "#ff6f6111", borderRadius: 8 }}>{err}</div>}
        <button onClick={submit} style={{ ...BS, marginTop: 18 }}>{isEdit ? "Salvar Alterações" : "Cadastrar Empresa"}</button>
      </div>
    </div>
  );
}

// ─── IMPORT PREVIEW MODAL ─────────────────────────────────────────────────────
function ImportPreviewModal({ rows, onConfirm, onClose }) {
  const valid = rows.filter((r) => !r.error);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 250, fontFamily: "'DM Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#141414", borderRadius: 20, padding: 28, width: 420, maxHeight: "80vh", overflowY: "auto", border: "1px solid #282828" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>📥 Importar Empresas</div>
        <div style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>{rows.length} linha(s) encontrada(s) · {valid.length} válida(s)</div>
        {rows.map((r, i) => (
          <div key={i} style={{ background: "#1c1c1c", borderRadius: 10, padding: "10px 14px", marginBottom: 6, border: "1px solid " + (r.error ? "#ef444444" : "#282828") }}>
            <div style={{ fontWeight: 600, color: r.error ? "#ef4444" : "#f0f0f0", fontSize: 13 }}>{r.name || "(sem nome)"}</div>
            {r.error ? <div style={{ color: "#ef4444", fontSize: 11, marginTop: 3 }}>{r.error}</div>
              : <div style={{ color: "#555", fontSize: 11, marginTop: 3 }}>Ano {r.year} · Meta: {fmtShort(r.annualGoal)}{r.rebate ? " · 💰 Rebate" : ""}</div>}
          </div>
        ))}
        {rows.some((r) => r.error) && <div style={{ color: "#f59e0b", fontSize: 12, padding: "8px 12px", background: "#f59e0b11", borderRadius: 8, marginTop: 6 }}>⚠️ Linhas com erro serão ignoradas</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ ...BS, background: "#282828", boxShadow: "none", flex: 1, marginTop: 0 }}>Cancelar</button>
          <button onClick={() => onConfirm(valid)} disabled={valid.length === 0} style={{ ...BS, flex: 1, marginTop: 0 }}>Importar {valid.length}</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ name, onConfirm, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, fontFamily: "'DM Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#141414", borderRadius: 18, padding: "28px 28px 22px", width: 300, border: "1px solid #2a1010" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 28, textAlign: "center", marginBottom: 12 }}>🗑️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", textAlign: "center", marginBottom: 8 }}>Excluir empresa?</div>
        <div style={{ fontSize: 13, color: "#666", textAlign: "center", marginBottom: 24 }}>"{name}" será removida permanentemente.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...BS, background: "#282828", boxShadow: "none", flex: 1, marginTop: 0 }}>Cancelar</button>
          <button onClick={onConfirm} style={{ ...BS, flex: 1, marginTop: 0 }}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

function UpdateModal({ quarter, qIndex, onSave, onClose }) {
  const [val, setVal] = useState("");
  const num = parseFloat(val.replace(",", "."));
  const corrected = !isNaN(num) && num > 0 ? num / 0.8 : null;
  const save = () => { if (!corrected) return; onSave(qIndex, corrected); onClose(); };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, fontFamily: "'DM Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#141414", borderRadius: 20, padding: 28, width: 320, border: "1px solid #2a2a2a" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>Atualizar Realizado</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 20 }}>{quarter.label}</div>
        <FL>Valor bruto digitado (R$)</FL>
        <input type="number" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="0.00" style={{ ...IS, marginTop: 6 }} autoFocus />
        {corrected && (
          <div style={{ marginTop: 12, padding: "12px 14px", background: "#1a1a1a", borderRadius: 12, border: "1px solid #2a2a2a" }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 5 }}>VALOR CORRIGIDO (÷ 0,8)</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: GREEN, fontFamily: "monospace" }}>{fmt(corrected)}</div>
            <div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>Este valor será salvo</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ ...BS, background: "#222", boxShadow: "none", flex: 1, marginTop: 0 }}>Cancelar</button>
          <button onClick={save} style={{ ...BS, flex: 1, marginTop: 0 }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT LIST ──────────────────────────────────────────────────────────────
function ClientList({ clients, currentUser, users, isMobile, onSelect, onSaveClient, onDeleteClient, onAddUser, onDeleteUser, onUpdateUser, onUpdateUserCompanies, onLogout, onKpi, onSettings, onPermissions }) {
  const [showUsers, setShowUsers] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [deleteClient, setDeleteClient] = useState(null);
  const [importRows, setImportRows] = useState(null);
  const [importErr, setImportErr] = useState("");
  const importRef = React.useRef();
  const perms = currentUser.permissions || {};
  const canAdd = currentUser.isAdmin || !!perms.canAddClient;
  const canEdit = currentUser.isAdmin || !!perms.canEditClient;
  const canDelete = currentUser.isAdmin || !!perms.canDeleteClient;
  const visibleClients = currentUser.isAdmin ? clients : clients.filter((c) => (currentUser.companyIds || []).includes(c.id));

  const handleImportFile = async (e) => {
    const file = e.target.files[0]; if (!file) return; setImportErr("");
    try {
      const XLSX = await loadXLSX();
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const parsed = rawRows.map((row) => {
        const name = String(row["Nome da Empresa"] || row["Nome"] || "").trim();
        if (!name) return { name: "(vazio)", error: "Nome ausente" };
        const year = parseInt(row["Ano"]) || new Date().getFullYear();
        const pn = (s) => parseFloat(String(s || "").replace(",", ".")) || 0;
        const ma = pn(row["Meta Anual (R$)"] || row["Meta Anual"]);
        const q1 = pn(row["Meta Q1 (R$)"] || row["Meta Q1"]), q2 = pn(row["Meta Q2 (R$)"] || row["Meta Q2"]);
        const q3 = pn(row["Meta Q3 (R$)"] || row["Meta Q3"]), q4 = pn(row["Meta Q4 (R$)"] || row["Meta Q4"]);
        let annualGoal, goals;
        if (q1 > 0 || q2 > 0 || q3 > 0 || q4 > 0) { goals = [q1, q2, q3, q4]; annualGoal = goals.reduce((s, x) => s + x, 0); }
        else if (ma > 0) { annualGoal = ma; goals = [ma * 0.25, ma * 0.25, ma * 0.25, ma * 0.25]; }
        else return { name, error: "Meta não definida" };
        const rs = String(row["Rebate"] || "").toLowerCase();
        const rebate = rs === "sim" || rs === "yes" || rs === "true";
        const labels = ["1º Trimestre", "2º Trimestre", "3º Trimestre", "4º Trimestre"];
        const quarters = labels.map((label, i) => ({ label, goal: goals[i], realized: 0, lastUpdate: null }));
        return { id: Date.now() + Math.random(), name, year, annualGoal, quarters, rebate };
      }).filter((r) => r.name !== "");
      if (parsed.length === 0) { setImportErr("Nenhuma linha encontrada."); return; }
      setImportRows(parsed);
    } catch (ex) { setImportErr("Erro ao ler arquivo: " + ex.message); }
    e.target.value = "";
  };
  const handleImportConfirm = async (rows) => {
    for (const c of rows) await onSaveClient({ ...c, id: Date.now() + Math.random() });
    setImportRows(null);
  };

  const inner = (
    <div style={{ padding: isMobile ? "18px 20px 80px" : "28px 36px 60px" }}>
      {isMobile && (
        <button onClick={onKpi} style={{ width: "100%", padding: "14px 18px", background: "linear-gradient(135deg,#1a0505,#200808)", border: "1px solid #e5393533", borderRadius: 14, marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>📊</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>Painel de KPIs</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Visão consolidada</div>
            </div>
          </div>
          <span style={{ color: "#e53935", fontSize: 20 }}>›</span>
        </button>
      )}
      {!isMobile && visibleClients.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Empresas", value: visibleClients.length, icon: "🏢", color: BLUE },
            { label: "Meta Total", value: fmtShort(visibleClients.reduce((s, c) => s + c.annualGoal, 0)), icon: "🎯", color: AMBER },
            { label: "Realizado Total", value: fmtShort(visibleClients.reduce((s, c) => s + c.quarters.reduce((ss, q) => ss + q.realized, 0), 0)), icon: "✅", color: GREEN },
          ].map((card) => (
            <div key={card.label} style={{ background: "#111", borderRadius: 14, padding: "18px 20px", border: "1px solid " + card.color + "22" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: card.color, fontFamily: "monospace" }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: isMobile ? 13 : 15, color: "#555" }}>{visibleClients.length} empresa{visibleClients.length !== 1 ? "s" : ""}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {currentUser.isAdmin && (<button onClick={() => importRef.current && importRef.current.click()} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#aaa", fontSize: 12, padding: isMobile ? "7px 10px" : "8px 14px", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>📥 {!isMobile && "Importar Excel"}</button>)}
          {isMobile && currentUser.isAdmin && <button onClick={() => setShowUsers(true)} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#888", fontSize: 12, padding: "7px 12px", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>👥</button>}
          {!isMobile && currentUser.isAdmin && <button onClick={() => setShowUsers(true)} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#aaa", fontSize: 12, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>👥 Usuários</button>}
        </div>
      </div>
      <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleImportFile} />
      {importErr && <div style={{ color: "#ef4444", fontSize: 12, padding: "8px 12px", background: "#ef444411", borderRadius: 8, marginBottom: 12 }}>⚠️ {importErr}</div>}
      {!isMobile ? (
        <div style={{ background: "#111", borderRadius: 16, border: "1px solid #1a1a1a", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 100px 120px", padding: "10px 20px", borderBottom: "1px solid #1a1a1a" }}>
            {["Empresa", "Meta Anual", "Realizado", "Progresso", ""].map((h) => (
              <div key={h} style={{ fontSize: 10, color: "#444", letterSpacing: 1.2, textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {visibleClients.length === 0 && <div style={{ textAlign: "center", padding: "50px 20px", color: "#444", fontSize: 14 }}>Nenhuma empresa cadastrada</div>}
          {visibleClients.map((c, idx) => {
            const total = c.quarters.reduce((s, q) => s + q.realized, 0);
            const p = pct(total, c.annualGoal);
            return (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 100px 120px", padding: "14px 20px", borderBottom: idx < visibleClients.length - 1 ? "1px solid #161616" : "none", alignItems: "center" }}>
                <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }} onClick={() => onSelect(c)}>
                  <Avatar name={c.name} size={36} fs={16} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{c.name}</span>{currentUser.isAdmin && c.rebate && <span style={{ fontSize: 9, padding: "1px 6px", background: "#1a0d00", border: "1px solid #f59e0b44", borderRadius: 4, color: "#f59e0b", fontWeight: 700 }}>REBATE</span>}</div>
                    <div style={{ fontSize: 11, color: "#444" }}>{c.year}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: "#f0f0f0", fontFamily: "monospace", fontWeight: 600 }}>{fmtShort(c.annualGoal)}</div>
                <div style={{ fontSize: 14, color: GREEN, fontFamily: "monospace", fontWeight: 700 }}>{fmtShort(total)}</div>
                <div>
                  <div style={{ fontSize: 12, color: GREEN, fontWeight: 700, marginBottom: 4 }}>{p}%</div>
                  <ProgressBar value={p} thin />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {canEdit && <button onClick={() => setEditClient(c)} style={{ padding: "5px 9px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 7, color: "#888", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✏️</button>}
                  {canDelete && <button onClick={() => setDeleteClient(c)} style={{ padding: "5px 9px", background: "#1a0a0a", border: "1px solid #e5393533", borderRadius: 7, color: "#ff6f61", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🗑️</button>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          {visibleClients.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#444" }}>Nenhuma empresa disponível</div>
            </div>
          )}
          {visibleClients.map((c) => {
            const total = c.quarters.reduce((s, q) => s + q.realized, 0);
            const p = pct(total, c.annualGoal);
            return (
              <div key={c.id} style={{ background: "#111", borderRadius: 16, padding: "16px 18px", marginBottom: 10, border: "1px solid #1a1a1a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => onSelect(c)}>
                  <Avatar name={c.name} size={44} fs={20} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#f0f0f0", fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 5 }}>{fmt(c.annualGoal)} · {c.year}</div>
                    <ProgressBar value={p} thin />
                    <div style={{ fontSize: 10, color: GREEN, fontWeight: 700 }}>{p}% · {fmt(total)}</div>
                  </div>
                  <div style={{ color: "#333", fontSize: 22 }}>›</div>
                </div>
                {(canEdit || canDelete) && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #1a1a1a" }}>
                    {canEdit && <button onClick={() => setEditClient(c)} style={{ flex: 1, padding: "7px 0", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#aaa", fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>✏️ Editar</button>}
                    {canDelete && <button onClick={() => setDeleteClient(c)} style={{ flex: 1, padding: "7px 0", background: "#1a0a0a", border: "1px solid #e5393533", borderRadius: 8, color: "#ff6f61", fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>🗑️ Excluir</button>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {canAdd && <button onClick={() => setShowAdd(true)} style={{ width: "100%", padding: "14px", background: "none", border: "1px dashed #282828", borderRadius: 14, color: "#555", fontSize: 13, cursor: "pointer", fontWeight: 600, marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>
        + Nova Empresa
      </button>}
      {showUsers && <UserModal users={users} clients={clients} onAdd={onAddUser} onDelete={onDeleteUser} onUpdateUser={onUpdateUser} onUpdateUserCompanies={onUpdateUserCompanies} onClose={() => setShowUsers(false)} />}
      {(showAdd || editClient) && <CompanyModal existing={editClient} isAdmin={currentUser.isAdmin} onSave={onSaveClient} onClose={() => { setShowAdd(false); setEditClient(null); }} />}
      {deleteClient && <ConfirmModal name={deleteClient.name} onConfirm={() => { onDeleteClient(deleteClient.id); setDeleteClient(null); }} onClose={() => setDeleteClient(null)} />}
      {importRows && <ImportPreviewModal rows={importRows} onConfirm={handleImportConfirm} onClose={() => setImportRows(null)} />}
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: "#0f0f0f", paddingTop: HDR_PAD_MOBILE, paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px", borderBottom: "1px solid #181818" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "#e53935", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>KP REPRESENTAÇÃO</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>Carteira</div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>Olá, <span style={{ color: "#888" }}>{currentUser.username}</span></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {currentUser.isAdmin && (
                <button onClick={onPermissions} style={{ background: "none", border: "1px solid #222", borderRadius: 10, color: "#555", fontSize: 12, padding: "7px 10px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🛡️</button>
              )}
              <button onClick={onSettings} style={{ background: "none", border: "1px solid #222", borderRadius: 10, color: "#555", fontSize: 12, padding: "7px 10px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>⚙️</button>
              <button onClick={onLogout} style={{ background: "none", border: "1px solid #222", borderRadius: 10, color: "#555", fontSize: 12, padding: "7px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Sair</button>
            </div>
          </div>
        </div>
        {inner}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#0d0d0d", padding: HDR_PAD_DESKTOP + " 36px 24px", borderBottom: "1px solid #181818" }}>
        <div style={{ fontSize: 11, color: "#e53935", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>KP REPRESENTAÇÃO</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>Carteira de Clientes</div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Gerencie suas empresas e metas comerciais</div>
      </div>
      {inner}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ client, isMobile, onBack, onUpdate, canUpdate }) {
  const [modal, setModal] = useState(null);
  const total = client.quarters.reduce((s, q) => s + q.realized, 0);
  const annualPct = pct(total, client.annualGoal);
  const annualRem = Math.max(0, client.annualGoal - total);
  const handlePrint = () => { const style = document.createElement("style"); style.innerHTML = PRINT_CSS; document.head.appendChild(style); window.print(); setTimeout(() => document.head.removeChild(style), 1000); };

  return (
    <div className="kp-page print-page" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* HEADER */}
      <div className="kp-hdr" style={{ background: "#0f0f0f", paddingTop: isMobile ? HDR_PAD_MOBILE : HDR_PAD_DESKTOP, paddingBottom: "18px", paddingLeft: isMobile ? "20px" : "36px", paddingRight: isMobile ? "20px" : "36px", borderBottom: "1px solid #181818" }}>
        <button className="no-print" onClick={onBack} style={{ background: "none", border: "none", color: "#e53935", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
        <div style={{ background: "linear-gradient(135deg,#160404,#1c0808)", borderRadius: 14, padding: isMobile ? "14px 16px" : "18px 20px", border: "1px solid #e5393525", display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar name={client.name} size={isMobile ? 44 : 52} fs={isMobile ? 18 : 22} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5, marginBottom: 4 }}>{client.name}</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#555" }}>📅 Ano {client.year}</span>
              <span style={{ fontSize: 11, color: AMBER }}>🎯 Meta: {fmtShort(client.annualGoal)}</span>
              <span style={{ fontSize: 11, color: GREEN }}>✅ Realizado: {fmtShort(total)}</span>
            </div>
            <ProgressBar value={annualPct} thin />
            <span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>{annualPct}% da meta anual atingida</span>
          </div>
          <button className="no-print" onClick={handlePrint} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#666", fontSize: 11, padding: isMobile ? "6px 10px" : "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>🖨️ {!isMobile && "PDF"}</button>
        </div>
      </div>
      {/* BODY */}
      <div className="kp-body">
        <div style={{ padding: isMobile ? "16px 18px 80px" : "0 36px 60px" }}>
          <SectionTitle>ANUAL</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: isMobile ? 10 : 14, marginBottom: 8 }}>
            <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: isMobile ? "14px" : "18px 20px", border: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Meta Anual</div>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: "#f0f0f0", fontFamily: "monospace" }} className="print-value-dark">{fmt(client.annualGoal)}</div>
            </div>
            <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: isMobile ? "14px" : "18px 20px", border: "1px solid " + GREEN + "28", gridColumn: isMobile ? "span 2" : "auto" }}>
              <div style={{ fontSize: 10, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Realizado Anual</div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: GREEN, fontFamily: "monospace" }} className="print-value-green">{fmt(total)}</div>
              <ProgressBar value={annualPct} />
              <div style={{ fontSize: 12, color: GREEN, fontWeight: 700 }} className="print-value-green">{annualPct}% atingido</div>
            </div>
            <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: isMobile ? "14px" : "18px 20px", border: "1px solid " + RED + "28" }}>
              <div style={{ fontSize: 10, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Faltante Anual</div>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: annualRem === 0 ? GREEN : RED, fontFamily: "monospace" }} className={annualRem === 0 ? "print-value-green" : "print-value-red"}>{fmt(annualRem)}</div>
            </div>
          </div>
          {client.quarters.map((q, i) => {
            const qPct = pct(q.realized, q.goal);
            const qRem = Math.max(0, q.goal - q.realized);
            return (
              <div key={i}>
                <SectionTitle>{q.label.toUpperCase()}</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: isMobile ? 10 : 14, marginBottom: 8 }}>
                  <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: isMobile ? "14px" : "18px 20px", border: "1px solid #1a1a1a" }}>
                    <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Meta {q.label}</div>
                    <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: "#f0f0f0", fontFamily: "monospace" }} className="print-value-dark">{fmt(q.goal)}</div>
                  </div>
                  <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: isMobile ? "14px" : "18px 20px", border: "1px solid " + GREEN + "28", gridColumn: isMobile ? "span 2" : "auto", position: "relative" }}>
                    <div style={{ fontSize: 10, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Realizado {q.label}</div>
                    <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: GREEN, fontFamily: "monospace" }} className="print-value-green">{fmt(q.realized)}</div>
                    <ProgressBar value={qPct} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: GREEN, fontWeight: 700 }} className="print-value-green">{qPct}% atingido</span>
                      {q.lastUpdate && <span style={{ fontSize: 10, color: "#2a2a2a" }}>{fmtDate(q.lastUpdate)}</span>}
                    </div>
                    {canUpdate && <button className="no-print" onClick={() => setModal(i)} style={{ position: "absolute", top: 12, right: 12, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 11, fontWeight: 700, padding: "5px 10px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✏️ Atualizar</button>}
                  </div>
                  <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: isMobile ? "14px" : "18px 20px", border: "1px solid " + RED + "28" }}>
                    <div style={{ fontSize: 10, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Faltante {q.label}</div>
                    <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: qRem === 0 ? GREEN : RED, fontFamily: "monospace" }} className={qRem === 0 ? "print-value-green" : "print-value-red"}>{fmt(qRem)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {modal !== null && <UpdateModal quarter={client.quarters[modal]} qIndex={modal} onSave={onUpdate} onClose={() => setModal(null)} />}
    </div>
  );
}

// ─── KPI DASHBOARD ────────────────────────────────────────────────────────────
function KpiDashboard({ clients, isMobile, onBack }) {
  const totalGoal = clients.reduce((s, c) => s + c.annualGoal, 0);
  const totalRealized = clients.reduce((s, c) => s + c.quarters.reduce((ss, q) => ss + q.realized, 0), 0);
  const totalPct = pct(totalRealized, totalGoal);
  const totalRemaining = Math.max(0, totalGoal - totalRealized);
  const q1Goal = clients.reduce((s, c) => s + (c.quarters[0] ? c.quarters[0].goal : 0), 0);
  const q1Real = clients.reduce((s, c) => s + (c.quarters[0] ? c.quarters[0].realized : 0), 0);
  const q1Pct = pct(q1Real, q1Goal);
  const avgPct = clients.length > 0 ? Math.round(clients.reduce((s, c) => s + pct(c.quarters.reduce((ss, q) => ss + q.realized, 0), c.annualGoal), 0) / clients.length) : 0;
  const onTrack = clients.filter((c) => pct(c.quarters[0] ? c.quarters[0].realized : 0, c.quarters[0] ? c.quarters[0].goal : 1) >= 50).length;
  const rating = totalPct >= 80 ? { label: "Excelente", color: GREEN, icon: "🏆" } : totalPct >= 60 ? { label: "Bom", color: AMBER, icon: "📈" } : totalPct >= 40 ? { label: "Regular", color: "#ff9800", icon: "⚠️" } : { label: "Atenção", color: RED, icon: "🚨" };
  const rows = clients.map((c) => { const r = c.quarters.reduce((s, q) => s + q.realized, 0); const p = pct(r, c.annualGoal); return { name: c.name, annualGoal: c.annualGoal, realized: r, pct: p }; }).sort((a, b) => b.pct - a.pct);
  const handlePrint = () => { const style = document.createElement("style"); style.innerHTML = PRINT_CSS; document.head.appendChild(style); window.print(); setTimeout(() => document.head.removeChild(style), 1000); };
  const monthsElapsed = 2.5;
  const projRealized = monthsElapsed > 0 ? totalRealized * (12 / monthsElapsed) : 0;
  const projPct = pct(projRealized, totalGoal);

  return (
    <div className="kp-page print-page" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* HEADER */}
      <div className="kp-hdr" style={{ background: "#0f0f0f", paddingTop: isMobile ? HDR_PAD_MOBILE : HDR_PAD_DESKTOP, paddingBottom: "18px", paddingLeft: isMobile ? "20px" : "36px", paddingRight: isMobile ? "20px" : "36px", borderBottom: "1px solid #181818" }}>
        <button className="no-print" onClick={onBack} style={{ background: "none", border: "none", color: "#e53935", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0, marginBottom: 10, display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "#e53935", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>KP REPRESENTAÇÃO</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>Painel de KPIs</div>
              <div style={{ padding: "4px 10px", background: rating.color + "18", borderRadius: 20, fontSize: 11, color: rating.color, fontWeight: 700, border: "1px solid " + rating.color + "33" }}>{rating.icon} {rating.label}</div>
            </div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{clients.length} empresa{clients.length !== 1 ? "s" : ""} na carteira</div>
          </div>
          {!isMobile && <button className="no-print" onClick={handlePrint} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#666", fontSize: 11, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🖨️ PDF</button>}
        </div>
      </div>
      {/* BODY */}
      <div className="kp-body">
        <div style={{ padding: isMobile ? "16px 18px 80px" : "0 36px 60px" }}>
          <SectionTitle>VISÃO GERAL</SectionTitle>
          <div className="print-card" style={{ background: "linear-gradient(135deg,#160404,#1c0808)", borderRadius: 16, padding: isMobile ? "16px" : "20px 24px", marginBottom: 14, border: "1px solid #e5393525" }}>
            <div style={{ fontSize: 10, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Realizado Total vs Meta Anual</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 900, color: GREEN, fontFamily: "monospace" }} className="print-value-green">{fmtShort(totalRealized)}</div>
              <div style={{ fontSize: 14, color: "#555" }}>de {fmtShort(totalGoal)}</div>
            </div>
            <ProgressBar value={totalPct} />
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: GREEN, fontWeight: 700 }} className="print-value-green">{totalPct}% da meta anual</span>
              <span style={{ fontSize: 11, color: RED }} className="print-value-red">faltam {fmtShort(totalRemaining)}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: isMobile ? 10 : 14, marginBottom: 14 }}>
            {[
              { icon: "🎯", label: "1º Tri Carteira", v: q1Pct + "%", sub: fmtShort(q1Real) + " / " + fmtShort(q1Goal), c: q1Pct >= 70 ? GREEN : q1Pct >= 40 ? AMBER : RED },
              { icon: "📊", label: "Média Carteira", v: avgPct + "%", sub: "desempenho médio", c: avgPct >= 50 ? GREEN : AMBER },
              { icon: "✅", label: "No Ritmo", v: onTrack + "/" + clients.length, sub: "acima de 50%", c: onTrack === clients.length ? GREEN : AMBER },
            ].map((k) => (
              <div key={k.label} className="print-card" style={{ background: "#111", borderRadius: 14, padding: isMobile ? "14px" : "16px 18px", border: "1px solid " + k.c + "22" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{k.icon}</div>
                <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: k.c, fontFamily: "monospace" }}>{k.v}</div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>
          <SectionTitle>RANKING DE EMPRESAS</SectionTitle>
          <div style={{ background: "#111", borderRadius: 16, border: "1px solid #1a1a1a", overflow: "hidden", marginBottom: 14 }}>
            {!isMobile && (
              <div style={{ display: "grid", gridTemplateColumns: "40px 2fr 1.2fr 1.2fr 1fr", padding: "10px 20px", borderBottom: "1px solid #1a1a1a" }}>
                {["#", "Empresa", "Meta Anual", "Realizado", "% Anual"].map((h) => (
                  <div key={h} style={{ fontSize: 10, color: "#444", letterSpacing: 1.2, textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>
            )}
            {rows.map((r, i) => (
              <div key={r.name} className="print-card" style={{ display: "grid", gridTemplateColumns: isMobile ? "36px 1fr" : "40px 2fr 1.2fr 1.2fr 1fr", padding: isMobile ? "12px 16px" : "14px 20px", borderBottom: i < rows.length - 1 ? "1px solid #161616" : "none", alignItems: "center", gap: isMobile ? 10 : 0 }}>
                <div style={{ fontSize: 20 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span style={{ color: "#444", fontSize: 13, fontWeight: 700 }}>{i + 1}</span>}</div>
                {isMobile ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginBottom: 3 }}>{r.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#666" }}>{fmtShort(r.annualGoal)}</span>
                      <span style={{ fontSize: 12, color: GREEN, fontWeight: 700 }}>{fmtShort(r.realized)}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: r.pct >= 80 ? GREEN : r.pct >= 50 ? AMBER : RED }}>{r.pct}%</span>
                    </div>
                    <ProgressBar value={r.pct} thin />
                  </div>
                ) : (
                  <React.Fragment>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{r.name}</div>
                    <div style={{ fontSize: 13, color: "#f0f0f0", fontFamily: "monospace", fontWeight: 600 }}>{fmtShort(r.annualGoal)}</div>
                    <div style={{ fontSize: 13, color: GREEN, fontFamily: "monospace", fontWeight: 700 }}>{fmtShort(r.realized)}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: r.pct >= 80 ? GREEN : r.pct >= 50 ? AMBER : RED, fontFamily: "monospace", marginBottom: 3 }}>{r.pct}%</div>
                      <ProgressBar value={r.pct} thin />
                    </div>
                  </React.Fragment>
                )}
              </div>
            ))}
          </div>
          <SectionTitle>PROJEÇÃO ANUAL</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: isMobile ? "16px" : "18px 20px", border: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Projeção com base no ritmo atual</div>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: projPct >= 80 ? GREEN : projPct >= 60 ? AMBER : RED, fontFamily: "monospace" }}>{fmtShort(projRealized)}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2, marginBottom: 10 }}>{projPct}% da meta projetado</div>
              <ProgressBar value={Math.min(100, projPct)} />
              <div style={{ fontSize: 13, fontWeight: 700, color: projPct >= 100 ? GREEN : projPct >= 70 ? AMBER : RED, marginTop: 6 }}>{projPct >= 100 ? "✅ Meta atingível" : projPct >= 70 ? "⚡ Precisa acelerar" : "🚨 Ritmo insuficiente"}</div>
            </div>
            <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: isMobile ? "16px" : "18px 20px", border: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Análise de Gap Mensal</div>
              {[
                { label: "Necessário/mês", value: totalRemaining / 9.5, color: BLUE },
                { label: "Ritmo atual/mês", value: totalRealized / monthsElapsed, color: (totalRealized / monthsElapsed) >= (totalRemaining / 9.5) ? GREEN : RED },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "#666" }}>{item.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: "monospace" }}>{fmtShort(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#e53935,#c62828)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: "0 4px 28px #e5393540" }}>📊</div>
        <div style={{ fontSize: 16, color: "#555", letterSpacing: 1 }}>Carregando...</div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [screen, setScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const [appIcon, setAppIcon] = useState("");

  useEffect(() => {
    async function loadData() {
      const [{ data: usersData }, { data: companiesData }, { data: settingsData }] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("companies").select("*"),
        supabase.from("app_settings").select("*"),
      ]);
      if (usersData) setUsers(usersData.map(dbToUser));
      if (companiesData) setClients(companiesData.map(dbToClient));
      if (settingsData) { const iconRow = settingsData.find((r) => r.key === "app_icon"); if (iconRow && iconRow.value) setAppIcon(iconRow.value); }
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    const sub = supabase.channel("companies-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, async () => {
        const { data } = await supabase.from("companies").select("*");
        if (data) {
          const updated = data.map(dbToClient);
          setClients(updated);
          setSelected((prev) => prev ? updated.find((c) => c.id === prev.id) || prev : prev);
        }
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const handleSaveClient = async (c) => {
    const row = { id: c.id, name: c.name, year: c.year, annual_goal: c.annualGoal, quarters: c.quarters, rebate: c.rebate || false };
    await supabase.from("companies").upsert(row);
    setClients((prev) => { const exists = prev.find((x) => x.id === c.id); return exists ? prev.map((x) => x.id === c.id ? c : x) : [...prev, c]; });
  };

  const handleDeleteClient = async (id) => {
    await supabase.from("companies").delete().eq("id", id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    const updatedUsers = users.map((u) => ({ ...u, companyIds: (u.companyIds || []).filter((cid) => cid !== id) }));
    for (const u of updatedUsers) {
      if ((u.companyIds || []).length !== (users.find((x) => x.id === u.id).companyIds || []).length) {
        await supabase.from("users").update({ company_ids: u.companyIds }).eq("id", u.id);
      }
    }
    setUsers(updatedUsers);
    if (selected && selected.id === id) setSelected(null);
  };

  const handleUpdate = async (qIndex, value) => {
    const now = new Date().toISOString();
    const updatedClient = { ...selected, quarters: selected.quarters.map((q, i) => i === qIndex ? { ...q, realized: value, lastUpdate: now } : q) };
    await supabase.from("companies").update({ quarters: updatedClient.quarters }).eq("id", selected.id);
    setClients((prev) => prev.map((c) => c.id === selected.id ? updatedClient : c));
    setSelected(updatedClient);
  };

  const handleSelect = (c) => { setSelected(clients.find((x) => x.id === c.id) || c); setScreen("dashboard"); };

  const handleUpdateUser = async (userId, changes) => {
    const dbChanges = {};
    if (changes.username !== undefined) dbChanges.username = changes.username;
    if (changes.password !== undefined) dbChanges.password = changes.password;
    if (changes.avatarUrl !== undefined) dbChanges.avatar_url = changes.avatarUrl;
    if (changes.email !== undefined) dbChanges.email = changes.email;
    await supabase.from("users").update(dbChanges).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...changes } : u));
    if (currentUser && currentUser.id === userId) setCurrentUser((prev) => ({ ...prev, ...changes }));
  };

  const handleUpdateUserCompanies = async (userId, companyIds) => {
    await supabase.from("users").update({ company_ids: companyIds }).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, companyIds } : u));
    if (currentUser && currentUser.id === userId) setCurrentUser((prev) => ({ ...prev, companyIds }));
  };

  const handleUpdatePermissions = async (userId, permissions) => {
    await supabase.from("users").update({ permissions }).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, permissions } : u));
    if (currentUser && currentUser.id === userId) setCurrentUser((prev) => ({ ...prev, permissions }));
  };

  const handleAddUser = async (u) => {
    const row = { id: u.id, username: u.username, email: u.email || "", password: u.password, is_admin: false, company_ids: [], avatar_url: "", permissions: {} };
    await supabase.from("users").insert(row);
    setUsers((prev) => [...prev, u]);
  };

  const handleDeleteUser = async (id) => {
    await supabase.from("users").delete().eq("id", id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleUpdateAppIcon = async (iconData) => {
    await supabase.from("app_settings").upsert({ key: "app_icon", value: iconData });
    setAppIcon(iconData);
  };

  const handleNav = (target) => {
    if (target === "kpi") setScreen("kpi");
    else if (target === "settings") setScreen("settings");
    else if (target === "permissions") setScreen("permissions");
    else setScreen("clients");
  };

  const kpiClients = currentUser && currentUser.isAdmin ? clients : clients.filter((c) => (currentUser ? currentUser.companyIds || [] : []).includes(c.id));
  const canUpdate = currentUser ? currentUser.isAdmin || !!(currentUser.permissions && currentUser.permissions.canUpdateGoals) : false;

  if (loading) return <LoadingScreen />;
  if (screen === "login") return <LoginScreen users={users} appIcon={appIcon} onLogin={(u) => { setCurrentUser(u); setScreen("clients"); }} />;

  const mainContent = (() => {
    if (screen === "kpi") return <KpiDashboard clients={kpiClients} isMobile={isMobile} onBack={() => setScreen("clients")} />;
    if (screen === "dashboard") return <Dashboard client={selected} isMobile={isMobile} onBack={() => setScreen("clients")} onUpdate={handleUpdate} canUpdate={canUpdate} />;
    if (screen === "permissions" && currentUser.isAdmin) return <PermissionsScreen users={users} onUpdatePermissions={handleUpdatePermissions} isMobile={isMobile} onBack={() => setScreen("clients")} />;
    if (screen === "settings") return <SettingsScreen currentUser={currentUser} appIcon={appIcon} onUpdateUser={handleUpdateUser} onUpdateAppIcon={handleUpdateAppIcon} isMobile={isMobile} onBack={() => setScreen("clients")} />;
    return <ClientList clients={clients} currentUser={currentUser} users={users} isMobile={isMobile} onSelect={handleSelect} onSaveClient={handleSaveClient} onDeleteClient={handleDeleteClient} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser} onUpdateUserCompanies={handleUpdateUserCompanies} onLogout={() => { setCurrentUser(null); setScreen("login"); }} onKpi={() => setScreen("kpi")} onSettings={() => setScreen("settings")} onPermissions={() => setScreen("permissions")} />;
  })();

  if (isMobile) return mainContent;
  return <DesktopLayout currentUser={currentUser} screen={screen} appIcon={appIcon} onNav={handleNav} onLogout={() => { setCurrentUser(null); setScreen("login"); }}>{mainContent}</DesktopLayout>;
}
