"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
var HtmlReporter = require('protractor-beautiful-reporter');
exports.config = {
    directConnect: true,
    capabilities: {
        'browserName': 'chrome',
        chromeOptions: {
            args: ["--headless", "--disable-gpu"]
        },
    },
    framework: 'jasmine',
    specs: ['./e2e_test_suite/spec/spec.js'],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci5jb25mLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJvdHJhY3Rvci5jb25mLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQWdFO0FBR2hFLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0FBRS9DLFFBQUEsTUFBTSxHQUFXO0lBQzVCLGFBQWEsRUFBRSxJQUFJO0lBQ2xCLFlBQVksRUFBRTtRQUNWLGFBQWEsRUFBRSxRQUFRO1FBQ3RCLGFBQWEsRUFBRTtZQUNYLElBQUksRUFBRSxDQUFFLFlBQVksRUFBRSxlQUFlLENBQUU7U0FDM0M7S0FDSjtJQUNELFNBQVMsRUFBRSxTQUFTO0lBQ3BCLEtBQUssRUFBRSxDQUFDLCtCQUErQixDQUFDO0lBRXZDLGVBQWUsRUFBRTtRQUNiLHNCQUFzQixFQUFFLEtBQUs7S0FDaEM7SUFDRCxTQUFTLEVBQUUsR0FBRyxFQUFFO1FBQ1osT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLFlBQVksQ0FBQztZQUMxQyxhQUFhLEVBQUUscUJBQXFCO1lBQ3BDLG9CQUFvQixFQUFFLFFBQVE7U0FDaEMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztRQUMzQixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDcEMsSUFBSSxPQUFPLEdBQXNCLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDdEQsZ0NBQWdDO1FBQzNCLHdDQUF3QztRQUN4QyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzVDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNuRCxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFDQSxVQUFVLEVBQUUsR0FBRyxFQUFFO1FBQ2Isb0JBQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNwQixDQUFDO0NBQ0osQ0FBQyJ9