import { browser, Config, ProtractorBrowser } from 'protractor';
import protractor = require('protractor');

var HtmlReporter = require('protractor-beautiful-reporter');

export const config: Config = {
  directConnect: true,
   capabilities: {
       'browserName': 'chrome',
        chromeOptions: {
            args: [ "--headless", "--disable-gpu" ]
       },
   },
   framework: 'jasmine',
   specs: ['./e2e_test_suite/spec/spec.js'],

    jasmineNodeOpts: {
        defaultTimeoutInterval: 90000
    },
    onPrepare: async() => {
        jasmine.getEnv().addReporter(new HtmlReporter({
            baseDirectory: 'Reports/screenshots',
            screenshotsSubfolder: 'images'
         }).getJasmine2Reporter());
        let globals = require('protractor');
        let browser: ProtractorBrowser = globals.browser;
   //let browser = globals.browser;
        await browser.waitForAngularEnabled(false);
        // browser.ignoreSynchronization = true;
        await browser.driver.manage().window().maximize();
        await browser.driver.manage().window().setPosition(0, 0);        
        await browser.manage().timeouts().implicitlyWait(5000);
   },
    onComplete: () => {
        browser.close();
    }
};