"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
var HtmlReporter = require('protractor-beautiful-reporter');
exports.config = {
    directConnect: true,
    capabilities: {
        'browserName': 'chrome',
        chromeOptions: {
        // args: [ "--headless", "--disable-gpu" ]
        },
    },
    framework: 'jasmine',
    specs: ['./e2e_test_suite/spec/google.search.homepage.spec.js'],
    jasmineNodeOpts: {
        defaultTimeoutInterval: 90000
    },
    onPrepare: () => __awaiter(void 0, void 0, void 0, function* () {
        jasmine.getEnv().addReporter(new HtmlReporter({
            baseDirectory: 'Reports/screenshots',
            screenshotsSubfolder: 'images'
        }).getJasmine2Reporter());
        let globals = require('protractor');
        let browser = globals.browser;
        //let browser = globals.browser;
        yield browser.waitForAngularEnabled(false);
        // browser.ignoreSynchronization = true;
        yield browser.driver.manage().window().maximize();
        yield browser.driver.manage().window().setPosition(0, 0);
        yield browser.manage().timeouts().implicitlyWait(5000);
    }),
    onComplete: () => {
        protractor_1.browser.close();
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci5jb25mLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJvdHJhY3Rvci5jb25mLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsMkNBQWdFO0FBR2hFLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0FBRS9DLFFBQUEsTUFBTSxHQUFXO0lBQzVCLGFBQWEsRUFBRSxJQUFJO0lBQ2xCLFlBQVksRUFBRTtRQUNWLGFBQWEsRUFBRSxRQUFRO1FBQ3RCLGFBQWEsRUFBRTtRQUNYLDBDQUEwQztTQUM5QztLQUNKO0lBQ0QsU0FBUyxFQUFFLFNBQVM7SUFDcEIsS0FBSyxFQUFFLENBQUMsc0RBQXNELENBQUM7SUFFOUQsZUFBZSxFQUFFO1FBQ2Isc0JBQXNCLEVBQUUsS0FBSztLQUNoQztJQUNELFNBQVMsRUFBRSxHQUFRLEVBQUU7UUFDakIsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLFlBQVksQ0FBQztZQUMxQyxhQUFhLEVBQUUscUJBQXFCO1lBQ3BDLG9CQUFvQixFQUFFLFFBQVE7U0FDaEMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztRQUMzQixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDcEMsSUFBSSxPQUFPLEdBQXNCLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDdEQsZ0NBQWdDO1FBQzNCLE1BQU0sT0FBTyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNDLHdDQUF3QztRQUN4QyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbEQsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekQsTUFBTSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVELENBQUMsQ0FBQTtJQUNBLFVBQVUsRUFBRSxHQUFHLEVBQUU7UUFDYixvQkFBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3BCLENBQUM7Q0FDSixDQUFDIn0=