const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const fs = require('fs').promises;

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const FILE_PATH = 'clickedElements.json'; // File path to store clicked elements
const verbitEmail = 'Zacserle4@gmail.com';
let clickedElements = new Set();
let firstInterval;

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        timeout: 0, // Set this to 0 to disable the timeout
        ignoreDefaultArgs: ['--enable-automation'],
        args: ['--start-maximized'],
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        protocolTimeout: 60000,
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
    // await clearClickedElements();

    // Navigate to the website
    await page.goto('https://platform.verbit.co/');

    const username = await page.waitForSelector('form > div.sc-bkkeKt.hlZVeT > div.sc-jrQzAO.cCmSqm > input');
    await username.type(verbitEmail);
    const next = await page.waitForSelector('form > button');
    await next.click();

    // Wait for loading to finish
    await page.setDefaultNavigationTimeout(0);
    await page.waitForNavigation({ waitUntil: 'load' });

    async function checkSelector(selector) {
        try {
            await page.waitForSelector(selector, { timeout: 60000 });
            return selector;
        } catch (error) {
            return null;
        }
    }

    let fileHandle; // Declare fileHandle outside the try-catch block
    let isLogoClicked = false;
    async function reload() {
        console.log('Reload function called'
        
        );

        try {
            fileHandle = await fs.open(FILE_PATH, 'r');
            const data = await fileHandle.readFile('utf8');
            clickedElements = new Set(JSON.parse(data));
        } catch (error) {
            console.error('Error reading clicked elements from file:', error.message);
        } finally {
            if (fileHandle) {
                fileHandle.close()
                .then(() => console.log('File handle closed successfully'))
                .catch(error => console.error('Error closing file handle:', error.message));
            }
        }

        const currentUrl = await page.url();

        if (currentUrl === 'https://platform.verbit.co/') {
            console.log("Successfully reloaded:", currentUrl);

            try {
                // Use a longer timeout for page reload (adjust as needed)
                await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });

                // Ensure that the navigation is complete before attempting to interact with the element.
                await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

                const selector1 = 'td.column-status.text-left.col-sm-4.font-grey-mint.status.status-ready > a';
                const selector2 = 'div.transcription-job-tables > div > div > div > h1';

                // Wait for either selector1 or selector2 to be found
                const foundSelector = await Promise.race([
                    checkSelector(selector1),
                    checkSelector(selector2),
                ]);

                if (foundSelector) {
                    // Perform actions based on the found selector
                    if (foundSelector === selector1) {
                        clearInterval(firstInterval);
                        console.log('Performing actions for selector1...');

                        // Get all matching elements
                        const taskElements = await page.$$(selector1);

                        // Execute click on them concurrently
                        await Promise.all(taskElements.map(async (taskId) => {
                            try {
                                // Check if the element is still attached
                                const isElementAttached = await taskId.evaluate(el => el && el.isConnected);

                                if (!isElementAttached) {
                                    throw new Error('Element is detached');
                                }

                                const href = await taskId.evaluate(el => el.getAttribute('href'));

                                // console.log('clickedElements BEFORE:: ', [...clickedElements]);

                                // Check if the element has been clicked
                                if (!clickedElements.has(href)) {
                                    // console.log('Trying to click href:', href);

                                    // Add the href to the Set to mark it as clicked
                                    clickedElements.add(href);

                                    // Click on the element
                                    await taskId.click({ button: 'middle' });

                                    // Wait for the click to potentially open a new tab
                                    // await page.waitForTimeout(200); // Adjust this timeout if needed

                                    // console.log('clickedElements AFTER:: ', [...clickedElements]);

                                    // Save clicked elements to the file
                                    await fs.writeFile(FILE_PATH, JSON.stringify([...clickedElements], null, 2), 'utf8');
                                } else {
                                    // console.log('Already clicked href:', href);
                                }
                            } catch (error) {
                                console.error(`Error interacting with element: ${error.message}`);
                                // Handle the error as needed, e.g., log it or take corrective action
                                if (error.message.includes('Execution context was destroyed')) {
                                    console.log('Execution context was destroyed, calling reload again...');
                                    // firstInterval = setInterval(reload, 6000);
                                } else {
                                    // If it's a different error, log it or handle it accordingly
                                    console.error(`Error interacting with element: ${error}`);
                                }
                            }
                        }));

                        // Continue with other actions (if any) after the loop
                        firstInterval = setInterval(reload, 3000);
                    } else if (foundSelector === selector2) {
                        console.log('Performing actions for selector2 (New jobs will be uploaded)...');
                        // Your actions for selector2
                    }
                } else {
                    console.error('Neither selector found within the specified timeout.');
                    clearInterval(firstInterval);
                }
            } catch (error) {
                console.error('Error during page reload:', error.message);
                // Handle the ProtocolError here
                if (error.name === 'ProtocolError' && error.message.includes('Page.reload timed out')) {
                    console.log('Page reload timed out. Retrying reload...');
                    // return reload(); // Retry the reload
                } else {
                    // Handle other errors accordingly
                    console.error('Unhandled error:', error);
                    // Restart the interval to avoid continuous reloads in case of an error
                    clearInterval(firstInterval);
                     firstInterval = setInterval(reload, 3000);
                }
            }
        } else {
            const verbitLogo = await page.waitForSelector('header > div.logo > a > img');
            clearInterval(firstInterval);
            console.log("Reloading in 30 sec...");
            await page.waitForTimeout(30000);

            try {
                // Check if the page is still open before interacting
                if (!page.isClosed()) {

                    // Check if the element is already clicked
                    // const isLogoClicked = await verbitLogo.evaluate(el => el.getAttribute('data-clicked') === 'true');

                    if (!isLogoClicked) {
                        // Click on the element only if it's not already clicked
                        await verbitLogo.click();
                        firstInterval = setInterval(reload, 3000);
                        // Mark the element as clicked to avoid clicking it again
                        await verbitLogo.evaluate(el => el.setAttribute('data-clicked', 'true'));
                    } else {
                        console.log('Verbit logo already clicked. Skipping...');
                    }

                    // await verbitLogo.click();
                } else {
                    console.error('Page is closed. Exiting reload function.');
                    return;
                }

            } catch (error) {
                // console.error(`Error interacting with the selector: ${error}`);
            }
        }

        // firstInterval = setInterval(reload, 3000);
    }

    // Uncomment the following line to start the interval
    firstInterval = setInterval(reload, 3000);

})();

// Close the browser after some time (adjust the time interval as needed)
setTimeout(async () => {
    console.log('You have been using Marsha bot for 12 hours');
    await browser.close();
}, 43200000); // Close the browser after 12 hours
