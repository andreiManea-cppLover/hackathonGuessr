/**
 * TimelineSlider
 * A slider for guessing the historical year of the panorama.
 *
 * Props:
 *   - value: number          -> current guessed year
 *   - min: number            -> earliest selectable year (negative = BCE)
 *   - max: number            -> latest selectable year
 *   - onChange: (year) => void
 *   - disabled: boolean
 */
export default function TimelineSlider({
  value,
  min = -3000,
  max = new Date().getFullYear(),
  onChange,
  disabled = false,
}) {
  const label = formatYear(value);

  return (
    <div style={{ padding: '0.75rem 1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.4rem',
          fontSize: '0.85rem',
          opacity: 0.8,
        }}
      >
        <span>{formatYear(min)}</span>
        <strong style={{ fontSize: '1.1rem', opacity: 1 }}>{label}</strong>
        <span>{formatYear(max)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

function formatYear(year) {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}
