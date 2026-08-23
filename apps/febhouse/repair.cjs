const fs = require('fs');
const path = require('path');

const blogDir = path.resolve('src/content/blog');
const publicImagesDir = path.resolve('public');

const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
let totalFixed = 0;

for (const file of files) {
    const filePath = path.join(blogDir, file);
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Find markdown image tags that are broken (missing closing parenthesis)
        // A broken image tag will look like: ![alt text](/images/2023/05/filename
        const imgMatch = line.match(/!\[.*?\]\(\/images\/([^)]+)$/);
        
        if (imgMatch) {
            const brokenPath = imgMatch[1]; // e.g. "2023/05/20230525_BUILDING" or "2023/05/20221129_MIX_THUNGNAI_VG_DAYLIGHT_V1.jpg"
            
            // The brokenPath might already have .jpg but lost .webp, or lost .gif entirely.
            // We need to look up the actual file in public/images/
            const parsed = path.parse(brokenPath);
            const dirToSearch = path.join(publicImagesDir, 'images', parsed.dir);
            
            if (fs.existsSync(dirToSearch)) {
                const candidates = fs.readdirSync(dirToSearch).filter(f => f.startsWith(parsed.name));
                if (candidates.length > 0) {
                    // Try to find the closest match.
                    // If brokenPath was "file.jpg" but actual is "file.jpg.webp", candidates will have it.
                    let bestMatch = candidates[0];
                    // Prefer exactly what they had, or whatever is longest
                    for (const c of candidates) {
                        if (brokenPath.endsWith('.jpg') && c.endsWith('.jpg.webp')) {
                            bestMatch = c;
                        } else if (!brokenPath.includes('.') && (c.endsWith('.gif') || c.endsWith('.jpg') || c.endsWith('.png'))) {
                            bestMatch = c;
                        }
                    }
                    
                    const correctUrl = `/images/${parsed.dir}/${bestMatch}`;
                    // Replace the broken part with the correct URL + closing parenthesis
                    lines[i] = line.replace(/\/images\/[^)]+$/, correctUrl + ')');
                    modified = true;
                    
                    // Also we need to fix the NEXT line if it lost its first character!
                    // E.g. "## THE MAIN HIGHLIGHT" was "#### THE MAIN HIGHLIGHT". We lost a '#'
                    // Or "he bungalows" was "The bungalows". We lost a 'T'.
                    // Wait, this is tricky to guess. We lost exactly ONE character because ([A-Za-z0-9#\*_]) captured exactly one character.
                    // So we can just leave it as is if it's a heading (## instead of ### is fine),
                    // but for text it's missing a letter. Let's flag them to manually review, or we can just hope it's not too bad.
                    // Wait, we lost exactly ONE character. Is there a way to know what it was? No.
                    // Let's at least fix the image tags first.
                }
            }
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
        totalFixed++;
        console.log(`Fixed images in ${file}`);
    }
}
console.log(`Total files repaired: ${totalFixed}`);
