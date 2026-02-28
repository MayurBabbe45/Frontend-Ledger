import { useState, useEffect, useCallback } from "react";
import {
  LogOut, Plus, ArrowRightLeft, LayoutDashboard, Eye, EyeOff,
  CreditCard, Shield, CheckCircle, XCircle, Loader2, ChevronRight,
  AlertCircle, X, User, Lock, Mail, RefreshCw, Banknote, Copy, Check,
  Trash2, Menu, ChevronLeft
} from "lucide-react";

// ─── UUID v4 generator ────────────────────────────────────────────────────────
function generateIdempotencyKey() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── API helpers ──────────────────────────────────────────────────────────────
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
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── Toast system ─────────────────────────────────────────────────────────────
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
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-[calc(100vw-2rem)] w-full sm:w-auto sm:max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-xl backdrop-blur-sm border pointer-events-auto
            ${t.type === "error" ? "bg-red-950/90 border-red-700/60 text-red-200" :
              t.type === "success" ? "bg-emerald-950/90 border-emerald-700/60 text-emerald-200" :
              "bg-slate-900/90 border-slate-700/60 text-slate-200"}`}
        >
          {t.type === "error" ? <XCircle size={15} className="shrink-0 mt-0.5" /> :
           t.type === "success" ? <CheckCircle size={15} className="shrink-0 mt-0.5" /> :
           <AlertCircle size={15} className="shrink-0 mt-0.5" />}
          <span className="leading-snug">{t.msg}</span>
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
    if (mode === "register" && form.name.trim().length < 3)
      return setError("Name must be at least 3 characters long.");
    if (!isValidEmail(form.email.trim()))
      return setError("Please enter a valid email address.");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters long.");

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
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-600/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600/15 border border-blue-500/20 mb-3 sm:mb-4">
            <Banknote size={22} className="text-blue-400 sm:hidden" />
            <Banknote size={26} className="text-blue-400 hidden sm:block" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">LedgerVault</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Secure financial management</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-5 sm:p-7 shadow-2xl">
          {/* Toggle */}
          <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl mb-5 sm:mb-6">
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200
                  ${mode === m ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3 sm:space-y-4">
            {mode === "register" && (
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={form.name} onChange={update("name")} placeholder="Full Name" autoComplete="name"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-600 rounded-xl pl-9 pr-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition" />
              </div>
            )}
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="email" value={form.email} onChange={update("email")} placeholder="Email address" autoComplete="email"
                className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-600 rounded-xl pl-9 pr-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition" />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type={showPw ? "text" : "password"} value={form.password} onChange={update("password")} placeholder="Password" autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-600 rounded-xl pl-9 pr-11 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition" />
              <button type="button" onClick={() => setShowPw((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition p-0.5">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-950/50 border border-red-800/50 rounded-xl px-3.5 py-2.5">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs sm:text-sm leading-snug">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 sm:py-3 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-1">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Recruiter Quick Login */}
          <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-800/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-slate-800" />
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium px-1">For Recruiters & Guests</p>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <button
              onClick={() => {
                setForm({ email: "guest@example.com", password: "123456", name: "" });
                setMode("login");
                setTimeout(() => document.querySelector("form").requestSubmit(), 100);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 rounded-xl py-2.5 text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Loader2 size={13} />
              1-Click Demo Login
            </button>
          </div>

          <p className="text-center text-[10px] sm:text-xs text-slate-600 mt-4 flex items-center justify-center gap-1.5">
            <Shield size={10} /> Protected by 256-bit AES encryption & JWT authentication
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
    if (balance !== 0 && balance !== null && balance !== "—") {
      toast(`Cannot close. Balance is $${balance}. Transfer all funds first.`, "error");
      return;
    }
    if (!window.confirm("Close this account? This is permanent.")) return;
    setClosing(true);
    try {
      await API.delete(`/accounts/${account.id || account._id}`);
      toast("Account closed successfully.", "success");
      onRefresh();
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
    <div className="relative group bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 sm:p-5 overflow-hidden hover:border-slate-700/60 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <CreditCard size={15} className="text-blue-400 sm:hidden" />
            <CreditCard size={17} className="text-blue-400 hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs sm:text-sm font-semibold">Account</p>
            <button onClick={copyId} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition text-[10px] sm:text-xs mt-0.5">
              ···{shortId}
              {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
            </button>
          </div>
        </div>

        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium border shrink-0
          ${isActive ? "bg-emerald-950/60 border-emerald-700/40 text-emerald-400" :
            isClosed ? "bg-red-950/60 border-red-700/40 text-red-400" :
            "bg-yellow-950/60 border-yellow-700/40 text-yellow-400"}`}>
          {isActive ? <CheckCircle size={10} /> : isClosed ? <XCircle size={10} /> : <AlertCircle size={10} />}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      <div className="relative mt-4 sm:mt-5">
        <p className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1">Available Balance</p>
        {loadingBal ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 size={12} className="animate-spin" /> Fetching…
          </div>
        ) : (
          <p className="text-white text-xl sm:text-2xl font-bold tracking-tight">
            {typeof balance === "number"
              ? `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : balance}
          </p>
        )}
      </div>

      <div className="relative flex items-center gap-2 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-800/60">
        {!isClosed && (
          <button onClick={handleCloseAccount} disabled={closing}
            className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 hover:text-red-400 transition disabled:opacity-50 font-medium">
            {closing ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
            Close Account
          </button>
        )}
        <button onClick={fetchBalance} disabled={loadingBal}
          className="ml-auto flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 hover:text-blue-400 transition disabled:opacity-50 font-medium">
          <RefreshCw size={10} className={loadingBal ? "animate-spin" : ""} />
          Refresh
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
  const [transferType, setTransferType] = useState("self");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("form");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleVerifyEmail = async () => {
    if (!recipientEmail) return toast("Please enter an email address.", "error");
    if (!isValidEmail(recipientEmail.trim())) return toast("Please enter a valid email format.", "error");
    setResolving(true);
    setResolvedUser(null);
    try {
      const data = await API.get(`/accounts/resolve/${recipientEmail.trim()}`);
      setResolvedUser(data);
      setForm((f) => ({ ...f, toAccountId: data.accountIds[0] }));
      toast("Recipient verified!", "success");
    } catch (err) {
      toast(err.message, "error");
      setForm((f) => ({ ...f, toAccountId: "" }));
    } finally {
      setResolving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(form.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return toast("Please enter a valid amount greater than $0.00.", "error");

    if (step === "form") {
      if (transferType === "external" && (!resolvedUser || !form.toAccountId))
        return toast("Please verify the recipient's email and select an account.", "error");
      if (transferType === "self") {
        if (!form.toAccountId) return toast("Please select a destination account.", "error");
        if (form.fromAccount === form.toAccountId) return toast("Cannot transfer to the same account.", "error");
      }
      setStep("confirm");
      return;
    }

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
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-800/60 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
              <ArrowRightLeft size={14} className="text-blue-400" />
            </div>
            <h2 className="text-white font-semibold text-base sm:text-lg">Transfer Funds</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition p-1.5 rounded-lg hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-4 sm:py-5">
          {step === "success" ? (
            <div className="text-center py-6 sm:py-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-950/60 border border-emerald-700/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={26} className="text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Transfer Successful</h3>
              <p className="text-slate-400 text-sm mb-6">
                Your funds have been securely transferred{" "}
                {transferType === "self" ? "between your accounts." : `to ${resolvedUser?.name}.`}
              </p>
              <button onClick={onClose}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-8 py-2.5 text-sm transition">
                Done
              </button>
            </div>
          ) : step === "confirm" ? (
            <div>
              <div className="space-y-3 mb-5">
                {[
                  { label: "From", value: `···${form.fromAccount.slice(-8).toUpperCase()}` },
                  {
                    label: "To",
                    extra: transferType === "self" ? "My Account" : resolvedUser?.name,
                    value: `···${form.toAccountId.slice(-8).toUpperCase()}`
                  },
                  { label: "Amount", value: `$${parseFloat(form.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}` }
                ].map(({ label, extra, value }) => (
                  <div key={label} className="flex items-center justify-between bg-slate-800/40 rounded-xl px-4 py-3">
                    <span className="text-slate-400 text-xs sm:text-sm">{label}</span>
                    <div className="text-right">
                      {extra && <p className="text-slate-300 text-xs font-medium">{extra}</p>}
                      <p className="text-white text-sm font-semibold">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="flex items-start gap-2 text-[10px] sm:text-xs text-slate-500 bg-slate-800/30 rounded-xl p-3 mb-4">
                <Shield size={11} className="shrink-0 mt-0.5 text-blue-500" />
                A unique idempotency key will be generated to prevent duplicate transactions.
              </p>
              <div className="flex gap-2.5">
                <button onClick={() => setStep("form")}
                  className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl py-2.5 text-sm font-medium transition">
                  Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition flex items-center justify-center gap-2">
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  {loading ? "Sending…" : "Confirm Transfer"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Transfer Type Toggle */}
              <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl">
                {[{ id: "self", label: "My Accounts" }, { id: "external", label: "Someone Else" }].map(({ id, label }) => (
                  <button key={id} type="button"
                    onClick={() => { setTransferType(id); setForm((f) => ({ ...f, toAccountId: "" })); }}
                    className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200
                      ${transferType === id ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* From Account */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block">From Account</label>
                <select value={form.fromAccount} onChange={update("fromAccount")} required
                  className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition appearance-none">
                  <option value="">Select source account</option>
                  {accounts.map((a) => (
                    <option key={a.id || a._id} value={a.id || a._id}>
                      ···{(a.id || a._id || "").slice(-8).toUpperCase()} — {a.status || "Active"}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Account / Recipient */}
              {transferType === "self" ? (
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1.5 block">To Account</label>
                  <select value={form.toAccountId} onChange={update("toAccountId")} required
                    className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition appearance-none">
                    <option value="">Select destination account</option>
                    {accounts.filter((a) => (a.id || a._id) !== form.fromAccount).map((a) => (
                      <option key={a.id || a._id} value={a.id || a._id}>
                        ···{(a.id || a._id || "").slice(-8).toUpperCase()} — {a.status || "Active"}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1.5 block">Recipient Email</label>
                  <div className="flex gap-2">
                    <input
                      value={recipientEmail}
                      onChange={(e) => { setRecipientEmail(e.target.value); setResolvedUser(null); }}
                      placeholder="e.g., friend@email.com"
                      className="flex-1 min-w-0 bg-slate-800/60 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition"
                    />
                    <button type="button" onClick={handleVerifyEmail} disabled={resolving}
                      className="shrink-0 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white text-xs sm:text-sm font-medium rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 transition flex items-center gap-1.5">
                      {resolving ? <Loader2 size={12} className="animate-spin" /> : null}
                      Verify
                    </button>
                  </div>

                  {resolvedUser && (
                    <div className="mt-3 bg-slate-800/40 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                        <p className="text-emerald-400 text-xs font-medium">Verified: {resolvedUser.name}</p>
                      </div>
                      <label className="text-xs text-slate-400 font-medium mb-1.5 block">Select Destination Account</label>
                      <select value={form.toAccountId} onChange={update("toAccountId")} required
                        className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition appearance-none">
                        <option value="">Select an account</option>
                        {resolvedUser.accountIds.map((id, index) => (
                          <option key={id} value={id}>Account {index + 1} (···{id.slice(-8).toUpperCase()})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                  <input type="number" min="0.01" step="0.01" value={form.amount} onChange={update("amount")} placeholder="0.00"
                    className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-600 rounded-xl pl-7 pr-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition" />
                </div>
              </div>

              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-2.5 sm:py-3 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-1">
                Review Transfer <ChevronRight size={14} />
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5 sm:py-6 border-b border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Banknote size={15} className="text-blue-400" />
        </div>
        <span className="text-white font-bold text-base tracking-tight">LedgerVault</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id}
            onClick={() => { setView(id); if (id === "transfer") { setShowTransfer(true); } setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${view === id && id !== "transfer"
                ? "bg-blue-600/15 text-blue-400 border border-blue-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}>
            <Icon size={16} />
            {label}
            {id !== "transfer" && <ChevronRight size={14} className="ml-auto opacity-40" />}
          </button>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-slate-800/60">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
            <User size={12} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.email || "User"}</p>
            <p className="text-emerald-400 text-[10px]">Authenticated</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition">
          <LogOut size={15} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#070B14] flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900/95 border-r border-slate-800/60 flex flex-col z-50" onClick={(e) => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 xl:w-60 bg-slate-900/60 border-r border-slate-800/60 flex-col shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Background grid */}
        <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 sm:mb-6 lg:mb-8 gap-3">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {view === "overview" ? "Overview" : "Dashboard"}
                </h1>
                <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            <button onClick={() => setShowTransfer(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-lg shadow-blue-600/20 shrink-0">
              <ArrowRightLeft size={13} className="sm:hidden" />
              <ArrowRightLeft size={15} className="hidden sm:block" />
              <span className="hidden xs:inline sm:inline">New Transfer</span>
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-5 sm:mb-6 lg:mb-8">
            {[
              { label: "Total Accounts", value: accounts.length, icon: CreditCard, color: "blue" },
              { label: "Active", value: accounts.filter((a) => (a.status || "active").toLowerCase() === "active").length, icon: CheckCircle, color: "emerald" },
              { label: "Frozen", value: accounts.filter((a) => (a.status || "active").toLowerCase() !== "active").length, icon: XCircle, color: "red" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label}
                className={`bg-slate-900/60 border rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 flex items-center gap-2 sm:gap-3 lg:gap-4
                  ${color === "blue" ? "border-slate-800/60" :
                    color === "emerald" ? "border-slate-800/60" :
                    "border-slate-800/60"}`}>
                <div className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0
                  ${color === "blue" ? "bg-blue-600/10 border border-blue-500/20" :
                    color === "emerald" ? "bg-emerald-600/10 border border-emerald-500/20" :
                    "bg-red-600/10 border border-red-500/20"}`}>
                  <Icon size={14}
                    className={`sm:hidden ${color === "blue" ? "text-blue-400" : color === "emerald" ? "text-emerald-400" : "text-red-400"}`} />
                  <Icon size={16}
                    className={`hidden sm:block ${color === "blue" ? "text-blue-400" : color === "emerald" ? "text-emerald-400" : "text-red-400"}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xl sm:text-2xl font-bold
                    ${color === "blue" ? "text-white" : color === "emerald" ? "text-emerald-400" : "text-red-400"}`}>
                    {value}
                  </p>
                  <p className="text-slate-500 text-[9px] sm:text-[10px] lg:text-xs font-medium truncate">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Accounts section */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
            <h2 className="text-white font-semibold text-sm sm:text-base">My Accounts</h2>
            <button onClick={createAccount} disabled={creatingAccount}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-medium transition disabled:opacity-50">
              {creatingAccount ? <Loader2 size={12} className="animate-spin" /> : <Plus size={13} />}
              {creatingAccount ? "Creating…" : "New Account"}
            </button>
          </div>

          {loadingAccounts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 sm:h-40 bg-slate-800/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-slate-900/40 border border-slate-800/40 rounded-2xl">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CreditCard size={20} className="text-slate-600" />
              </div>
              <p className="text-white font-semibold text-sm sm:text-base mb-1">No accounts yet</p>
              <p className="text-slate-500 text-xs sm:text-sm mb-4 sm:mb-5">Create your first account to get started</p>
              <button onClick={createAccount} disabled={creatingAccount}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm transition">
                {creatingAccount ? <Loader2 size={12} className="animate-spin" /> : <Plus size={13} />}
                Create Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {accounts.map((account) => (
                <AccountCard key={account.id || account._id} account={account} onRefresh={loadAccounts} toast={toast} />
              ))}
              {/* Add account tile */}
              <button onClick={createAccount} disabled={creatingAccount}
                className="h-36 sm:h-40 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-800 hover:border-blue-600/40 hover:bg-blue-600/3 rounded-2xl text-slate-600 hover:text-blue-400 transition-all duration-200 group disabled:opacity-50">
                {creatingAccount ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} className="group-hover:scale-110 transition-transform" />}
                <span className="text-xs sm:text-sm font-medium">{creatingAccount ? "Creating…" : "Add Account"}</span>
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
      <ToastContainer toasts={toasts} />
      {user ? (
        <Dashboard user={user} onLogout={() => setUser(null)} toast={toast} />
      ) : (
        <AuthScreen onLogin={(u) => setUser(u)} />
      )}
    </>
  );
}
