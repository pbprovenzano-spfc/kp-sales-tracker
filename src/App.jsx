// KP Sales Tracker v2.0 - settings, kpi todos, foto perfil, icone app
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  "https://fbeqqiimmccprknzrmwk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZXFxaWltbWNjcHJrbnpybXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxOTA5ODIsImV4cCI6MjA4ODc2Njk4Mn0.nmM1GHJZWtbF_Q-npeavMsUZDGyLJ9uDjrWZ2riRs2A"
);

// ─── DB HELPERS ───────────────────────────────────────────────────────────────
const dbToUser = (r) => ({ id: r.id, username: r.username, password: r.password, isAdmin: r.is_admin, companyIds: r.company_ids || [] });
const dbToClient = (r) => ({ id: r.id, name: r.name, year: r.year, annualGoal: r.annual_goal, quarters: r.quarters });

// ─── GLOBAL RESET ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } html, body { width: 100%; height: 100%; background: #080808; } #root { width: 100%; min-height: 100vh; }`;
(function injectGlobal() {
  if (document.getElementById("kp-global")) return;
  const s = document.createElement("style"); s.id = "kp-global"; s.innerHTML = GLOBAL_CSS; document.head.prepend(s);
})();

// ─── PRINT STYLES ─────────────────────────────────────────────────────────────
const PRINT_CSS = `
@media print {
  body { background: #fff !important; color: #111 !important; font-family: 'DM Sans', sans-serif; }
  .no-print { display: none !important; }
  .print-page { background: #fff !important; color: #111 !important; padding: 24px !important; }
  .print-card { background: #f7f7f7 !important; border: 1px solid #ddd !important; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }
  .print-value-green { color: #16a34a !important; }
  .print-value-red { color: #dc2626 !important; }
  .print-value-dark { color: #111 !important; }
  .print-section { color: #e53935 !important; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 20px 0 10px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  .print-bar-bg { background: #e5e5e5 !important; border-radius: 999px; height: 7px; margin: 6px 0 3px; overflow: hidden; }
  .print-bar-fill { height: 100%; border-radius: 999px; }
}`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtShort = v => { if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`; if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(0)}K`; return fmt(v); };
const pct = (r, g) => (g === 0 ? 0 : Math.min(100, Math.round((r / g) * 100)));
const fmtDate = iso => { if (!iso) return null; const d = new Date(iso); return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); };

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return isMobile;
}

