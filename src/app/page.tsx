"use client";

import React, { useState, useEffect, useRef } from "react";
import { historicalLocations, HistoricalLocation } from "@/data/locations";
import { calculateDistance, calculateScore, getSarcasticRemark, getTemporalTitle } from "@/utils/gameUtils";
import TimelineSlider from "@/components/TimelineSlider";
import GuessMap from "@/components/GuessMap";
import confetti from "canvas-confetti";
import {
  MapPin, Clock, ChevronRight, Trophy, RotateCcw, Zap,
  HelpCircle, Volume2, VolumeX, Target, Calendar,
  TrendingUp, Award, Star, ArrowRight, Globe,
} from "lucide-react";

type GameState = "MENU" | "PLAYING" | "RESULT" | "SUMMARY";

interface LeaderboardEntry {
  name: string;
  score: number;
  title: string;
  date: string;
}

// ── Score bar component ──────────────────────────────────────────────────────
function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-[#4a5063] font-medium">{label}</span>
        <span className="text-white font-bold">+{value.toLocaleString()} pct</span>
      </div>
      <div className="h-2 bg-[#2e3340] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [rounds, setRounds] = useState<HistoricalLocation[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [selectedYear, setSelectedYear] = useState(1800);
  const [guessCoords, setGuessCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [timer, setTimer] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [roundResult, setRoundResult] = useState<{
    distanceKm: number; yearDiff: number;
    distanceScore: number; yearScore: number; roundScore: number; remark: string;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [powerUps, setPowerUps] = useState({ clue: true, delorean: true });
  const [clueVisible, setClueVisible] = useState(false);
  const [clueIndex, setClueIndex] = useState(0);
  const [sliderMin, setSliderMin] = useState(1600);
  const [sliderMax, setSliderMax] = useState(2026);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);

  // ── Audio ────────────────────────────────────────────────────────────────
  const beep = (freq = 440, dur = 0.12, type: OscillatorType = "sine") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtx.current)
        audioCtx.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = audioCtx.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch { /* ignore */ }
  };

  // ── Leaderboard fetch ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/leaderboard");
        if (r.ok) { const d = await r.json(); setLeaderboard(d); return; }
      } catch { /* ignore */ }
      const saved = localStorage.getItem("chronomap_lb");
      if (saved) { setLeaderboard(JSON.parse(saved)); return; }
      const defaults: LeaderboardEntry[] = [
        { name: "EINSTEIN_A", score: 24150, title: "Stăpânul Timpului",   date: "1921-11-09" },
        { name: "MARTY_M",    score: 21890, title: "Navigator de Elită",  date: "1985-10-26" },
        { name: "DR_BROWN",   score: 19820, title: "Navigator de Elită",  date: "1955-11-12" },
        { name: "WELLS_HG",   score: 15400, title: "Călător de Duminică", date: "1895-05-15" },
        { name: "NOVICE",     score: 5800,  title: "Novice Temporal",     date: "2026-06-19" },
      ];
      setLeaderboard(defaults);
      localStorage.setItem("chronomap_lb", JSON.stringify(defaults));
    };
    load();
  }, [gameState]);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isTimerActive || gameState !== "PLAYING") return;
    if (timer === 0) { handleLockGuess(); return; }
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 10 && t > 0) beep(880, 0.05);
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerActive, timer, gameState]);

  // ── Game helpers ─────────────────────────────────────────────────────────
  const resetRound = () => {
    setGuessCoords(null);
    setSelectedYear(1800);
    setTimer(90);
    setIsTimerActive(true);
    setClueVisible(false);
    setSliderMin(1600);
    setSliderMax(2026);
    setMapExpanded(false);
    setGameState("PLAYING");
  };

  const handleStartGame = () => {
    const shuffled = [...historicalLocations].sort(() => 0.5 - Math.random()).slice(0, 5);
    setRounds(shuffled);
    setCurrentRoundIndex(0);
    setTotalScore(0);
    setScoreSubmitted(false);
    setPowerUps({ clue: true, delorean: true });
    setGameState("PLAYING");
    setGuessCoords(null);
    setSelectedYear(1800);
    setTimer(90);
    setIsTimerActive(true);
    setClueVisible(false);
    setSliderMin(1600);
    setSliderMax(2026);
    setMapExpanded(false);
    beep(523, 0.15, "triangle");
    setTimeout(() => beep(659, 0.15, "triangle"), 160);
    setTimeout(() => beep(784, 0.25, "triangle"), 320);
  };

  const handleLockGuess = () => {
    setIsTimerActive(false);
    const round = rounds[currentRoundIndex];
    const fc = guessCoords ?? { lat: -round.lat, lng: (round.lng + 180) % 360 - 180 };
    const distanceKm = calculateDistance(fc.lat, fc.lng, round.lat, round.lng);
    const yearDiff = Math.abs(selectedYear - round.year);
    const { distanceScore, yearScore, totalScore: rs } = calculateScore(distanceKm, yearDiff);
    setRoundResult({
      distanceKm, yearDiff, distanceScore, yearScore, roundScore: rs,
      remark: getSarcasticRemark(rs, distanceKm, yearDiff),
    });
    setTotalScore((prev) => prev + rs);
    setGameState("RESULT");
    beep(523, 0.08, "square");
  };

  const handleNextRound = () => {
    beep(659, 0.1, "triangle");
    if (currentRoundIndex < 4) {
      setCurrentRoundIndex((i) => i + 1);
      resetRound();
    } else {
      setGameState("SUMMARY");
      setIsTimerActive(false);
      if (totalScore >= 18000) confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2, "triangle"), i * 160));
    }
  };

  const useClue = () => {
    if (!powerUps.clue || gameState !== "PLAYING") return;
    beep(600, 0.1);
    setPowerUps((p) => ({ ...p, clue: false }));
    setClueIndex(Math.floor(Math.random() * rounds[currentRoundIndex].clues.length));
    setClueVisible(true);
  };

  const useDelorean = () => {
    if (!powerUps.delorean || gameState !== "PLAYING") return;
    beep(800, 0.15, "sawtooth");
    setPowerUps((p) => ({ ...p, delorean: false }));
    const y = rounds[currentRoundIndex].year;
    const newMin = Math.max(1600, y - Math.floor(Math.random() * 20 + 20));
    const newMax = Math.min(2026, y + Math.floor(Math.random() * 20 + 20));
    setSliderMin(newMin);
    setSliderMax(newMax);
    setSelectedYear(Math.round((newMin + newMax) / 2));
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || scoreSubmitted) return;
    const title = getTemporalTitle(totalScore);
    const name = playerName.trim().substring(0, 12).toUpperCase();
    try {
      const r = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, score: totalScore, title }),
      });
      if (r.ok) {
        const d = await r.json();
        if (d.success && d.leaderboard) {
          setLeaderboard(d.leaderboard);
          localStorage.setItem("chronomap_lb", JSON.stringify(d.leaderboard));
          setScoreSubmitted(true);
          beep(784, 0.2, "sine");
          return;
        }
      }
    } catch { /* ignore */ }
    const updated = [...leaderboard, { name, score: totalScore, title, date: new Date().toISOString().split("T")[0] }]
      .sort((a, b) => b.score - a.score).slice(0, 10);
    setLeaderboard(updated);
    localStorage.setItem("chronomap_lb", JSON.stringify(updated));
    setScoreSubmitted(true);
    beep(784, 0.2, "sine");
  };

  const timerPct = (timer / 90) * 100;
  const timerColor = timer > 30 ? "#4dbb6e" : timer > 10 ? "#f5c842" : "#e05252";
  const roundProgress = ((currentRoundIndex + (gameState === "RESULT" ? 1 : 0)) / 5) * 100;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#111318] text-[#e8eaf0] font-inter">

      {/* ─── MENU ─────────────────────────────────────────────────────────── */}
      {gameState === "MENU" && (
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between px-8 py-5 border-b border-[#2e3340]">
            <div className="flex items-center gap-3">
              <Globe size={22} className="text-[#f5c842]" />
              <span className="text-lg font-bold" style={{ fontFamily: "var(--font-sora)" }}>
                Chrono<span className="text-[#f5c842]">Map</span>
              </span>
            </div>
            <button
              onClick={() => setSoundEnabled((s) => !s)}
              className="p-2 rounded-lg hover:bg-[#1e2128] text-[#4a5063] hover:text-white transition-colors cursor-pointer border border-transparent hover:border-[#2e3340]"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </header>

          {/* Hero section */}
          <div className="flex-grow flex flex-col md:flex-row items-center justify-between px-8 lg:px-16 py-8 gap-8 max-w-7xl mx-auto w-full">
            
            {/* Left Images (Symmetric Column 1 - Hidden on mobile, shown on tablet/desktop) */}
            <div className="hidden md:flex flex-col gap-6 w-full md:w-1/4 max-w-[240px] animate-fade-in">
              <div className="relative group overflow-hidden rounded-2xl border border-[#2e3340] hover:border-[#f5c842]/50 transition-all duration-300 shadow-lg shadow-black/40">
                <img src="/images/bg1.png" alt="Ancient Egypt" className="w-full aspect-[4/3] object-cover filter brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-md border border-white/5 text-[10px] font-semibold text-[#f5c842] uppercase tracking-wider italic">Egiptul Antic</div>
              </div>
              <div className="relative group overflow-hidden rounded-2xl border border-[#2e3340] hover:border-[#f5c842]/50 transition-all duration-300 shadow-lg shadow-black/40">
                <img src="/images/bg3.png" alt="Industrial Revolution" className="w-full aspect-[4/3] object-cover filter brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-md border border-white/5 text-[10px] font-semibold text-[#f5c842] uppercase tracking-wider italic">Revoluția Industrială</div>
              </div>
            </div>

            {/* Center — CTA (The text in between the images) */}
            <div className="flex-1 flex flex-col justify-center items-center text-center max-w-xl mx-auto py-6">
              <div className="inline-flex items-center gap-2 bg-[#f5c842]/10 border border-[#f5c842]/25 rounded-full px-5 py-2 text-xs font-semibold text-[#f5c842] uppercase tracking-wider mb-6 italic">
                <Zap size={13} /> Joc de Geografie Temporală
              </div>

              <h1 className="text-5xl lg:text-7xl font-black leading-tight mb-8 italic text-[#f5c842] tracking-tight" style={{ fontFamily: "var(--font-sora)" }}>
                Ghicește<br />
                <span className="text-[#f5c842]">Epoca</span> &amp;<br />
                <span className="text-[#f5c842]">Locul</span>
              </h1>

              <p className="text-[#f5c842]/80 text-lg lg:text-xl mb-12 leading-relaxed max-w-md italic font-medium">
                Analizează imagini istorice fascinante și ghicește în ce an și unde au fost surprinse.
                Fiecare rundă — o epocă nouă de descoperit.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full justify-center items-center">
                <button
                  id="btn-start-game"
                  onClick={handleStartGame}
                  className="btn-primary text-lg px-10 py-5 text-center justify-center italic"
                >
                  <Play size={20} /> Pornește Aventura
                </button>
                <div className="flex items-center gap-3 text-sm text-[#f5c842]/70 px-2 font-semibold italic">
                  <span className="flex items-center gap-1.5"><Clock size={16} /> 90s/rundă</span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><Target size={16} /> 5 Runde</span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><Star size={16} /> Max 25K pct</span>
                </div>
              </div>

              {/* How to play chips */}
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { icon: <Globe size={15} />, text: "Pune pin pe hartă" },
                  { icon: <Calendar size={15} />, text: "Selectează anul" },
                  { icon: <TrendingUp size={15} />, text: "Câștigă puncte" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 bg-[#1e2128] border border-[#2e3340] rounded-full px-4.5 py-2.5 text-xs text-[#f5c842] font-semibold italic">
                    <span className="text-[#f5c842]">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Images (Symmetric Column 2 - Hidden on mobile, shown on tablet/desktop) */}
            <div className="hidden md:flex flex-col gap-6 w-full md:w-1/4 max-w-[240px] animate-fade-in">
              <div className="relative group overflow-hidden rounded-2xl border border-[#2e3340] hover:border-[#f5c842]/50 transition-all duration-300 shadow-lg shadow-black/40">
                <img src="/images/bg2.png" alt="Medieval Castle" className="w-full aspect-[4/3] object-cover filter brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-md border border-white/5 text-[10px] font-semibold text-[#f5c842] uppercase tracking-wider italic">Evul Mediu</div>
              </div>
              <div className="relative group overflow-hidden rounded-2xl border border-[#2e3340] hover:border-[#f5c842]/50 transition-all duration-300 shadow-lg shadow-black/40">
                <img src="/images/bg4.png" alt="Future DeLorean" className="w-full aspect-[4/3] object-cover filter brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-md border border-white/5 text-[10px] font-semibold text-[#f5c842] uppercase tracking-wider italic">Călătoria în Timp</div>
              </div>
            </div>

            {/* Mobile/Tablet image grid (shown only on mobile) */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md md:hidden mt-8">
              {[
                { src: "/images/bg1.png", label: "Egiptul Antic" },
                { src: "/images/bg2.png", label: "Evul Mediu" },
                { src: "/images/bg3.png", label: "Revoluția Industrială" },
                { src: "/images/bg4.png", label: "Călătoria în Timp" },
              ].map((img, i) => (
                <div key={i} className="relative group overflow-hidden rounded-xl border border-[#2e3340] shadow-md shadow-black/40">
                  <img src={img.src} alt={img.label} className="w-full aspect-[4/3] object-cover filter brightness-75" />
                  <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded border border-white/5 text-[8px] font-semibold text-[#f5c842] uppercase tracking-wider italic">{img.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ─── PLAYING ──────────────────────────────────────────────────────── */}
      {gameState === "PLAYING" && rounds[currentRoundIndex] && (
        <div className="flex-1 flex flex-col relative overflow-hidden" style={{ height: "100vh" }}>
          {/* Full-screen image */}
          <div className="absolute inset-0">
            <img
              src={rounds[currentRoundIndex].imageUrl}
              alt="Historical event"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1600";
              }}
            />
            {/* Gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </div>

          {/* ── HUD top-left ── */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
            {/* Logo */}
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
              <Globe size={15} className="text-[#f5c842]" />
              <span className="font-bold text-sm" style={{ fontFamily: "var(--font-sora)" }}>ChronoMap</span>
            </div>

            {/* Round indicator */}
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-xl px-4 py-2">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
                <span className="font-semibold text-white">Runda {currentRoundIndex + 1}</span>
                <span>din 5</span>
              </div>
              <div className="round-progress w-24">
                <div className="round-progress-fill" style={{ width: `${((currentRoundIndex + 1) / 5) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* ── HUD top-center: Timer ── */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-xl px-5 py-2.5 flex items-center gap-3 min-w-[120px] justify-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center relative"
                style={{
                  background: `conic-gradient(${timerColor} ${timerPct}%, #2e3340 0%)`,
                }}
              >
                <div className="absolute inset-1 rounded-full bg-black/70 flex items-center justify-center">
                  <Clock size={12} style={{ color: timerColor }} />
                </div>
              </div>
              <span className="font-bold text-lg tabular-nums" style={{ color: timerColor, fontFamily: "var(--font-sora)" }}>
                {String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* ── HUD top-right: Score + Powerups ── */}
          <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2">
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
              <Award size={14} className="text-[#f5c842]" />
              <span className="font-bold text-sm" style={{ fontFamily: "var(--font-sora)" }}>
                {totalScore.toLocaleString()} pct
              </span>
            </div>

            {/* Power-ups */}
            <div className="flex gap-2">
              <button
                id="btn-powerup-clue"
                onClick={useClue}
                disabled={!powerUps.clue}
                title="Indiciu (Bunicul Guraliv)"
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  powerUps.clue
                    ? "bg-black/60 backdrop-blur border-white/20 hover:bg-[#f5c842]/20 hover:border-[#f5c842]/60 text-[#f5c842] hover:scale-110 active:scale-95"
                    : "bg-black/30 border-white/5 text-[#2e3340] cursor-not-allowed"
                }`}
              >
                <HelpCircle size={16} />
              </button>
              <button
                id="btn-powerup-delorean"
                onClick={useDelorean}
                disabled={!powerUps.delorean}
                title="DeLorean Warp (îngustează intervalul de ani)"
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  powerUps.delorean
                    ? "bg-black/60 backdrop-blur border-white/20 hover:bg-[#4dbb6e]/20 hover:border-[#4dbb6e]/60 text-[#4dbb6e] hover:scale-110 active:scale-95"
                    : "bg-black/30 border-white/5 text-[#2e3340] cursor-not-allowed"
                }`}
              >
                <Zap size={16} />
              </button>
              <button
                onClick={() => setSoundEnabled((s) => !s)}
                className="w-10 h-10 rounded-xl border border-white/10 bg-black/60 backdrop-blur flex items-center justify-center text-gray-400 hover:text-white hover:bg-black/80 transition-all cursor-pointer"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
          </div>

          {/* ── Clue panel ── */}
          {clueVisible && (
            <div className="absolute top-20 left-4 z-30 max-w-xs bg-black/75 backdrop-blur-md border border-[#f5c842]/30 rounded-xl p-4 score-pop">
              <div className="text-[10px] font-bold text-[#f5c842] uppercase tracking-widest mb-1.5">💡 Indiciu</div>
              <p className="text-sm text-gray-200 leading-relaxed">{rounds[currentRoundIndex].clues[clueIndex]}</p>
            </div>
          )}

          {/* ── Bottom panel: Year selector + Guess button ── */}
          <div className="absolute bottom-6 left-6 right-6 z-30 flex items-end gap-4">
            <div
              className="flex-1 bg-[#111318]/90 backdrop-blur-md border border-[#2e3340] rounded-2xl p-5"
              style={{ maxWidth: "600px" }}
            >
              <div className="text-xs font-semibold text-[#4a5063] uppercase tracking-widest mb-4">
                📅 În ce an a fost surprinsă această imagine?
              </div>
              <TimelineSlider
                value={selectedYear}
                onChange={setSelectedYear}
                min={sliderMin}
                max={sliderMax}
              />
            </div>

            {/* Guess button */}
            <div className="flex flex-col items-center gap-2">
              {!guessCoords && (
                <div className="bg-black/70 backdrop-blur border border-[#e05252]/40 rounded-lg px-3 py-2 text-xs text-[#e05252] font-medium max-w-[160px] text-center">
                  <MapPin size={12} className="inline mr-1 pin-pulse" />
                  Plasează pin pe hartă
                </div>
              )}
              <button
                id="btn-lock-guess"
                onClick={handleLockGuess}
                disabled={!guessCoords}
                className="btn-primary px-7 py-4 text-sm whitespace-nowrap"
                style={!guessCoords ? { background: "#1e2128", color: "#4a5063", boxShadow: "none", cursor: "not-allowed" } : {}}
              >
                <ChevronRight size={18} />
                Fă Guess-ul!
              </button>
            </div>
          </div>

          {/* ── Map corner (GeoGuessr style) ── */}
          <div
            id="map-corner"
            className={`map-corner ${mapExpanded ? "expanded" : ""}`}
            onMouseEnter={() => setMapExpanded(true)}
            onMouseLeave={() => setMapExpanded(false)}
          >
            {/* Label */}
            {!guessCoords && !mapExpanded && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-black/70 rounded-lg px-3 py-2 text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  <MapPin size={12} className="pin-pulse" /> Click pe hartă
                </div>
              </div>
            )}
            <GuessMap
              guessCoords={guessCoords}
              onPlaceMarker={(c) => { beep(523, 0.06); setGuessCoords(c); }}
            />
          </div>
        </div>
      )}

      {/* ─── RESULT ───────────────────────────────────────────────────────── */}
      {gameState === "RESULT" && rounds[currentRoundIndex] && roundResult && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden" style={{ height: "100vh" }}>
          {/* Left: Info panel */}
          <div className="lg:w-[420px] xl:w-[480px] shrink-0 flex flex-col border-r border-[#2e3340] overflow-y-auto">
            <div className="p-6 border-b border-[#2e3340]">
              <div className="flex items-center gap-2 text-xs text-[#4a5063] font-semibold uppercase tracking-widest mb-3">
                <Globe size={12} className="text-[#f5c842]" />
                Runda {currentRoundIndex + 1} / 5 · Rezultate
              </div>
              <div className="round-progress mb-4">
                <div className="round-progress-fill" style={{ width: `${((currentRoundIndex + 1) / 5) * 100}%` }} />
              </div>

              {/* Round score */}
              <div className="text-center py-4 score-pop">
                <div className="text-xs text-[#4a5063] font-medium uppercase tracking-widest mb-1">Scor Rundă</div>
                <div
                  className="text-6xl font-black"
                  style={{
                    fontFamily: "var(--font-sora)",
                    color: roundResult.roundScore >= 4000 ? "#4dbb6e" : roundResult.roundScore >= 2000 ? "#f5c842" : "#e05252",
                  }}
                >
                  +{roundResult.roundScore.toLocaleString()}
                </div>
                <div className="text-sm text-[#4a5063] mt-1">
                  Total acumulat: <span className="text-white font-semibold">{totalScore.toLocaleString()} pct</span>
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="p-6 border-b border-[#2e3340] flex flex-col gap-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-[#4a5063]">Detalii Scor</h3>
              <ScoreBar
                label={`Distanță — ${roundResult.distanceKm} km`}
                value={roundResult.distanceScore}
                max={2500}
                color="#f5c842"
              />
              <ScoreBar
                label={`Timp — ${roundResult.yearDiff} ani diferență`}
                value={roundResult.yearScore}
                max={2500}
                color="#4dbb6e"
              />
            </div>

            {/* AI Remark */}
            <div className="p-6 border-b border-[#2e3340]">
              <div className="bg-[#1e2128] border border-[#2e3340] rounded-xl p-4">
                <div className="text-[11px] font-bold text-[#4a5063] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  🤖 ChronoAI
                </div>
                <p className="text-sm text-gray-300 italic leading-relaxed">
                  &ldquo;{roundResult.remark}&rdquo;
                </p>
              </div>
            </div>

            {/* Historical context */}
            <div className="p-6 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={15} className="text-[#f5c842]" />
                <h3 className="font-bold text-sm text-white">{rounds[currentRoundIndex].title}</h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#4a5063] mb-3">
                <span className="flex items-center gap-1">
                  <Star size={11} className="text-[#f5c842]" />
                  An corect: <strong className="text-white ml-1">{rounds[currentRoundIndex].year}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} className="text-[#4dbb6e]" />
                  {rounds[currentRoundIndex].lat.toFixed(2)}, {rounds[currentRoundIndex].lng.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-[#4a5063] leading-relaxed">{rounds[currentRoundIndex].description}</p>
            </div>

            {/* Next button */}
            <div className="p-6 border-t border-[#2e3340]">
              <button
                id="btn-next-round"
                onClick={handleNextRound}
                className="btn-primary w-full justify-center text-center py-4 text-base"
              >
                {currentRoundIndex < 4 ? (
                  <><ArrowRight size={18} /> Runda Următoare</>
                ) : (
                  <><Trophy size={18} /> Vezi Rezumatul</>
                )}
              </button>
            </div>
          </div>

          {/* Right: Map (full height) */}
          <div className="flex-1 relative">
            <GuessMap
              guessCoords={guessCoords}
              onPlaceMarker={() => {}}
              actualCoords={{ lat: rounds[currentRoundIndex].lat, lng: rounds[currentRoundIndex].lng }}
              showResults={true}
            />
            {/* Legend */}
            <div className="absolute bottom-5 left-5 flex flex-col gap-2 z-30">
              <div className="bg-black/70 backdrop-blur border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-gray-300">
                <div className="w-3 h-3 rounded-full bg-[#f5c842] border border-white" />
                Estimarea ta
              </div>
              <div className="bg-black/70 backdrop-blur border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-gray-300">
                <div className="w-3 h-3 rounded-full bg-[#4dbb6e] border border-white" />
                Locul corect
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUMMARY ──────────────────────────────────────────────────────── */}
      {gameState === "SUMMARY" && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between px-8 py-5 border-b border-[#2e3340]">
            <div className="flex items-center gap-3">
              <Globe size={22} className="text-[#f5c842]" />
              <span className="text-lg font-bold" style={{ fontFamily: "var(--font-sora)" }}>
                Chrono<span className="text-[#f5c842]">Map</span>
              </span>
            </div>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-xl flex flex-col gap-8 mx-auto">
              {/* Score summary */}
              <div className="flex flex-col gap-6 w-full">
                <div className="text-center">
                  <div className="text-sm text-[#4a5063] font-semibold uppercase tracking-widest mb-2">Misiune Finalizată!</div>
                  <h2 className="text-5xl font-black leading-tight" style={{ fontFamily: "var(--font-sora)" }}>
                    Scor Final
                  </h2>
                </div>

                <div className="card p-8 text-center score-pop">
                  <div
                    className="text-8xl font-black mb-2"
                    style={{
                      fontFamily: "var(--font-sora)",
                      color: totalScore >= 20000 ? "#4dbb6e" : totalScore >= 10000 ? "#f5c842" : "#e8eaf0",
                    }}
                  >
                    {totalScore.toLocaleString()}
                  </div>
                  <div className="text-[#4a5063] text-sm font-medium">puncte din 25,000 posibile</div>
                  <div className="mt-4 pt-4 border-t border-[#2e3340] text-lg font-semibold text-[#f5c842]">
                    {getTemporalTitle(totalScore)}
                  </div>
                </div>

                {/* Submit score */}
                {!scoreSubmitted ? (
                  <form onSubmit={handleSubmitScore} className="card p-6">
                    <h4 className="font-bold text-sm mb-4 text-center" style={{ fontFamily: "var(--font-sora)" }}>
                      📋 Salvează-ți scorul
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nickname tău..."
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                        maxLength={12}
                        required
                        className="flex-1 bg-[#111318] border border-[#2e3340] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#f5c842] uppercase tracking-wider text-sm placeholder:text-[#2e3340] placeholder:normal-case placeholder:font-normal transition-colors"
                      />
                      <button type="submit" className="btn-primary px-5 py-3 whitespace-nowrap">
                        Salvează
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="card p-4 border-[#4dbb6e]/30 bg-[#4dbb6e]/5 flex items-center gap-3">
                    <span className="text-xl">✅</span>
                    <div>
                      <div className="font-bold text-sm text-[#4dbb6e]">Scor salvat cu succes!</div>
                      <div className="text-xs text-[#4a5063]">Scorul tău a fost înregistrat.</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button id="btn-play-again" onClick={handleStartGame} className="btn-primary flex-1 justify-center py-4">
                    <RotateCcw size={16} /> Joacă Din Nou
                  </button>
                  <button onClick={() => setGameState("MENU")} className="btn-secondary flex-1 justify-center py-4">
                    🏠 Meniu Principal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Missing Play component import alias
function Play({ size, ...props }: { size: number; [key: string]: unknown }) {
  return <ArrowRight size={size} {...props} />;
}
