import { useState, useEffect, useCallback } from "react";
import {
  LogOut, Plus, ArrowRightLeft, LayoutDashboard, Eye, EyeOff,
  CreditCard, Shield, CheckCircle, XCircle, Loader2, ChevronRight,
  AlertCircle, X, User, Lock, Mail, RefreshCw, Banknote, Copy, Check, Trash2
} from "lucide-react";

// ─── UUID v4 generator (works in browser without extra deps) ──────────────────
function generateIdempotencyKey() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── API helpers (credentials: 'include' for HTTP-only cookie JWT) ────────────
const API = {
  base: "https://backend-ledger-af1t.onrender.com/api",
  req: async (path, options = {}) => {
    const res = await fetch(`${API.base}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
    return data;
  },
  post: (path, body) => API.req(path, { method: "POST", body: JSON.stringify(body) }),
  get: (path) => API.req(path),
  delete: (path) => API.req(path, { method: "DELETE" }),
};

// ─── Validation Helpers ───────────────────────────────────────────────────────
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ─── Tiny toast system ────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return { toasts, add };
}

function ToastContainer({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium backdrop-blur-md border pointer-events-auto
            ${t.type === "error" ? "bg-red-950/90 border-red-800 text-red-200" :
              t.type === "success" ? "bg-emerald-950/90 border-emerald-800 text-emerald-200" :
              "bg-slate-900/90 border-slate-700 text-slate-200"}`}
          style={{ animation: "slideIn 0.25s ease" }}
        >
          {t.type === "error" ? <AlertCircle size={15} /> :
           t.type === "success" ? <CheckCircle size={15} /> :
           <Shield size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // --- FRONTEND INPUT VALIDATION ---
    if (mode === "register" && form.name.trim().length < 3) {
      return setError("Name must be at least 3 characters long.");
    }
    if (!isValidEmail(form.email.trim())) {
      return setError("Please enter a valid email address.");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }
    // ---------------------------------

    setLoading(true);
    try {
      if (mode === "register") {
        await API.post("/auth/register", form);
        setMode("login");
        setForm((f) => ({ ...f, name: "" }));
      } else {
        const data = await API.post("/auth/login", { email: form.email.trim(), password: form.password });
        onLogin(data.user || { email: form.email });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080e1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#4a9eff 1px,transparent 1px),linear-gradient(90deg,#4a9eff 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30 mb-4">
            <Banknote size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>LedgerVault</h1>
          <p className="text-slate-500 text-sm mt-1">Secure financial management</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Toggle */}
          <div className="flex bg-slate-800/60 rounded-xl p-1 mb-7 gap-1">
            {["login", "register"].map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === m ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input required value={form.name} onChange={update("name")} placeholder="Full Name"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition" />
              </div>
            )}
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input required type="email" value={form.email} onChange={update("email")} placeholder="Email address"
                className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition" />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input required type={showPw ? "text" : "password"} value={form.password} onChange={update("password")} placeholder="Password"
                className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition" />
              <button type="button" onClick={() => setShowPw((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2.5">
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl py-3 text-sm transition-all duration-200 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* --- 🚀 PORTFOLIO UPGRADE: RECRUITER QUICK LOGIN --- */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900/70 px-2 text-slate-400">For Recruiters & Guests</span>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={() => {
              setForm({ email: "guest@example.com", password: "123456", name: "" });
              setMode("login");
              // A tiny delay to let state update, then submit!
              setTimeout(() => document.querySelector('form').requestSubmit(), 100);
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 rounded-xl py-2.5 text-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <User size={15} className="text-blue-400"/>
            1-Click Demo Login
          </button>
          {/* --- END RECRUITER QUICK LOGIN --- */}

          <p className="text-center text-slate-600 text-xs mt-6">
            Protected by 256-bit AES encryption & JWT authentication
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Account Card ─────────────────────────────────────────────────────────────
function AccountCard({ account, onRefresh, toast }) {
  const [balance, setBalance] = useState(null);
  const [loadingBal, setLoadingBal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchBalance = useCallback(async () => {
    setLoadingBal(true);
    try {
      const data = await API.get(`/accounts/balance/${account.id || account._id}`);
      setBalance(data.balance ?? data.data?.balance ?? 0);
    } catch {
      setBalance("—");
    } finally {
      setLoadingBal(false);
    }
  }, [account.id, account._id]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const copyId = () => {
    navigator.clipboard.writeText(account.id || account._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseAccount = async () => {
    // 1. Quick frontend check to save an API call
    if (balance !== 0 && balance !== null && balance !== "—") {
      toast(`Cannot close. Current balance is $${balance}. Please transfer all funds first.`, "error");
      return;
    }

    // 2. Confirm intent
    if (!window.confirm("Are you sure you want to close this account? This action is permanent.")) return;

    setClosing(true);
    try {
      await API.delete(`/accounts/${account.id || account._id}`);
      toast("Account closed successfully.", "success");
      onRefresh(); // Trigger the dashboard to reload the accounts list
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setClosing(false);
    }
  };

  const status = (account.status || "active").toLowerCase();
  const isActive = status === "active";
  const isClosed = status === "closed";
  const shortId = (account.id || account._id || "").slice(-8).toUpperCase();

  return (
    <div className={`relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/60 rounded-2xl p-5 hover:border-slate-600 transition-all duration-200 group overflow-hidden ${isClosed ? "opacity-60 grayscale" : ""}`}>
      {/* Subtle card glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/15 flex items-center justify-center">
            <CreditCard size={17} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Account</p>
            <button onClick={copyId} disabled={isClosed} className="flex items-center gap-1.5 text-slate-300 text-sm font-mono font-medium hover:text-white transition group/copy">
              ···{shortId}
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={11} className="text-slate-600 group-hover/copy:text-slate-400 transition" />}
            </button>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            isActive ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/50" : 
            isClosed ? "bg-slate-900/60 text-slate-400 border border-slate-800" :
            "bg-red-950/60 text-red-400 border border-red-900/50"
          }`}>
          {isActive ? <CheckCircle size={11} /> : isClosed ? <XCircle size={11} /> : <AlertCircle size={11} />}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="mt-2">
        <p className="text-xs text-slate-500 mb-0.5">Available Balance</p>
        {loadingBal ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-sm">Fetching…</span>
          </div>
        ) : (
          <p className="text-2xl font-bold text-white tracking-tight">
            {typeof balance === "number" ? `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : balance}
          </p>
        )}
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-3">
        {!isClosed && (
          <button onClick={handleCloseAccount} disabled={closing} className="text-slate-600 hover:text-red-400 transition" title="Close Account">
            {closing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        )}
        <button onClick={fetchBalance}
          className="text-slate-600 hover:text-blue-400 transition"
          title="Refresh balance">
          <RefreshCw size={13} className={loadingBal ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}

// ─── Transfer Modal ───────────────────────────────────────────────────────────
function TransferModal({ accounts, onClose, toast }) {
  const [form, setForm] = useState({ fromAccount: "", toAccountId: "", amount: "" });
  const [recipientEmail, setRecipientEmail] = useState(""); 
  const [resolvedUser, setResolvedUser] = useState(null);   
  const [resolving, setResolving] = useState(false);        
  
  // Toggle between 'self' and 'external' transfers
  const [transferType, setTransferType] = useState("self"); 
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("form");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleVerifyEmail = async () => {
    // --- FRONTEND EMAIL VALIDATION ---
    if (!recipientEmail) {
      return toast("Please enter an email address.", "error");
    }
    if (!isValidEmail(recipientEmail.trim())) {
      return toast("Please enter a valid email format.", "error");
    }
    // ---------------------------------

    setResolving(true);
    setResolvedUser(null);
    try {
      const data = await API.get(`/accounts/resolve/${recipientEmail.trim()}`);
      setResolvedUser(data);
      setForm(f => ({ ...f, toAccountId: data.accountIds[0] }));
      toast("Recipient verified!", "success");
    } catch (err) {
      toast(err.message, "error");
      setForm(f => ({ ...f, toAccountId: "" }));
    } finally {
      setResolving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- FRONTEND AMOUNT VALIDATION ---
    const parsedAmount = parseFloat(form.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
       return toast("Please enter a valid amount greater than $0.00.", "error");
    }
    // ----------------------------------

    // Step 1: Validation before showing confirmation screen
    if (step === "form") {
      if (transferType === "external" && (!resolvedUser || !form.toAccountId)) {
        return toast("Please verify the recipient's email and select an account.", "error");
      }
      if (transferType === "self") {
        if (!form.toAccountId) return toast("Please select a destination account.", "error");
        if (form.fromAccount === form.toAccountId) return toast("Cannot transfer to the exact same account.", "error");
      }
      setStep("confirm"); 
      return; 
    }

    // Step 2: Actually send the transaction to the backend
    setLoading(true);
    const idempotencyKey = generateIdempotencyKey();
    try {
      await API.post("/transactions/", {
        fromAccount: form.fromAccount,
        toAccount: form.toAccountId,
        amount: parsedAmount,
        idempotencyKey,
      });
      setStep("success");
      toast("Transfer completed successfully!", "success");
    } catch (err) {
      toast(err.message, "error");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden" style={{ animation: "slideUp 0.25s ease" }}>
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600/15 rounded-lg flex items-center justify-center">
              <ArrowRightLeft size={15} className="text-blue-400" />
            </div>
            <h2 className="text-white font-semibold">Transfer Funds</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300 transition"><X size={18} /></button>
        </div>

        <div className="p-6">
          {step === "success" ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={30} className="text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">Transfer Successful</h3>
              <p className="text-slate-500 text-sm mb-6">
                Your funds have been securely transferred {transferType === "self" ? "between your accounts." : `to ${resolvedUser?.name}.`}
              </p>
              <button type="button" onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">Done</button>
            </div>
          ) : step === "confirm" ? (
            <div>
              <div className="bg-slate-800/60 rounded-xl p-4 mb-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">From</span>
                  <span className="text-slate-200 font-mono text-xs">···{form.fromAccount.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">To</span>
                  <span className="text-slate-200 font-medium flex flex-col items-end">
                    {transferType === "self" ? "My Account" : resolvedUser?.name}
                    <span className="text-slate-400 font-mono text-[10px] mt-0.5">···{form.toAccountId.slice(-8).toUpperCase()}</span>
                  </span>
                </div>
                <div className="h-px bg-slate-700" />
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Amount</span>
                  <span className="text-white font-bold text-lg">${parseFloat(form.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-950/30 border border-blue-900/30 rounded-lg px-3 py-2 mb-5">
                <Shield size={12} className="text-blue-400 shrink-0" />
                A unique idempotency key will be generated to prevent duplicate transactions.
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("form")} className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl py-2.5 text-sm font-medium transition">Back</button>
                <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {loading ? "Sending…" : "Confirm Transfer"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Transfer Type Toggle */}
              <div className="flex bg-slate-800/60 rounded-xl p-1 mb-2 gap-1">
                <button type="button" onClick={() => { setTransferType("self"); setForm(f => ({...f, toAccountId: ""})); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${transferType === "self" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}>
                  My Accounts
                </button>
                <button type="button" onClick={() => { setTransferType("external"); setForm(f => ({...f, toAccountId: ""})); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${transferType === "external" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}>
                  Someone Else
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">From Account</label>
                <select required value={form.fromAccount} onChange={update("fromAccount")} className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition appearance-none">
                  <option value="">Select source account</option>
                  {accounts.map((a) => (
                    <option key={a.id || a._id} value={a.id || a._id}>···{(a.id || a._id || "").slice(-8).toUpperCase()} — {a.status || "Active"}</option>
                  ))}
                </select>
              </div>
              
              {/* Conditional Rendering based on toggle */}
              {transferType === "self" ? (
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">To Account</label>
                  <select required value={form.toAccountId} onChange={update("toAccountId")} className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition appearance-none">
                    <option value="">Select destination account</option>
                    {accounts.filter(a => (a.id || a._id) !== form.fromAccount).map((a) => (
                      <option key={a.id || a._id} value={a.id || a._id}>···{(a.id || a._id || "").slice(-8).toUpperCase()} — {a.status || "Active"}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Recipient Email</label>
                  <div className="flex gap-2">
                    <input required type="email" value={recipientEmail} onChange={(e) => { setRecipientEmail(e.target.value); setResolvedUser(null); }} placeholder="e.g., friend@email.com"
                      className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition" />
                    <button type="button" onClick={handleVerifyEmail} disabled={resolving || !recipientEmail} className="px-5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-50 font-medium text-sm">
                      {resolving ? <Loader2 size={16} className="animate-spin" /> : "Verify"}
                    </button>
                  </div>

                  {resolvedUser && (
                    <div className="mt-4 p-4 bg-slate-800/40 border border-emerald-900/30 rounded-xl space-y-3" style={{ animation: "slideUp 0.2s ease" }}>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle size={14} /> Verified: <strong>{resolvedUser.name}</strong>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-medium mb-1.5 block">Select Destination Account</label>
                        <select required value={form.toAccountId} onChange={update("toAccountId")} className="w-full bg-slate-900/60 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition appearance-none">
                          <option value="">Select an account</option>
                          {resolvedUser.accountIds.map((id, index) => (
                            <option key={id} value={id}>
                              Account {index + 1} (···{id.slice(-8).toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">$</span>
                  <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={update("amount")} placeholder="0.00"
                    className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-600 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-semibold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-1">
                <ArrowRightLeft size={15} /> Review Transfer
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function Dashboard({ user, onLogout, toast }) {
  const [view, setView] = useState("overview");
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const data = await API.get("/accounts/");
      setAccounts(data.accounts || data.data || data || []);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoadingAccounts(false);
    }
  }, [toast]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const createAccount = async () => {
    setCreatingAccount(true);
    try {
      await API.post("/accounts/", {});
      await loadAccounts();
      toast("New account created!", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCreatingAccount(false);
    }
  };

  const logout = async () => {
    try { await API.post("/auth/logout", {}); } catch {}
    onLogout();
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "transfer", label: "Transfer Funds", icon: ArrowRightLeft },
  ];

  return (
    <div className="min-h-screen bg-[#080e1a] flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-slate-800/60 flex flex-col bg-slate-950/50 shrink-0">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/30">
              <Banknote size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>LedgerVault</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id}
              onClick={() => { setView(id); if (id === "transfer") setShowTransfer(true); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${view === id && id !== "transfer"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}>
              <Icon size={16} />
              {label}
              {id !== "transfer" && <ChevronRight size={13} className="ml-auto opacity-40" />}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-slate-800/60">
          <div className="px-3 py-2 mb-2">
            <p className="text-slate-300 text-xs font-medium truncate">{user?.email || "User"}</p>
            <p className="text-slate-600 text-xs">Authenticated</p>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition">
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Background grid */}
        <div className="fixed inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(#4a9eff 1px,transparent 1px),linear-gradient(90deg,#4a9eff 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
                {view === "overview" ? "Overview" : "Dashboard"}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowTransfer(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/20">
                <ArrowRightLeft size={15} />
                New Transfer
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Accounts", value: accounts.length, icon: CreditCard, color: "blue" },
              { label: "Active", value: accounts.filter((a) => (a.status || "active").toLowerCase() === "active").length, icon: CheckCircle, color: "emerald" },
              { label: "Frozen", value: accounts.filter((a) => (a.status || "active").toLowerCase() !== "active").length, icon: XCircle, color: "red" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                  ${color === "blue" ? "bg-blue-600/15" : color === "emerald" ? "bg-emerald-600/15" : "bg-red-600/15"}`}>
                  <Icon size={18} className={color === "blue" ? "text-blue-400" : color === "emerald" ? "text-emerald-400" : "text-red-400"} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-slate-500 text-xs">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Accounts section */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-white font-semibold">My Accounts</h2>
            <button onClick={createAccount} disabled={creatingAccount}
              className="flex items-center gap-2 border border-slate-700 hover:border-blue-500/60 hover:bg-blue-600/10 text-slate-300 hover:text-blue-400 px-3.5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
              {creatingAccount ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {creatingAccount ? "Creating…" : "New Account"}
            </button>
          </div>

          {loadingAccounts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 animate-pulse h-36" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-2xl">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <CreditCard size={24} className="text-slate-600" />
              </div>
              <h3 className="text-slate-300 font-medium mb-1">No accounts yet</h3>
              <p className="text-slate-600 text-sm mb-5">Create your first account to get started</p>
              <button onClick={createAccount} disabled={creatingAccount}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                {creatingAccount ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <AccountCard 
                  key={account.id || account._id} 
                  account={account} 
                  onRefresh={loadAccounts} 
                  toast={toast} 
                />
              ))}
              {/* Add account tile */}
              <button onClick={createAccount} disabled={creatingAccount}
                className="border-2 border-dashed border-slate-800 hover:border-blue-600/40 hover:bg-blue-600/5 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-blue-400 transition h-36 group">
                {creatingAccount ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} className="group-hover:scale-110 transition-transform" />}
                <span className="text-xs font-medium">{creatingAccount ? "Creating…" : "Add Account"}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Transfer Modal */}
      {showTransfer && (
        <TransferModal accounts={accounts} onClose={() => { setShowTransfer(false); setView("overview"); }} toast={toast} />
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const { toasts, add: toast } = useToast();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        * { box-sizing: border-box; }
        select option { background: #1e293b; color: white; }
      `}</style>
      <ToastContainer toasts={toasts} />
      {user ? (
        <Dashboard user={user} onLogout={() => setUser(null)} toast={toast} />
      ) : (
        <AuthScreen onLogin={(u) => setUser(u)} />
      )}
    </>
  );
}