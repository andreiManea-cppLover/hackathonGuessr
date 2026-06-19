"use client";

import React from "react";

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

  const ticks = [1600, 1700, 1800, 1900, 1950, 2000, 2026];

  return (
    <div className="w-full select-none">
      {/* Year display */}
      <div className="flex items-baseline gap-2 mb-5">
        <span className="text-5xl font-bold text-white" style={{ fontFamily: "var(--font-sora)" }}>
          {value}
        </span>
        <span className="text-sm text-[#4a5063] font-medium">an selectat</span>
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
          const pos = ((tick - min) / (max - min)) * 100;
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
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-[#f5c842]" : "text-[#4a5063]"
                } group-hover:text-white`}
              >
                {tick}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
