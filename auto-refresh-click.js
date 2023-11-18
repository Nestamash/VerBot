const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--start-maximized'],
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });

  const page = await browser.newPage();
  const pages = await browser.pages();
  if (pages.length > 1) {
    await pages[0].close();
  }

  // Navigate to the website
  await page.goto('https://platform.verbit.co/');

  const username = await page.waitForSelector('form > div.sc-bkkeKt.hlZVeT > div.sc-jrQzAO.cCmSqm > input');
  await username.type('janellporter.125@gmail.com');
  const next = await page.waitForSelector('form > button');
  await next.click();

  // Wait for loading to finish
  await page.setDefaultNavigationTimeout(0);
  await page.waitForNavigation({ waitUntil: 'load' });

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
      await page.reload({ waitUntil: 'domcontentloaded' });
  
      // ensure that the navigation is complete before attempting to interact with the element.
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
      const xpathSelector = '//div/span[@class="filename css_ellipsis-part2"]';
  
      // Retry mechanism for waiting for the elements
      const maxRetries = 5;
      let retries = 0;
      let transcriptionTasks;
  
      while (retries < maxRetries) {
        try {
          // Wait for XPath
          await page.waitForXPath(xpathSelector, { timeout: 120000 });
  
          // Get all matching elements
          transcriptionTasks = await page.$x(xpathSelector);
  
          if (transcriptionTasks && transcriptionTasks.length > 0) {
            break; // Break the loop if elements are found
          }
        } catch (error) {
          console.error(`Error while waiting for XPath: ${error}`);
        }
  
        retries++;
        await page.waitForTimeout(5000); // Adjust the delay between retries
      }
  
      if (!transcriptionTasks || transcriptionTasks.length === 0) {
        console.error('Failed to find elements after maximum retries or transcriptionTasks is undefined.');
        return;
      }
  
      for (const taskId of transcriptionTasks) {
        // Check if the element has the data-clicked attribute
        const isClicked = await taskId.evaluate(el => el.getAttribute('data-clicked'));
  
        if (!isClicked) {
          // Click on the element
          await taskId.click({ button: 'middle' });
  
          // Mark the element as clicked by adding the data-clicked attribute
          await taskId.evaluate(el => el.setAttribute('data-clicked', 'true'));
  
          // Wait for navigation to complete
          await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  
          // Perform additional actions if needed (e.g., opening a new page)
          const newPage = await getNewBrowserTab(browser);
          await newPage.bringToFront();
  
          // Wait for the new page to load (adjust the waiting time as needed)
          await newPage.waitForNavigation({ waitUntil: 'domcontentloaded' });
  
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

  // Close the browser after some time (adjust the time interval as needed)
  setTimeout(async () => {
    await browser.close();
  }, 43200000); // Close the browser after 12 hours
})();
