import os
import glob
import re

blog_dir = r"e:\2026_NAMNH\WEBSITE\ARCHIDIAGRAM_V3\apps\archidiagram\src\content\blog"

for filepath in glob.glob(os.path.join(blog_dir, "*.md")):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_content = content
    
    # Replace [ DOWNLOAD VIA GUMROAD ] or [DOWNLOAD VIA GUMROAD ] with [ FREE DOWNLOAD VIA GUMROAD ]
    content = re.sub(r"\[\s*DOWNLOAD VIA GUMROAD\s*\]", "[ FREE DOWNLOAD VIA GUMROAD ]", content, flags=re.IGNORECASE)
    
    if content != original_content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")
