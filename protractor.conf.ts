import { PluginConfig as PluginConfig } from "./plugins";
import { browser, Config, ProtractorBrowser } from "protractor";

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
   specs: ['./e2e_test_suite/spec.ts'],

    jasmineNodeOpts: {
        defaultTimeoutInterval: 90000
    },
    onPrepare: () => {
        let globals = require('protractor');
        let browser: ProtractorBrowser = globals.browser;
   //let browser = globals.browser;
        browser.ignoreSynchronization = true;
        browser.manage().window().maximize();
        browser.manage().timeouts().implicitlyWait(5000);
   },
    onComplete: () => {
        browser.pause();
    }
};