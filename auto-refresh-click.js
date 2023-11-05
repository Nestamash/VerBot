const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch(
    {
        headless: false,
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation'], // remove the infobars
        args: ['--start-maximized'] // you can also use '--start-fullscreen'
        // executablePath: '/path/to/chrome-binary', // Replace with the path to your specific Chrome binary
    });
  // const page = await browser.newPage();
  const pages = await browser.pages();
  const page = pages[0]

  // Set the viewport to full-screen size
  // await page.setViewport({
  //   width: 1920, // Replace with your desired width
  //   height: 1080, // Replace with your desired height
  // });

  // Navigate to the website
  await page.goto('https://www.jumia.co.ke/');

  // Auto-refresh the page every 3 seconds (adjust the time interval as needed)
  setInterval(async () => {
    await page.reload();
  }, 3000);

  // Auto-click a button (replace with your specific HTML element selector)
  // await page.waitForSelector('#your-button-selector');
  // await page.click('#your-button-selector');

  // Close the browser after some time (adjust the time interval as needed)
//   setTimeout(async () => {
//     await browser.close();
//   }, 43200000); // Close the browser after 12 hours
})();