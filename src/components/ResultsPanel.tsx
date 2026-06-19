"use client";

import React from "react";
import {
  Globe, Calendar, Star, MapPin, Bot, ArrowRight, Trophy, Compass, ExternalLink,
} from "lucide-react";
import { HistoricalLocation } from "@/data/locations";
import { formatYear, getRomanianTitle, getWikipediaUrl } from "@/utils/gameUtils";

export interface RoundResult {
  distanceKm: number;
  yearDiff: number;
  distanceScore: number;
  yearScore: number;
  roundScore: number;
  remark: string;
}

interface ResultsPanelProps {
  round: HistoricalLocation;
  result: RoundResult;
  currentRoundIndex: number;
  totalRounds: number;
  totalScore: number;
  isLastRound: boolean;
  onNext: () => void;
  /** Recenters the results map (compass control). Hidden when omitted. */
  onRecenter?: () => void;
}

// ── Dynamic performance tier → color tokens ──────────────────────────────────
// >80% great (emerald) · 30–80% average (gold) · <30% poor (rose)
interface Tier {
  text: string;
  bar: string;
  glow: string;
}

function getScoreTier(ratio: number): Tier {
  if (ratio >= 0.8) {
    return { text: "text-emerald-400", bar: "linear-gradient(90deg,#34d399,#4dbb6e)", glow: "rgba(77,187,110,0.45)" };
  }
  if (ratio >= 0.3) {
    return { text: "text-geo-gold", bar: "linear-gradient(90deg,#f7d160,#f5a623)", glow: "rgba(245,200,66,0.40)" };
  }
  return { text: "text-rose-400", bar: "linear-gradient(90deg,#fb7185,#e05252)", glow: "rgba(224,82,82,0.40)" };
}

// ── Score bar with dynamic, performance-based coloring ───────────────────────
function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const ratio = max > 0 ? value / max : 0;
  const pct = Math.min(100, ratio * 100);
  const tier = getScoreTier(ratio);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className={`font-bold tabular-nums tracking-tight ${tier.text}`}>
          +{value.toLocaleString()} pct
        </span>
      </div>
      <div className="h-2 bg-geo-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: tier.bar, boxShadow: `0 0 12px ${tier.glow}` }}
        />
      </div>
    </div>
  );
}

const MAX_COMPONENT = 2500; // max points per distance/time component
const MAX_ROUND = MAX_COMPONENT * 2;

export default function ResultsPanel({
  round,
  result,
  currentRoundIndex,
  totalRounds,
  totalScore,
  isLastRound,
  onNext,
  onRecenter,
}: ResultsPanelProps) {
  const roundTier = getScoreTier(result.roundScore / MAX_ROUND);
  const titleRo = getRomanianTitle(round);
  const wikiUrl = getWikipediaUrl(round);
  // Keep the description in Romanian even when source data prefixes the English title.
  const descriptionRo = round.description.replace(round.title, titleRo);

  return (
    <section className="lg:w-[440px] xl:w-[500px] shrink-0 flex flex-col border-r border-geo-border bg-geo-dark overflow-hidden">
      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-6 p-6">

        {/* Round progress + round score */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <Globe size={12} className="text-geo-gold" />
              Runda {currentRoundIndex + 1} / {totalRounds} · Rezultate
            </div>
            <div className="round-progress">
              <div
                className="round-progress-fill"
                style={{ width: `${((currentRoundIndex + 1) / totalRounds) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-1 py-2 score-pop">
            <span className="text-xs font-medium uppercase tracking-widest text-gray-400">Scor Rundă</span>
            <span
              className={`text-6xl font-black tabular-nums tracking-tight ${roundTier.text}`}
              style={{ fontFamily: "var(--font-sora)" }}
            >
              +{result.roundScore.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400">
              Total acumulat:{" "}
              <span className="text-white font-semibold tabular-nums">{totalScore.toLocaleString()} pct</span>
            </span>
          </div>
        </header>

        {/* Score breakdown */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Detalii Scor</h3>
          <ScoreBar label={`Distanță — ${result.distanceKm.toLocaleString()} km`} value={result.distanceScore} max={MAX_COMPONENT} />
          <ScoreBar label={`Timp — ${result.yearDiff} ani diferență`} value={result.yearScore} max={MAX_COMPONENT} />
        </div>

        {/* ChronoAI personality card */}
        <div className="chrono-ai-card rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="chrono-ai-avatar">
              <Bot size={17} />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-geo-gold">ChronoAI</span>
          </div>
          <p className="text-base italic leading-relaxed text-gray-200">
            &ldquo;{result.remark}&rdquo;
          </p>
        </div>

        {/* Historical context */}
        <article className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <Calendar size={18} className="mt-0.5 shrink-0 text-geo-gold" />
            <h3 className="text-lg font-bold leading-snug text-white">{titleRo}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Star size={12} className="text-geo-gold" />
              An corect:
              <strong className="text-white tabular-nums">{formatYear(round.year)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-geo-green" />
              <span className="tabular-nums">{round.lat.toFixed(2)}, {round.lng.toFixed(2)}</span>
            </span>
          </div>

          <p className="text-base leading-relaxed text-gray-300">{descriptionRo}</p>

          {/* Wikipedia secondary action */}
          <a
            href={wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-geo-gold transition-colors hover:text-[#f7d160] hover:underline underline-offset-4"
          >
            Citește mai mult pe Wikipedia
            <ExternalLink size={14} />
          </a>
        </article>
      </div>

      {/* ── Sticky footer: compass + next, one flex row, no overlap ── */}
      <footer className="flex items-stretch gap-3 p-4 border-t border-geo-border bg-geo-dark">
        {onRecenter && (
          <button
            type="button"
            onClick={onRecenter}
            aria-label="Recentrează harta spre nord"
            title="Recentrează harta"
            className="shrink-0 aspect-square flex items-center justify-center rounded-xl bg-geo-card border border-geo-border text-gray-300 transition-colors hover:text-geo-gold hover:border-geo-gold/50 active:scale-95 cursor-pointer"
          >
            <Compass size={20} />
          </button>
        )}
        <button
          id="btn-next-round"
          onClick={onNext}
          className="btn-primary flex-1 justify-center py-4 text-base"
        >
          {!isLastRound ? (
            <><ArrowRight size={18} /> Runda Următoare</>
          ) : (
            <><Trophy size={18} /> Vezi Rezumatul</>
          )}
        </button>
      </footer>
    </section>
  );
}
