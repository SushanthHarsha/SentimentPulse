"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Globe2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface SentimentData {
  overall: { positive: number; negative: number; neutral: number };
  score: number;
  summary: string;
  keyTopics: { topic: string; sentiment: "positive" | "negative" | "neutral"; mentions: number }[];
  recentMentions: { text: string; sentiment: "positive" | "negative" | "neutral"; source: string }[];
  concerns: string[];
  positives: string[];
  sources: { url: string; title: string }[];
}

const POLICIES = [
  { id: "ev", name: "EV Policy" },
  { id: "nep", name: "National Education Policy" },
  { id: "metro", name: "Metro Projects" },
  { id: "e20", name: "E20 Ethanol Blending" },
  { id: "digital", name: "Digital India" },
  { id: "ayushman", name: "Ayushman Bharat" },
];

export default function Dashboard() {
  const [policyName, setPolicyName] = useState("");
  const [customPolicy, setCustomPolicy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SentimentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const analyzeSentiment = async (policy: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setPolicyName(policy);

    try {
      const response = await fetch("/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy }),
      });
      if (!response.ok) throw new Error("Failed");
      setData(await response.json());
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPolicy.trim()) {
      analyzeSentiment(customPolicy.trim());
    }
  };

  const pieData = data ? [
    { name: "Positive", value: data.overall.positive, color: "#00FF88" },
    { name: "Negative", value: data.overall.negative, color: "#FF3366" },
    { name: "Neutral", value: data.overall.neutral, color: "#666666" },
  ] : [];

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* Noise texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-50"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      {/* Top Bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 px-8 py-6 flex items-center justify-between mix-blend-difference"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-white/20 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold">SP</span>
          </div>
          <span className="text-sm tracking-[0.2em] uppercase opacity-60">SentimentPulse</span>
        </div>
        <div className="flex items-center gap-8">
          <span className="text-sm tracking-[0.2em] uppercase opacity-60">IST {time}</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
            <span className="text-sm tracking-[0.2em] uppercase opacity-60">Live</span>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {!data && !isLoading && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Hero */}
            <section className="flex-1 flex flex-col justify-center px-8 md:px-16 pt-32 pb-20">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-sm tracking-[0.3em] uppercase text-[#00FF88] mb-8">
                  AI-Powered Sentiment Analysis
                </p>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-[clamp(3rem,12vw,12rem)] font-black uppercase leading-[0.85] tracking-tighter"
              >
                <span className="block">Decode</span>
                <span className="block text-transparent" style={{ WebkitTextStroke: "2px white" }}>Public</span>
                <span className="block">
                  <span className="text-[#00FF88]">Pulse</span>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="mt-12 text-xl md:text-2xl text-white/40 max-w-xl leading-relaxed"
              >
                Real-time sentiment monitoring for government policies from news, social media & public forums.
              </motion.p>

              {/* Search */}
              <motion.form
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleSearch}
                className="mt-16 max-w-2xl"
              >
                <div className="relative group">
                  <input
                    type="text"
                    value={customPolicy}
                    onChange={(e) => setCustomPolicy(e.target.value)}
                    placeholder="Search any policy..."
                    className="w-full py-6 px-0 bg-transparent text-2xl border-b-2 border-white/20 focus:border-[#00FF88] placeholder:text-white/20 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm tracking-[0.2em] uppercase text-[#00FF88] hover:text-white transition-colors"
                  >
                    Analyze <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>
            </section>

            {/* Marquee */}
            <div className="border-y border-white/10 py-6 overflow-hidden">
              <motion.div
                animate={{ x: [0, -1920] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="flex gap-16 whitespace-nowrap"
              >
                {[...Array(4)].map((_, i) => (
                  <span key={i} className="flex gap-16 text-6xl md:text-8xl font-black uppercase tracking-tighter text-white/5">
                    <span>News</span>
                    <span className="text-[#00FF88]/10">•</span>
                    <span>Twitter</span>
                    <span className="text-[#00FF88]/10">•</span>
                    <span>Reddit</span>
                    <span className="text-[#00FF88]/10">•</span>
                    <span>Forums</span>
                    <span className="text-[#00FF88]/10">•</span>
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Policies Grid */}
            <section className="px-8 md:px-16 py-20">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm tracking-[0.3em] uppercase text-white/30 mb-12"
              >
                Popular Policies
              </motion.p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {POLICIES.map((policy, i) => (
                  <motion.button
                    key={policy.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    onClick={() => analyzeSentiment(policy.name)}
                    className="group relative p-8 border border-white/10 hover:border-[#00FF88]/50 hover:bg-[#00FF88]/5 transition-all duration-500 text-left"
                  >
                    <span className="absolute top-4 right-4 text-xs text-white/20 tracking-[0.2em]">0{i + 1}</span>
                    <span className="text-xl md:text-2xl font-semibold group-hover:text-[#00FF88] transition-colors">{policy.name}</span>
                    <ArrowUpRight className="absolute bottom-4 right-4 w-5 h-5 opacity-0 group-hover:opacity-100 text-[#00FF88] transition-opacity" />
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Footer */}
            <footer className="px-8 md:px-16 py-8 border-t border-white/10 flex items-center justify-between text-sm text-white/30">
              <span>© 2026 SentimentPulse</span>
              <span>Built with AI + Real-time Grounding</span>
            </footer>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-2 border-white/10 border-t-[#00FF88] rounded-full mb-8"
            />
            <p className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Analyzing</p>
            <p className="text-white/40 tracking-[0.2em] uppercase text-sm">{policyName}</p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-8"
          >
            <AlertTriangle className="w-16 h-16 text-[#FF3366] mb-8" />
            <p className="text-2xl text-center">{error}</p>
            <button onClick={() => setError(null)} className="mt-8 text-[#00FF88] hover:underline">
              Try again
            </button>
          </motion.div>
        )}

        {/* Results */}
        {data && !isLoading && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-32 pb-20 px-8 md:px-16"
          >
            {/* Policy Title */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="mb-20">
              <p className="text-sm tracking-[0.3em] uppercase text-[#00FF88] mb-4">Analysis Complete</p>
              <h1 className="text-[clamp(2rem,8vw,8rem)] font-black uppercase leading-[0.9] tracking-tighter">
                {policyName}
              </h1>
            </motion.div>

            {/* Big Score */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20"
            >
              <div>
                <p className="text-sm tracking-[0.3em] uppercase text-white/30 mb-8">Sentiment Score</p>
                <div className="flex items-baseline gap-4">
                  <span className={`text-[12rem] md:text-[16rem] font-black leading-none tracking-tighter ${
                    data.score > 20 ? "text-[#00FF88]" : data.score < -20 ? "text-[#FF3366]" : "text-[#FFAA00]"
                  }`}>
                    {data.score > 0 ? "+" : ""}{data.score}
                  </span>
                </div>
                <div className="mt-8 h-1 w-full max-w-md bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${50 + data.score / 2}%` }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className={`h-full ${data.score > 20 ? "bg-[#00FF88]" : data.score < -20 ? "bg-[#FF3366]" : "bg-[#FFAA00]"}`}
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-8">
                {[
                  { label: "Positive", value: data.overall.positive, color: "#00FF88", icon: TrendingUp },
                  { label: "Negative", value: data.overall.negative, color: "#FF3366", icon: TrendingDown },
                  { label: "Neutral", value: data.overall.neutral, color: "#666", icon: Minus },
                ].map((item) => (
                  <div key={item.label} className="border-l-2 pl-6" style={{ borderColor: item.color }}>
                    <item.icon className="w-6 h-6 mb-4" style={{ color: item.color }} />
                    <p className="text-5xl md:text-6xl font-black" style={{ color: item.color }}>{item.value}%</p>
                    <p className="text-sm tracking-[0.2em] uppercase text-white/40 mt-2">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-20 border-t border-white/10 pt-12"
            >
              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="w-6 h-6 text-[#00FF88]" />
                <p className="text-sm tracking-[0.3em] uppercase text-white/30">AI Summary</p>
              </div>
              <p className="text-2xl md:text-3xl leading-relaxed text-white/70 max-w-4xl">{data.summary}</p>
            </motion.div>

            {/* Charts */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20"
            >
              <div className="border border-white/10 p-8">
                <p className="text-sm tracking-[0.3em] uppercase text-white/30 mb-8">Distribution</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value" strokeWidth={0}>
                        {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: "0" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-8 mt-6">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-white/40">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/10 p-8">
                <p className="text-sm tracking-[0.3em] uppercase text-white/30 mb-8">Trending Topics</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.keyTopics.slice(0, 5)} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="topic" width={120} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: "0" }} />
                      <Bar dataKey="mentions" fill="#00FF88" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Concerns & Positives */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20"
            >
              <div className="border-l-2 border-[#FF3366] pl-8">
                <div className="flex items-center gap-4 mb-8">
                  <AlertTriangle className="w-5 h-5 text-[#FF3366]" />
                  <p className="text-sm tracking-[0.3em] uppercase text-[#FF3366]">Public Concerns</p>
                </div>
                <ul className="space-y-6">
                  {data.concerns.map((c, i) => (
                    <li key={i} className="text-lg text-white/60">{c}</li>
                  ))}
                </ul>
              </div>

              <div className="border-l-2 border-[#00FF88] pl-8">
                <div className="flex items-center gap-4 mb-8">
                  <CheckCircle2 className="w-5 h-5 text-[#00FF88]" />
                  <p className="text-sm tracking-[0.3em] uppercase text-[#00FF88]">Positive Aspects</p>
                </div>
                <ul className="space-y-6">
                  {data.positives.map((p, i) => (
                    <li key={i} className="text-lg text-white/60">{p}</li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Mentions */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-20 border-t border-white/10 pt-12"
            >
              <div className="flex items-center gap-4 mb-12">
                <MessageSquare className="w-5 h-5 text-white/30" />
                <p className="text-sm tracking-[0.3em] uppercase text-white/30">Recent Mentions</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.recentMentions.map((m, i) => (
                  <div key={i} className="border border-white/10 p-6 hover:border-white/30 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      {m.sentiment === "positive" ? <TrendingUp className="w-4 h-4 text-[#00FF88]" /> : 
                       m.sentiment === "negative" ? <TrendingDown className="w-4 h-4 text-[#FF3366]" /> : 
                       <Minus className="w-4 h-4 text-white/40" />}
                      <span className="text-xs tracking-[0.2em] uppercase text-white/30">{m.source}</span>
                    </div>
                    <p className="text-white/60 leading-relaxed">&ldquo;{m.text}&rdquo;</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Sources */}
            {data.sources.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="border-t border-white/10 pt-12"
              >
                <div className="flex items-center gap-4 mb-8">
                  <Globe2 className="w-5 h-5 text-white/30" />
                  <p className="text-sm tracking-[0.3em] uppercase text-white/30">Sources</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {data.sources.slice(0, 10).map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-white/10 hover:border-[#00FF88] hover:text-[#00FF88] text-sm text-white/50 transition-colors flex items-center gap-2">
                      {s.title || new URL(s.url).hostname}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Back */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-20 pt-12 border-t border-white/10">
              <button onClick={() => setData(null)} className="text-sm tracking-[0.2em] uppercase text-white/30 hover:text-[#00FF88] transition-colors">
                ← Analyze another policy
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
