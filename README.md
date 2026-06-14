# Human Design 3D

An interactive 3D bodygraph explorer built with React, Three.js, and React Three Fiber.

## What this demonstrates

- **3D rendering with React Three Fiber** — energy centers are extruded 3D shapes (triangles, squares, rhombuses) with per-material color, opacity, and a particle effect on defined centers.
- **Dynamic chart loading** — paste a birth date/time/place to calculate a Human Design chart via a backend API; the bodygraph instantly updates to show defined/undefined centers, active gates, and colored channels (personality = conscious, design = unconscious).
- **Rich contextual tooltips** — every clickable element (centers, gates, channels, type/profile/authority badges) shows a description tooltip with Human Design meanings.
- **Vite + Tailwind CSS** for fast development and a dark, minimal UI.
- **Automatic GitHub Pages deployment** via a GitHub Actions workflow.

## Project layout

```
react-app/          Vite + React app
  src/
    components/
      bodygraph/    3D bodygraph mesh, energy centers, gates, channels
      Tooltip.tsx   Shared floating tooltip
      ChartBadges   Type / Profile / Authority cards
    store/          Zustand global state
    constants/      Colors
    data/           SVG reference overlay
.github/workflows/  deploy.yml — builds and publishes to GitHub Pages
```

## Running locally

```bash
cd react-app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Using the UI

| Area | What to do |
|---|---|
| **Bodygraph** | Click any energy center, gate, or channel to see its Human Design description |
| **Type / Profile / Authority** badges | Click any badge (bottom of screen) for a description of that trait |
| **Chart input** | Enter a birth date, time, and location in the left sidebar to load a real chart |
| **3D navigation** | Drag to orbit · scroll to zoom · right-drag to pan |
| **Auto-spin** | Toggle in the sidebar; adjust speed with the slider |
| **Reset view** | Press the reset button to return to the default camera position |

### Reading the colors

- **Teal / colored center** — defined (consistent energy in this area)
- **Dim center** — open/undefined (receptive to outside influence)
- **Bright gate sphere** — active gate in the loaded chart
- **Dim gate sphere** — inactive gate
- **Colored channel** — active channel; split color indicates personality (one side) vs. design (other side)
