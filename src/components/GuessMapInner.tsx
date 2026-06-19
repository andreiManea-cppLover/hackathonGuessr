"use client";

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";

interface GuessMapInnerProps {
  guessCoords: { lat: number; lng: number } | null;
  onPlaceMarker: (coords: { lat: number; lng: number }) => void;
  actualCoords?: { lat: number; lng: number } | null;
  showResults?: boolean;
}

const guessIcon =
  typeof window !== "undefined"
    ? L.divIcon({
        className: "",
        html: `<div class="marker-guess"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })
    : undefined;

const actualIcon =
  typeof window !== "undefined"
    ? L.divIcon({
        className: "",
        html: `<div class="marker-actual"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })
    : undefined;

function MapClickHandler({
  onPlaceMarker,
  disabled,
}: {
  onPlaceMarker: (c: { lat: number; lng: number }) => void;
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
}: {
  guess: { lat: number; lng: number } | null;
  actual?: { lat: number; lng: number } | null;
  active: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (active && guess && actual) {
      map.fitBounds(
        [[guess.lat, guess.lng], [actual.lat, actual.lng]],
        { padding: [40, 40], maxZoom: 10, animate: true, duration: 1.2 }
      );
    } else if (!active) {
      map.setView([20, 0], 2);
    }
  }, [active, guess, actual, map]);
  return null;
}

export default function GuessMapInner({
  guessCoords,
  onPlaceMarker,
  actualCoords,
  showResults = false,
}: GuessMapInnerProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={1}
      zoomControl={true}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapClickHandler onPlaceMarker={onPlaceMarker} disabled={showResults} />

      {guessCoords && (
        <Marker position={[guessCoords.lat, guessCoords.lng]} icon={guessIcon} />
      )}

      {showResults && actualCoords && (
        <>
          <Marker position={[actualCoords.lat, actualCoords.lng]} icon={actualIcon} />
          {guessCoords && (
            <Polyline
              positions={[
                [guessCoords.lat, guessCoords.lng],
                [actualCoords.lat, actualCoords.lng],
              ]}
              pathOptions={{ color: "#f5c842", weight: 2, dashArray: "6 8", opacity: 0.85 }}
            />
          )}
        </>
      )}

      <FitBounds guess={guessCoords} actual={actualCoords} active={showResults} />
    </MapContainer>
  );
}
