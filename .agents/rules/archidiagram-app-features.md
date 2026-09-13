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
