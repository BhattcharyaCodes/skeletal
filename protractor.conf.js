"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
var HtmlReporter = require('protractor-beautiful-reporter');
exports.config = {
    directConnect: true,
    capabilities: {
        'browserName': 'chrome',
        chromeOptions: {
        //    args: [ "--headless", "--disable-gpu" ]
        },
    },
    framework: 'jasmine',
    specs: ['./e2e_test_suite/spec.js'],
    jasmineNodeOpts: {
        defaultTimeoutInterval: 90000
    },
    onPrepare: () => {
        jasmine.getEnv().addReporter(new HtmlReporter({
            baseDirectory: 'Reports/screenshots',
            screenshotsSubfolder: 'images'
        }).getJasmine2Reporter());
        let globals = require('protractor');
        let browser = globals.browser;
        //let browser = globals.browser;
        // browser.ignoreSynchronization = true;
        browser.driver.manage().window().maximize();
        browser.driver.manage().window().setPosition(0, 0);
        browser.manage().timeouts().implicitlyWait(5000);
    },
    onComplete: () => {
        protractor_1.browser.close();
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci5jb25mLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJvdHJhY3Rvci5jb25mLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQWdFO0FBR2hFLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0FBRS9DLFFBQUEsTUFBTSxHQUFXO0lBQzVCLGFBQWEsRUFBRSxJQUFJO0lBQ2xCLFlBQVksRUFBRTtRQUNWLGFBQWEsRUFBRSxRQUFRO1FBQ3RCLGFBQWEsRUFBRTtRQUNmLDZDQUE2QztTQUM3QztLQUNKO0lBQ0QsU0FBUyxFQUFFLFNBQVM7SUFDcEIsS0FBSyxFQUFFLENBQUMsMEJBQTBCLENBQUM7SUFFbEMsZUFBZSxFQUFFO1FBQ2Isc0JBQXNCLEVBQUUsS0FBSztLQUNoQztJQUNELFNBQVMsRUFBRSxHQUFHLEVBQUU7UUFDWixPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksWUFBWSxDQUFDO1lBQzFDLGFBQWEsRUFBRSxxQkFBcUI7WUFDcEMsb0JBQW9CLEVBQUUsUUFBUTtTQUNoQyxDQUFDLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1FBQzNCLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNwQyxJQUFJLE9BQU8sR0FBc0IsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUN0RCxnQ0FBZ0M7UUFDM0Isd0NBQXdDO1FBQ3hDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDNUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUNBLFVBQVUsRUFBRSxHQUFHLEVBQUU7UUFDYixvQkFBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3BCLENBQUM7Q0FDSixDQUFDIn0=