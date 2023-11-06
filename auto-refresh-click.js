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

  // Navigate to the website
  await page.goto('https://platform.verbit.co/');

  const username = await page.waitForSelector('form > div.sc-bkkeKt.hlZVeT > div.sc-jrQzAO.cCmSqm > input');
  await username.type('johnsonterry16541@gmail.com');
  const next = await page.waitForSelector('form > button');
  await next.click();
 
  // Auto-refresh the page every 3 seconds (adjust the time interval as needed)
  // setInterval(async () => {
  //   await page.reload();
  // }, 3000);

  // Close the browser after some time (adjust the time interval as needed)
//   setTimeout(async () => {
//     await browser.close();
//   }, 43200000); // Close the browser after 12 hours
})();