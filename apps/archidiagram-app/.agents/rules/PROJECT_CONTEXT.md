# Archi Diagram Project Context Summary

## Project Overview
**Archi Diagram** (by Febhouse) is a web-based 3D architectural diagramming tool built with React, Three.js (React Three Fiber), and Zustand. It allows users to create interactive Sun Paths (Shadow Analysis) and place 3D "Dynamic Symbols" into a scene.

## Core Architecture
- **State Management**: `zustand` (`src/store/useEditorStore.ts`). Handles global states like environment settings (latitude, longitude, time, theme), sunpath settings, and the array of 3D objects (`PlacedModel`).
- **UI Framework**: React (functional components).
- **3D Engine**: `@react-three/fiber` and `@react-three/drei`.

## Key Files & Responsibilities
- **`src/components/Studio.tsx`**: The main IDE layout. It contains the resizable Left Panel (sidebar) with H2 accordion sections (`Sun Diagram`, `Dynamic Symbols`, `Export`) and the Floating Top Toolbar (Transform tools, Global toggles, Theme/Background controls).
- **`src/components/Scene.tsx`**: The `<Canvas>` wrapper. It handles the rendering of the `Environment`, `Grid`, and iterates over `objects` to render `ModelLoader` or `NativeSunpath`.
- **`src/components/NativeSunpath.tsx`**: Renders the parametric 3D Sun Path. 
  - `monthlyArcsData`: Renders the thick paths with text for selected months (`visibleMonths`).
  - `skyDomeGeo`: Renders the dome surface and thin lines for the 21st of each representative month.
  - Generates the moving `currentSun` sphere.
- **`src/components/SunLight.tsx`**: Creates the actual Three.js `<directionalLight>` that casts shadows, matching the sun's position calculated in `NativeSunpath`.
- **`src/components/ModelLoader.tsx`**: Loads external `.glb` models (Dynamic Symbols) and wraps them in `<TransformControls>`. Intercepts rotation events for `SUNPATH` to update the global `northOffset`.

## Specific Logic & Rules
- **Sun Path Algorithm**: Uses a precise astronomical algorithm in `NativeSunpath.tsx` (`getSunPosition`, `calculateUtcOffset`, `isDstActive`) to calculate sun vectors based on Day of Year, Latitude, Longitude, and Time.
- **DST (Daylight Saving Time)**: Handled in `isDstActive` function which respects Northern/Southern hemispheres and can be forced `on`, `off`, or `auto`.
- **Theme (Light/Dark Mode)**: Controlled by `uiTheme` in `useEditorStore`. The HUD overlay inverts colors for readability. `bgMain` (Background color) falls back to white/dark gray if no custom color is set in `monthColors[17]`.
- **Color Mapping**: The `monthColors` object in the store is used as a generic palette. Keys 1-12 are months. `13` = Sun color, `14` = Text color, `15` = Compass color, `16` = Sky Dome color, `17` = Background color.
- **Dynamic Symbols Default**: New symbols placed from the library default to color `#233156` (RGB 35, 49, 86) and 0.7 opacity.

## Important Recent Changes
- Removed the Analemma (figure-8 curve) to declutter the chart.
- The `currentDateArc` is skipped if the `activeMonth` is already in `visibleMonths` to prevent overlapping/Z-fighting paths when adjusting custom days (e.g. Day 11).
- Sidebar width is now resizable (`resize: horizontal`, `minWidth: 340px`).
- The ARCHI DIAGRAM logo now uses `/images/LOGO/LOGO_FEBHOUSE1.svg` from the `public` directory.
- Theme controls (Light/Dark mode) and Background Color have been moved to the floating Top Toolbar.

*You can copy this entire document and provide it to the AI in your new chat session to restore full context.*
