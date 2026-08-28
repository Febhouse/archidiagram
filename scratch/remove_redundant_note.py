import os
import glob

blog_dir = r"e:\2026_NAMNH\WEBSITE\ARCHIDIAGRAM_V3\apps\archidiagram\src\content\blog"

redundant_note = "> *💡 **Note:** You can download the file for free via Gumroad. If you find these resources helpful and would like to support my work, you can enter $0 or leave a small tip during checkout.*\n\n"

for filepath in glob.glob(os.path.join(blog_dir, "*.md")):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_content = content
    
    content = content.replace(redundant_note, "")
    # Also handle without trailing newlines just in case
    content = content.replace(redundant_note.strip(), "")
    
    if content != original_content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Removed redundant Note from: {os.path.basename(filepath)}")
