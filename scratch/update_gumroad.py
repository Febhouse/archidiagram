
import os
import re

blog_dir = r"E:\2026_NAMNH\WEBSITE\ARCHIDIAGRAM_V3\apps\archidiagram\src\content\blog"

instruction = """

On Gumroad, simply enter **$0** in the "Name a fair price" box to download for free.  
(No bank or card information required.)

If you want to support me, you can enter any amount you wish. Thank you!"""

updated_count = 0

for filename in os.listdir(blog_dir):
    if not filename.endswith(".md"):
        continue
    filepath = os.path.join(blog_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "gumroad.com" in content and "Name a fair price" not in content:
        # Add instruction after the gumroad link
        # Find the last occurrence of Gumroad link or just append after it
        # Sometimes there are multiple links, but we just need one instruction
        pattern = re.compile(r"(\[.*?GUMROAD.*?\]\(https?://[^\)]*gumroad\.com[^\)]*\))", re.IGNORECASE)
        # We just want to replace the first occurrence or all? Replacing all is fine if there is only 1.
        # Actually it is better to just append it after the FIRST gumroad link.
        
        match = pattern.search(content)
        if match:
            new_content = content[:match.end()] + instruction + content[match.end():]
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {filename}")
            updated_count += 1

print(f"Total updated: {updated_count}")

