const puppeteer = require('puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[Browser ${type.toUpperCase()}] ${msg.text()}`);
    } else {
      console.log(`[Browser LOG] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    console.log(`[Browser PAGE_ERROR] ${err.message}`);
  });

  console.log("Navigating to http://localhost:5173/studio...");
  await page.goto('http://localhost:5173/studio', { waitUntil: 'networkidle2', timeout: 30000 });
  
  console.log("Waiting for UI to load...");
  await wait(2000);
  
  console.log("Clicking SunDiagram tab...");
  const tabs = await page.$$('img[src="/SunDiagram-logo.svg"]');
  if (tabs.length > 0) {
    await tabs[0].evaluate(el => el.parentElement.click());
    await wait(1000);
    
    console.log("Clicking + ADD NEW SUN PATH...");
    const buttons = await page.$$('button');
    let addBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('+ ADD NEW SUN PATH')) {
        addBtn = btn;
        break;
      }
    }
    if (addBtn) {
      await addBtn.click();
      console.log("Button clicked!");
      
      console.log("Moving mouse over canvas...");
      const canvas = await page.$('canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        console.log("Mouse moved to canvas center.");
        
        await wait(2000);
        
        console.log("Clicking canvas to place...");
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        console.log("Canvas clicked!");
      } else {
        console.log("Canvas not found!");
      }
    } else {
      console.log("Button not found!");
    }
  } else {
    console.log("SunDiagram tab not found!");
    const html = await page.content();
    console.log(html.substring(0, 1000));
  }
  
  await wait(3000);
  console.log("Closing browser...");
  await browser.close();
})();
