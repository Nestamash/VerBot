const puppeteer = require('puppeteer-extra');

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// normal Puppeteer usage
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
  await username.type('johnsonterry16541@gmail.com'); //Nestanie123@
  const next = await page.waitForSelector('form > button');
  await next.click();

 // wait for loading to finish 
  await page.setDefaultNavigationTimeout(0);
  await page.waitForNavigation({ waitUntil: 'load' });
  
    // const requestLimit = await page.waitForSelector('div.request-limit.col-md-6.col-md-offset-3 > div > div.request-limit__title');

    if(page.url() === 'https://platform.verbit.co/'){
      console.log("successfull:" ,page.url())
      setInterval(async () => {
        await page.reload();
      }, 2000);

    }else {
      console.log("failed-limit:" ,page.url())
    setInterval(async () => {
        await page.reload();
      }, 120000);
    }
  

  //Close the browser after some time (adjust the time interval as needed)
  setTimeout(async () => {
    await browser.close();
  }, 43200000); // Close the browser after 12 hours
})();