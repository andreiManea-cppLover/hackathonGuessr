import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix the default marker icon paths when bundling with Vite.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function ClickHandler({ onPick, disabled }) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/**
 * GuessMap
 * A Leaflet world map. Clicking drops a guess marker.
 *
 * Props:
 *   - guess: { lat, lng } | null  -> the user's current guess
 *   - onPick: ({ lat, lng }) => void
 *   - disabled: boolean -> lock the map after a round is submitted
 */
export default function GuessMap({ guess, onPick, disabled = false }) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      worldCopyJump
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} disabled={disabled} />
      {guess && <Marker position={[guess.lat, guess.lng]} />}
    </MapContainer>
  );
}
