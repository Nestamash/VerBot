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

  const page = await browser.newPage();
    const pages = await browser.pages();
    if (pages.length > 1) {
        await pages[0].close();
    }

  // Navigate to the website
  await page.goto('https://platform.verbit.co/');

  const username = await page.waitForSelector('form > div.sc-bkkeKt.hlZVeT > div.sc-jrQzAO.cCmSqm > input');
  await username.type('janellporter.125@gmail.com'); //Nestanie123@
  const next = await page.waitForSelector('form > button');
  await next.click();

 // wait for loading to finish 
  await page.setDefaultNavigationTimeout(0);
  await page.waitForNavigation({ waitUntil: 'load' });
  
    // const requestLimit = await page.waitForSelector('div.request-limit.col-md-6.col-md-offset-3 > div > div.request-limit__title');  
    
    async function getNewBrowserTab(browser) {
      let resultPromise

      async function onTargetcreatedHandler(target) {
          if (target.type() === 'page') {
              const newPage = await target.page()
              const newPagePromise = new Promise(y =>
                  newPage.once('domcontentloaded', () => y(newPage))
              )

              const isPageLoaded = await newPage.evaluate(
                  () => document.readyState
              )

              browser.off('targetcreated', onTargetcreatedHandler) // unsubscribing

              return isPageLoaded.match('complete|interactive')
                  ? resultPromise(newPage)
                  : resultPromise(newPagePromise)
          }
      }

      return new Promise(resolve => {
          resultPromise = resolve
          browser.on('targetcreated', onTargetcreatedHandler)
      })
  }
    
    let firstInterval;

    async function reload() {
      const currentUrl = await page.url();
    
      if (currentUrl === 'https://platform.verbit.co/') {
        console.log("Successfully reloaded:", currentUrl);
        await page.reload();

        // ensure that the navigation is complete before attempting to interact with the element.
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        // await page.waitForSelector('div > span.filename.css_ellipsis-part2', { timeout: 60000 });

        console.log('Before waiting for selector');
const xpathSelector = '//div/span[@class="filename css_ellipsis-part2"]';

// Wait for the elements to be present
await page.waitForXPath(xpathSelector, { timeout: 120000 });
console.log('After waiting for selector');

// Get all matching elements
const transcriptionTasks = await page.$x(xpathSelector);

// Create a Set to keep track of clicked elements
const clickedElements = new Set();

for (const taskId of transcriptionTasks) {
    // Get the XPath of the current element
    const elementXPath = await page.evaluate(el => {
        const { xpath } = el;
        return xpath;
    }, taskId);

    // Check if the element has already been clicked
    if (!clickedElements.has(elementXPath)) {
        // Click on the element
        await taskId.click({ button: 'middle' });

        // Add the XPath to the set to mark it as clicked
        clickedElements.add(elementXPath);

        // Perform additional actions if needed (e.g., opening a new page)
        const newPage = await getNewBrowserTab(browser);
        await newPage.bringToFront();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

        
      } else {
        clearInterval(firstInterval);
        console.log("Reloading in 2 minutes...");
        await page.waitForTimeout(120000);

        const verbitLogo = await page.waitForSelector('header > div.logo > a > img');
        await verbitLogo.click();
    
        firstInterval = setInterval(reload, 4000);
      }
    }
    
    firstInterval = setInterval(reload, 4000);
  
  //Close the browser after some time (adjust the time interval as needed)
  setTimeout(async () => {
    await browser.close();
  }, 43200000); // Close the browser after 12 hours
})();