// ─── COLORS ───────────────────────────────────────────────────────────────────
const GREEN = "#22c55e"; const RED = "#ef4444"; const AMBER = "#f59e0b"; const BLUE = "#64b5f6"; const ORANGE = "#ff9800";

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const IS = { width: "100%", background: "#1e1e1e", border: "1px solid #333", borderRadius: 10, padding: "12px 14px", color: "#f0f0f0", fontSize: 15, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };
const BS = { width: "100%", marginTop: 8, background: "linear-gradient(135deg,#e53935,#c62828)", border: "none", borderRadius: 10, padding: "13px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3, boxShadow: "0 4px 20px #e5393533", fontFamily: "'DM Sans', sans-serif" };

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function ProgressBar({ value, thin, print }) {
  if (print) return <div className="print-bar-bg"><div className="print-bar-fill" style={{ width: `${value}%`, background: "#16a34a" }} /></div>;
  return <div style={{ background: "#242424", borderRadius: 999, height: thin ? 5 : 8, overflow: "hidden", margin: thin ? "4px 0 2px" : "8px 0 4px" }}><div style={{ width: `${value}%`, height: "100%", background: GREEN, borderRadius: 999, transition: "width .7s cubic-bezier(.4,0,.2,1)" }} /></div>;
}

function SectionTitle({ children, print }) {
  if (print) return <div className="print-section">{children}</div>;
  return <div style={{ fontSize: 11, color: "#e53935", fontWeight: 700, letterSpacing: 2.5, margin: "28px 0 12px", display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1, height: 1, background: "#2a1010" }} />{children}<div style={{ flex: 1, height: 1, background: "#2a1010" }} /></div>;
}

function FL({ children, mt }) { return <div style={{ fontSize: 11, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4, marginTop: mt || 0 }}>{children}</div>; }

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

// ─── DESKTOP SIDEBAR ──────────────────────────────────────────────────────────
function Sidebar({ currentUser, screen, onNav, onLogout }) {
  const navItems = [{ id: "clients", icon: "🏢", label: "Carteira" }, ...(currentUser.isAdmin ? [{ id: "kpi", icon: "📊", label: "Painel KPIs" }] : [])];
  return (
    <div style={{ width: 220, minHeight: "100vh", background: "#0a0a0a", borderRight: "1px solid #181818", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 50, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid #181818" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#e53935,#c62828)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📊</div>
          <div><div style={{ fontSize: 13, fontWeight: 800, color: "#f0f0f0" }}>Sales Tracker</div><div style={{ fontSize: 10, color: "#e53935", fontWeight: 700, letterSpacing: 1.5 }}>KP</div></div>
        </div>
      </div>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #141414" }}>
        <div style={{ fontSize: 11, color: "#444", marginBottom: 3 }}>Logado como</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>{currentUser.username}</div>
        <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>{currentUser.isAdmin ? "Administrador" : "Usuário"}</div>
      </div>
      <div style={{ flex: 1, padding: "12px 10px" }}>
        {navItems.map(item => {
          const active = screen === item.id || (item.id === "clients" && screen === "dashboard");
          return <button key={item.id} onClick={() => onNav(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: active ? "#1a0505" : "transparent", color: active ? "#ff6f61" : "#555", fontSize: 13, fontWeight: active ? 700 : 500, fontFamily: "'DM Sans', sans-serif", marginBottom: 2, borderLeft: active ? "2px solid #e53935" : "2px solid transparent", transition: "all .15s" }}><span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}</button>;
        })}
      </div>
      <div style={{ padding: "14px 10px", borderTop: "1px solid #141414" }}>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", color: "#444", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}><span>🚪</span> Sair</button>
      </div>
    </div>
  );
}

function DesktopLayout({ children, currentUser, screen, onNav, onLogout }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080808" }}>
      <Sidebar currentUser={currentUser} screen={screen} onNav={onNav} onLogout={onLogout} />
      <div style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ users, onLogin }) {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const submit = () => {
    if (!u || !p) { setErr("Preencha todos os campos."); return; }
    setLoading(true);
    setTimeout(() => {
      const found = users.find(x => x.username === u && x.password === p);
      if (found) onLogin(found); else { setErr("Usuário ou senha inválidos."); setLoading(false); }
    }, 700);
  };
  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: 360, background: "#111", borderRadius: 24, padding: "44px 36px", boxShadow: "0 0 80px #e5393515", border: "1px solid #1e1e1e" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#e53935,#c62828)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: "0 4px 28px #e5393540" }}>📊</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>Sales Tracker</div>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4, letterSpacing: 0.5 }}>KP Representação</div>
        </div>
        <FL>Usuário</FL>
        <input value={u} onChange={e => { setU(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && submit()} placeholder="seu usuário" style={IS} />
        <FL mt={14}>Senha</FL>
        <input type="password" value={p} onChange={e => { setP(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && submit()} placeholder="••••••" style={{ ...IS, marginTop: 8 }} />
        {err && <div style={{ color: "#ff6f61", fontSize: 13, marginTop: 10, padding: "8px 12px", background: "#ff6f6111", borderRadius: 8 }}>{err}</div>}
        <button onClick={submit} disabled={loading} style={{ ...BS, marginTop: 20 }}>{loading ? "Entrando..." : "Entrar"}</button>
      </div>
    </div>
  );
}

// ─── USER MODAL ───────────────────────────────────────────────────────────────
function UserModal({ users, clients, onAdd, onDelete, onUpdateUser, onUpdateUserCompanies, onClose }) {
  const [nu, setNu] = useState(""); const [np, setNp] = useState(""); const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  const [expandedUser, setExpandedUser] = useState(null); const [editName, setEditName] = useState(""); const [editPass, setEditPass] = useState(""); const [editErr, setEditErr] = useState("");

  const add = () => {
    if (!nu.trim() || !np.trim()) { setErr("Preencha usuário e senha."); return; }
    if (users.find(x => x.username === nu.trim())) { setErr("Usuário já existe."); return; }
    onAdd({ id: Date.now().toString(), username: nu.trim(), password: np.trim(), isAdmin: false, companyIds: [] });
    const n = nu.trim(); setNu(""); setNp(""); setErr(""); setOk(`Usuário "${n}" criado!`); setTimeout(() => setOk(""), 2500);
  };
  const openEdit = (u) => { setEditName(u.username); setEditPass(""); setEditErr(""); setExpandedUser({ id: u.id, mode: "edit" }); };
  const saveEdit = (u) => {
    if (!editName.trim()) { setEditErr("Nome não pode ser vazio."); return; }
    if (users.find(x => x.username === editName.trim() && x.id !== u.id)) { setEditErr("Esse nome já está em uso."); return; }
    onUpdateUser(u.id, { username: editName.trim(), password: editPass.trim() !== "" ? editPass.trim() : u.password });
    setExpandedUser(null); setOk("Usuário atualizado!"); setTimeout(() => setOk(""), 2500);
  };
  const toggleCompany = (userId, companyId, currentIds) => { const next = currentIds.includes(companyId) ? currentIds.filter(id => id !== companyId) : [...currentIds, companyId]; onUpdateUserCompanies(userId, next); };
  const togglePanel = (uid, mode) => { if (expandedUser?.id === uid && expandedUser?.mode === mode) { setExpandedUser(null); return; } if (mode === "edit") { openEdit(users.find(u => u.id === uid)); return; } setExpandedUser({ id: uid, mode }); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, fontFamily: "'DM Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#141414", borderRadius: 20, padding: 28, width: 380, border: "1px solid #282828", maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f0" }}>👥 Usuários</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        {users.map(u => (
          <div key={u.id} style={{ background: "#1c1c1c", borderRadius: 12, marginBottom: 8, border: "1px solid #282828", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
              <div><div style={{ color: "#f0f0f0", fontSize: 14, fontWeight: 600 }}>{u.username}</div><div style={{ color: "#555", fontSize: 11 }}>{u.isAdmin ? "Administrador" : `${(u.companyIds || []).length} empresa(s)`}</div></div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {!u.isAdmin && <button onClick={() => togglePanel(u.id, "edit")} style={{ background: expandedUser?.id === u.id && expandedUser?.mode === "edit" ? "#1a2a1a" : "#282828", border: `1px solid ${expandedUser?.id === u.id && expandedUser?.mode === "edit" ? GREEN + "44" : "#383838"}`, borderRadius: 8, color: "#aaa", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>✏️ Editar</button>}
                {!u.isAdmin && <button onClick={() => togglePanel(u.id, "companies")} style={{ background: expandedUser?.id === u.id && expandedUser?.mode === "companies" ? "#1a1a2a" : "#282828", border: `1px solid ${expandedUser?.id === u.id && expandedUser?.mode === "companies" ? BLUE + "44" : "#383838"}`, borderRadius: 8, color: "#aaa", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>🏢 Empresas</button>}
                {!u.isAdmin && <button onClick={() => onDelete(u.id)} style={{ background: "#1a0a0a", border: "1px solid #e5393533", borderRadius: 8, color: "#ff6f61", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>🗑️</button>}
              </div>
            </div>
            {expandedUser?.id === u.id && expandedUser?.mode === "edit" && (
              <div style={{ borderTop: "1px solid #282828", padding: 14, background: "#161616" }}>
                <FL>Novo nome</FL>
                <input value={editName} onChange={e => { setEditName(e.target.value); setEditErr(""); }} style={{ ...IS, marginTop: 5, fontSize: 13, padding: "9px 12px" }} />
                <FL mt={10}>Nova senha <span style={{ color: "#3a3a3a", textTransform: "none", letterSpacing: 0 }}>(em branco = manter)</span></FL>
                <input type="password" value={editPass} onChange={e => { setEditPass(e.target.value); setEditErr(""); }} placeholder="••••••" style={{ ...IS, marginTop: 5, fontSize: 13, padding: "9px 12px" }} />
                {editErr && <div style={{ color: RED, fontSize: 11, marginTop: 6 }}>{editErr}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => setExpandedUser(null)} style={{ flex: 1, padding: "8px", background: "#282828", border: "none", borderRadius: 8, color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                  <button onClick={() => saveEdit(u)} style={{ flex: 1, padding: "8px", background: GREEN, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Salvar</button>
                </div>
              </div>
            )}
            {expandedUser?.id === u.id && expandedUser?.mode === "companies" && (
              <div style={{ borderTop: "1px solid #282828", padding: "10px 14px", background: "#161616" }}>
                <div style={{ fontSize: 10, color: "#555", marginBottom: 8, letterSpacing: 1 }}>EMPRESAS VISÍVEIS</div>
                {clients.map(c => { const ids = u.companyIds || []; const active = ids.includes(c.id); return <div key={c.id} onClick={() => toggleCompany(u.id, c.id, ids)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: active ? "#1a2a1a" : "#1e1e1e", border: `1px solid ${active ? GREEN + "33" : "#282828"}` }}><span style={{ fontSize: 13, color: active ? GREEN : "#888" }}>{c.name}</span><span style={{ fontSize: 16 }}>{active ? "✓" : "○"}</span></div>; })}
              </div>
            )}
          </div>
        ))}
        <div style={{ height: 1, background: "#1e1e1e", margin: "18px 0" }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 12 }}>Novo Usuário</div>
        <FL>Usuário</FL><input value={nu} onChange={e => { setNu(e.target.value); setErr(""); }} placeholder="nome" style={IS} />
        <FL mt={10}>Senha</FL><input value={np} onChange={e => { setNp(e.target.value); setErr(""); }} placeholder="senha" style={{ ...IS, marginTop: 6 }} />
        {err && <div style={{ color: "#ff6f61", fontSize: 12, marginTop: 8, padding: "7px 12px", background: "#ff6f6111", borderRadius: 8 }}>{err}</div>}
        {ok && <div style={{ color: GREEN, fontSize: 12, marginTop: 8, padding: "7px 12px", background: "#22c55e11", borderRadius: 8 }}>{ok}</div>}
        <button onClick={add} style={{ ...BS, marginTop: 14 }}>Criar Usuário</button>
      </div>
    </div>
  );
}

// ─── COMPANY MODAL ────────────────────────────────────────────────────────────
function CompanyModal({ existing, onSave, onClose }) {
  const isEdit = !!existing;
  const [name, setName] = useState(isEdit ? existing.name : "");
  const [year, setYear] = useState(isEdit ? String(existing.year) : "2026");
  const [mode, setMode] = useState("quarters");
  const [annual, setAnnual] = useState(isEdit ? String(existing.annualGoal) : "");
  const [qs, setQs] = useState(isEdit ? existing.quarters.map(q => String(q.goal)) : ["", "", "", ""]);
  const [err, setErr] = useState("");
  const parseNum = s => parseFloat(String(s).replace(",", ".")) || 0;
  const setQ = (i, v) => { const a = [...qs]; a[i] = v; setQs(a); };
  const computedGoals = () => { if (mode === "annual") { const a = parseNum(annual); return { annualGoal: a, q: [a * 0.25, a * 0.25, a * 0.25, a * 0.25] }; } const qv = qs.map(parseNum); return { annualGoal: qv.reduce((s, x) => s + x, 0), q: qv }; };
  const submit = () => {
    if (!name.trim()) { setErr("Informe o nome."); return; }
    const { annualGoal, q } = computedGoals();
    if (annualGoal <= 0) { setErr("Defina metas válidas."); return; }
    const labels = ["1º Trimestre", "2º Trimestre", "3º Trimestre", "4º Trimestre"];
    const quarters = labels.map((label, i) => ({ label, goal: q[i], realized: isEdit ? existing.quarters[i].realized : 0, lastUpdate: isEdit ? existing.quarters[i].lastUpdate : null }));
    onSave({ id: isEdit ? existing.id : Date.now(), name: name.trim(), year: parseInt(year) || 2026, annualGoal, quarters });
    onClose();
  };
  const { annualGoal, q } = computedGoals();
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, fontFamily: "'DM Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#141414", borderRadius: 20, padding: 28, width: 380, border: "1px solid #282828", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f0" }}>{isEdit ? "✏️ Editar Empresa" : "🏢 Nova Empresa"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <FL>Nome</FL><input value={name} onChange={e => { setName(e.target.value); setErr(""); }} placeholder="ex: Grupo Leão" style={IS} />
        <FL mt={14}>Ano</FL><input value={year} onChange={e => setYear(e.target.value)} style={{ ...IS, marginTop: 6 }} />
        <div style={{ display: "flex", gap: 8, margin: "16px 0 12px" }}>
          {["annual", "quarters"].map(m => <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: mode === m ? "linear-gradient(135deg,#e53935,#c62828)" : "#282828", color: mode === m ? "#fff" : "#777", fontFamily: "'DM Sans', sans-serif" }}>{m === "annual" ? "Meta Anual" : "Por Trimestre"}</button>)}
        </div>
        {mode === "annual" ? (
          <><FL>Meta Anual (R$)</FL><input value={annual} onChange={e => setAnnual(e.target.value)} placeholder="ex: 500000" style={{ ...IS, marginTop: 6 }} />{parseNum(annual) > 0 && <div style={{ marginTop: 10, padding: 12, background: "#1a1a1a", borderRadius: 10, border: "1px solid #282828" }}><div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>DISTRIBUIÇÃO (25% cada)</div>{["1º", "2º", "3º", "4º"].map((l, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginBottom: 3 }}><span>{l} Tri</span><span style={{ color: "#ccc" }}>{fmt(q[i])}</span></div>)}</div>}</>
        ) : (
          <>{["1º Trimestre", "2º Trimestre", "3º Trimestre", "4º Trimestre"].map((l, i) => <div key={l}><FL mt={12}>{l} (R$)</FL><input value={qs[i]} onChange={e => setQ(i, e.target.value)} placeholder="ex: 125000" style={{ ...IS, marginTop: 5 }} /></div>)}{annualGoal > 0 && <div style={{ marginTop: 10, padding: "10px 14px", background: "#1a1a1a", borderRadius: 10, border: "1px solid #282828", display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "#666" }}>Total</span><span style={{ color: GREEN, fontWeight: 700 }}>{fmt(annualGoal)}</span></div>}</>
        )}
        {err && <div style={{ color: "#ff6f61", fontSize: 12, marginTop: 10, padding: "7px 12px", background: "#ff6f6111", borderRadius: 8 }}>{err}</div>}
        <button onClick={submit} style={{ ...BS, marginTop: 18 }}>{isEdit ? "Salvar Alterações" : "Cadastrar Empresa"}</button>
      </div>
    </div>
  );
}

function ConfirmModal({ name, onConfirm, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000d", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, fontFamily: "'DM Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#141414", borderRadius: 18, padding: "28px 28px 22px", width: 300, border: "1px solid #2a1010" }} onClick={e => e.stopPropagation()}>
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

// ─── UPDATE MODAL ─────────────────────────────────────────────────────────────
function UpdateModal({ quarter, qIndex, onSave, onClose }) {
  const [val, setVal] = useState("");
  const num = parseFloat(val.replace(",", "."));
  const corrected = !isNaN(num) && num > 0 ? num / 0.8 : null;
  const save = () => { if (!corrected) return; onSave(qIndex, corrected); onClose(); };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, fontFamily: "'DM Sans', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#141414", borderRadius: 20, padding: 28, width: 320, border: "1px solid #2a2a2a" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>Atualizar Realizado</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 20 }}>{quarter.label}</div>
        <FL>Valor bruto digitado (R$)</FL>
        <input type="number" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && save()} placeholder="0.00" style={{ ...IS, marginTop: 6 }} autoFocus />
        {corrected && <div style={{ marginTop: 12, padding: "12px 14px", background: "#1a1a1a", borderRadius: 12, border: "1px solid #2a2a2a" }}><div style={{ fontSize: 10, color: "#555", marginBottom: 5 }}>VALOR CORRIGIDO (÷ 0,8)</div><div style={{ fontSize: 22, fontWeight: 800, color: GREEN, fontFamily: "monospace" }}>{fmt(corrected)}</div><div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>Este valor será salvo</div></div>}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ ...BS, background: "#222", boxShadow: "none", flex: 1, marginTop: 0 }}>Cancelar</button>
          <button onClick={save} style={{ ...BS, flex: 1, marginTop: 0 }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT LIST ──────────────────────────────────────────────────────────────
function ClientList({ clients, currentUser, users, isMobile, onSelect, onSaveClient, onDeleteClient, onAddUser, onDeleteUser, onUpdateUser, onUpdateUserCompanies, onLogout, onKpi }) {
  const [showUsers, setShowUsers] = useState(false); const [showAdd, setShowAdd] = useState(false); const [editClient, setEditClient] = useState(null); const [deleteClient, setDeleteClient] = useState(null);
  const visibleClients = currentUser.isAdmin ? clients : clients.filter(c => (currentUser.companyIds || []).includes(c.id));

  const inner = (
    <div style={{ padding: isMobile ? "18px 20px 80px" : "28px 36px 60px" }}>
      {isMobile && currentUser.isAdmin && (
        <button onClick={onKpi} style={{ width: "100%", padding: "14px 18px", background: "linear-gradient(135deg,#1a0505,#200808)", border: "1px solid #e5393533", borderRadius: 14, marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 22 }}>📊</span><div style={{ textAlign: "left" }}><div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>Painel de KPIs</div><div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Visão consolidada</div></div></div>
          <span style={{ color: "#e53935", fontSize: 20 }}>›</span>
        </button>
      )}
      {!isMobile && visibleClients.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[{ label: "Empresas", value: visibleClients.length, icon: "🏢", color: BLUE }, { label: "Meta Total", value: fmtShort(visibleClients.reduce((s, c) => s + c.annualGoal, 0)), icon: "🎯", color: AMBER }, { label: "Realizado Total", value: fmtShort(visibleClients.reduce((s, c) => s + c.quarters.reduce((ss, q) => ss + q.realized, 0), 0)), icon: "✅", color: GREEN }].map(card => (
            <div key={card.label} style={{ background: "#111", borderRadius: 14, padding: "18px 20px", border: `1px solid ${card.color}22` }}><div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div><div style={{ fontSize: 11, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>{card.label}</div><div style={{ fontSize: 22, fontWeight: 800, color: card.color, fontFamily: "monospace" }}>{card.value}</div></div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: isMobile ? 13 : 15, color: "#555" }}>{visibleClients.length} empresa{visibleClients.length !== 1 ? "s" : ""}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {isMobile && currentUser.isAdmin && <button onClick={() => setShowUsers(true)} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#888", fontSize: 12, padding: "7px 12px", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>👥</button>}
          {!isMobile && currentUser.isAdmin && <button onClick={() => setShowUsers(true)} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#aaa", fontSize: 12, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>👥 Usuários</button>}
        </div>
      </div>
      {!isMobile ? (
        <div style={{ background: "#111", borderRadius: 16, border: "1px solid #1a1a1a", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 100px 120px", padding: "10px 20px", borderBottom: "1px solid #1a1a1a" }}>
            {["Empresa", "Meta Anual", "Realizado", "Progresso", ""].map(h => <div key={h} style={{ fontSize: 10, color: "#444", letterSpacing: 1.2, textTransform: "uppercase" }}>{h}</div>)}
          </div>
          {visibleClients.length === 0 && <div style={{ textAlign: "center", padding: "50px 20px", color: "#444", fontSize: 14 }}>Nenhuma empresa cadastrada</div>}
          {visibleClients.map((c, idx) => { const total = c.quarters.reduce((s, q) => s + q.realized, 0); const p = pct(total, c.annualGoal); return (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 100px 120px", padding: "14px 20px", borderBottom: idx < visibleClients.length - 1 ? "1px solid #161616" : "none", alignItems: "center", transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = "#161616"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }} onClick={() => onSelect(c)}><div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#e53935,#c62828)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{c.name[0]}</div><div><div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{c.name}</div><div style={{ fontSize: 11, color: "#444" }}>{c.year}</div></div></div>
              <div style={{ fontSize: 14, color: "#888", fontFamily: "monospace" }}>{fmtShort(c.annualGoal)}</div>
              <div style={{ fontSize: 14, color: GREEN, fontFamily: "monospace", fontWeight: 700 }}>{fmtShort(total)}</div>
              <div><div style={{ fontSize: 12, color: GREEN, fontWeight: 700, marginBottom: 4 }}>{p}%</div><ProgressBar value={p} thin /></div>
              {currentUser.isAdmin && <div style={{ display: "flex", gap: 6 }}><button onClick={() => setEditClient(c)} style={{ padding: "5px 9px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 7, color: "#888", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✏️</button><button onClick={() => setDeleteClient(c)} style={{ padding: "5px 9px", background: "#1a0a0a", border: "1px solid #e5393533", borderRadius: 7, color: "#ff6f61", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🗑️</button></div>}
            </div>
          ); })}
        </div>
      ) : (
        <>
          {visibleClients.length === 0 && <div style={{ textAlign: "center", padding: "50px 20px" }}><div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div><div style={{ fontSize: 15, fontWeight: 600, color: "#444" }}>Nenhuma empresa disponível</div></div>}
          {visibleClients.map(c => { const total = c.quarters.reduce((s, q) => s + q.realized, 0); const p = pct(total, c.annualGoal); return (
            <div key={c.id} style={{ background: "#111", borderRadius: 16, padding: "16px 18px", marginBottom: 10, border: "1px solid #1a1a1a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => onSelect(c)}><div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#e53935,#c62828)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.name[0]}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, color: "#f0f0f0", fontSize: 15 }}>{c.name}</div><div style={{ fontSize: 11, color: "#555", marginBottom: 5 }}>{fmt(c.annualGoal)} · {c.year}</div><ProgressBar value={p} thin /><div style={{ fontSize: 10, color: GREEN, fontWeight: 700 }}>{p}% · {fmt(total)}</div></div><div style={{ color: "#333", fontSize: 22 }}>›</div></div>
              {currentUser.isAdmin && <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #1a1a1a" }}><button onClick={() => setEditClient(c)} style={{ flex: 1, padding: "7px 0", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#aaa", fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>✏️ Editar</button><button onClick={() => setDeleteClient(c)} style={{ flex: 1, padding: "7px 0", background: "#1a0a0a", border: "1px solid #e5393533", borderRadius: 8, color: "#ff6f61", fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>🗑️ Excluir</button></div>}
            </div>
          ); })}
        </>
      )}
      {currentUser.isAdmin && <button onClick={() => setShowAdd(true)} style={{ width: "100%", padding: "14px", background: "none", border: "1px dashed #282828", borderRadius: 14, color: "#555", fontSize: 13, cursor: "pointer", fontWeight: 600, marginTop: 12, fontFamily: "'DM Sans', sans-serif" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#e53935"; e.currentTarget.style.color = "#e53935"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#282828"; e.currentTarget.style.color = "#555"; }}>+ Nova Empresa</button>}
      {showUsers && <UserModal users={users} clients={clients} onAdd={onAddUser} onDelete={onDeleteUser} onUpdateUser={onUpdateUser} onUpdateUserCompanies={onUpdateUserCompanies} onClose={() => setShowUsers(false)} />}
      {(showAdd || editClient) && <CompanyModal existing={editClient} onSave={onSaveClient} onClose={() => { setShowAdd(false); setEditClient(null); }} />}
      {deleteClient && <ConfirmModal name={deleteClient.name} onConfirm={() => { onDeleteClient(deleteClient.id); setDeleteClient(null); }} onClose={() => setDeleteClient(null)} />}
    </div>
  );

  if (isMobile) return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#0f0f0f", padding: "48px 22px 22px", borderBottom: "1px solid #181818" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><div style={{ fontSize: 11, color: "#e53935", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>KP REPRESENTAÇÃO</div><div style={{ fontSize: 24, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>Carteira</div><div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>Olá, <span style={{ color: "#888" }}>{currentUser.username}</span></div></div>
          <button onClick={onLogout} style={{ background: "none", border: "1px solid #222", borderRadius: 10, color: "#555", fontSize: 12, padding: "7px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Sair</button>
        </div>
      </div>
      {inner}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#0d0d0d", padding: "32px 36px 24px", borderBottom: "1px solid #181818" }}>
        <div style={{ fontSize: 11, color: "#e53935", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>KP REPRESENTAÇÃO</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>Carteira de Clientes</div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Gerencie suas empresas e metas comerciais</div>
      </div>
      {inner}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ client, isMobile, onBack, onUpdate }) {
  const [modal, setModal] = useState(null);
  const total = client.quarters.reduce((s, q) => s + q.realized, 0);
  const annualPct = pct(total, client.annualGoal);
  const annualRem = Math.max(0, client.annualGoal - total);
  const handlePrint = () => { const style = document.createElement("style"); style.innerHTML = PRINT_CSS; document.head.appendChild(style); window.print(); setTimeout(() => document.head.removeChild(style), 1000); };

  const quarterCards = client.quarters.map((q, i) => {
    const qPct = pct(q.realized, q.goal); const qRem = Math.max(0, q.goal - q.realized);
    if (!isMobile) return (
      <div key={i}><SectionTitle>{q.label.toUpperCase()}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 8 }}>
          <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: "16px 18px", border: "1px solid #1a1a1a" }}><div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Meta {q.label}</div><div className="print-value-dark" style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0", fontFamily: "monospace" }}>{fmt(q.goal)}</div></div>
          <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: "16px 18px", border: `1px solid ${GREEN}28`, position: "relative" }}>
            <div style={{ fontSize: 10, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Realizado {q.label}</div>
            <div className="print-value-green" style={{ fontSize: 18, fontWeight: 700, color: GREEN, fontFamily: "monospace" }}>{fmt(q.realized)}</div>
            <ProgressBar value={qPct} /><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>{qPct}%</span>{q.lastUpdate && <span style={{ fontSize: 9, color: "#2a2a2a", fontStyle: "italic" }}>atualizado {fmtDate(q.lastUpdate)}</span>}</div>
            <button className="no-print" onClick={() => setModal(i)} style={{ position: "absolute", top: 14, right: 14, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 11, fontWeight: 700, padding: "5px 9px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#e53935"; e.currentTarget.style.color = "#ff6f61"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#888"; }}>✏️</button>
          </div>
          <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: "16px 18px", border: `1px solid ${RED}28` }}><div style={{ fontSize: 10, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Faltante {q.label}</div><div className="print-value-red" style={{ fontSize: 18, fontWeight: 700, color: qRem === 0 ? GREEN : RED, fontFamily: "monospace" }}>{fmt(qRem)}</div></div>
        </div>
      </div>
    );
    return (
      <div key={i}><SectionTitle>{q.label.toUpperCase()}</SectionTitle>
        <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: "14px 18px", marginBottom: 10, border: "1px solid #1a1a1a" }}><div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Meta {q.label}</div><div className="print-value-dark" style={{ fontSize: 20, fontWeight: 700, color: "#f0f0f0", fontFamily: "monospace" }}>{fmt(q.goal)}</div></div>
        <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: "14px 18px", marginBottom: 10, border: `1px solid ${GREEN}28`, position: "relative" }}>
          <div style={{ paddingRight: 80 }}><div style={{ fontSize: 10, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Realizado {q.label}</div><div className="print-value-green" style={{ fontSize: 20, fontWeight: 700, color: GREEN, fontFamily: "monospace" }}>{fmt(q.realized)}</div><ProgressBar value={qPct} /><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>{qPct}%</span>{q.lastUpdate && <span style={{ fontSize: 9, color: "#2a2a2a", fontStyle: "italic" }}>atualizado {fmtDate(q.lastUpdate)}</span>}</div></div>
          <button className="no-print" onClick={() => setModal(i)} style={{ position: "absolute", top: 14, right: 14, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 9, color: "#888", fontSize: 11, fontWeight: 700, padding: "6px 10px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#e53935"; e.currentTarget.style.color = "#ff6f61"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#888"; }}>✏️ Editar</button>
        </div>
        <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: "14px 18px", marginBottom: 10, border: `1px solid ${RED}28` }}><div style={{ fontSize: 10, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Faltante {q.label}</div><div className="print-value-red" style={{ fontSize: 20, fontWeight: 700, color: qRem === 0 ? GREEN : RED, fontFamily: "monospace" }}>{fmt(qRem)}</div></div>
      </div>
    );
  });

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif", paddingBottom: 60 }}>
      <div className="no-print" style={{ background: "#0f0f0f", padding: isMobile ? "44px 22px 20px" : "28px 36px 24px", borderBottom: "1px solid #181818", ...(isMobile ? { position: "sticky", top: 0, zIndex: 10 } : {}) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {isMobile && <button onClick={onBack} style={{ background: "none", border: "none", color: "#e53935", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0, marginBottom: 10, display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Sans', sans-serif" }}>← Carteira</button>}
          <button onClick={handlePrint} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#aaa", fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, marginLeft: isMobile ? 0 : "auto" }}>📄 Exportar PDF</button>
        </div>
        <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>{client.name}</div>
        <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Ano {client.year}</div>
      </div>
      <div className="print-page" style={{ padding: isMobile ? "4px 20px 0" : "28px 36px 40px" }}>
        <SectionTitle>ANUAL</SectionTitle>
        {!isMobile ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 8 }}>
            {[{ label: "Meta Anual", value: fmt(client.annualGoal), color: "#888", border: "#1a1a1a" }, { label: "Realizado Anual", value: fmt(total), color: GREEN, border: GREEN + "28", extra: `${annualPct}% atingido` }, { label: "Faltante Anual", value: fmt(annualRem), color: annualRem === 0 ? GREEN : RED, border: RED + "28" }].map(card => (
              <div key={card.label} className="print-card" style={{ background: "#111", borderRadius: 14, padding: "16px 18px", border: `1px solid ${card.border}` }}><div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{card.label}</div><div style={{ fontSize: 20, fontWeight: 800, color: card.color, fontFamily: "monospace" }}>{card.value}</div>{card.extra && <><ProgressBar value={annualPct} /><span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>{card.extra}</span></>}</div>
            ))}
          </div>
        ) : (
          <>
            <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: "14px 18px", marginBottom: 10, border: "1px solid #1a1a1a" }}><div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Meta Anual</div><div className="print-value-dark" style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", fontFamily: "monospace" }}>{fmt(client.annualGoal)}</div></div>
            <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: "14px 18px", marginBottom: 10, border: `1px solid ${GREEN}28` }}><div style={{ fontSize: 10, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Realizado Anual</div><div className="print-value-green" style={{ fontSize: 22, fontWeight: 800, color: GREEN, fontFamily: "monospace" }}>{fmt(total)}</div><ProgressBar value={annualPct} /><span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>{annualPct}% atingido</span></div>
            <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: "14px 18px", marginBottom: 10, border: `1px solid ${RED}28` }}><div style={{ fontSize: 10, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Faltante Anual</div><div className="print-value-red" style={{ fontSize: 22, fontWeight: 800, color: annualRem === 0 ? GREEN : RED, fontFamily: "monospace" }}>{fmt(annualRem)}</div></div>
          </>
        )}
        {quarterCards}
      </div>
      {modal !== null && <UpdateModal quarter={client.quarters[modal]} qIndex={modal} onSave={onUpdate} onClose={() => setModal(null)} />}
    </div>
  );
}

// ─── KPI DASHBOARD ────────────────────────────────────────────────────────────
function KpiDashboard({ clients, isMobile, onBack }) {
  const totalGoal = clients.reduce((s, c) => s + c.annualGoal, 0);
  const totalRealized = clients.reduce((s, c) => s + c.quarters.reduce((ss, q) => ss + q.realized, 0), 0);
  const totalPct = pct(totalRealized, totalGoal); const totalRemaining = Math.max(0, totalGoal - totalRealized);
  const currentQ = 0;
  const qGoalTotal = clients.reduce((s, c) => s + (c.quarters[currentQ]?.goal || 0), 0);
  const qRealTotal = clients.reduce((s, c) => s + (c.quarters[currentQ]?.realized || 0), 0);
  const qPctTotal = pct(qRealTotal, qGoalTotal);
  const onTrack = clients.filter(c => pct(c.quarters[currentQ]?.realized || 0, c.quarters[currentQ]?.goal || 1) >= 50).length;
  const offTrack = clients.length - onTrack;
  const avgPct = clients.length > 0 ? Math.round(clients.reduce((s, c) => s + pct(c.quarters.reduce((ss, q) => ss + q.realized, 0), c.annualGoal), 0) / clients.length) : 0;
  const totalUpdates = clients.reduce((s, c) => s + c.quarters.filter(q => q.realized > 0).length, 0);
  const avgTicket = totalUpdates > 0 ? totalRealized / totalUpdates : 0;
  const rating = totalPct >= 80 ? { label: "Excelente", color: GREEN, icon: "🏆" } : totalPct >= 60 ? { label: "Bom", color: AMBER, icon: "📈" } : totalPct >= 40 ? { label: "Regular", color: ORANGE, icon: "⚠️" } : { label: "Atenção", color: RED, icon: "🚨" };
  const rows = clients.map(c => { const r = c.quarters.reduce((s, q) => s + q.realized, 0); const p = pct(r, c.annualGoal); const qR = c.quarters[currentQ]?.realized || 0; const qG = c.quarters[currentQ]?.goal || 0; const qP = pct(qR, qG); return { name: c.name, annualGoal: c.annualGoal, realized: r, pct: p, qGoal: qG, qReal: qR, qPct: qP }; }).sort((a, b) => b.pct - a.pct);
  const monthsElapsed = 2.5; const projAnual = totalRealized * (12 / monthsElapsed); const projPct = pct(projAnual, totalGoal);
  const handlePrint = () => { const style = document.createElement("style"); style.innerHTML = PRINT_CSS; document.head.appendChild(style); window.print(); setTimeout(() => document.head.removeChild(style), 1000); };
  const KpiCard = ({ icon, label, value, sub, color }) => <div style={{ background: "#111", borderRadius: 14, padding: "16px 16px 14px", border: `1px solid ${color}22`, flex: "1 1 140px", minWidth: 0 }}><div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div><div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>{label}</div><div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "monospace" }}>{value}</div>{sub && <div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>{sub}</div>}</div>;
  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "'DM Sans', sans-serif", paddingBottom: 60 }}>
      <div className="no-print" style={{ background: "#0f0f0f", padding: isMobile ? "44px 22px 20px" : "28px 36px 24px", borderBottom: "1px solid #181818", ...(isMobile ? { position: "sticky", top: 0, zIndex: 10 } : {}) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {isMobile && <button onClick={onBack} style={{ background: "none", border: "none", color: "#e53935", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>← Carteira</button>}
          <button onClick={handlePrint} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#aaa", fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, marginLeft: isMobile ? 0 : "auto" }}>📄 Exportar PDF</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>Painel de KPIs</div><div style={{ padding: "4px 10px", background: `${rating.color}18`, borderRadius: 20, fontSize: 11, color: rating.color, fontWeight: 700 }}>{rating.icon} {rating.label}</div></div>
        <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{clients.length} empresa{clients.length !== 1 ? "s" : ""}</div>
      </div>
      <div className="print-page" style={{ padding: isMobile ? "4px 20px 0" : "28px 36px 40px" }}>
        <SectionTitle>VISÃO GERAL</SectionTitle>
        <div className="print-card" style={{ background: "linear-gradient(135deg,#160404,#1c0808)", borderRadius: 16, padding: "20px 20px 16px", marginBottom: 14, border: "1px solid #e5393525" }}>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Realizado Total vs Meta Anual</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}><div style={{ fontSize: 28, fontWeight: 900, color: GREEN, fontFamily: "monospace" }}>{fmtShort(totalRealized)}</div><div style={{ fontSize: 14, color: "#555" }}>de {fmtShort(totalGoal)}</div></div>
          <ProgressBar value={totalPct} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span style={{ fontSize: 13, color: GREEN, fontWeight: 700 }}>{totalPct}% da meta anual</span><span style={{ fontSize: 11, color: RED }}>faltam {fmtShort(totalRemaining)}</span></div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <KpiCard icon="🎯" label="1º Tri Carteira" value={`${qPctTotal}%`} sub={`${fmtShort(qRealTotal)} / ${fmtShort(qGoalTotal)}`} color={qPctTotal >= 70 ? GREEN : qPctTotal >= 40 ? AMBER : RED} />
          <KpiCard icon="📊" label="Média Carteira" value={`${avgPct}%`} sub="desempenho médio" color={avgPct >= 50 ? GREEN : AMBER} />
          <KpiCard icon="✅" label="No Ritmo" value={`${onTrack}/${clients.length}`} sub="acima de 50%" color={onTrack === clients.length ? GREEN : AMBER} />
          <KpiCard icon="🧾" label="Ticket Médio" value={fmtShort(avgTicket)} sub="por período" color={BLUE} />
        </div>
        {offTrack > 0 && <div style={{ background: "#150e00", borderRadius: 12, padding: "12px 16px", marginBottom: 14, border: "1px solid #f59e0b33", display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 18 }}>⚠️</span><div><div style={{ fontSize: 13, color: AMBER, fontWeight: 700 }}>{offTrack} empresa{offTrack > 1 ? "s" : ""} abaixo de 50% no 1º tri</div><div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Ação comercial recomendada</div></div></div>}
        <SectionTitle>RANKING POR EMPRESA</SectionTitle>
        {!isMobile ? (
          <div style={{ background: "#111", borderRadius: 16, border: "1px solid #1a1a1a", overflow: "hidden", marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "40px 2fr 1fr 1fr 1fr 100px", padding: "10px 20px", borderBottom: "1px solid #1a1a1a" }}>
              {["#", "Empresa", "Meta", "Realizado", "% Anual", "1º Tri"].map(h => <div key={h} style={{ fontSize: 10, color: "#444", letterSpacing: 1.2, textTransform: "uppercase" }}>{h}</div>)}
            </div>
            {rows.map((r, i) => (
              <div key={r.name} style={{ display: "grid", gridTemplateColumns: "40px 2fr 1fr 1fr 1fr 100px", padding: "14px 20px", borderBottom: i < rows.length - 1 ? "1px solid #161616" : "none", alignItems: "center" }}>
                <div style={{ fontSize: 18 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span style={{ color: "#444", fontSize: 13 }}>{i + 1}</span>}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{r.name}</div>
                <div style={{ fontSize: 13, color: "#666", fontFamily: "monospace" }}>{fmtShort(r.annualGoal)}</div>
                <div style={{ fontSize: 13, color: GREEN, fontFamily: "monospace", fontWeight: 700 }}>{fmtShort(r.realized)}</div>
                <div><div style={{ fontSize: 14, fontWeight: 800, color: r.pct >= 80 ? GREEN : r.pct >= 50 ? AMBER : RED, fontFamily: "monospace" }}>{r.pct}%</div><ProgressBar value={r.pct} thin /></div>
                <div style={{ fontSize: 12, color: r.qPct >= 70 ? GREEN : r.qPct >= 40 ? AMBER : RED, fontWeight: 700, fontFamily: "monospace" }}>{r.qPct}%</div>
              </div>
            ))}
          </div>
        ) : rows.map((r, i) => (
          <div key={r.name} className="print-card" style={{ background: "#111", borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: "1px solid #1a1a1a" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ fontSize: 12, fontWeight: 700, width: 20 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</div><div><div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>{r.name}</div><div style={{ fontSize: 10, color: "#555" }}>Meta: {fmtShort(r.annualGoal)}</div></div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 18, fontWeight: 800, color: r.pct >= 80 ? GREEN : r.pct >= 50 ? AMBER : RED, fontFamily: "monospace" }}>{r.pct}%</div><div style={{ fontSize: 10, color: GREEN }}>{fmtShort(r.realized)}</div></div>
            </div>
            <ProgressBar value={r.pct} thin />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}><span style={{ fontSize: 10, color: "#555" }}>1º Tri: <span style={{ color: r.qPct >= 70 ? GREEN : r.qPct >= 40 ? AMBER : RED, fontWeight: 700 }}>{r.qPct}%</span></span><span style={{ fontSize: 10, color: r.pct >= 80 ? GREEN : r.pct >= 50 ? AMBER : RED }}>{r.pct >= 80 ? "No ritmo ✓" : r.pct >= 50 ? "Atenção" : "Crítico"}</span></div>
          </div>
        ))}
        <SectionTitle>PROJEÇÃO ANUAL</SectionTitle>
        <div style={{ display: !isMobile ? "grid" : "block", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: "16px 18px", marginBottom: isMobile ? 10 : 0, border: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Projeção com base no ritmo atual</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: projPct >= 80 ? GREEN : projPct >= 60 ? AMBER : RED, fontFamily: "monospace" }}>{fmtShort(projAnual)}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2, marginBottom: 8 }}>{projPct}% da meta projetado</div>
            <ProgressBar value={Math.min(100, projPct)} />
            <div style={{ fontSize: 13, fontWeight: 700, color: projPct >= 100 ? GREEN : projPct >= 70 ? AMBER : RED, marginTop: 6 }}>{projPct >= 100 ? "✅ Meta atingível" : projPct >= 70 ? "⚡ Precisa acelerar" : "🚨 Ritmo insuficiente"}</div>
          </div>
          <div className="print-card" style={{ background: "#111", borderRadius: 14, padding: "16px 18px", border: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Análise de Gap Mensal</div>
            {[{ label: "Necessário/mês", value: totalRemaining / 9.5, color: BLUE }, { label: "Ritmo atual/mês", value: totalRealized / monthsElapsed, color: (totalRealized / monthsElapsed) >= (totalRemaining / 9.5) ? GREEN : RED }].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><span style={{ fontSize: 12, color: "#666" }}>{item.label}</span><span style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: "monospace" }}>{fmtShort(item.value)}</span></div>
            ))}
          </div>
        </div>
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

  // ── Load data from Supabase on mount ──
  useEffect(() => {
    async function loadData() {
      const [{ data: usersData }, { data: companiesData }] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("companies").select("*"),
      ]);
      if (usersData) setUsers(usersData.map(dbToUser));
      if (companiesData) setClients(companiesData.map(dbToClient));
      setLoading(false);
    }
    loadData();
  }, []);

  // ── Realtime: refresh companies when changed ──
  useEffect(() => {
    const sub = supabase.channel("companies-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, async () => {
        const { data } = await supabase.from("companies").select("*");
        if (data) {
          const updated = data.map(dbToClient);
          setClients(updated);
          setSelected(prev => prev ? updated.find(c => c.id === prev.id) || prev : prev);
        }
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // ── Handlers ──
  const handleSaveClient = async (c) => {
    const row = { id: c.id, name: c.name, year: c.year, annual_goal: c.annualGoal, quarters: c.quarters };
    await supabase.from("companies").upsert(row);
    setClients(prev => { const exists = prev.find(x => x.id === c.id); return exists ? prev.map(x => x.id === c.id ? c : x) : [...prev, c]; });
  };

  const handleDeleteClient = async (id) => {
    await supabase.from("companies").delete().eq("id", id);
    setClients(prev => prev.filter(c => c.id !== id));
    const updatedUsers = users.map(u => ({ ...u, companyIds: (u.companyIds || []).filter(cid => cid !== id) }));
    for (const u of updatedUsers) { if ((u.companyIds || []).length !== (users.find(x => x.id === u.id)?.companyIds || []).length) { await supabase.from("users").update({ company_ids: u.companyIds }).eq("id", u.id); } }
    setUsers(updatedUsers);
    if (selected?.id === id) setSelected(null);
  };

  const handleUpdate = async (qIndex, value) => {
    const now = new Date().toISOString();
    const update = c => ({ ...c, quarters: c.quarters.map((q, i) => i === qIndex ? { ...q, realized: value, lastUpdate: now } : q) });
    const updatedClient = update(selected);
    await supabase.from("companies").update({ quarters: updatedClient.quarters }).eq("id", selected.id);
    setClients(prev => prev.map(c => c.id === selected.id ? updatedClient : c));
    setSelected(updatedClient);
  };

  const handleSelect = (c) => { setSelected(clients.find(x => x.id === c.id) || c); setScreen("dashboard"); };

  const handleUpdateUser = async (userId, changes) => {
    const dbChanges = {};
    if (changes.username !== undefined) dbChanges.username = changes.username;
    if (changes.password !== undefined) dbChanges.password = changes.password;
    await supabase.from("users").update(dbChanges).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...changes } : u));
    if (currentUser?.id === userId) setCurrentUser(prev => ({ ...prev, ...changes }));
  };

  const handleUpdateUserCompanies = async (userId, companyIds) => {
    await supabase.from("users").update({ company_ids: companyIds }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, companyIds } : u));
    if (currentUser?.id === userId) setCurrentUser(prev => ({ ...prev, companyIds }));
  };

  const handleAddUser = async (u) => {
    const row = { id: u.id, username: u.username, password: u.password, is_admin: false, company_ids: [] };
    await supabase.from("users").insert(row);
    setUsers(prev => [...prev, u]);
  };

  const handleDeleteUser = async (id) => {
    await supabase.from("users").delete().eq("id", id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleNav = (target) => { if (target === "kpi") setScreen("kpi"); else setScreen("clients"); };

  if (loading) return <LoadingScreen />;
  if (screen === "login") return <LoginScreen users={users} onLogin={u => { setCurrentUser(u); setScreen("clients"); }} />;

  const mainContent = (() => {
    if (screen === "kpi") return <KpiDashboard clients={clients} isMobile={isMobile} onBack={() => setScreen("clients")} />;
    if (screen === "dashboard") return <Dashboard client={selected} isMobile={isMobile} onBack={() => setScreen("clients")} onUpdate={handleUpdate} />;
    return <ClientList clients={clients} currentUser={currentUser} users={users} isMobile={isMobile} onSelect={handleSelect} onSaveClient={handleSaveClient} onDeleteClient={handleDeleteClient} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser} onUpdateUserCompanies={handleUpdateUserCompanies} onLogout={() => { setCurrentUser(null); setScreen("login"); }} onKpi={() => setScreen("kpi")} />;
  })();

  if (isMobile) return mainContent;
  return <DesktopLayout currentUser={currentUser} screen={screen} onNav={handleNav} onLogout={() => { setCurrentUser(null); setScreen("login"); }}>{mainContent}</DesktopLayout>;
}
