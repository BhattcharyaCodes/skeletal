exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    capabilities: {
        'browserName': 'chrome'
    },
    framework: 'jasmine',
    specs: ['/e2e_test_suite/specs.js'],
    // Options to be passed to Jasmine.
     jasmineNodeOpts: {
        defaultTimeoutInterval: 30000
     }
};
