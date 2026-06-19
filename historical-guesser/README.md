# Historical Guesser

A GeoGuessr-style web game using 360° equirectangular panoramas, where you guess
both the **location** (on a map) and the **year** (on a timeline).

## Tech stack

- **React** (via Vite)
- **Leaflet** + **react-leaflet** for the guessing map
- Plain CSS for the panorama viewer (no 3D dependency)

## Getting started

```bash
cd historical-guesser
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

## Adding your panoramas

1. Drop your generated 360° JPEGs into `public/assets/images/`.
2. Add a matching entry to `src/data/dataset.json`:

```json
{
  "id": "loc-004",
  "title": "Place name",
  "image": "/assets/images/loc-004.jpg",
  "lat": 48.8584,
  "lng": 2.2945,
  "year": 1889,
  "yearRange": { "min": 1800, "max": 2000 },
  "description": "Optional context shown after the round.",
  "credit": "Optional attribution."
}
```

| Field       | Type   | Notes                                                       |
| ----------- | ------ | ----------------------------------------------------------- |
| `id`        | string | Unique key.                                                 |
| `title`     | string | Shown on the scoreboard.                                    |
| `image`     | string | Path under `public/` (served at site root).                 |
| `lat`/`lng` | number | True location, used for the Haversine distance score.       |
| `year`      | number | True year (negative = BCE).                                 |
| `yearRange` | object | `{ min, max }` bounds for the timeline slider (optional).   |

## Project structure

```text
historical-guesser/
├── public/assets/images/      # your generated 360 JPEGs
├── src/
│   ├── components/
│   │   ├── PanoramaViewer.jsx  # 360 image rendering (drag to pan)
│   │   ├── GuessMap.jsx        # Leaflet map for location guessing
│   │   ├── TimelineSlider.jsx  # slider for the year guess
│   │   └── ScoreBoard.jsx      # Haversine distance + year delta scoring
│   ├── data/dataset.json       # the location database
│   ├── App.jsx                 # main game loop
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Upgrading the viewer to a true 360 sphere

`PanoramaViewer.jsx` currently pans the equirectangular image with CSS so the
skeleton runs with zero extra dependencies. For real spherical projection, swap
the inner element for a Three.js scene (texture on the inside of a `SphereGeometry`)
or a library such as [`@photo-sphere-viewer/core`](https://photo-sphere-viewer.js.org/)
or [`pannellum`](https://pannellum.org/).
