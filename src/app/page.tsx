"use client";

import React, { useState, useEffect, useRef } from "react";
import { HistoricalLocation } from "@/data/locations";
import { panoramaLocations, PANORAMA_MIN_YEAR } from "@/data/panoramas";
import { calculateDistance, calculateScore, getSarcasticRemark, getTemporalTitle } from "@/utils/gameUtils";
import TimelineSlider from "@/components/TimelineSlider";
import GuessMap from "@/components/GuessMap";
import ResultsPanel from "@/components/ResultsPanel";
import ProPaywallModal from "@/components/ProPaywallModal";
import { canPlay, recordGamePlayed } from "@/utils/dailyLimit";
import confetti from "canvas-confetti";
import {
  MapPin, Clock, RotateCcw, Zap,
  HelpCircle, Volume2, VolumeX, Target,
  Award, ArrowRight, Globe,
  Maximize2, Minimize2, Save, Home as HomeIcon, CheckCircle2, Trophy,
} from "lucide-react";

type GameState = "MENU" | "PLAYING" | "RESULT" | "SUMMARY";

// Timeline spans the full temporal range of the panorama pool (BC → present).
const SLIDER_MIN = Math.floor(PANORAMA_MIN_YEAR / 100) * 100; // e.g. -2600
const SLIDER_MAX = 2026;
const SLIDER_MID = Math.round((SLIDER_MIN + SLIDER_MAX) / 2);
const ROUNDS_PER_GAME = 5;

