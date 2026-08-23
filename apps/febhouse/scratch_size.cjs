const fs = require('fs');
const path = require('path');

const d = './public/images';
const imgFiles = fs.readdirSync(d, {recursive: true})
    .filter(f => /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(f))
    .map(f => {
        const fullPath = path.join(d, f);
        return {
            path: fullPath,
            name: path.basename(f),
            size: fs.statSync(fullPath).size
        };
    });

const src = './src';
const sf = fs.readdirSync(src, {recursive: true})
    .filter(f => /\.(astro|md|mdx|ts|tsx|json|css)$/i.test(f))
    .map(f => path.join(src, f));

const c = sf.map(x => fs.readFileSync(x, 'utf8')).join('\n');

const unused = imgFiles.filter(i => !c.includes(i.name));
const totalSize = unused.reduce((sum, i) => sum + i.size, 0);

console.log(`Unused files: ${unused.length}`);
console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

fs.writeFileSync('unused_media_list.txt', unused.map(i => i.path).join('\n'));
