var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 17643,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0017000c-00af-0011-007e-006b00cd001a.png",
        "timestamp": 1574097008951,
        "duration": 32
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 17870,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00fe0068-00eb-00a3-0032-00b5001e0051.png",
        "timestamp": 1574097512217,
        "duration": 39
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 17926,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00510024-0016-0054-0068-00bf009d005b.png",
        "timestamp": 1574097537141,
        "duration": 15
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18022,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/005d00c7-00d0-0079-0006-00b3006b0037.png",
        "timestamp": 1574097725760,
        "duration": 46
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18116,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00dd006c-00c7-007f-00fd-006a00cd00e7.png",
        "timestamp": 1574097835215,
        "duration": 27
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18190,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0062006e-00f8-003e-00d1-00d400580056.png",
        "timestamp": 1574097895049,
        "duration": 17
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18401,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00e800b1-00c5-008a-005b-005c004e0089.png",
        "timestamp": 1574098258705,
        "duration": 15
    },
    {
        "description": "should load the google image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18401,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a500c6-0061-0078-0027-000b00fe0017.png",
        "timestamp": 1574098259692,
        "duration": 109
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18930,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00e0004d-0027-0049-0077-00fb00270089.png",
        "timestamp": 1574099674387,
        "duration": 75
    },
    {
        "description": "should load the google image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18930,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00120040-00f5-00e1-0022-00e000c40013.png",
        "timestamp": 1574099676524,
        "duration": 119
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 20618,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00960025-002f-0016-009b-00dc00290090.png",
        "timestamp": 1574105455559,
        "duration": 52
    },
    {
        "description": "should load the google image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 20618,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d80065-0063-00be-00ad-004400ec00da.png",
        "timestamp": 1574105458823,
        "duration": 120
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 20742,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/004d00ad-0087-007d-00d6-004b002900c6.png",
        "timestamp": 1574105585614,
        "duration": 15
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 20742,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009d006c-003d-001f-00ee-0027006f0021.png",
        "timestamp": 1574105586208,
        "duration": 62
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 20742,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "InvalidSelectorError: invalid selector: An invalid or illegal selector was specified\n  (Session info: chrome=78.0.3904.97)\n  (Driver info: chromedriver=78.0.3904.70 (edb9c9f3de0247fd912a77b7f6cae7447f6d3ad5-refs/branch-heads/3904@{#800}),platform=Mac OS X 10.14.6 x86_64)"
        ],
        "trace": [
            "InvalidSelectorError: invalid selector: An invalid or illegal selector was specified\n  (Session info: chrome=78.0.3904.97)\n  (Driver info: chromedriver=78.0.3904.70 (edb9c9f3de0247fd912a77b7f6cae7447f6d3ad5-refs/branch-heads/3904@{#800}),platform=Mac OS X 10.14.6 x86_64)\n    at Object.checkLegacyResponse (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: WebDriver.findElements(By(css selector, input.['gLFyf gsfi']))\n    at Driver.schedule (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at Driver.findElements (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:1048:19)\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:159:44\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec.ts:33:20\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/006100ec-00ee-00d4-0009-00f700fc0020.png",
        "timestamp": 1574105586549,
        "duration": 34
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22373,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00fa009d-00b8-00a1-003a-0030002600d4.png",
        "timestamp": 1574112246976,
        "duration": 14
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22373,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d2003a-00cf-002b-002e-000f00c6006e.png",
        "timestamp": 1574112252972,
        "duration": 94
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22373,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, *[id=\"fakebox-input\"])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, *[id=\"fakebox-input\"])\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec.ts:32:47\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec.ts:30:54)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"should search for the input text\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec.ts:30:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00b4008d-003a-0023-00ca-009f00be002a.png",
        "timestamp": 1574112253978,
        "duration": 5093
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22768,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007a00df-000c-004b-0040-009000990091.png",
        "timestamp": 1574113518714,
        "duration": 89
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22768,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002d007c-0085-00c1-00b6-007e00da00d9.png",
        "timestamp": 1574113520236,
        "duration": 116
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22768,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Failed: invalid selector: An invalid or illegal selector was specified\n  (Session info: headless chrome=78.0.3904.97)\n  (Driver info: chromedriver=78.0.3904.70 (edb9c9f3de0247fd912a77b7f6cae7447f6d3ad5-refs/branch-heads/3904@{#800}),platform=Mac OS X 10.14.6 x86_64)"
        ],
        "trace": [
            "InvalidSelectorError: invalid selector: An invalid or illegal selector was specified\n  (Session info: headless chrome=78.0.3904.97)\n  (Driver info: chromedriver=78.0.3904.70 (edb9c9f3de0247fd912a77b7f6cae7447f6d3ad5-refs/branch-heads/3904@{#800}),platform=Mac OS X 10.14.6 x86_64)\n    at Object.checkLegacyResponse (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: WebDriver.findElements(By(css selector, input.[gLFyf gsfi]))\n    at Driver.schedule (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at Driver.findElements (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:1048:19)\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:159:44\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec.ts:35:38\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec.ts:30:54)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"should search for the input text\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec.ts:30:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00e700fe-003e-00e5-0044-009000420020.png",
        "timestamp": 1574113520634,
        "duration": 226
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22882,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ad00f9-0028-008f-00b5-0051000b00fe.png",
        "timestamp": 1574113557598,
        "duration": 13
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22882,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a800d0-00ed-0087-0067-00d800d10008.png",
        "timestamp": 1574113558186,
        "duration": 28
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22882,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, input.gLFyf gsfi)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, input.gLFyf gsfi)\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec.ts:35:36\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec.ts:30:54)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"should search for the input text\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec.ts:30:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/007800c4-006e-00f5-00f2-00f500ff00ec.png",
        "timestamp": 1574113558464,
        "duration": 5025
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23007,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d100b4-0018-00cc-009b-0035003c0021.png",
        "timestamp": 1574113654344,
        "duration": 12
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23007,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ae0080-009c-006e-00ef-00e1007400e1.png",
        "timestamp": 1574113654833,
        "duration": 140
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23007,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c000f1-0016-0031-00db-00d70082006d.png",
        "timestamp": 1574113655217,
        "duration": 2023
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
