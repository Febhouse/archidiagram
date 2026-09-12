# Sunpath & HUD UI Design Rules

When developing or modifying the 3D Sun Path and HUD UI (e.g. `Studio.tsx`, `NativeSunpath.tsx`), strictly adhere to the following user preferences and design conventions:

1. **Sun Hour Formatting**: On the 3D sun path, the solar hour labels must be displayed purely as numbers (e.g., 8, 9, 10, 11, 12, 13) without any suffixes like "h" (e.g. 8h) or ":00". This minimizes visual clutter and aligns with professional architectural diagramming standards.
2. **HUD UTC & DST Display**: The Notes/HUD panel must clearly distinguish Local Time, UTC offsets, and DST states. The formatting must be:
   - `Time: [Local Time] (UTC[+/-Offset]) ([Auto/Manual])` -> e.g., `Time: 13:30 (UTC+7) (Auto)`
   - `DST: [On/Off] ([Auto/Manual])` -> e.g., `DST: Off (Auto)`
3. **Brand Naming**: The application signature should be `ARCHIDIAGRAM.COM` instead of long variations like "ARCHI DIAGRAM by Febhouse".
4. **DST Visual Simulation (The "Clock Adjust" Effect)**: When Daylight Saving Time (DST) is active, the system simulates humans advancing the clock by +1 hour. Mathematically, it does this by rendering the civil time `T` at the physical standard time position `T-1` (i.e. `standardTime = timeOfDay - 1`). Do not change this logic; it accurately ensures that the bead labeled "13" is drawn at the solar noon (apex) position, matching user expectations for DST visual feedback.
5. **Timezone Dropdown**: Manual timezone selection should use a detailed, Windows-style dropdown select (e.g., `(UTC+07:00) Bangkok, Hanoi, Jakarta`) rather than a simple numeric input.
