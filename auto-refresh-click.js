const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const fs = require('fs').promises;

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const FILE_PATH = 'clickedElements.json'; // File path to store clicked elements
const verbitEmail = 'musyokamarvin84@gmail.com';
let clickedElements = new Set();
let firstInterval;

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        timeout: 0,
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

    await clearClickedElements();

    await page.goto('https://platform.verbit.co/');

    const username = await page.waitForSelector('form > div.sc-bkkeKt.hlZVeT > div.sc-jrQzAO.cCmSqm > input');
    await username.type(verbitEmail);
    const next = await page.waitForSelector('form > button');
    await next.click();

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

    let fileHandle;

    async function reload() {
        try {

            // Check if the page is available
            if (!page) {
                console.log('Page is not available. Exiting reload.');
                clearInterval(firstInterval);
                return;
            }

            console.log('Reload function called');

            // Check if the page is still open
            if (page.isClosed()) {
                console.log('Page is closed. Exiting reload.');
                return;
            }

            fileHandle = await fs.open(FILE_PATH, 'r');
            const data = await fileHandle.readFile('utf8');
            clickedElements = new Set(JSON.parse(data));

            const currentUrl = await page.url();

            if (currentUrl === 'https://platform.verbit.co/') {
                console.log("Successfully reloaded:", currentUrl);

                await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
                await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

                const selector1 = 'td.column-status.text-left.col-sm-4.font-grey-mint.status.status-ready > a';
                const selector2 = 'div.transcription-job-tables > div > div > div > h1';

                const foundSelector = await Promise.race([
                    checkSelector(selector1),
                    checkSelector(selector2),
                ]);

                if (foundSelector) {
                    if (foundSelector === selector1) {
                        clearInterval(firstInterval);
                        console.log('Performing actions for selector1...');

                        const taskElements = await page.$$(selector1);

                        await Promise.all(taskElements.map(async (taskId) => {
                            try {
                                const isElementAttached = await taskId.evaluate(el => el && el.isConnected);

                                if (!isElementAttached) {
                                    throw new Error('Element is detached');
                                }

                                const href = await taskId.evaluate(el => el.getAttribute('href'));

                                if (!clickedElements.has(href)) {

                                    clickedElements.add(href);

                                    await taskId.click({ button: 'middle' });

                                    await fs.writeFile(FILE_PATH, JSON.stringify([...clickedElements], null, 2), 'utf8');
                                }
                            } catch (error) {
                                console.error(`Error interacting with element: ${error.message}`);
                                if (error.message.includes('Execution context was destroyed')) {
                                    console.log('Execution context was destroyed, calling reload again...');
                                    return reload();
                                } else {
                                    console.error(`Error interacting with element: ${error}`);
                                }
                            }
                        }));

                        firstInterval = setInterval(reload, 4000);

                    } else if (foundSelector === selector2) {
                        console.log('Performing actions for selector2 (New jobs will be uploaded)...');
                    }
                } else {
                    console.error('Neither selector found within the specified timeout.');
                }
            } else {
                try {
                    const verbitLogo = await page.waitForSelector('header > div.logo > a > img', { timeout: 30000 });
                    clearInterval(firstInterval);
                    console.log("Reloading in 30 sec...");
                
                    // Wait for 30 seconds before clicking
                    await page.waitForTimeout(30000);
                
                    // Check if the element is still attached to the DOM
                    const isVerbitLogoAttached = await verbitLogo.evaluate(el => el && el.isConnected);
                
                    if (isVerbitLogoAttached) {
                        verbitLogo.click();
                
                        // Wait for navigation to complete
                        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
                
                        firstInterval = setInterval(reload, 4000);
                    } else {
                        console.log('verbitLogo element is detached. Retrying reload...');
                        return reload();
                    }
                

                } catch (error) {
                    if (error.name === 'TimeoutError' && error.message.includes('Waiting for selector')) {
                        console.log('Timeout waiting for selector. Retrying reload...');
                        return reload();
                    } else {
                        console.error(`Unexpected error: ${error.message}`);
                        firstInterval = setInterval(reload, 4000);
                    }
                }
            }
        } catch (error) {
            console.error(`Unexpected error in reload: ${error.message}`);
            // Handle the error as needed
        } finally {
            if (fileHandle) {
                fileHandle.close()
                    .then(() => console.log('File handle closed'))
                    .catch(error => console.error('Error closing file handle:', error.message));
            }
        }
    }

    firstInterval = setInterval(reload, 4000);

})();

setTimeout(async () => {
    console.log('You have been using Marsha bot for 12 hours');
    await browser.close();
}, 43200000);
