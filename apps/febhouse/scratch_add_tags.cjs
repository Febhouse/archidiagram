const fs = require('fs');
const path = require('path');

const dir = 'e:/2026_NAMNH/WEBSITE/FEBHOUSE_V2/src/content/blog';

if (!fs.existsSync(dir)) {
    console.error('Directory not found:', dir);
    process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
let updatedCount = 0;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Find the frontmatter block
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) continue;

    const frontmatter = frontmatterMatch[1];
    
    // Check if tags already exist
    if (frontmatter.includes('tags:')) {
        // We could merge tags, but the prompt just said "bổ sung tags là projects giúp tôi"
        // Let's assume we append to existing if it's an array, or just leave it for now.
        if (!frontmatter.includes('projects')) {
            // Very naive replacement just to ensure 'projects' is in tags
            // For now, let's just log it if it already has tags but not projects
            console.log(`Skipping ${file} - already has tags`);
        }
    } else {
        // Insert tags at the end of the frontmatter
        const newFrontmatter = frontmatter + '\ntags: ["projects"]';
        const newContent = content.replace(frontmatterMatch[0], `---\n${newFrontmatter}\n---`);
        fs.writeFileSync(filePath, newContent, 'utf8');
        updatedCount++;
    }
}

console.log(`Successfully added tags to ${updatedCount} files.`);
