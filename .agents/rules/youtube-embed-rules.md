---
name: YouTube Links & Embed Rules
description: Guidelines for handling YouTube links to improve UX and avoid pre-roll ads on landing pages.
---
# YouTube Links & Embed Rules

When adding links to YouTube videos (e.g., "See How It Works" buttons) on landing pages or UI components, follow these best practices to maximize user retention and improve UX:

1. **Use Modals for Playback**: Do not redirect users away from the landing page to `youtube.com` or `youtu.be`. Instead, intercept the click and open the video in an embedded Modal/Lightbox on the same page.
2. **Prevent Ads (Autoplay & Rel)**: When constructing the iframe embed URL for the Modal, always use the format `https://www.youtube.com/embed/VIDEO_ID?autoplay=1&rel=0`.
   - `autoplay=1`: Ensures the video starts playing immediately when the modal opens.
   - `rel=0`: Ensures that when the video finishes, YouTube only suggests related videos from the same channel, preventing competitors' videos or irrelevant content from showing up.
   - This embed approach significantly reduces the chance of users seeing intrusive pre-roll ads compared to direct navigation.
3. **Parse Timestamps**: If the original link contains a timestamp parameter (e.g., `?t=20`), parse it and append it to the embed URL as `&start=20`.
4. **Modal UI/UX**: Ensure the modal close button is highly visible. Use a dark, semi-transparent background with a clear white icon (e.g., `bg-slate-900/50 hover:bg-slate-900 text-white/90 rounded-full border border-white/10`) to prevent it from blending into global button styles or appearing as a blank white box.
