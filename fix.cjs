const fs = require('fs');
const path = 'e:/2026_NAMNH/WEBSITE/ARCHIDIAGRAM_V3/apps/archidiagram-app/src/components/Studio.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "onClick={() => alert('Upgrade to Pro to unlock this feature!')}>PRO</span>setIsAuthModalOpen(true)}>PRO</span>",
  "onClick={() => setIsAuthModalOpen(true)}>PRO</span>"
);

content = content.replace(
  "alert('Importing custom 3D models is a Pro feature! Login and subscription functionality coming soon.');setIsAuthModalOpen(true);",
  "setIsAuthModalOpen(true);"
);

content = content.replace(
  "onClick={() => alert('Customizing Date and Time for this month is a Pro feature! Login and subscription coming soon.')}setIsAuthModalOpen(true)}",
  "onClick={() => setIsAuthModalOpen(true)}"
);

content = content.replace(
  "onClick={() => alert('Customizing Object Colors is a Pro feature! Login and subscription coming soon.')}setIsAuthModalOpen(true)}",
  "onClick={() => setIsAuthModalOpen(true)}"
);

content = content.replace(
  "onClick={() => alert('Customizing Month Colors is a Pro feature! Login and subscription coming soon.')}setIsAuthModalOpen(true)}",
  "onClick={() => setIsAuthModalOpen(true)}"
);

content = content.replace(
  "alert('Video export is a Pro feature! Login and subscription functionality coming soon.');setIsAuthModalOpen(true);",
  "setIsAuthModalOpen(true);"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
