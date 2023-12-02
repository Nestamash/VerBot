const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const fs = require('fs').promises;
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const FILE_PATH = 'clickedElements.json'; // File path to store clicked elements

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

  async function clearClickedElements() {
    try {
      await fs.writeFile(FILE_PATH, '[]', 'utf8');
      console.log('clickedElements.json cleared successfully.');
    } catch (error) {
      console.error('Error clearing clickedElements.json:', error.message);
    }
  }

  // Uncomment the following line if you want to clear the file before starting the script
      //  await clearClickedElements();

  // Navigate to the website
  await page.goto('https://platform.verbit.co/');

  const username = await page.waitForSelector('form > div.sc-bkkeKt.hlZVeT > div.sc-jrQzAO.cCmSqm > input');
  await username.type('Zacserle4@gmail.com');
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

  let clickedElements = [];

  async function reload() {
    console.log('Reload function called');
    // Load clicked elements from file or initialize an empty array
    
    try {
      const data = await fs.readFile(FILE_PATH, 'utf8');
      clickedElements = JSON.parse(data);
    } catch (error) {
      console.error('Error reading clicked elements from file:', error.message);
    }
    const currentUrl = await page.url();
  
    if (currentUrl === 'https://platform.verbit.co/') {
      console.log("Successfully reloaded:", currentUrl);
      await page.reload({ waitUntil: 'domcontentloaded' });
  
      // Ensure that the navigation is complete before attempting to interact with the element.
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
      const selector = 'td.column-status.text-left.col-sm-4.font-grey-mint.status.status-ready > a';
  
      // Retry mechanism for waiting for the elements
      const maxRetries = 5;
      let retries = 0;
      let transcriptionTasks;
  
      while (retries < maxRetries) {
        try {
          // Wait for the selector
          await page.waitForSelector(selector);
  
          // Get all matching elements
          transcriptionTasks = await page.$$(selector);
  
          if (transcriptionTasks && transcriptionTasks.length > 0) {
            break; // Break the loop if elements are found
          }
        } catch (error) {
          // console.error(`Error waiting for selector: ${error}`);
        }
  
        retries++;
        await page.waitForTimeout(5000); // Adjust the delay between retries
      }
  
      if (!transcriptionTasks || transcriptionTasks.length === 0) {
        // console.error('Failed to find elements after maximum retries or transcriptionTasks is undefined.');
        return;
      }

      console.log('Number of jobs found: ', transcriptionTasks.length)
      
     for (const taskId of transcriptionTasks){
  
        try {
          // Check if the element is still attached
          await taskId.evaluate(el => {
            if (!el || !el.isConnected) {
              throw new Error('Element is detached');
            }
          });
  
          // Check if the element has been clicked
          const href = await taskId.evaluate(el => el.getAttribute('href'));
           
          console.log('clicked element BEFORE:: ', clickedElements);
          
          if (!clickedElements.includes(href)) {
            // Now 'href' contains the value of the 'href' attribute of the clicked element
            console.log('Clicked element href:', href);
  
            // Click on the task.
            await Promise.all([
              taskId.click({ button: 'middle' }),
              page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
              // Add any other promises you need to wait for here
          ]);
  
            // Add the href to the array to mark it as clicked
            clickedElements.push(href);    

           // Save clicked elements to the file
          await fs.writeFile(FILE_PATH, JSON.stringify(clickedElements, null, 2), 'utf8');
          
            // Wait for navigation to complete
            await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  
            // Perform additional actions if needed (e.g., opening a new page)
            const newPage = await getNewBrowserTab(browser);
            await newPage.bringToFront();
  
            // Wait for the new page to load (adjust the waiting time as needed)
            await newPage.waitForNavigation({ waitUntil: 'domcontentloaded' });
  
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          // console.error(`Error interacting with element: ${error}`);
        }
      }
    } else {
      clearInterval(firstInterval);
      console.log("Reloading in 2 minutes...");
      await page.waitForTimeout(120000);
  
      const verbitLogo = await page.waitForSelector('header > div.logo > a > img');
      await verbitLogo.click();
  
      firstInterval = setInterval(reload, 6000);
    }
  }
  
  // Initialize the interval with the first call
 firstInterval = setInterval(reload, 6000);
  

  
 
  
  // Close the browser after some time (adjust the time interval as needed)
  setTimeout(async () => {
    await browser.close();
  }, 43200000); // Close the browser after 12 hours
})();