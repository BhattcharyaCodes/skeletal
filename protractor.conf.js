//"use strict";
//Object.defineProperty(exports, "__esModule", { value: true });
//exports.config = {
//    directConnect: true,
//    capabilities: {
//        'browserName': 'chrome',
//        chromeOptions: {
//            args: ["--headless", "--disable-gpu"]
//        }
//    },
//    framework: 'jasmine',
//    specs: ['./e2e_test_suite/spec.js'],
//    jasmineNodeOpts: {
//        defaultTimeoutInterval: 90000
//    },
//    onPrepare: () => {
//        let globals = require('protractor');
//        let browser = globals.browser;
//        browser.manage().window().maximize();
//        browser.manage().timeouts().implicitlyWait(5000);
//    }
//};
////# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci5jb25mLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJvdHJhY3Rvci5jb25mLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ1csUUFBQSxNQUFNLEdBQVc7SUFDMUIsYUFBYSxFQUFFLElBQUk7SUFDbEIsWUFBWSxFQUFFO1FBQ1YsYUFBYSxFQUFFLFFBQVE7UUFDdEIsYUFBYSxFQUFFO1lBQ1osSUFBSSxFQUFFLENBQUUsWUFBWSxFQUFFLGVBQWUsQ0FBRTtTQUMxQztLQUNKO0lBQ0QsU0FBUyxFQUFFLFNBQVM7SUFDcEIsS0FBSyxFQUFFLENBQUMsMEJBQTBCLENBQUM7SUFFdEMsZUFBZSxFQUFFO1FBQ2Isc0JBQXNCLEVBQUUsS0FBSztLQUM5QjtJQUNELFNBQVMsRUFBRSxHQUFHLEVBQUU7UUFDZixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDcEMsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUM5QixPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuRCxDQUFDO0NBQ0QsQ0FBQSJ9


exports.config = {
  directConnect: true,
  framework: 'jasmine',
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
            args: ["--headless", "--disable-gpu"]
    }
  },
  specs: [
    './e2e_test_suite/spec.js',

  ],
  directConnect: true,

  // You could set no globals to true to avoid jQuery '$' and protractor '$'
  // collisions on the global namespace.
  noGlobals: true
};