"use client";

import React from "react";
import { formatYear } from "@/utils/gameUtils";

interface TimelineSliderProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export default function TimelineSlider({
  value,
  onChange,
  min = 1600,
  max = 2026,
  disabled = false,
}: TimelineSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  // Build evenly spaced tick marks across the (possibly very wide) range.
  const TICK_COUNT = 6;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) =>
    Math.round(min + (i * (max - min)) / TICK_COUNT)
  );

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const step = (delta: number) => !disabled && onChange(clamp(value + delta));

  return (
    <div className="w-full select-none">
      {/* Year display with step buttons — fixed height so BC/AD never resize the panel */}
      <div className="flex items-center justify-between gap-3 mb-4 h-16">
        {/* [-] fine-tune button */}
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={disabled || value <= min}
          aria-label="Anul anterior"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/15 text-[#f5c842] text-xl font-bold leading-none transition-all duration-200 hover:bg-[#f5c842] hover:text-[#111318] hover:border-[#f5c842] active:scale-90 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-[#f5c842] disabled:cursor-not-allowed cursor-pointer"
        >
          −
        </button>

        <div className="flex-1 min-w-0 text-center">
          <div className="text-4xl font-bold text-white tabular-nums whitespace-nowrap leading-none truncate" style={{ fontFamily: "var(--font-sora)" }}>
            {formatYear(value)}
          </div>
          <div className="text-[11px] text-gray-300 font-medium mt-1 whitespace-nowrap">an selectat</div>
        </div>

        {/* [+] fine-tune button */}
        <button
          type="button"
          onClick={() => step(1)}
          disabled={disabled || value >= max}
          aria-label="Anul următor"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/15 text-[#f5c842] text-xl font-bold leading-none transition-all duration-200 hover:bg-[#f5c842] hover:text-[#111318] hover:border-[#f5c842] active:scale-90 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-[#f5c842] disabled:cursor-not-allowed cursor-pointer"
        >
          +
        </button>
      </div>

      {/* Slider */}
      <div className="relative py-3">
        {/* Track */}
        <div className="timeline-track">
          <div className="timeline-fill" style={{ width: `${percentage}%` }} />
        </div>

        {/* Thumb (visual) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#f5c842] border-2 border-white shadow-[0_0_0_3px_rgba(245,200,66,0.3)] pointer-events-none transition-all duration-75"
          style={{ left: `calc(${percentage}% + ${(0.5 - percentage / 100) * 20}px)` }}
        />

        {/* Native input (transparent, handles interaction) */}
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

      {/* Tick marks */}
      <div className="flex justify-between mt-1">
        {ticks.map((tick) => {
          const isActive = value >= tick;
          return (
            <button
              key={tick}
              onClick={() => !disabled && onChange(tick)}
              disabled={disabled}
              className="flex flex-col items-center gap-1 group cursor-pointer disabled:cursor-not-allowed"
              style={{ width: "auto" }}
            >
              <div
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
