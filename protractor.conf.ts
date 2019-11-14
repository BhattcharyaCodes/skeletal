import { browser } from 'protractor';
import { PluginConfig } from './plugins';

module.export   let config: Config = {
  directConnect: true,
   capabilities: {
       'browserName': 'chrome',
        chromeOptions: {
           args: [ "--headless", "--disable-gpu" ]
       }
   },
   framework: 'jasmine',
   specs: ['./e2e_test_suite/spec.ts'],

jasmineNodeOpts: {
    defaultTimeoutInterval: 90000
  },
  onPrepare: () => {
   let globals = require('protractor');
   let browser = globals.browser;
   browser.manage().window().maximize();
   browser.manage().timeouts().implicitlyWait(5000);
 }
 onComplete: () => {
    browser.pause();
    }
}