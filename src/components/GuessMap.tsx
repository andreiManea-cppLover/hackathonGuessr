"use client";

import React from "react";
import dynamic from "next/dynamic";

interface GuessMapProps {
  guessCoords: { lat: number; lng: number } | null;
  onPlaceMarker: (coords: { lat: number; lng: number }) => void;
  actualCoords?: { lat: number; lng: number } | null;
  showResults?: boolean;
}

// Încărcare dinamică cu ssr: false pentru a evita erorile legate de lipsa obiectului window la compilare (Next.js SSR)
const GuessMapInner = dynamic(() => import("./GuessMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b0b14] border border-retro-cyan/20 rounded-lg text-retro-cyan/60 font-orbitron text-xs animate-pulse">
      {/* Indicator de încărcare stilizat ca terminal SF */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-retro-cyan animate-ping" />
        <span>CONECTARE SISTEM RADAR TEMPORAL...</span>
      </div>
      <span className="text-[10px] text-retro-cyan/40">ÎNCĂRCARE HĂRȚI OPENSTREETMAP</span>
    </div>
  ),
});

export default function GuessMap({
  guessCoords,
  onPlaceMarker,
  actualCoords,
  showResults = false,
}: GuessMapProps) {
  return (
    <div className="w-full h-full relative overflow-hidden rounded-lg border border-retro-border/40 bg-retro-dark">
      <GuessMapInner
        guessCoords={guessCoords}
        onPlaceMarker={onPlaceMarker}
        actualCoords={actualCoords}
        showResults={showResults}
      />
    </div>
  );
}
