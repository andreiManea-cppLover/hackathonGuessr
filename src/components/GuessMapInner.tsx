"use client";

import React, { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  ZoomControl,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";

interface LatLng {
  lat: number;
  lng: number;
}

interface GuessMapInnerProps {
  guessCoords: LatLng | null;
  onPlaceMarker: (coords: LatLng) => void;
  actualCoords?: LatLng | null;
  showResults?: boolean;
  recenterSignal?: number;
}

// ── Custom HTML markers ──────────────────────────────────────────────────────
// Guess: a teardrop map pin in the user's gold color (anchored at the tip).
const guessIcon =
  typeof window !== "undefined"
    ? L.divIcon({
        className: "",
        html: `
          <div class="marker-pin-wrap">
            <svg width="30" height="40" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z"
                    fill="#f5c842" stroke="#ffffff" stroke-width="2"/>
              <circle cx="12" cy="12" r="4.5" fill="#111318"/>
            </svg>
          </div>`,
        iconSize: [30, 40],
        iconAnchor: [15, 40],
      })
    : undefined;

// Correct location: a glowing, pulsing target (anchored at its center).
const actualIcon =
  typeof window !== "undefined"
    ? L.divIcon({
        className: "",
        html: `
          <div class="marker-target">
            <span class="marker-target__pulse"></span>
            <span class="marker-target__ring"></span>
            <span class="marker-target__core"></span>
          </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      })
    : undefined;

// ── Geodesic-style arc (quadratic Bézier bowed perpendicular to the chord) ────
// Simulates the curvature of the earth without a heavy plugin dependency.
function arcPositions(a: LatLng, b: LatLng, segments = 64): [number, number][] {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  // Control point: midpoint pushed along the perpendicular (-dy, dx).
  const curvature = 0.18; // fraction of the chord length
  const mx = (a.lng + b.lng) / 2;
  const my = (a.lat + b.lat) / 2;
  const cx = mx + (-dy / dist) * dist * curvature;
  const cy = my + (dx / dist) * dist * curvature;

  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    const lng = u * u * a.lng + 2 * u * t * cx + t * t * b.lng;
    const lat = u * u * a.lat + 2 * u * t * cy + t * t * b.lat;
    pts.push([lat, lng]);
  }
  return pts;
}

function GeodesicArc({ from, to }: { from: LatLng; to: LatLng }) {
  const positions = useMemo(() => arcPositions(from, to), [from, to]);
  return (
    <>
      {/* Soft underglow */}
      <Polyline
        positions={positions}
        pathOptions={{ color: "#f5c842", weight: 9, opacity: 0.16, lineCap: "round", className: "result-arc-glow" }}
      />
      {/* Animated flowing line */}
      <Polyline
        positions={positions}
        pathOptions={{ color: "#f5c842", weight: 3, opacity: 0.95, lineCap: "round", className: "result-arc" }}
      />
    </>
  );
}

function MapClickHandler({
  onPlaceMarker,
  disabled,
}: {
  onPlaceMarker: (c: LatLng) => void;
  disabled: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!disabled) onPlaceMarker({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FitBounds({
  guess,
  actual,
  active,
  recenterSignal,
}: {
  guess: LatLng | null;
  actual?: LatLng | null;
  active: boolean;
  recenterSignal: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (active && guess && actual) {
      // Fit to the full arc so its apex never clips off-screen.
      const bounds = L.latLngBounds(arcPositions(guess, actual));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10, animate: true, duration: 1.2 });
    } else if (!active) {
      map.setView([20, 0], 2);
    }
    // recenterSignal is a dep so the compass control can re-trigger the fit.
  }, [active, guess, actual, map, recenterSignal]);
  return null;
}

export default function GuessMapInner({
  guessCoords,
  onPlaceMarker,
  actualCoords,
  showResults = false,
  recenterSignal = 0,
}: GuessMapInnerProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={1}
      zoomControl={false}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* On the results screen the left info panel hugs the top-left, so keep the
          zoom control on the right edge, clear of the panel. */}
      <ZoomControl position={showResults ? "topright" : "topleft"} />

      <MapClickHandler onPlaceMarker={onPlaceMarker} disabled={showResults} />

      {guessCoords && (
        <Marker position={[guessCoords.lat, guessCoords.lng]} icon={guessIcon} />
      )}

      {showResults && actualCoords && (
        <>
          {guessCoords && <GeodesicArc from={guessCoords} to={actualCoords} />}
          <Marker position={[actualCoords.lat, actualCoords.lng]} icon={actualIcon} />
        </>
      )}

      <FitBounds guess={guessCoords} actual={actualCoords} active={showResults} recenterSignal={recenterSignal} />
    </MapContainer>
  );
}
