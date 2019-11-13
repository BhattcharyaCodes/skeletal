export.config = {
    seleniumAddress: 'https://localhost:4444/wd/hub',
    capabilities: {
        'browserName': 'chrome'
    },
    framework: 'jasmine',
    specs: ['specs.js'],

};
