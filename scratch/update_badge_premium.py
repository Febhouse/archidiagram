import os
import glob
import re

blog_dir = r"e:\2026_NAMNH\WEBSITE\ARCHIDIAGRAM_V3\apps\archidiagram\src\content\blog"

for filepath in glob.glob(os.path.join(blog_dir, "*.md")):
    filename = os.path.basename(filepath)
    
    if filename in ["2025-02-17-architectural-diagram-with-canva.md", "2025-03-01-motion-symbols-for-architectural-diagram.md"]:
        badge = "ONLY $5"
        
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Check if badge already exists
        if re.search(r"^badge:.*", content, re.MULTILINE):
            # Replace existing badge
            content = re.sub(r"^badge:.*", f"badge: '{badge}'", content, flags=re.MULTILINE)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            
            print(f"Updated badge to '{badge}' for {filename}")
