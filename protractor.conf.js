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
            args: ["--headless", "--disable-gpu"]
        },
    },
    framework: 'jasmine',
    specs: [
        //'./e2e_test_suite/spec/google.search.homepage.spec.js'
        // './e2e_test_suite/spec/maps.spec.js'
        // './e2e_test_suite/spec/spotify.read.get.api.spec.ts'
        './e2e_test_suite/spec/request.promise.spec.ts'
    ],
    jasmineNodeOpts: {
        defaultTimeoutInterval: 120000
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci5jb25mLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJvdHJhY3Rvci5jb25mLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsMkNBQWdFO0FBR2hFLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO0FBRS9DLFFBQUEsTUFBTSxHQUFXO0lBQzVCLGFBQWEsRUFBRSxJQUFJO0lBQ2xCLFlBQVksRUFBRTtRQUNWLGFBQWEsRUFBRSxRQUFRO1FBQ3RCLGFBQWEsRUFBRTtZQUNWLElBQUksRUFBRSxDQUFFLFlBQVksRUFBRSxlQUFlLENBQUU7U0FDNUM7S0FDSjtJQUNELFNBQVMsRUFBRSxTQUFTO0lBQ3BCLEtBQUssRUFBRTtRQUNILHdEQUF3RDtRQUN2RCx1Q0FBdUM7UUFDdkMsdURBQXVEO1FBQ3ZELCtDQUErQztLQUNsRDtJQUVELGVBQWUsRUFBRTtRQUNiLHNCQUFzQixFQUFFLE1BQU07S0FDakM7SUFDRCxTQUFTLEVBQUUsR0FBUSxFQUFFO1FBQ2pCLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxZQUFZLENBQUM7WUFDMUMsYUFBYSxFQUFFLHFCQUFxQjtZQUNwQyxvQkFBb0IsRUFBRSxRQUFRO1NBQ2hDLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7UUFDM0IsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3BDLElBQUksT0FBTyxHQUFzQixPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ3RELGdDQUFnQztRQUMzQixNQUFNLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyx3Q0FBd0M7UUFDeEMsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2xELE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1RCxDQUFDLENBQUE7SUFDQSxVQUFVLEVBQUUsR0FBRyxFQUFFO1FBQ2Isb0JBQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNwQixDQUFDO0NBQ0osQ0FBQyJ9