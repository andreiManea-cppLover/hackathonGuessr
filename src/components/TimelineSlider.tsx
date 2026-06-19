"use client";

import React from "react";
import { Clock } from "lucide-react";
import { formatYear } from "@/utils/gameUtils";

interface TimelineSliderProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** Prompt shown in the card header. */
  title?: string;
}

export default function TimelineSlider({
  value,
  onChange,
  min = 1600,
  max = 2026,
  disabled = false,
  title = "În ce an a fost surprinsă această imagine?",
}: TimelineSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  // Evenly spaced snap points across the (possibly very wide) range.
  // 4 intervals → 5 labels keeps wide BC strings (e.g. "3500 î.Hr.") from colliding.
  const TICK_COUNT = 4;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) =>
    Math.round(min + (i * (max - min)) / TICK_COUNT)
  );

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const step = (delta: number) => !disabled && onChange(clamp(value + delta));

  const stepBtn =
    "shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/15 text-[#f5c842] text-xl font-bold leading-none transition-all duration-200 hover:bg-[#f5c842] hover:text-[#111318] hover:border-[#f5c842] active:scale-90 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-[#f5c842] disabled:cursor-not-allowed cursor-pointer";

  return (
    <div className="w-full select-none flex flex-col">
      {/* ── Header: icon + prompt, dead-center ── */}
      <div className="flex flex-row items-center justify-center gap-2 mb-3">
        <Clock size={13} className="shrink-0 text-[#f5c842]" />
        <h3 className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400 leading-tight text-balance">
          {title}
        </h3>
      </div>

      {/* ── Main controls: [-]  year  [+] — mathematically centered ── */}
      <div className="flex flex-row items-center justify-center gap-6 w-full">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={disabled || value <= min}
          aria-label="Anul anterior"
          className={stepBtn}
        >
          −
        </button>

        {/* Fixed min-width so changing year strings never shift the buttons */}
        <div className="flex flex-col items-center justify-center min-w-[150px]">
          <span
            className="text-center text-4xl font-bold leading-none text-white tabular-nums whitespace-nowrap"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            {formatYear(value)}
          </span>
          <span className="text-center text-[11px] font-medium text-gray-300 mt-1">
            an selectat
          </span>
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={disabled || value >= max}
          aria-label="Anul următor"
          className={stepBtn}
        >
          +
        </button>
      </div>

      {/* ── Slider ── */}
      <div className="relative py-3 mt-2">
        <div className="timeline-track">
          <div className="timeline-fill" style={{ width: `${percentage}%` }} />
        </div>

        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#f5c842] border-2 border-white shadow-[0_0_0_3px_rgba(245,200,66,0.3)] pointer-events-none transition-all duration-75"
          style={{ left: `calc(${percentage}% + ${(0.5 - percentage / 100) * 20}px)` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      {/* ── Tick marks + labels: each label dead-center under its tick ── */}
      <div className="flex justify-between w-full relative mt-1">
        {ticks.map((tick) => {
          const isActive = value >= tick;
          return (
            <button
              key={tick}
              onClick={() => !disabled && onChange(tick)}
              disabled={disabled}
              aria-label={`Sari la anul ${formatYear(tick)}`}
              className="flex flex-col items-center gap-1 group cursor-pointer disabled:cursor-not-allowed"
            >
              <span
                className={`w-0.5 h-2 rounded-full transition-colors ${
                  isActive ? "bg-[#f5c842]" : "bg-[#2e3340]"
                } group-hover:bg-[#f7d160]`}
              />
              <span
                className={`text-[10px] font-medium whitespace-nowrap transition-colors ${
                  isActive ? "text-[#f5c842]" : "text-[#4a5063]"
                } group-hover:text-white`}
              >
                {formatYear(tick)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
