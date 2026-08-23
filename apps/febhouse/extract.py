import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('demo_source.html', encoding='utf-8') as f:
    html = f.read()

print('\n--- BUTTON ---')
btns = re.findall(r'<button[^>]*id="global-ai-floating-btn"[^>]*>.*?</button>', html, re.IGNORECASE | re.DOTALL)
print('\n'.join(btns))

print('\n--- WINDOW ---')
win = re.search(r'<div[^>]*id="main-ai-chat-window"[^>]*>.*?(?=</script>|$)', html, re.IGNORECASE | re.DOTALL)
if win:
    # Just grab the outer HTML roughly up to iframe end, this is minified.
    m = re.search(r'<div[^>]*id="main-ai-chat-window"[^>]*>.*?</iframe>\s*</div>\s*</div>', html, re.IGNORECASE | re.DOTALL)
    print(m.group(0) if m else 'Window found but regex failed')
else:
    print('No win')
