import os
import glob

blog_dir = r"e:\2026_NAMNH\WEBSITE\ARCHIDIAGRAM_V3\apps\archidiagram\src\content\blog"

correct_text = "> *💡 **Note:** You can download the file for free via Gumroad. If you find these resources helpful and would like to support my work, you can enter $0 or leave a small tip during checkout.*"

bad_text_1 = correct_text + "**Gumroad** (where you can enter $0 or leave a small tip).*"
bad_text_2 = correct_text + "**Gumroad** or **Ko-fi** (where you can enter $0 or leave a small tip).*"
bad_text_3 = correct_text + "**Gumroad** (where you can enter $0 or leave a small tip).*"
bad_text_4 = "> *💡 **Note:** You can download the file for free via Gumroad. If you find these resources helpful and would like to support my work, you can enter $0 or leave a small tip during checkout.**" # just in case

for filepath in glob.glob(os.path.join(blog_dir, "*.md")):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_content = content
    
    content = content.replace(bad_text_1, correct_text)
    content = content.replace(bad_text_2, correct_text)
    
    # Catch any general mangled stuff that starts with the correct text and has extra garbage before the newline
    import re
    # We look for the correct text followed by anything up to the end of the line
    pattern = re.escape(correct_text) + r".*$"
    content = re.sub(pattern, correct_text, content, flags=re.MULTILINE)
    
    if content != original_content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed mangled Gumroad text in: {os.path.basename(filepath)}")
