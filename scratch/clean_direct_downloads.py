import os
import glob
import re

blog_dir = r"e:\2026_NAMNH\WEBSITE\ARCHIDIAGRAM_V3\apps\archidiagram\src\content\blog"

for filepath in glob.glob(os.path.join(blog_dir, "*.md")):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_content = content
    
    # 1. Replace the note about Direct Download + Gumroad/Ko-fi
    content = re.sub(
        r"> \*💡 \*\*Note:\*\* You can use the \*\*Direct Download\*\* for instant, hassle-free access\..*?\*",
        r"> *💡 **Note:** You can download the file for free via Gumroad. If you find these resources helpful and would like to support my work, you can enter $0 or leave a small tip during checkout.*",
        content,
        flags=re.DOTALL
    )
    
    # Also handle the shorter one (just Direct Download)
    content = re.sub(
        r"> \*💡 \*\*Note:\*\* You can use the \*\*Direct Download\*\* for instant, hassle-free access\.\*",
        r"> *💡 **Note:** You can download the file for free via Gumroad. If you find these resources helpful and would like to support my work, you can enter $0 or leave a small tip during checkout.*",
        content,
        flags=re.DOTALL
    )
    
    # 2. Delete any [ DIRECT DOWNLOAD ](...) lines entirely
    content = re.sub(
        r"\[\s*DIRECT DOWNLOAD\s*\].*?\n",
        "",
        content,
        flags=re.IGNORECASE
    )
    
    if content != original_content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Cleaned Direct Download in: {os.path.basename(filepath)}")
