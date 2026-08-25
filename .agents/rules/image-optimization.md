---
name: Image Optimization Rule
description: Ensure all JPG images are converted to WebP automatically.
---
# Image Optimization Rule

Whenever the user adds a new article, modifies a post, or adds new images in JPG/JPEG format to the project:
1. You MUST proactively offer to convert or automatically convert these `.jpg` or `.jpeg` files to the `.webp` format (with 80% quality) to optimize website performance.
2. Ensure that any HTML `<img>` tags or Markdown `![alt](image)` references you generate or update point to the `.webp` extension instead of `.jpg`.
3. If generating `<img>` tags for static public images, ensure `width`, `height`, `loading="lazy"`, and `decoding="async"` attributes are applied correctly to prevent Cumulative Layout Shifts (CLS). (Do not apply `loading="lazy"` if the image is above-the-fold/Hero image).
4. You can use a local script with the `sharp` NodeJS library to perform mass image conversions.
5. When performing mass string replacements for extensions (e.g. `.jpg` -> `.webp`), ensure you use proper regex boundaries to prevent double extensions (e.g. accidentally turning `.jpg.webp` into `.webp.webp`).
