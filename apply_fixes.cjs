const fs = require('fs');
const path = 'e:/2026_NAMNH/WEBSITE/ARCHIDIAGRAM_V3/apps/archidiagram-app/src/components/Studio.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
  "import { getDayOfYear } from './SunLight'",
  "import { getDayOfYear } from './SunLight'\nimport AuthModal from './AuthModal'\nimport { supabase } from '../lib/supabase'"
);

// 2. Add state & user selector
content = content.replace(
  "exportWidth, exportHeight, setExportResolution, hudScale\n  } = useEditorStore()",
  "exportWidth, exportHeight, setExportResolution, hudScale,\n    user, isPro, setUser\n  } = useEditorStore()"
);

content = content.replace(
  "const [showGlobalMenu, setShowGlobalMenu] = useState(false)",
  "const [showGlobalMenu, setShowGlobalMenu] = useState(false)\n  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)"
);

// 3. Wrap root in <> and add AuthModal
content = content.replace(
  "  return (\n    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', width: '100vw', height: '100dvh', overflow: 'hidden', fontFamily: '\"Quicksand\", sans-serif', background: bgMain, color: textMain }}>",
  "  return (\n    <>\n      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />\n      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', width: '100vw', height: '100dvh', overflow: 'hidden', fontFamily: '\"Quicksand\", sans-serif', background: bgMain, color: textMain }}>"
);

// 4. Sign in button replacement
content = content.replace(
  `            <button \n              onClick={() => alert('Login functionality coming soon!')}\n              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}\n            >\n              Sign In\n            </button>`,
  `            {user ? (\n              <button \n                onClick={async () => {\n                  await supabase.auth.signOut()\n                  setUser(null)\n                }}\n                style={{ background: 'transparent', color: textMain, border: \`1px solid \${borderCol}\`, borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', transition: '0.2s' }}\n              >\n                Sign Out ({user.email?.split('@')[0]})\n              </button>\n            ) : (\n              <button \n                onClick={() => setIsAuthModalOpen(true)}\n                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}\n              >\n                Sign In\n              </button>\n            )}`
);

// 5. Replace alerts
content = content.replace(
  "onClick={() => alert('Upgrade to Pro to unlock this feature!')}>PRO</span>",
  "onClick={() => setIsAuthModalOpen(true)}>PRO</span>"
);

content = content.replace(
  "alert('Importing custom 3D models is a Pro feature! Login and subscription functionality coming soon.');",
  "setIsAuthModalOpen(true);"
);

content = content.replace(
  "onClick={() => alert('Customizing Date and Time for this month is a Pro feature! Login and subscription coming soon.')}",
  "onClick={() => setIsAuthModalOpen(true)}"
);

content = content.replace(
  "onClick={() => alert('Customizing Object Colors is a Pro feature! Login and subscription coming soon.')}",
  "onClick={() => setIsAuthModalOpen(true)}"
);

content = content.replace(
  "onClick={() => alert('Customizing Month Colors is a Pro feature! Login and subscription coming soon.')}",
  "onClick={() => setIsAuthModalOpen(true)}"
);

content = content.replace(
  "alert('Video export is a Pro feature! Login and subscription functionality coming soon.');",
  "setIsAuthModalOpen(true);"
);

// 6. LibraryItem onProClick
content = content.replace(
  "onReplace={(name) => {\n                          if (selectedIds.length > 0) replaceObjectUrl(selectedIds, getModelUrl(name))\n                        }}",
  "onReplace={(name) => {\n                          if (selectedIds.length > 0) replaceObjectUrl(selectedIds, getModelUrl(name))\n                        }}\n                        onProClick={() => setIsAuthModalOpen(true)}"
);

// 7. Fix ending tags
content = content.replace(
  "        </div>\n\n      </div>\n    </div>\n  )\n}",
  "        </div>\n\n      </div>\n    </div>\n    </>\n  )\n}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done replacement script');
