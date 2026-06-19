"use client";

import React from "react";
import dynamic from "next/dynamic";

interface GuessMapProps {
  guessCoords: { lat: number; lng: number } | null;
  onPlaceMarker: (coords: { lat: number; lng: number }) => void;
  actualCoords?: { lat: number; lng: number } | null;
  showResults?: boolean;
  /** Incrementing counter — refits the results view when it changes. */
  recenterSignal?: number;
}

// Încărcare dinamică cu ssr: false pentru a evita erorile legate de lipsa obiectului window la compilare (Next.js SSR)
const GuessMapInner = dynamic(() => import("./GuessMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e2128] text-[#f5c842]/70 text-xs animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-[#f5c842] animate-ping" />
        <span className="font-semibold tracking-wide">SE ÎNCARCĂ HARTA...</span>
      </div>
      <span className="text-[10px] text-[#4a5063]">OPENSTREETMAP · CARTO</span>
    </div>
  ),
});

export default function GuessMap({
  guessCoords,
  onPlaceMarker,
  actualCoords,
  showResults = false,
  recenterSignal = 0,
}: GuessMapProps) {
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#1e2128]">
      <GuessMapInner
        guessCoords={guessCoords}
        onPlaceMarker={onPlaceMarker}
        actualCoords={actualCoords}
        showResults={showResults}
        recenterSignal={recenterSignal}
      />
    </div>
  );
}
