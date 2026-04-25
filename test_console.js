const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    page.on('requestfailed', request => console.log('REQ FAIL:', request.url(), request.failure().errorText));

    await page.goto('http://localhost:3000');
    // wait a bit for shader
    await new Promise(r => setTimeout(r, 2000));
    
    await browser.close();
})();
