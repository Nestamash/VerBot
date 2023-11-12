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
        args: ['--start-maximized'], // you can also use '--start-fullscreen'
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      
        // executablePath: '/Users/Marsha/Desktop/GoogleChromePortable/GoogleChromePortable.exe',  // Replace with the path to your specific Chrome binary
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
    let firstInterval;

    async function reload() {
      const currentUrl = await page.url();
    
      if (currentUrl === 'https://platform.verbit.co/') {
        console.log("Successfully reloaded:", currentUrl);
        await page.reload();
        const taskId = await page.waitForSelector('');
        await taskId.click();
      } else {
        clearInterval(firstInterval);
        console.log("Reloading in 2 minutes...");
        await page.waitForTimeout(120000);

        const verbitLogo = await page.waitForSelector('header > div.logo > a > img');
        await verbitLogo.click();
    
        firstInterval = setInterval(reload, 2000);
      }
    }
    
    firstInterval = setInterval(reload, 2000);
  
  //Close the browser after some time (adjust the time interval as needed)
  setTimeout(async () => {
    await browser.close();
  }, 43200000); // Close the browser after 12 hours
})();