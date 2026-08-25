---
name: UI Styling & Alignment Rules
description: Guidelines for styling image frames, borders, and paddings in Astro components.
---
# UI Styling & Alignment Rules

When building or updating UI sections (such as features, services, or about pages) that contain images or iframes:
1. **Consistent Image Framing**: Use a thin, unified frame layout for image/video containers similar to the landing page. Wrap the asset in a container with classes like `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] p-[10px] shadow-sm`.
   - *Exception*: If the image is already inside a larger card or section frame (like an ecosystem grid), DO NOT wrap it in a second inner frame to avoid the "double frame" look.
2. **Avoid Thick Paddings**: Do not use excessively large paddings (e.g., `p-8` or `p-12`) directly around image containers. Keep the frame tight with `p-[10px]`.
3. **Asset Styling**: Inside the frame, apply `rounded-[8px] shadow-none border-none` to the actual `<img>` or `<iframe>` elements to ensure they fit seamlessly within the frame without double borders.