interface LeaderboardEntry {
  name: string;
  score: number;
  title: string;
  date: string;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [rounds, setRounds] = useState<HistoricalLocation[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedYear, setSelectedYear] = useState(SLIDER_MID);
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
  const [sliderMin, setSliderMin] = useState(SLIDER_MIN);
  const [sliderMax, setSliderMax] = useState(SLIDER_MAX);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapRecenter, setMapRecenter] = useState(0);
  const [showPinWarning, setShowPinWarning] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const pinWarnTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pannellum (360° panorama) viewer state & refs
  const [pannellumLoaded, setPannellumLoaded] = useState(false);
  const pannellumContainerRef = useRef<HTMLDivElement>(null);
  const pannellumViewerRef = useRef<any>(null);

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

  // ── Personal best (localStorage) — evaluated when the summary screen opens ──
  useEffect(() => {
    if (gameState !== "SUMMARY") return;

    let prev: number | null = null;
    try {
      const raw = localStorage.getItem("chronoMap_bestScore");
      if (raw !== null) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) prev = n;
      }
    } catch { /* ignore */ }

    const beat = prev === null ? totalScore > 0 : totalScore > prev;
    if (prev === null || totalScore > prev) {
      try { localStorage.setItem("chronoMap_bestScore", String(totalScore)); } catch { /* ignore */ }
      setBestScore(totalScore);
    } else {
      setBestScore(prev);
    }
    setIsNewRecord(beat);
  }, [gameState, totalScore]);

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

  // ── Load Pannellum Scripts ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load Pannellum CSS
    if (!document.getElementById("pannellum-css")) {
      const link = document.createElement("link");
      link.id = "pannellum-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
      document.head.appendChild(link);
    }

    // Load Pannellum JS
    if (!document.getElementById("pannellum-js")) {
      const script = document.createElement("script");
      script.id = "pannellum-js";
      script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
      script.async = true;
      script.onload = () => setPannellumLoaded(true);
      document.head.appendChild(script);
    } else {
      if ((window as any).pannellum) {
        setPannellumLoaded(true);
      } else {
        const script = document.getElementById("pannellum-js") as HTMLScriptElement;
        if (script) {
          const prevOnload = script.onload;
          script.onload = (e) => {
            if (prevOnload) (prevOnload as any)(e);
            setPannellumLoaded(true);
          };
        }
      }
    }
  }, []);

  // ── Initialize/Destroy Pannellum 360 Viewer ──────────────────────────────
  useEffect(() => {
    if (!pannellumLoaded || gameState !== "PLAYING" || !rounds[currentRoundIndex]?.is360) {
      if (pannellumViewerRef.current) {
        try {
          pannellumViewerRef.current.destroy();
        } catch { /* ignore */ }
        pannellumViewerRef.current = null;
      }
      return;
    }

    if (pannellumContainerRef.current && (window as any).pannellum) {
      if (pannellumViewerRef.current) {
        try {
          pannellumViewerRef.current.destroy();
        } catch { /* ignore */ }
      }

      try {
        pannellumViewerRef.current = (window as any).pannellum.viewer(pannellumContainerRef.current, {
          type: "equirectangular",
          panorama: rounds[currentRoundIndex].imageUrl,
          autoLoad: true,
          showControls: true,
          compass: false,
          mouseZoom: true,
          keyboardZoom: true,
        });
      } catch (err) {
        console.error("Failed to initialize pannellum:", err);
      }
    }

    return () => {
      if (pannellumViewerRef.current) {
        try {
          pannellumViewerRef.current.destroy();
        } catch { /* ignore */ }
        pannellumViewerRef.current = null;
      }
    };
  }, [pannellumLoaded, gameState, currentRoundIndex, rounds]);

  // ── Game helpers ─────────────────────────────────────────────────────────
  const resetRound = () => {
    setGuessCoords(null);
    setSelectedYear(SLIDER_MID);
    setTimer(90);
    setIsTimerActive(true);
    setClueVisible(false);
    setSliderMin(SLIDER_MIN);
    setSliderMax(SLIDER_MAX);
    setMapExpanded(false);
    setShowPinWarning(false);
    setGameState("PLAYING");
  };

  const handleStartGame = () => {
    // Pick a random set of 360° panoramas (geo + temporal metadata baked into each entry).
    const shuffled = [...panoramaLocations]
      .sort(() => 0.5 - Math.random())
      .slice(0, ROUNDS_PER_GAME);
    setRounds(shuffled);
    setCurrentRoundIndex(0);
    setTotalScore(0);
    setRoundScores([]);
    setScoreSubmitted(false);
    setPowerUps({ clue: true, delorean: true });
    setGameState("PLAYING");
    setGuessCoords(null);
    setSelectedYear(SLIDER_MID);
    setTimer(90);
    setIsTimerActive(true);
    setClueVisible(false);
    setSliderMin(SLIDER_MIN);
    setSliderMax(SLIDER_MAX);
    setMapExpanded(false);
    setShowPinWarning(false);
    beep(523, 0.15, "triangle");
    setTimeout(() => beep(659, 0.15, "triangle"), 160);
    setTimeout(() => beep(784, 0.25, "triangle"), 320);
  };

  // Freemium gate: every "Play" entry point goes through here.
  const attemptStartGame = () => {
    if (!canPlay()) {
      setShowPaywall(true);
      beep(300, 0.14, "square");
      return;
    }
    recordGamePlayed();
    handleStartGame();
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
    setRoundScores((prev) => [...prev, rs]);
    setGameState("RESULT");
    beep(523, 0.08, "square");
  };

  // CTA click — guard against a missing pin with a transient warning toast
  const handleGuessClick = () => {
    if (!guessCoords) {
      setShowPinWarning(true);
      beep(300, 0.14, "square");
      if (pinWarnTimeout.current) clearTimeout(pinWarnTimeout.current);
      pinWarnTimeout.current = setTimeout(() => setShowPinWarning(false), 2800);
      return;
    }
    handleLockGuess();
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
    const newMin = Math.max(SLIDER_MIN, y - Math.floor(Math.random() * 20 + 20));
    const newMax = Math.min(SLIDER_MAX, y + Math.floor(Math.random() * 20 + 20));
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
    <div className="min-h-dvh w-full flex flex-col bg-[#111318] text-[#e8eaf0] font-inter">

      {/* ─── MENU ─────────────────────────────────────────────────────────── */}
      {gameState === "MENU" && (
        <div className="relative flex-1 flex flex-col h-dvh overflow-hidden">
          {/* ── Cinematic background: Earth from space + heavy overlay for readability ── */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2000"
              alt=""
              aria-hidden
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-black/95" />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* ── Header overlay ── */}
          <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
            <div className="flex items-center gap-2.5">
              <Globe size={22} className="text-[#f5c842]" />
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-sora)" }}>
                Chrono<span className="text-[#f5c842]">Map</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSoundEnabled((s) => !s)}
                title={soundEnabled ? "Oprește sunetul" : "Pornește sunetul"}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-[#f5c842] hover:border-[#f5c842]/50 transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>
          </header>

          {/* ── Hero: perfectly centered single column ── */}
          <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-10 max-w-3xl mx-auto w-full">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#f5c842]/10 border border-[#f5c842]/25 rounded-full px-5 py-2 text-[11px] md:text-xs font-semibold text-[#f5c842] uppercase tracking-[0.18em] mb-8">
              <Zap size={13} /> Joc de Geografie Temporală
            </div>

            {/* Title with glow */}
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-6 text-white"
              style={{
                fontFamily: "var(--font-sora)",
                textShadow: "0 0 40px rgba(245,200,66,0.35), 0 4px 28px rgba(0,0,0,0.7)",
              }}
            >
              Ghicește <span className="text-[#f5c842]">Epoca</span>
              <br className="hidden sm:block" /> &amp; <span className="text-[#f5c842]">Locul</span>
            </h1>

            {/* Subtitle */}
            <p className="text-gray-300/90 text-base md:text-lg max-w-xl mb-10 leading-relaxed">
              Analizează imagini istorice fascinante și ghicește în ce an și unde au fost
              surprinse. Fiecare rundă — o epocă nouă de descoperit.
            </p>

            {/* Unified central block: settings + start button */}
            <div className="w-full max-w-md flex flex-col items-center gap-6 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl px-6 md:px-8 py-7 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-center gap-5 text-sm text-gray-200 font-medium">
                <span className="flex items-center gap-2">
                  <Clock size={16} className="text-[#f5c842]" /> 90s / rundă
                </span>
                <span className="w-px h-4 bg-white/15" />
                <span className="flex items-center gap-2">
                  <Target size={16} className="text-[#f5c842]" /> 5 Runde
                </span>
              </div>
              <button
                id="btn-start-game"
                onClick={attemptStartGame}
                className="btn-primary w-full justify-center text-lg px-10 py-5"
              >
                <Play size={20} /> Pornește Aventura
              </button>
            </div>
          </main>
        </div>
      )}

      {/* ─── PLAYING ──────────────────────────────────────────────────────── */}
      {gameState === "PLAYING" && rounds[currentRoundIndex] && (
        <div className="flex-1 flex flex-col relative overflow-hidden" style={{ height: "100dvh" }}>
          {/* Full-screen image or 360-degree panorama viewer */}
          <div className="absolute inset-0">
            {rounds[currentRoundIndex].is360 ? (
              <div 
                ref={pannellumContainerRef} 
                className="w-full h-full"
                style={{ background: "#0c0f17" }}
              />
            ) : (
              <img
                src={rounds[currentRoundIndex].imageUrl}
                alt="Historical event"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1600";
                }}
              />
            )}
            {/* Gradient vignette */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </div>

          {/* ── HUD top-left: Timer (primary, enlarged) + Round ── */}
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-30 flex items-stretch gap-2 sm:gap-3">
            {/* Timer — the most important readout: bigger, accent-bordered */}
            <div className="bg-black/65 backdrop-blur border border-[#f5c842]/40 rounded-xl px-3 py-2 sm:px-5 sm:py-3 flex items-center gap-2.5 sm:gap-3.5 shadow-lg shadow-black/30">
              <div
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center relative shrink-0"
                style={{
                  background: `conic-gradient(${timerColor} ${timerPct}%, #2e3340 0%)`,
                }}
              >
                <div className="absolute inset-1 rounded-full bg-black/70 flex items-center justify-center">
                  <Clock size={14} className="sm:hidden" style={{ color: timerColor }} />
                  <Clock size={16} className="hidden sm:block" style={{ color: timerColor }} />
                </div>
              </div>
              <span className="font-bold text-xl sm:text-3xl tabular-nums leading-none" style={{ color: timerColor, fontFamily: "var(--font-sora)" }}>
                {String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}
              </span>
            </div>

            {/* Round indicator */}
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-400 mb-1 sm:mb-1.5">
                <span className="font-semibold text-white">Runda {currentRoundIndex + 1}</span>
                <span>din 5</span>
              </div>
              <div className="round-progress w-16 sm:w-24">
                <div className="round-progress-fill" style={{ width: `${((currentRoundIndex + 1) / 5) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* ── HUD top-right: Score + Powerups — one symmetric row, equal heights ── */}
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 flex items-stretch gap-2">
            {/* Score */}
            <div className="h-9 sm:h-10 bg-black/60 backdrop-blur border border-white/10 rounded-xl px-3 sm:px-4 flex items-center gap-2">
              <Award size={14} className="text-[#f5c842] shrink-0" />
              <span className="font-bold text-xs sm:text-sm tabular-nums whitespace-nowrap" style={{ fontFamily: "var(--font-sora)" }}>
                {totalScore.toLocaleString()} pct
              </span>
            </div>

            {/* Control buttons — unified glassmorphism, accent only on active/toggle */}
            <button
              id="btn-powerup-clue"
              onClick={useClue}
              disabled={!powerUps.clue}
              title="Indiciu (Bunicul Guraliv)"
              className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl border backdrop-blur flex items-center justify-center transition-all duration-200 ${
                powerUps.clue
                  ? "bg-black/60 border-white/15 text-white hover:text-[#f5c842] hover:border-[#f5c842]/60 hover:scale-110 active:scale-95 cursor-pointer"
                  : "bg-black/30 border-white/5 text-[#3a3f50] cursor-not-allowed"
              }`}
            >
              <HelpCircle size={16} />
            </button>
            <button
              id="btn-powerup-delorean"
              onClick={useDelorean}
              disabled={!powerUps.delorean}
              title="DeLorean Warp (îngustează intervalul de ani)"
              className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl border backdrop-blur flex items-center justify-center transition-all duration-200 ${
                powerUps.delorean
                  ? "bg-black/60 border-white/15 text-white hover:text-[#f5c842] hover:border-[#f5c842]/60 hover:scale-110 active:scale-95 cursor-pointer"
                  : "bg-black/30 border-white/5 text-[#3a3f50] cursor-not-allowed"
              }`}
            >
              <Zap size={16} />
            </button>
            <button
              onClick={() => setSoundEnabled((s) => !s)}
              title={soundEnabled ? "Oprește sunetul" : "Pornește sunetul"}
              className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl border backdrop-blur flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
                soundEnabled
                  ? "bg-black/60 border-white/15 text-white hover:text-[#f5c842] hover:border-[#f5c842]/60"
                  : "bg-[#f5c842]/15 border-[#f5c842]/50 text-[#f5c842]"
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

          {/* ── Clue panel ── */}
          {clueVisible && (
            <div className="absolute top-16 left-2 sm:top-24 sm:left-4 z-30 max-w-[60vw] sm:max-w-xs bg-black/75 backdrop-blur-md border border-[#f5c842]/30 rounded-xl p-3 sm:p-4 score-pop">
              <div className="text-[10px] font-bold text-[#f5c842] uppercase tracking-widest mb-1.5">💡 Indiciu</div>
              <p className="text-sm text-gray-200 leading-relaxed">{rounds[currentRoundIndex].clues[clueIndex]}</p>
            </div>
          )}

          {/* ── Bottom panel: Timeline (left) · CTA (center) · map footprint (right) ── */}
          <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 z-30 flex flex-col md:flex-row items-stretch gap-3 sm:gap-4">
            {/* Timeline panel — same footprint as the map */}
            <div className="w-full md:w-[380px] md:h-[210px] shrink-0 overflow-hidden bg-[#111318]/85 md:bg-[#111318]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col justify-center">
              <TimelineSlider
                value={selectedYear}
                onChange={setSelectedYear}
                min={sliderMin}
                max={sliderMax}
              />
            </div>

            {/* Guess button — primary CTA, centered between the two panels */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-full md:w-auto">
                {/* Dynamic warning toast: only when CTA pressed without a pin */}
                {showPinWarning && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 score-pop bg-[#e05252] text-white rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap shadow-lg shadow-[#e05252]/40 flex items-center gap-1.5">
                    <MapPin size={13} className="pin-pulse" />
                    Plasează mai întâi un pin pe hartă!
                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[6px] border-transparent border-t-[#e05252]" />
                  </div>
                )}
                <button
                  id="btn-lock-guess"
                  onClick={handleGuessClick}
                  className={`btn-primary w-full md:w-auto justify-center px-6 py-4 sm:px-9 sm:py-5 text-sm sm:text-base font-extrabold whitespace-nowrap transition-all duration-200 ${
                    guessCoords
                      ? "shadow-[0_8px_28px_rgba(245,200,66,0.45)] hover:scale-[1.03]"
                      : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <Target size={20} />
                  Confirmă Locația și Anul
                </button>
              </div>
            </div>

            {/* Right spacer — reserves the map footprint so the CTA stays centered (desktop only) */}
            <div className="hidden md:block w-[380px] h-[210px] shrink-0 pointer-events-none" aria-hidden />
          </div>

          {/* ── Map corner (GeoGuessr style) — expands on hover or via toggle ── */}
          <div
            id="map-corner"
            className={`map-corner ${mapExpanded ? "expanded" : ""}`}
          >
            {/* Expand / collapse toggle — fixed size unless deliberately toggled */}
            <button
              onClick={() => setMapExpanded((p) => !p)}
              title={mapExpanded ? "Restrânge harta" : "Extinde harta"}
              className="absolute top-2 right-2 z-[1000] w-8 h-8 rounded-lg bg-black/70 backdrop-blur border border-white/15 text-white hover:text-[#f5c842] hover:border-[#f5c842]/60 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
            >
              {mapExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Hint label */}
            {!guessCoords && !mapExpanded && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-black/70 rounded-lg px-3 py-2 text-xs text-gray-300 font-medium flex items-center gap-1.5">
                  <MapPin size={12} className="pin-pulse" /> Click pe hartă
                </div>
              </div>
            )}
            <GuessMap
              guessCoords={guessCoords}
              onPlaceMarker={(c) => { beep(523, 0.06); setShowPinWarning(false); setGuessCoords(c); }}
            />
          </div>
        </div>
      )}

      {/* ─── RESULT ───────────────────────────────────────────────────────── */}
      {gameState === "RESULT" && rounds[currentRoundIndex] && roundResult && (
        <div className="flex-1 flex flex-col-reverse lg:flex-row overflow-hidden" style={{ height: "100dvh" }}>
          {/* Left: Info panel */}
          <ResultsPanel
            round={rounds[currentRoundIndex]}
            result={roundResult}
            currentRoundIndex={currentRoundIndex}
            totalRounds={ROUNDS_PER_GAME}
            totalScore={totalScore}
            isLastRound={currentRoundIndex >= ROUNDS_PER_GAME - 1}
            onNext={handleNextRound}
            onRecenter={() => setMapRecenter((n) => n + 1)}
          />

          {/* Right: Map (full height on desktop, fixed band on mobile) */}
          <div className="relative h-[40vh] shrink-0 min-h-0 lg:h-auto lg:flex-1">
            <GuessMap
              guessCoords={guessCoords}
              onPlaceMarker={() => {}}
              actualCoords={{ lat: rounds[currentRoundIndex].lat, lng: rounds[currentRoundIndex].lng }}
              showResults={true}
              recenterSignal={mapRecenter}
            />
            {/* Legend — bottom-right, clear of the left panel seam */}
            <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-30">
              <div className="bg-black/70 backdrop-blur border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-gray-300">
                <MapPin size={13} className="text-[#f5c842]" />
                Estimarea ta
              </div>
              <div className="bg-black/70 backdrop-blur border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-gray-300">
                <Target size={13} className="text-[#4dbb6e]" />
                Locul corect
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUMMARY ──────────────────────────────────────────────────────── */}
      {gameState === "SUMMARY" && (
        <div className="flex flex-col h-dvh overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between px-8 py-5 border-b border-[#2e3340]">
            <div className="flex items-center gap-3">
              <Globe size={22} className="text-[#f5c842]" />
              <span className="text-lg font-bold" style={{ fontFamily: "var(--font-sora)" }}>
                Chrono<span className="text-[#f5c842]">Map</span>
              </span>
            </div>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-lg flex flex-col gap-6 mx-auto">
              {/* Heading */}
              <div className="text-center">
                <div className="text-sm text-[#4a5063] font-semibold uppercase tracking-[0.2em] mb-2">Misiune Finalizată</div>
                <h2 className="text-4xl sm:text-5xl font-black leading-tight" style={{ fontFamily: "var(--font-sora)" }}>
                  Scor Final
                </h2>
              </div>

              {/* ── Gamified score ring + rank ── */}
              {(() => {
                const max = ROUNDS_PER_GAME * 5000;
                const pct = Math.min(100, Math.round((totalScore / max) * 100));
                const ringColor =
                  totalScore >= 20000 ? "#4dbb6e" : totalScore >= 10000 ? "#f5c842" : "#e05252";
                const R = 88;
                const C = 2 * Math.PI * R;
                const dash = (pct / 100) * C;
                return (
                  <div className="card p-7 sm:p-8 flex flex-col items-center score-pop">
                    {/* New record badge */}
                    {isNewRecord && (
                      <div
                        className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 text-xs font-bold uppercase tracking-widest score-pop"
                        style={{ boxShadow: "0 0 22px rgba(52,211,153,0.45)" }}
                      >
                        <Award size={14} /> Nou Record!
                      </div>
                    )}

                    {/* Progress ring */}
                    <div className="relative w-52 h-52">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r={R} fill="none" stroke="#2e3340" strokeWidth="12" />
                        <circle
                          cx="100" cy="100" r={R} fill="none"
                          stroke={ringColor} strokeWidth="12" strokeLinecap="round"
                          strokeDasharray={`${dash} ${C}`}
                          style={{
                            transition: "stroke-dasharray 1.1s cubic-bezier(0.4,0,0.2,1)",
                            filter: `drop-shadow(0 0 8px ${ringColor}80)`,
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div
                          className="text-5xl font-black tabular-nums leading-none"
                          style={{ fontFamily: "var(--font-sora)", color: ringColor }}
                        >
                          {totalScore.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-[#4a5063] font-medium mt-1.5">
                          din {max.toLocaleString()}
                        </div>
                        <div className="mt-2 text-xs font-bold tabular-nums" style={{ color: ringColor }}>
                          {pct}%
                        </div>
                      </div>
                    </div>

                    {/* Rank badge */}
                    <div
                      className="mt-6 inline-flex items-center gap-2.5 rounded-full pl-3 pr-5 py-2 border"
                      style={{
                        background: `${ringColor}1a`,
                        borderColor: `${ringColor}59`,
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[#111318]"
                        style={{ background: ringColor }}
                      >
                        <Trophy size={15} />
                      </span>
                      <span className="text-sm font-bold" style={{ color: ringColor }}>
                        {getTemporalTitle(totalScore)}
                      </span>
                    </div>

                    {/* Personal best */}
                    <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-gray-400">
                      <Trophy size={14} />
                      Record Personal:
                      <span className="text-gray-200 font-semibold tabular-nums">
                        {(bestScore ?? totalScore).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* ── Match summary breakdown ── */}
              <div className="card p-5">
                <div className="text-[11px] font-bold text-[#4a5063] uppercase tracking-[0.16em] mb-3">
                  Rezumat Runde
                </div>
                <div className="flex items-stretch gap-2.5">
                  {Array.from({ length: ROUNDS_PER_GAME }).map((_, i) => {
                    const s = roundScores[i];
                    const has = s !== undefined;
                    const c = !has ? "#2e3340" : s >= 4000 ? "#4dbb6e" : s >= 2000 ? "#f5c842" : "#e05252";
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full rounded-lg py-2.5 flex items-center justify-center text-xs font-bold tabular-nums border transition-all"
                          style={{
                            background: has ? `${c}1f` : "transparent",
                            borderColor: `${c}66`,
                            color: c,
                          }}
                        >
                          {has ? s.toLocaleString() : "—"}
                        </div>
                        <span className="text-[10px] text-[#4a5063] font-medium">R{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Action buttons: primary CTA + secondary ── */}
              <div className="flex flex-row gap-4">
                <button
                  id="btn-play-again"
                  onClick={attemptStartGame}
                  className="btn-primary flex-1 justify-center py-4 text-base shadow-[0_8px_28px_rgba(245,200,66,0.45)] hover:scale-[1.02] transition-transform"
                >
                  <RotateCcw size={18} /> Joacă Din Nou
                </button>
                <button
                  onClick={() => setGameState("MENU")}
                  className="flex-1 justify-center py-4 inline-flex items-center gap-2 rounded-[10px] font-semibold text-sm bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20 hover:text-white active:scale-[0.98] transition-all cursor-pointer"
                  style={{ fontFamily: "var(--font-sora)" }}
                >
                  <HomeIcon size={18} /> Meniu Principal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRO paywall (daily limit reached) ─────────────────────────────── */}
      <ProPaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => {
          // TODO: wire to a real checkout flow.
          beep(784, 0.18, "triangle");
        }}
      />
    </div>
  );
}

// Missing Play component import alias
function Play({ size, ...props }: { size: number; [key: string]: unknown }) {
  return <ArrowRight size={size} {...props} />;
}
