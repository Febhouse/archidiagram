const fs = require('fs');
const readline = require('readline');

async function recover() {
  const logPath = 'C:\\Users\\RD_NamNH\\.gemini\\antigravity-ide\\brain\\b6aaf380-3c06-4c04-ac77-87d02d73c799\\.system_generated\\logs\\transcript_full.jsonl';
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (const call of obj.tool_calls) {
          if (call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
            if (call.args && typeof call.args.TargetFile === 'string' && call.args.TargetFile.includes('Studio.tsx')) {
              if (call.name === 'replace_file_content') {
                if (call.args.ReplacementContent && call.args.ReplacementContent.includes('FILE')) {
                  console.log('>>> POTENTIAL FILE BUTTON (Single) <<<');
                  console.log(call.args.ReplacementContent);
                }
              } else if (call.args.ReplacementChunks) {
                call.args.ReplacementChunks.forEach((chunk) => {
                  if (chunk.ReplacementContent && (chunk.ReplacementContent.includes('FILE') || chunk.ReplacementContent.includes('showFileMenu'))) {
                    console.log('>>> POTENTIAL FILE BUTTON (Multi) <<<');
                    console.log(chunk.ReplacementContent);
                  }
                });
              }
            }
          }
        }
      }
    } catch (e) { }
  }
}

recover();
