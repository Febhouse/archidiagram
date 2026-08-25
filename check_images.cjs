const fs = require('fs');
const path = require('path');

const publicDir = 'apps/archidiagram/public/images';
const srcDir = 'apps/archidiagram/src';

function getAllFiles(dir, ext) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(getAllFiles(file, ext));
        } else {
            if (!ext || file.endsWith(ext)) results.push(file);
        }
    });
    return results;
}

const jpgFiles = getAllFiles(publicDir, '.jpg').map(f => f.replace(/\\/g, '/'));
const sourceFiles = getAllFiles(srcDir, '');

let usedJpgs = new Set();
let sourceContents = sourceFiles.map(f => fs.readFileSync(f, 'utf8'));

jpgFiles.forEach(jpgPath => {
    // get relative path like /images/2026/04/SunDiagram-UserGuide-1.jpg
    const relPath = '/' + jpgPath.split('apps/archidiagram/public/')[1];
    const baseName = path.basename(jpgPath);
    
    let isUsed = false;
    for (const content of sourceContents) {
        if (content.includes(relPath) || content.includes(baseName)) {
            isUsed = true;
            break;
        }
    }
    if (isUsed) {
        usedJpgs.add(jpgPath);
    }
});

const unusedJpgs = jpgFiles.filter(f => !usedJpgs.has(f));

console.log('--- USED JPGs ---');
Array.from(usedJpgs).forEach(f => console.log(f));
console.log('\n--- UNUSED JPGs ---');
unusedJpgs.forEach(f => console.log(f));
