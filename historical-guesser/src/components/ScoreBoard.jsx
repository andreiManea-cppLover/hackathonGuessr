/**
 * ScoreBoard
 * Shows the result of a round: distance from the true location (Haversine)
 * and how far off the year guess was, plus a combined score.
 *
 * Props:
 *   - guess:  { lat, lng } | null
 *   - guessYear: number
 *   - actual: { lat, lng, year, title } -> the location's truth
 *   - onNext: () => void
 */
export default function ScoreBoard({ guess, guessYear, actual, onNext }) {
  if (!actual) return null;

  const distanceKm = guess
    ? haversineKm(guess.lat, guess.lng, actual.lat, actual.lng)
    : null;
  const yearDelta = Math.abs(guessYear - actual.year);

  const distanceScore = guess ? distanceToScore(distanceKm) : 0;
  const yearScore = yearToScore(yearDelta);
  const total = distanceScore + yearScore; // out of 10000

  return (
    <div style={{ padding: '1rem', lineHeight: 1.6 }}>
      <h2 style={{ marginTop: 0 }}>Round Result</h2>
      <p>
        <strong>{actual.title}</strong>
      </p>
      <p>
        Distance:{' '}
        {distanceKm == null
          ? 'no guess placed'
          : `${distanceKm.toFixed(1)} km`}{' '}
        — {distanceScore.toLocaleString()} pts
      </p>
      <p>
        Year off by: {yearDelta} years (you: {guessYear}, actual: {actual.year})
        — {yearScore.toLocaleString()} pts
      </p>
      <p style={{ fontSize: '1.3rem' }}>
        <strong>Total: {total.toLocaleString()} / 10,000</strong>
      </p>
      <button onClick={onNext}>Next location →</button>
    </div>
  );
}

/**
 * Great-circle distance between two lat/lng points in kilometers.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// 5000 pts at 0 km, decaying with distance.
function distanceToScore(km) {
  return Math.round(5000 * Math.exp(-km / 2000));
}

// 5000 pts for an exact year, losing ~50 pts per year off.
function yearToScore(yearDelta) {
  return Math.max(0, Math.round(5000 - yearDelta * 50));
}
