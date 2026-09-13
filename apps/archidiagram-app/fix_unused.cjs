const fs = require('fs');

// Fix App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/const \{ data: \{ user \}, error \} = await supabase\.auth\.getUser\(\)/g, "const { data: { user } } = await supabase.auth.getUser()");
fs.writeFileSync('src/App.tsx', appContent, 'utf8');

// Fix Studio.tsx
let studioContent = fs.readFileSync('src/components/Studio.tsx', 'utf8');
studioContent = studioContent.replace(/import \{ isDstActive, getMonthColor \} from '.\/NativeSunpath'/g, "import { isDstActive } from './NativeSunpath'");
studioContent = studioContent.replace(/    user, isPro, setUser\r?\n/g, "    user, setUser\n");
studioContent = studioContent.replace(/  const \[showObjectColors, setShowObjectColors\] = useState\(true\)\r?\n/g, "");
studioContent = studioContent.replace(/  const \[showMonthColors, setShowMonthColors\] = useState\(true\)\r?\n/g, "");

fs.writeFileSync('src/components/Studio.tsx', studioContent, 'utf8');
console.log('Unused vars removed.');
