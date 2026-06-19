import { useMemo, useState } from 'react';
import PanoramaViewer from './components/PanoramaViewer.jsx';
import GuessMap from './components/GuessMap.jsx';
import TimelineSlider from './components/TimelineSlider.jsx';
import ScoreBoard from './components/ScoreBoard.jsx';
import dataset from './data/dataset.json';

function pickRandom(locations, excludeId) {
  const pool = locations.filter((l) => l.id !== excludeId);
  const list = pool.length ? pool : locations;
  return list[Math.floor(Math.random() * list.length)];
}

export default function App() {
  const locations = dataset.locations;

  const [current, setCurrent] = useState(() => pickRandom(locations));
  const [guess, setGuess] = useState(null);
  const [guessYear, setGuessYear] = useState(1000);
  const [submitted, setSubmitted] = useState(false);

  // Year bounds come from the location if provided, else a sensible default.
  const yearBounds = useMemo(
    () => current?.yearRange ?? { min: -3000, max: new Date().getFullYear() },
    [current]
  );

  function handleSubmit() {
    if (!guess) return;
    setSubmitted(true);
  }

  function handleNext() {
    setCurrent((prev) => pickRandom(locations, prev?.id));
    setGuess(null);
    setGuessYear(1000);
    setSubmitted(false);
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 420px',
        gridTemplateRows: '1fr auto',
        height: '100vh',
      }}
    >
      {/* Panorama (top-left, spans both rows) */}
      <div style={{ gridRow: '1 / span 2', position: 'relative' }}>
        <PanoramaViewer src={current?.image} />
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(0,0,0,0.6)',
            padding: '0.4rem 0.8rem',
            borderRadius: 6,
          }}
        >
          Historical Guesser
        </div>
      </div>

      {/* Map (top-right) */}
      <div style={{ minHeight: 0 }}>
        <GuessMap guess={guess} onPick={setGuess} disabled={submitted} />
      </div>

      {/* Controls / result (bottom-right) */}
      <div style={{ background: '#222', borderTop: '1px solid #333' }}>
        {submitted ? (
          <ScoreBoard
            guess={guess}
            guessYear={guessYear}
            actual={current}
            onNext={handleNext}
          />
        ) : (
          <>
            <TimelineSlider
              value={guessYear}
              min={yearBounds.min}
              max={yearBounds.max}
              onChange={setGuessYear}
            />
            <div style={{ padding: '0 1rem 1rem' }}>
              <button
                onClick={handleSubmit}
                disabled={!guess}
                style={{ width: '100%' }}
              >
                {guess ? 'Submit guess' : 'Click the map to place a guess'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
