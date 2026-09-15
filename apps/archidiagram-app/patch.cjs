const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'Studio.tsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Thay đổi text Aspect Ratio buttons (active state)
code = code.replace(
  `<button onClick={() => setExportResolution(exportWidth, exportWidth)} style={{ flex: 1, padding: '4px', fontSize: '0.75rem', background: inputBg, color: textMain, border: \`1px solid \${inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>1:1</button>`,
  `<button onClick={() => setExportResolution(exportWidth, exportWidth)} style={{ flex: 1, padding: '4px', fontSize: '0.75rem', background: (exportWidth === exportHeight) ? '#3b82f6' : inputBg, color: (exportWidth === exportHeight) ? '#fff' : textMain, border: \`1px solid \${(exportWidth === exportHeight) ? '#3b82f6' : inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>1:1</button>`
);
code = code.replace(
  `<button onClick={() => setExportResolution(exportWidth, Math.round(exportWidth * 9 / 16))} style={{ flex: 1, padding: '4px', fontSize: '0.75rem', background: inputBg, color: textMain, border: \`1px solid \${inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>16:9</button>`,
  `<button onClick={() => setExportResolution(exportWidth, Math.round(exportWidth * 9 / 16))} style={{ flex: 1, padding: '4px', fontSize: '0.75rem', background: (Math.abs((exportWidth / exportHeight) - (16/9)) < 0.01) ? '#3b82f6' : inputBg, color: (Math.abs((exportWidth / exportHeight) - (16/9)) < 0.01) ? '#fff' : textMain, border: \`1px solid \${(Math.abs((exportWidth / exportHeight) - (16/9)) < 0.01) ? '#3b82f6' : inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>16:9</button>`
);
code = code.replace(
  `<button onClick={() => setExportResolution(exportWidth, Math.round(exportWidth * 16 / 9))} style={{ flex: 1, padding: '4px', fontSize: '0.75rem', background: inputBg, color: textMain, border: \`1px solid \${inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>9:16</button>`,
  `<button onClick={() => setExportResolution(exportWidth, Math.round(exportWidth * 16 / 9))} style={{ flex: 1, padding: '4px', fontSize: '0.75rem', background: (Math.abs((exportWidth / exportHeight) - (9/16)) < 0.01) ? '#3b82f6' : inputBg, color: (Math.abs((exportWidth / exportHeight) - (9/16)) < 0.01) ? '#fff' : textMain, border: \`1px solid \${(Math.abs((exportWidth / exportHeight) - (9/16)) < 0.01) ? '#3b82f6' : inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>9:16</button>`
);

// 2. Thay đổi text Resolution buttons (active state)
code = code.replace(
  `<button onClick={() => setExportResolution(1920, 1080)} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: inputBg, color: textMain, border: \`1px solid \${inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>FHD</button>`,
  `<button onClick={() => setExportResolution(1920, 1080)} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: (exportWidth === 1920 && exportHeight === 1080) ? '#3b82f6' : inputBg, color: (exportWidth === 1920 && exportHeight === 1080) ? '#fff' : textMain, border: \`1px solid \${(exportWidth === 1920 && exportHeight === 1080) ? '#3b82f6' : inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>FHD</button>`
);
code = code.replace(
  `<button onClick={() => setExportResolution(2560, 1440)} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: inputBg, color: textMain, border: \`1px solid \${inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>2K</button>`,
  `<button onClick={() => setExportResolution(2560, 1440)} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: (exportWidth === 2560 && exportHeight === 1440) ? '#3b82f6' : inputBg, color: (exportWidth === 2560 && exportHeight === 1440) ? '#fff' : textMain, border: \`1px solid \${(exportWidth === 2560 && exportHeight === 1440) ? '#3b82f6' : inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>2K</button>`
);
code = code.replace(
  `<button onClick={() => setExportResolution(3200, 1800)} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: inputBg, color: textMain, border: \`1px solid \${inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>3K</button>`,
  `<button onClick={() => setExportResolution(3200, 1800)} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: (exportWidth === 3200 && exportHeight === 1800) ? '#3b82f6' : inputBg, color: (exportWidth === 3200 && exportHeight === 1800) ? '#fff' : textMain, border: \`1px solid \${(exportWidth === 3200 && exportHeight === 1800) ? '#3b82f6' : inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>3K</button>`
);
code = code.replace(
  `<button onClick={() => setExportResolution(3840, 2160)} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: inputBg, color: textMain, border: \`1px solid \${inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>4K</button>`,
  `<button onClick={() => setExportResolution(3840, 2160)} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: (exportWidth === 3840 && exportHeight === 2160) ? '#3b82f6' : inputBg, color: (exportWidth === 3840 && exportHeight === 2160) ? '#fff' : textMain, border: \`1px solid \${(exportWidth === 3840 && exportHeight === 2160) ? '#3b82f6' : inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>4K</button>`
);
code = code.replace(
  `<button onClick={() => setExportResolution(5120, 2880)} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: inputBg, color: textMain, border: \`1px solid \${inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>5K</button>`,
  `<button onClick={() => setExportResolution(5120, 2880)} style={{ flex: 1, padding: '4px', fontSize: '0.7rem', background: (exportWidth === 5120 && exportHeight === 2880) ? '#3b82f6' : inputBg, color: (exportWidth === 5120 && exportHeight === 2880) ? '#fff' : textMain, border: \`1px solid \${(exportWidth === 5120 && exportHeight === 2880) ? '#3b82f6' : inputBorder}\`, borderRadius: '4px', cursor: 'pointer' }}>5K</button>`
);

