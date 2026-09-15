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
# Archidiagram App - Core Features & Workflow

When maintaining, refactoring, or upgrading `archidiagram-app` (specifically components like `Studio.tsx` and `useEditorStore.ts`), you MUST strictly preserve the following 5-step workflow and its corresponding UI features. Do not remove, rename, or accidentally disable any of these capabilities.

## The 5-Step Visualization Workflow (SOP)

### Step 1: Location & Context
- **Coordinates Input:** Users must be able to input Latitude/Longitude or paste an address.
- **Diagram Radius:** A slider to adjust the working area radius (in meters or feet).
- **Context Map:** A toggle to display the Mapbox Satellite map. Must include Opacity and Zoom controls.
- **Distance Rings:** A toggle to display distance measurement rings radiating from the center.

### Step 2: Import (3D Models & Shapes)
- **Add Basic Shapes:** Quick buttons to add primitive 3D shapes (e.g., Box) for massing.
- **Import Custom 3D:** A file input to upload custom 3D models (`.glb`, `.gltf`).

### Step 3: Sun Diagram (Solar Analysis)
- **3D Sun path Tab:**
  - `Scale Sun path`: Adjusts the overall size of the solar dome. **This must remain independent of the `Diagram Radius`.**
  - `True North (Offset North)`: A slider to rotate the compass to match the project's real-world orientation.
  - `Time Zone` & `DST`: Auto or manual settings for accurate solar calculation. The DST calculation uses a 0KB heuristic algorithm that must be preserved.
- **Shadow Tab:**
  - `Enable Environment Shadows`: Toggles shadow casting.
  - `Time of Day`: A slider to scrub through the day.
  - Month Selection: Checkboxes to select which months' sun paths are visible.
  - Sun color customization to highlight the `Current Sun`.
- **Style Tab:** Controls for path colors, line thickness, and `Global Text Size`.

### Step 4: Dynamic Symbols (Annotations)
- **Library:** A collection of architectural symbols (wind arrows, noise nodes, traffic, etc.) used to annotate environmental impacts.
- **Transform Tools:** Tools to Translate, Rotate, and Scale symbols.
- **Properties:** Color pickers, opacity sliders, and crucially, an `Enable Animation` checkbox with a Speed slider to make symbols move (e.g., wind blowing).
- **Multi-select:** Support for selecting multiple symbols to modify properties simultaneously. (e.g. `updateObjectProperties` handles batch updates).

### Step 5: Camera & Export
- **Save View:** A camera system allowing users to save and return to specific 3D perspectives.
- **UI Theme:** Light and Dark mode toggles.
- **Export Format:**
  - `PNG` / `PDF`: Single-frame high-resolution export for Photoshop/Canva.
  - `VIDEO`: Only when VIDEO format is selected, a `BATCH EXPORT SHADOWS` panel must appear. This panel allows users to configure the start/end hours for selected months to export a sequence of images/video.

## UI Label Conventions
The following domain-specific names are critical and must NOT be changed:
- **SUN DIAGRAM** and **DYNAMIC SYMBOLS** (These are core brand names from SketchUp).
- **Context Map** (Not Map Background).
- **Distance Rings** (Not Scale Rings).
- **True North (Offset North)**.
- **Time zone** & **Sunpath Scale**.

## Technical Decisions & Resolved Edge Cases

### State Persistence & Save Mechanisms
- **Zustand Persistence:** All user UI settings (e.g., `legendItems`, `showHUD`), map configurations (`mapRadius`, `showMapBackground`), and environment settings must be explicitly included in the `partialize` configuration of Zustand's `persist` middleware. Failure to do so will cause them to be lost upon page reloads (F5).
- **File Save (Local/Cloud):** The `useEditorStore` contains circular WebGL references (`glRenderer`, `glScene`, `glCamera`) and DOM/function references (`customAlert`, etc.). These MUST be omitted/destructured out from the `safeState` before calling `JSON.stringify()`. Attempting to stringify these will result in `Converting circular structure to JSON` crashes.
- **Security:** Save files (`.archi`) are purely JSON data. They are parsed using `JSON.parse()` without code execution. React's built-in XSS protection sanitizes any malicious strings rendered to the DOM, ensuring safe file sharing.

### UI & Rendering Logic
- **Batch Export UI:** The batch export panel must use Radio buttons for month selection (enforcing single-month iteration per export) and default to unselected. The `onChange` must be `onClick` to guarantee state updates, and export must be blocked if no month is selected.
- **HUD Notes (Legend) Icons:** Custom 3D files (`data:`/`blob:` URLs) and primitive shapes (`BOX`, `CYLINDER`, etc.) do not have `.png` thumbnails. In the Notes/Legend menu, they must be rendered using a generic 3D SVG icon instead of an `<img>` tag to prevent broken image links.
- **Context Map Scaling & Strict 1:1 Scale:** The `MapBackground` component MUST enforce a strict 1:1 physical scale for the satellite image. `mapPhysicalSize` must always be calculated as `mapSize * metersPerPixel` (where `metersPerPixel` is derived from the map's latitude and `mapZoom`). NEVER artificially stretch the map geometry to fit `mapRadius`, as this destroys real-world scaling and breaks measurement accuracy. To maximize coverage, request the maximum API size of `1280x1280`. If `mapRadius` exceeds `mapPhysicalSize / 2`, the map will appear cut off (as a square); the user must lower the Zoom Level to cover a larger physical area.
- **Symbol Replacement Inheritance:** When a user replaces an existing symbol with a new one from the library, the new object must inherit the previous object's `color` and `opacity` (via `materialOverrides`) to maintain visual continuity.
# Sunpath & HUD UI Design Rules

When developing or modifying the 3D Sun Path and HUD UI (e.g. `Studio.tsx`, `NativeSunpath.tsx`), strictly adhere to the following user preferences and design conventions:

1. **Sun Hour Formatting**: On the 3D sun path, the solar hour labels must be displayed purely as numbers (e.g., 8, 9, 10, 11, 12, 13) without any suffixes like "h" (e.g. 8h) or ":00". This minimizes visual clutter and aligns with professional architectural diagramming standards.
2. **HUD UTC & DST Display**: The Notes/HUD panel must clearly distinguish Local Time, UTC offsets, and DST states. The formatting must be:
   - `Time: [Local Time] (UTC[+/-Offset]) ([Auto/Manual])` -> e.g., `Time: 13:30 (UTC+7) (Auto)`
   - `DST: [On/Off] ([Auto/Manual])` -> e.g., `DST: Off (Auto)`
3. **Brand Naming**: The application signature should be `ARCHIDIAGRAM.COM` instead of long variations like "ARCHI DIAGRAM by Febhouse".
4. **DST Visual Simulation (The "Clock Adjust" Effect)**: When Daylight Saving Time (DST) is active, the system simulates humans advancing the clock by +1 hour. Mathematically, it does this by rendering the civil time `T` at the physical standard time position `T-1` (i.e. `standardTime = timeOfDay - 1`). Do not change this logic; it accurately ensures that the bead labeled "13" is drawn at the solar noon (apex) position, matching user expectations for DST visual feedback.
5. **Timezone Dropdown**: Manual timezone selection should use a detailed, Windows-style dropdown select (e.g., `(UTC+07:00) Bangkok, Hanoi, Jakarta`) rather than a simple numeric input.
