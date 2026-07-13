import React, { useState, useEffect } from 'react';

const FREE_MONTHLY_LIMIT = 1;
const PREMIUM_PRICE = 29;

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

export default function App() {
  const [userStatus, setUserStatus] = useState({ is_premium: false, analysis_count: 0 });
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [showPricing, setShowPricing] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [toast, setToast] = useState('');

  // Adres Twojego serwera na Renderze
  const API_URL = "https://cv-analyzer-backend.onrender.com";

  useEffect(() => {
    fetchUserStatus();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // POPRAWIONE: Dodano /api/user/status
  const fetchUserStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/status`);
      const data = await res.json();
      setUserStatus((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Error fetching user status", err);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const limitReached = !userStatus.is_premium && userStatus.analysis_count >= FREE_MONTHLY_LIMIT;

  const handleAnalyze = async (e) => {
    e.preventDefault();
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
      // POPRAWIONE: Zmieniono adres z ${API_URL}/upload na ${API_URL}/api/upload
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
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

  // POPRAWIONE: Dopasowano punkt końcowy płatności do struktury z main.py (/api/create-checkout-session)
  const handlePurchasePremium = async () => {
    setPurchasing(true);
    try {
      const res = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; 
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

  // Skrócona treść widoku w celu dopasowania do przesłanego fragmentu kodu.
  // Poniższy return renderuje podstawowy układ formularza i cennika.
  return (
    <div className="h-screen bg-[#0B0F19] text-[#E2E8F0] font-body relative overflow-y-auto overflow-x-hidden scrollbar-thin">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        html, body { margin: 0; height: 100%; overflow: hidden; }
        .font-display { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.01em; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .glass-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); backdrop-filter: blur(20px); }
        .grad-text { background-image: linear-gradient(92deg, #818CF8 0%, #22D3EE 50%, #34D399 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .grad-cta { background-image: linear-gradient(92deg, #6366F1 0%, #06B6D4 55%, #10B981 100%); color: white; }
        .field-input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 14px; color: #E2E8F0; }
        .bg-glow { position: absolute; border-radius: 9999px; filter: blur(110px); pointer-events: none; z-index: 0; }
        .lock-blur { filter: blur(3px); user-select: none; pointer-events: none; }
      `}</style>

      <div className="bg-glow w-[520px] h-[520px] bg-indigo-600/25 -top-40 -left-32"></div>

      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] text-emerald-200 bg-emerald-500/15 p-4 rounded-xl">{toast}</div>}

      <header className="relative z-10 border-b border-white/5 bg-[#0B0F19]/70 backdrop-blur-xl sticky top-0 px-6 py-4 flex justify-between items-center">
        <span className="font-display font-semibold text-lg text-white">Kreator CV &middot; Audytor ATS</span>
        <button onClick={() => setShowPricing(true)} className="grad-cta text-xs py-2 px-4 rounded-xl">Cennik</button>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto py-12 px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-card rounded-3xl p-6 space-y-6">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <input type="file" accept=".pdf" onChange={handleFileChange} className="w-full field-input text-sm" />
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Wklej ofertę..." rows={6} className="w-full field-input text-sm resize-none" />
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button type="submit" disabled={loading} className="grad-cta w-full py-3 rounded-xl font-semibold">
              {loading ? "Generowanie audytu..." : "Uruchom audyt ekspercki"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 glass-card rounded-3xl p-6">
          {report ? (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Wynik dopasowania: {report.score}/100</h3>
              <p className="text-slate-300">Poziom: {report.seniority}</p>
              <div className="bg-black/20 p-4 rounded-xl"><p className="text-xs font-mono">{report.improved_cv_draft || "Brak szkicu"}</p></div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-12">Wgraj plik PDF i uruchom audyt.</p>
          )}
        </div>
      </main>

      {showPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPricing(false)}>
          <div className="glass-card bg-[#0B0F19] rounded-3xl p-8 max-w-md w-full text-center space-y-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold">Wybierz plan Premium</h3>
            <button onClick={handlePurchasePremium} disabled={purchasing} className="grad-cta w-full py-3 rounded-xl font-semibold">
              {purchasing ? "Przekierowanie..." : `Aktywuj dostęp za ${PREMIUM_PRICE} zł`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}