// 3. Xóa logic Zip ở PDF & Sửa thành tải 1 file
code = code.replace(
  `const JSZip = (await import('jszip')).default;\n                      const zip = new JSZip();`,
  ``
);
code = code.replace(
  /if \(monthPageCount > 0 && !isCancelled\) {[\s\S]*?zip\.file\(`Archidiagram_Shadows_\$\{monthNames\[m-1\]\}\.pdf`, doc\.output\('blob'\)\);\n\s*}/,
  `if (monthPageCount > 0 && !isCancelled) {
                            const blob = doc.output('blob');
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.style.display = 'none';
                            a.href = url;
                            a.download = \`Archidiagram_Shadows_\${monthNames[m-1]}.pdf\`;
                            a.target = '_blank';
                            document.body.appendChild(a);
                            a.click();
                            setTimeout(() => {
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }, 100);
                          }`
);
code = code.replace(
  /if \(!isCancelled\) {[\s\S]*?const zipBlob = await zip\.generateAsync\(\{ type: 'blob' \}\);[\s\S]*?URL\.revokeObjectURL\(url\);\n\s*}, 100\);\n\s*}/,
  ``
);

// 4. Xóa logic Zip ở VIDEO & Sửa thành tải 1 file
code = code.replace(
  `const JSZip = (await import('jszip')).default;\n                      const zip = new JSZip();`,
  ``
);
code = code.replace(
  `recorder.onstop = () => {
                            if (!isCancelled) {
                              const blob = new Blob(chunks, { type: mimeType });
                              zip.file(\`Archidiagram_Shadows_\${monthNames[m-1]}.\${mimeType === 'video/mp4' ? 'mp4' : 'webm'}\`, blob);
                            }
                            resolve();
                          };`,
  `recorder.onstop = () => {
                            if (!isCancelled) {
                              const blob = new Blob(chunks, { type: mimeType });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.style.display = 'none';
                              a.href = url;
                              a.download = \`Archidiagram_Shadows_\${monthNames[m-1]}.\${mimeType === 'video/mp4' ? 'mp4' : 'webm'}\`;
                              document.body.appendChild(a);
                              a.click();
                              setTimeout(() => {
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              }, 100);
                            }
                            resolve();
                          };`
);
code = code.replace(
  /if \(!isCancelled\) {[\s\S]*?const zipBlob = await zip\.generateAsync\(\{ type: 'blob' \}\);[\s\S]*?URL\.revokeObjectURL\(url\);\n\s*}, 100\);\n\s*}/,
  ``
);

// 5. Thêm Warning Text cho Video & PDF
code = code.replace(
  `<p style={{ fontSize: '0.85rem', color: textMuted, marginBottom: '20px' }}>\n                          Select months to export shadow study videos.\n                        </p>`,
  `<p style={{ fontSize: '0.85rem', color: textMuted, marginBottom: '20px' }}>\n                          Select months to export shadow study videos.<br/>\n                          <span style={{ color: '#ef4444' }}>Note: To avoid browser freezing or out-of-memory errors, please export one month at a time.</span>\n                        </p>`
);
code = code.replace(
  `{(exportFormat === 'VIDEO' || (exportFormat === 'PDF' && pdfExportMode === 'MULTI')) && (\n                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>`,
  `{(exportFormat === 'VIDEO' || (exportFormat === 'PDF' && pdfExportMode === 'MULTI')) && (\n                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>\n                        {exportFormat === 'PDF' && (\n                          <div style={{ fontSize: '0.8rem', color: '#ef4444', marginBottom: '5px' }}>\n                            Note: To avoid browser freezing or out-of-memory errors, please export one month at a time.\n                          </div>\n                        )}`
);

// 6. Bọc onClick Export để Resize CSS container to High Res
const tryBlockStart = `
                    const mainContainer = document.getElementById('studio-main-container');
                    const originalCss = mainContainer ? mainContainer.style.cssText : '';
                    if (mainContainer) {
                      const currentW = mainContainer.clientWidth;
                      const currentH = mainContainer.clientHeight;
                      const scale = Math.min(currentW / exportWidth, currentH / exportHeight);
                      mainContainer.style.cssText = \`position: fixed; top: 0; left: 0; width: \${exportWidth}px; height: \${exportHeight}px; transform: scale(\${scale}); transform-origin: top left; z-index: -9999; background: \${bgMain};\`;
                      await new Promise(r => setTimeout(r, 800)); // wait for resize
                    }
                    try {`;

const drawHudStr = `const drawHUDOnCanvas = (targetCtx: any) => {`;
code = code.replace(drawHudStr, tryBlockStart + '\n' + drawHudStr);

const finallyBlockEnd = `if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                      }
                      setEnvironment({ timeOfDay: originalTime, activeMonth: originalMonth });
                    }`;
const replaceFinally = `if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                      }
                      setEnvironment({ timeOfDay: originalTime, activeMonth: originalMonth });
                    }
                  } finally {
                    const mainContainer = document.getElementById('studio-main-container');
                    if (mainContainer) {
                      mainContainer.style.cssText = originalCss;
                    }
                  }`;
code = code.replace(finallyBlockEnd, replaceFinally);

fs.writeFileSync(file, code);
console.log("Patched successfully");
