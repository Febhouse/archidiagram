import os
import glob
import re

blog_dir = r"e:\2026_NAMNH\WEBSITE\ARCHIDIAGRAM_V3\apps\archidiagram\src\content\blog"

instruction_text = """
*On Gumroad, simply enter **$0** in the "Name a fair price" box to download for free.*
*(No bank or card information required.)*
"""

for filepath in glob.glob(os.path.join(blog_dir, "*.md")):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_content = content
    
    if "[ DOWNLOAD VIA GUMROAD ]" in content or "[DOWNLOAD VIA GUMROAD ]" in content:
        # Remove Direct Download note
        content = re.sub(r"> \*💡 \*\*Note:\*\* You can use the \*\*Direct Download\*\* for instant, hassle-free access\.\*\n*", "", content)
        
        # Remove Direct Download link
        content = re.sub(r"\[\s*DIRECT DOWNLOAD\s*\]\([^\)]+\)\n*", "", content)
        
        # Add instruction after Gumroad link if not already present
        if "simply enter **$0**" not in content:
            # Find the Gumroad link and insert instructions after it
            # Match both [ DOWNLOAD VIA GUMROAD ] and [DOWNLOAD VIA GUMROAD ]
            content = re.sub(
                r"(\[\s*DOWNLOAD VIA GUMROAD\s*\]\([^\)]+\))",
                r"\1\n\n" + instruction_text.strip(),
                content
            )
            
    if content != original_content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")
