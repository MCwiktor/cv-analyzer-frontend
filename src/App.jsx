import React, { useState, useEffect } from 'react';

const FREE_MONTHLY_LIMIT = 1;
const PREMIUM_PRICE = 29;

// KOMPONENT POMOCNICZY (którego brakowało w kodzie i mógł powodować błędy renderowania)
function PremiumUnlockRow({ label, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="mt-4 p-3 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer flex items-center justify-between transition-colors group"
    >
      <span className="text-xs font-mono text-indigo-300 font-medium">{label}</span>
      <span className="text-xs text-indigo-400 group-hover:text-indigo-300 transition-colors">Odblokuj Premium →</span>
    </div>
  );
}

function AuthModal({ onClose, onAuthSuccess, apiUrl }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Coś poszło nie tak.');
      }
      onAuthSuccess(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-in relative w-full max-w-sm glass-card rounded-3xl p-6 sm:p-8 border border-white/10 bg-[#0B0F19]/95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
          aria-label="Zamknij"
        >
          ✕
        </button>

        <h3 className="font-display text-2xl font-extrabold text-white mb-1">
          {mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
        </h3>
        <p className="font-body text-sm text-slate-400 mb-6">
          {mode === 'login'
            ? 'Zaloguj się, aby uruchomić audyt CV.'
            : 'Załóż darmowe konto, aby zacząć.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full field-input text-sm"
              placeholder="ty@przyklad.pl"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
              Hasło
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full field-input text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-body text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="grad-cta w-full font-display font-semibold text-sm text-white py-3 px-4 rounded-xl"
          >
            {loading ? 'Chwileczkę...' : mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-5 font-body">
          {mode === 'login' ? 'Nie masz konta?' : 'Masz już konto?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-indigo-300 hover:text-indigo-200 font-medium"
          >
            {mode === 'login' ? 'Zarejestruj się' : 'Zaloguj się'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [userStatus, setUserStatus] = useState({ is_premium: false, analysis_count: 0 });
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [showAuth, setShowAuth] = useState(false);
  const isLoggedIn = !!token;

  const [showPricing, setShowPricing] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [toast, setToast] = useState('');

  const API_URL = "https://backend-wjl3.onrender.com";

  useEffect(() => {
    fetchUserStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchUserStatus = async (authToken = token) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/api/user/status`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        // token wygasł albo jest nieprawidłowy
        handleLogout();
        return;
      }
      const data = await res.json();
      setUserStatus((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Error fetching user status", err);
    }
  };

  const handleAuthSuccess = (newToken) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    setShowAuth(false);
    fetchUserStatus(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUserStatus({ is_premium: false, analysis_count: 0 });
    setReport(null);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const limitReached = !userStatus.is_premium && userStatus.analysis_count >= FREE_MONTHLY_LIMIT;

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    if (limitReached) {
      setShowPricing(true);
      return;
    }
    if (!file) {
      setError("Wgraj plik PDF przed uruchomieniem analizy.");
      return;
    }
    setError('');
    setLoading(true);
    setReport(null);
    setCopied(false);

    const formData = new FormData();
    formData.append("file", file);
    if (jobDescription) {
      formData.append("job_description", jobDescription);
    }

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Coś poszło nie tak.");
      }

      const data = await res.json();
      setReport(data);
      setUserStatus((prev) => ({ ...prev, analysis_count: (prev.analysis_count || 0) + 1 }));
      fetchUserStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (report && report.improved_cv_draft) {
      navigator.clipboard.writeText(report.improved_cv_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Integracja z Twoim backendem Stripe:
  const handlePurchasePremium = async () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    setPurchasing(true);
    try {
      const res = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Przekierowanie do Stripe
      } else {
        throw new Error(data.error || "Nie udało się utworzyć sesji płatności");
      }
    } catch (err) {
      console.error(err);
      setToast("Błąd połączenia z płatnościami.");
    } finally {
      setPurchasing(false);
    }
  };

  // Skala statusów: emerald (dobry) / amber (średni) / rose (słaby)
  const getScoreTone = (score) => {
    if (score === undefined || score === null) return 'amber';
    if (score >= 75) return 'emerald';
    if (score >= 45) return 'amber';
    return 'rose';
  };

  const toneClasses = {
    emerald: {
      text: 'text-emerald-300',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/25',
      dot: 'bg-emerald-400',
      ring: 'shadow-[0_0_24px_-6px_rgba(16,185,129,0.45)]',
    },
    amber: {
      text: 'text-amber-300',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/25',
      dot: 'bg-amber-400',
      ring: 'shadow-[0_0_24px_-6px_rgba(245,158,11,0.4)]',
    },
    rose: {
      text: 'text-rose-300',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/25',
      dot: 'bg-rose-400',
      ring: 'shadow-[0_0_24px_-6px_rgba(244,63,94,0.45)]',
    },
  };

  const getImportanceTone = (importance) => {
    switch (importance?.toUpperCase()) {
      case 'HIGH': return 'rose';
      case 'MID': return 'amber';
      default: return 'emerald';
    }
  };

  const isPremium = !!userStatus.is_premium;
  const visibleStrengths = isPremium ? report?.strengths : report?.strengths?.slice(0, 2);
  const visibleWeaknesses = isPremium ? report?.weaknesses : report?.weaknesses?.slice(0, 2);
  const visibleMissingSkills = isPremium ? report?.missing_skills : report?.missing_skills?.slice(0, 2);
  const visibleImprovements = isPremium ? report?.improvements : report?.improvements?.slice(0, 1);

  const plans = [
    {
      id: 'free',
      name: 'Darmowy',
      price: '0 zł',
      period: '',
      tagline: 'Sprawdź, jak wypada Twoje CV',
      features: [
        `${FREE_MONTHLY_LIMIT} audyt miesięcznie`,
        'Wynik ogólny i zgodność ATS',
        'Podgląd 2 mocnych i 2 słabych stron',
        'Skrócona lista luk kompetencyjnych',
      ],
      cta: isPremium ? null : 'Twój obecny plan',
      highlight: false,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: `${PREMIUM_PRICE} zł`,
      period: '/ jednorazowo',
      tagline: 'Pełny protokół i gotowe CV',
      features: [
        'Nielimitowane audyty ATS',
        'Pełna lista mocnych i słabych stron',
        'Kompletna mapa luk kompetencyjnych',
        'Cały plan naprawczy krok po kroku',
        'Gotowy szablon zoptymalizowanego CV',
      ],
      cta: isPremium ? 'Plan aktywny' : `Kup Premium — ${PREMIUM_PRICE} zł`,
      highlight: true,
    },
  ];

  return (
    <div className="h-screen bg-[#0B0F19] text-[#E2E8F0] font-body relative overflow-y-auto overflow-x-hidden scrollbar-thin">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        html, body {
          margin: 0;
          height: 100%;
          overflow: hidden;
        }
        #root, #__next {
          height: 100%;
        }

        .font-display { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.01em; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .glass-card-hover {
          transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
        }
        .glass-card-hover:hover {
          border-color: rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.045);
          transform: translateY(-2px);
        }

        .grad-text {
          background-image: linear-gradient(92deg, #818CF8 0%, #22D3EE 50%, #34D399 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .grad-cta {
          background-image: linear-gradient(92deg, #6366F1 0%, #06B6D4 55%, #10B981 100%);
          transition: filter 0.2s ease, transform 0.2s ease;
        }
        .grad-cta:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .grad-cta:disabled { filter: grayscale(0.5) brightness(0.7); transform: none; cursor: not-allowed; }

        .grad-border {
          position: relative;
        }
        .grad-border::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 1px;
          border-radius: inherit;
          background: linear-gradient(120deg, rgba(129,140,248,0.5), rgba(34,211,238,0.35), rgba(52,211,153,0.5));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .field-input {
          font-family: 'Inter', sans-serif;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 10px 14px;
          color: #E2E8F0;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .field-input::placeholder { color: rgba(226,232,240,0.35); }
        .field-input:focus {
          outline: none;
          border-color: rgba(129,140,248,0.6);
          background: rgba(255,255,255,0.05);
        }
        .field-input::file-selector-button {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: rgba(255,255,255,0.08);
          color: #E2E8F0;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 6px 12px;
          margin-right: 12px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .field-input::file-selector-button:hover { background: rgba(255,255,255,0.14); }

        .bg-glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(110px);
          pointer-events: none;
          z-index: 0;
        }

        .scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 8px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

        @keyframes modal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-in { animation: modal-in 0.22s ease-out; }

        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .toast-in { animation: toast-in 0.25s ease-out; }

        .lock-blur {
          filter: blur(3px);
          user-select: none;
          pointer-events: none;
        }
      `}</style>

      {/* AMBIENTOWE POŚWIATY TŁA */}
      <div className="bg-glow w-[520px] h-[520px] bg-indigo-600/25 -top-40 -left-32"></div>
      <div className="bg-glow w-[480px] h-[480px] bg-cyan-500/15 top-40 right-[-160px]"></div>
      <div className="bg-glow w-[420px] h-[420px] bg-emerald-500/10 bottom-[-140px] left-1/3"></div>

      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] toast-in">
          <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm font-body px-4 py-2.5 rounded-xl shadow-[0_8px_30px_-8px_rgba(16,185,129,0.5)] backdrop-blur-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {toast}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="relative z-10 border-b border-white/5 bg-[#0B0F19]/70 backdrop-blur-xl sticky top-0 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl grad-cta flex items-center justify-center font-display font-bold text-xs text-white shadow-[0_0_20px_-4px_rgba(99,102,241,0.6)]">
            AI
          </div>
          <span className="font-display font-semibold text-lg tracking-tight text-white">
            Kreator CV <span className="text-white/30 mx-1">&middot;</span> Audytor ATS
          </span>
        </div>
        <div className="flex items-center space-x-3">
          {!isLoggedIn ? (
            <button
              onClick={() => setShowAuth(true)}
              className="grad-cta font-display font-semibold text-xs text-white py-2 px-4 rounded-xl"
            >
              Zaloguj się
            </button>
          ) : (
            <>
              {isPremium ? (
                <span className="text-[11px] font-mono px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 font-medium tracking-wide flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></span>
                  PREMIUM ACTIVATED
                </span>
              ) : (
                <>
                  <span className="hidden sm:inline text-[11px] font-mono px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-slate-400 font-medium tracking-wide">
                    PLAN DARMOWY &middot; {Math.max(FREE_MONTHLY_LIMIT - (userStatus.analysis_count || 0), 0)}/{FREE_MONTHLY_LIMIT} audytów
                  </span>
                  <button
                    onClick={() => setShowPricing(true)}
                    className="grad-cta font-display font-semibold text-xs text-white py-2 px-4 rounded-xl"
                  >
                    Ulepsz do Premium
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="text-xs font-mono text-slate-500 hover:text-slate-300 px-3 py-2"
              >
                Wyloguj
              </button>
            </>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 max-w-4xl mx-auto text-center pt-20 pb-14 px-4">
        <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-indigo-300/80 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
          Optymalizacja pod algorytmy rekrutacyjne
        </span>
        <h1 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]">
          Przejdź audyt systemu <span className="grad-text">ATS</span> z pełnym raportem
        </h1>
        <p className="font-body text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          Wklej treść oferty i dodaj swoje CV. Nasz zaawansowany silnik przeprowadzi głęboką analizę semantyczną kompetencji oraz wygeneruje gotowy szablon ulepszonego dokumentu.
        </p>
      </section>

      {/* DASHBOARD */}
      <main className="relative z-10 max-w-6xl mx-auto pb-24 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* PANEL KONFIGURACJI */}
          <div className="lg:col-span-1 glass-card rounded-3xl p-6 h-fit space-y-6">
            <h3 className="font-display text-xl font-semibold text-white border-b border-white/5 pb-3">
              Konfiguracja analizy
            </h3>

            {!isLoggedIn ? (
              <div className="text-center py-8 space-y-4">
                <p className="font-body text-sm text-slate-400">
                  Zaloguj się, aby uruchomić audyt CV.
                </p>
                <button
                  onClick={() => setShowAuth(true)}
                  className="grad-cta font-display font-semibold text-sm text-white py-3 px-6 rounded-xl"
                >
                  Zaloguj się / Zarejestruj
                </button>
              </div>
            ) : (
              <form onSubmit={handleAnalyze} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Plik CV w formacie PDF
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full field-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Treść dedykowanej oferty pracy
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Wklej tutaj wymagania z ogłoszenia, aby algorytm wyliczył precyzyjny współczynnik dopasowania (Job Match)..."
                    rows={8}
                    className="w-full field-input text-sm resize-none scrollbar-thin"
                  />
                </div>

                {error && (
                  <p className="font-body text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                {limitReached && (
                  <p className="font-body text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                    Wykorzystano darmowy limit audytów. Ulepsz do Premium, aby kontynuować bez ograniczeń.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="grad-cta w-full font-display font-semibold text-sm text-white py-3 px-4 rounded-xl"
                >
                  {loading
                    ? "Generowanie audytu..."
                    : limitReached
                    ? "Ulepsz do Premium, aby kontynuować"
                    : "Uruchom audyt ekspercki"}
                </button>
              </form>
            )}
          </div>

          {/* PANEL WYNIKÓW */}
          <div className="lg:col-span-2 space-y-6">
            {!report && !loading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed border-white/10 text-slate-500 text-sm font-body text-center px-8 glass-card rounded-3xl">
                <p className="max-w-sm">
                  Wprowadź dane w formularzu bocznym, aby wygenerować profesjonalny protokół kontroli i dopasowania ATS.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4 glass-card rounded-3xl">
                <div className="w-12 h-12 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>
                <p className="text-sm font-mono text-slate-400">Przetwarzanie profilu zawodowego przez LLM...</p>
              </div>
            )}

            {report && (
              <div className="space-y-6">

                {/* METRYKI */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(() => {
                    const scoreTone = toneClasses[getScoreTone(report.score)];
                    return (
                      <div className={`glass-card glass-card-hover rounded-3xl p-5 text-center ${scoreTone.ring}`}>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                          Wynik ogólny
                        </span>
                        <span className={`text-4xl font-display font-extrabold ${scoreTone.text}`}>
                          {report.score}
                          <span className="text-lg font-normal text-slate-500">/100</span>
                        </span>
                      </div>
                    );
                  })()}

                  <div className="glass-card glass-card-hover rounded-3xl p-5 text-center flex flex-col justify-center">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                      Poziom profilu
                    </span>
                    <span className="text-xl font-display font-bold text-white">
                      {report.seniority || 'Nieokreślony'}
                    </span>
                  </div>

                  {(() => {
                    const atsTone = toneClasses[getScoreTone(report.ats_compatibility || report.match_score)];
                    return (
                      <div className={`glass-card glass-card-hover rounded-3xl p-5 text-center ${atsTone.ring}`}>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                          Zgodność ATS
                        </span>
                        <span className={`text-4xl font-display font-extrabold ${atsTone.text}`}>
                          {(report.ats_compatibility || report.match_score) || '—'}
                          <span className="text-lg font-normal text-slate-500">%</span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* SILNE I SŁABE STRONY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-3xl p-6">
                    <h4 className="font-display font-bold text-lg mb-4 flex items-center gap-2 text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Silne strony dokumentu
                    </h4>
                    <ul className="space-y-4">
                      {visibleStrengths?.map((s, i) => (
                        <li key={i} className="font-body text-sm text-slate-300">
                          <strong className="text-emerald-300 block mb-1">{s.title || s}</strong>
                          {s.desc && <span className="text-slate-500 text-xs block">{s.desc}</span>}
                        </li>
                      ))}
                    </ul>
                    {!isPremium && report.strengths?.length > visibleStrengths?.length && (
                      <PremiumUnlockRow
                        label={`+${report.strengths.length - visibleStrengths.length} więcej w Premium`}
                        onClick={() => setShowPricing(true)}
                      />
                    )}
                  </div>

                  <div className="glass-card rounded-3xl p-6">
                    <h4 className="font-display font-bold text-lg mb-4 flex items-center gap-2 text-rose-300">
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                      Wykryte uchybienia
                    </h4>
                    <ul className="space-y-4">
                      {visibleWeaknesses?.map((w, i) => (
                        <li key={i} className="font-body text-sm text-slate-300">
                          <strong className="text-rose-300 block mb-1">{w.title || w}</strong>
                          {w.desc && <span className="text-slate-500 text-xs block">{w.desc}</span>}
                        </li>
                      ))}
                    </ul>
                    {!isPremium && report.weaknesses?.length > visibleWeaknesses?.length && (
                      <PremiumUnlockRow
                        label={`+${report.weaknesses.length - visibleWeaknesses.length} więcej w Premium`}
                        onClick={() => setShowPricing(true)}
                      />
                    )}
                  </div>
                </div>

                {/* LUKI KOMPETENCYJNE */}
                <div className="glass-card rounded-3xl p-6">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-4 font-semibold">
                    Luki kompetencyjne względem oferty
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {visibleMissingSkills?.map((sk, i) => {
                      const tone = toneClasses[getImportanceTone(sk.importance)];
                      return (
                        <div
                          key={i}
                          className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] glass-card-hover flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold text-sm text-white">{sk.skill || sk}</span>
                            {sk.importance && (
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border ${tone.bg} ${tone.border} ${tone.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`}></span>
                                {sk.importance}
                              </span>
                            )}
                          </div>
                          {sk.reason && (
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Ten brak osłabia pozycję: {sk.reason}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {!isPremium && report.missing_skills?.length > visibleMissingSkills?.length && (
                    <PremiumUnlockRow
                      label={`+${report.missing_skills.length - visibleMissingSkills.length} kolejnych luk w Premium`}
                      onClick={() => setShowPricing(true)}
                    />
                  )}
                </div>

                {/* PLAN NAPRAWCZY */}
                <div className="glass-card rounded-3xl p-6">
                  <h4 className="font-display font-bold text-lg mb-4 text-white">
                    Zalecany plan naprawczy
                  </h4>
                  <ol className="space-y-3">
                    {visibleImprovements?.map((imp, i) => (
                      <li
                        key={i}
                        className="font-body text-sm text-slate-300 flex gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 glass-card-hover"
                      >
                        <span className="font-mono font-bold text-base text-transparent bg-clip-text grad-text flex-shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          {imp.section && (
                            <strong className="text-[11px] uppercase font-mono block text-slate-500 mb-1 tracking-wide">
                              Sekcja: {imp.section}
                            </strong>
                          )}
                          <p className="text-sm text-slate-200">{imp.action || imp}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {!isPremium && report.improvements?.length > visibleImprovements?.length && (
                    <PremiumUnlockRow
                      label={`+${report.improvements.length - visibleImprovements.length} kolejnych kroków w Premium`}
                      onClick={() => setShowPricing(true)}
                    />
                  )}
                </div>

                {/* SZKIC CV */}
                {report.improved_cv_draft && (
                  <div className="glass-card rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-display font-bold text-lg text-white">
                        Gotowy szablon zoptymalizowanego CV
                      </h4>
                      {isPremium && (
                        <button
                          onClick={handleCopyToClipboard}
                          className="text-xs font-mono px-4 py-2 rounded-xl grad-cta text-white font-medium"
                        >
                          {copied ? "Skopiowano ✓" : "Kopiuj kod Markdown"}
                        </button>
                      )}
                    </div>

                    {isPremium ? (
                      <pre className="whitespace-pre-wrap bg-black/30 p-5 border border-white/5 rounded-2xl text-xs font-mono text-slate-300 max-h-[450px] overflow-y-auto leading-[24px]">
                        {report.improved_cv_draft}
                      </pre>
                    ) : (
                      <div className="relative">
                        <pre className="lock-blur whitespace-pre-wrap bg-black/30 p-5 border border-white/5 rounded-2xl text-xs font-mono text-slate-300 max-h-[220px] overflow-hidden leading-[24px]">
                          {report.improved_cv_draft}
                        </pre>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0B0F19]/40 rounded-2xl">
                          <p className="font-body text-sm text-slate-300 text-center max-w-xs">
                            Gotowy szablon CV jest częścią planu Premium.
                          </p>
                          <button
                            onClick={() => setShowPricing(true)}
                            className="grad-cta font-display font-semibold text-sm text-white py-2.5 px-5 rounded-xl"
                          >
                            Odblokuj za {PREMIUM_PRICE} zł
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      </main>

      {/* MODAL CENNIKA */}
      {showPricing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !purchasing && setShowPricing(false)}
        >
          <div
            className="modal-in relative w-full max-w-3xl glass-card rounded-3xl p-6 sm:p-8 border border-white/10 bg-[#0B0F19]/95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !purchasing && setShowPricing(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
              aria-label="Zamknij"
            >
              ✕
            </button>

            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-indigo-300/80 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-4">
                Wybierz plan
              </span>
              <h3 className="font-display text-3xl font-extrabold text-white mb-2">
                Odblokuj pełny <span className="grad-text">protokół ATS</span>
              </h3>
              <p className="font-body text-sm text-slate-400 max-w-md mx-auto">
                Jedna, jednorazowa opłata za dostęp Premium — bez subskrypcji i ukrytych kosztów.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-6 flex flex-col ${
                    plan.highlight
                      ? 'grad-border bg-white/[0.04] shadow-[0_0_30px_-8px_rgba(99,102,241,0.45)]'
                      : 'border border-white/5 bg-white/[0.02]'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-6 text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full grad-cta text-white">
                      Polecany
                    </span>
                  )}
                  <h4 className="font-display font-bold text-xl text-white mb-1">{plan.name}</h4>
                  <p className="text-xs text-slate-500 mb-4 font-body">{plan.tagline}</p>
                  <div className="mb-5">
                    <span className="font-display text-4xl font-extrabold text-white">{plan.price}</span>
                    {plan.period && <span className="text-sm text-slate-500 ml-1">{plan.period}</span>}
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300 font-body">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${plan.highlight ? 'bg-cyan-400' : 'bg-slate-500'}`}></span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.id === 'premium' ? (
                    <button
                      onClick={handlePurchasePremium}
                      disabled={isPremium || purchasing}
                      className="grad-cta w-full font-display font-semibold text-sm text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                    >
                      {purchasing ? "Łączenie z bramką..." : isPremium ? "Plan aktywny" : `Kup Premium — ${PREMIUM_PRICE} zł`}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-white/[0.04] border border-white/5 text-slate-500 font-display font-semibold text-sm py-3 px-4 rounded-xl"
                    >
                      {plan.cta}
                    </button>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* MODAL LOGOWANIA */}
      {showAuth && (
        <AuthModal
          apiUrl={API_URL}
          onClose={() => setShowAuth(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}