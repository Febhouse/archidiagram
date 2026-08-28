import os
import glob
import re

blog_dir = r"e:\2026_NAMNH\WEBSITE\ARCHIDIAGRAM_V3\apps\archidiagram\src\content\blog"

for filepath in glob.glob(os.path.join(blog_dir, "*.md")):
    filename = os.path.basename(filepath)
    
    # Determine the badge
    if filename in ["2025-02-17-architectural-diagram-with-canva.md", "2025-03-01-motion-symbols-for-architectural-diagram.md"]:
        badge = "$5 PREMIUM"
    elif filename in ["2026-08-22-shadow-slice.md", "2026-08-22-sun-diagram.md", "2025-02-16-presentation-a3.md", "2026-08-22-dynamic-symbols.md", "2026-08-22-custom-diagram-service.md"]:
        # Custom diagram service is not really free, let's skip or mark it accordingly. Actually, I don't know about custom diagram service. Let's just say FREE & PRO for the extensions.
        if "custom-diagram-service" in filename:
            badge = "SERVICE"
        else:
            badge = "FREE & PRO"
    else:
        badge = "FREE"

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check if badge already exists
    if re.search(r"^badge:.*", content, re.MULTILINE):
        # Replace existing badge
        content = re.sub(r"^badge:.*", f"badge: '{badge}'", content, flags=re.MULTILINE)
    else:
        # Insert badge before the closing ---
        content = re.sub(r"\n---\n", f"\nbadge: '{badge}'\n---\n", content, count=1)
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"Added badge '{badge}' to {filename}")
