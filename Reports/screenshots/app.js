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
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23629,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00090084-0021-0036-00ba-001500d5004f.png",
        "timestamp": 1574115131882,
        "duration": 17
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23629,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00be001f-003d-0064-0099-00b6001d0010.png",
        "timestamp": 1574115132733,
        "duration": 84
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23629,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0074007b-0094-00c3-0079-001100bd00a9.png",
        "timestamp": 1574115133087,
        "duration": 2669
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24422,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a300b9-009b-00c1-0078-005300c000d7.png",
        "timestamp": 1574115811035,
        "duration": 13
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24422,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d900d5-002c-0058-0088-009d000800b4.png",
        "timestamp": 1574115811930,
        "duration": 49
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24422,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007c0019-0018-009a-007d-00b8007f0079.png",
        "timestamp": 1574115812234,
        "duration": 25
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 24422,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00860025-00e7-0026-00c8-005a00920028.png",
        "timestamp": 1574115812508,
        "duration": 0
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24422,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/004c00df-009a-0050-00fc-00e8003800f2.png",
        "timestamp": 1574115812518,
        "duration": 2037
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24498,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009200ac-0058-0012-001c-006700300083.png",
        "timestamp": 1574115859775,
        "duration": 16
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24498,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/004c006e-0003-000b-0059-00b800a000c3.png",
        "timestamp": 1574115860152,
        "duration": 28
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24498,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00060054-0021-002b-00c5-003100fd007e.png",
        "timestamp": 1574115860438,
        "duration": 30
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24498,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/004800db-00f7-004b-00be-00d500cb00ea.png",
        "timestamp": 1574115860716,
        "duration": 44
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24498,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d00047-0057-003e-00dd-00f900b20051.png",
        "timestamp": 1574115861021,
        "duration": 2481
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24586,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00b100e3-007c-00eb-00d8-004700140084.png",
        "timestamp": 1574115939328,
        "duration": 14
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24586,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a9003b-0087-00bb-00b3-004e00ce0055.png",
        "timestamp": 1574115939669,
        "duration": 29
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24586,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d700c5-0075-0006-00fa-009600f100fa.png",
        "timestamp": 1574115939947,
        "duration": 31
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24586,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00960049-00cc-00eb-00ab-00c1004f0068.png",
        "timestamp": 1574115940252,
        "duration": 69
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24586,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00fc007a-00a0-0053-005c-0016008a00bd.png",
        "timestamp": 1574115940604,
        "duration": 2179
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24850,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00af0062-00a3-00de-00a5-00e9007600b1.png",
        "timestamp": 1574117318785,
        "duration": 55
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24850,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00660028-00d7-0003-0063-007200d6002d.png",
        "timestamp": 1574117319272,
        "duration": 67
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24850,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a20024-002d-007a-0018-00a5000b0075.png",
        "timestamp": 1574117319675,
        "duration": 61
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24850,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00530088-0055-0006-00e5-009400690061.png",
        "timestamp": 1574117320141,
        "duration": 100
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 24850,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007500f6-0094-00ee-00b9-0011001f0002.png",
        "timestamp": 1574117320587,
        "duration": 3211
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 27551,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00720051-008f-0039-003c-00b5000b00e6.png",
        "timestamp": 1574138609687,
        "duration": 23
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 27551,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/0090000e-0030-00b9-00fa-002f00a3008c.png",
        "timestamp": 1574138610704,
        "duration": 0
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 27551,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00a2001e-001e-00b7-0061-00a500b70020.png",
        "timestamp": 1574138610728,
        "duration": 0
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 27551,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00c40047-00b9-001f-00f3-007900d50021.png",
        "timestamp": 1574138610775,
        "duration": 0
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 27551,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00de007e-007b-00f6-002a-007700200034.png",
        "timestamp": 1574138610795,
        "duration": 2725
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 27635,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00f800a8-007f-004e-0041-0096007500cc.png",
        "timestamp": 1574138675822,
        "duration": 20
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 27635,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ab00ba-004e-005d-00a7-009700050019.png",
        "timestamp": 1574138676140,
        "duration": 30
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 27635,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002500f5-007b-006a-007a-00dd005800dc.png",
        "timestamp": 1574138676420,
        "duration": 32
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 27635,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00740088-009f-0037-00db-003000970041.png",
        "timestamp": 1574138676701,
        "duration": 32
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 27635,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00250079-0087-00d4-002c-00cc009d004c.png",
        "timestamp": 1574138676990,
        "duration": 2360
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28014,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should open the google search engine\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:20:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/004900c9-00d7-0036-00d3-00c800f800fc.png",
        "timestamp": 1574139146209,
        "duration": 17
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28014,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should load the google logo image\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:27:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00d20051-0046-0002-00a5-001200e200be.png",
        "timestamp": 1574139146476,
        "duration": 13
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28014,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should contain the \"Feeling lucky button\"\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:32:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00f50005-002c-00a8-0094-0033009a00d6.png",
        "timestamp": 1574139146744,
        "duration": 3
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28014,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00c30057-0085-002a-0046-001400fa005f.png",
        "timestamp": 1574139146994,
        "duration": 2
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28014,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:45:29\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:43:54)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"should search for the input text\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:43:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00d2004c-0054-0021-0057-00b700dc009d.png",
        "timestamp": 1574139147232,
        "duration": 14
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28309,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should open the google search engine\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:20:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/009c00a1-0018-0088-00bb-003500f200c3.png",
        "timestamp": 1574139441500,
        "duration": 16
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28309,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should load the google logo image\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:27:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/000400ba-00e9-0054-002d-00b1001900b8.png",
        "timestamp": 1574139442973,
        "duration": 14
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28309,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should contain the \"Feeling lucky button\"\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:32:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00be0090-00a7-0049-0018-006700370055.png",
        "timestamp": 1574139443219,
        "duration": 3
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28309,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00c600ea-0040-00f6-00e0-003800fe00a9.png",
        "timestamp": 1574139443472,
        "duration": 2
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28309,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:45:29\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:43:54)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"should search for the input text\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:43:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/003c00d6-005d-0021-00cd-0085004900e4.png",
        "timestamp": 1574139443724,
        "duration": 14
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28505,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should open the google search engine\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:20:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00dc0036-00d5-0015-00db-00420085001c.png",
        "timestamp": 1574140006457,
        "duration": 15
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28505,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should load the google logo image\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:27:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00ec0003-0018-0045-0045-00e400c30030.png",
        "timestamp": 1574140007552,
        "duration": 12
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28505,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should contain the \"Feeling lucky button\"\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:32:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/004300ee-00e8-004f-0080-002f002f00a4.png",
        "timestamp": 1574140007797,
        "duration": 2
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28505,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/007600ae-003a-0068-0094-0070002e00dd.png",
        "timestamp": 1574140008049,
        "duration": 2
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28505,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"",
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/browser.js:463:23\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:45:29\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:43:54)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"should search for the input text\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:43:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:8:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00ca003e-0036-009f-00f8-00b300cc00ca.png",
        "timestamp": 1574140008298,
        "duration": 12
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28890,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/005400ff-00cd-0046-006f-0007005000eb.png",
        "timestamp": 1574141455433,
        "duration": 86
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28890,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003300b3-008a-00e3-0050-004d008b003a.png",
        "timestamp": 1574141456622,
        "duration": 71
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28890,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:34:42\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:32:63)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00b40007-00a1-0025-00c6-007600b200fd.png",
        "timestamp": 1574141456950,
        "duration": 3
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28890,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:40:42\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:37:64)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00010055-009d-001d-0011-007b00de009c.png",
        "timestamp": 1574141457221,
        "duration": 3
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 28890,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:47:35\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/009e008e-0081-0086-00ac-006d00a1002e.png",
        "timestamp": 1574141457467,
        "duration": 2513
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29003,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002a002f-00ac-005b-007f-001500d800e1.png",
        "timestamp": 1574141679022,
        "duration": 13
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29003,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00010029-00d6-008c-001a-006600cd00eb.png",
        "timestamp": 1574141679592,
        "duration": 59
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29003,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:34:42\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:32:63)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/005000ac-00c6-0096-0015-007e00e80093.png",
        "timestamp": 1574141679915,
        "duration": 4
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29003,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:40:42\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:37:64)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/0070008e-00af-00dd-00fa-0065001b0082.png",
        "timestamp": 1574141680180,
        "duration": 3
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29003,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:47:35\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/006e004f-000f-009e-00da-0078005900a7.png",
        "timestamp": 1574141680432,
        "duration": 2377
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29106,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c10099-00f6-001a-0040-00b600d30011.png",
        "timestamp": 1574141821538,
        "duration": 13
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29106,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00e900b1-0064-00ef-0036-0078004700ce.png",
        "timestamp": 1574141822121,
        "duration": 28
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29106,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:34:48\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/001200ab-00f1-005f-009d-00e700540081.png",
        "timestamp": 1574141822411,
        "duration": 3
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29106,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:40:48\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/009b00e5-00f3-00c3-0008-0083002900c2.png",
        "timestamp": 1574141822654,
        "duration": 3
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29106,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:47:35\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00a900e2-009c-0001-00ca-009600130006.png",
        "timestamp": 1574141822906,
        "duration": 2163
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29295,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007b00ac-0077-0037-00d0-00d400a800db.png",
        "timestamp": 1574142151627,
        "duration": 12
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29295,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00040051-0055-001a-00f4-00a300e200e3.png",
        "timestamp": 1574142152056,
        "duration": 30
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29295,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:34:48\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00b40026-00a7-00ad-009f-009100e6006c.png",
        "timestamp": 1574142152335,
        "duration": 3
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29295,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:40:48\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00e000e2-009f-00fa-0002-00fd00bc00ab.png",
        "timestamp": 1574142152587,
        "duration": 2
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29295,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:47:35\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/008100f0-0059-00ff-0041-000700be0010.png",
        "timestamp": 1574142152834,
        "duration": 2296
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 29409,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00e300c3-00df-008d-00cc-006c0082005a.png",
        "timestamp": 1574142293342,
        "duration": 2
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 29409,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/005b001e-0007-00a1-008e-00b700f80008.png",
        "timestamp": 1574142293394,
        "duration": 0
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29409,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:34:48\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00ac0071-00e7-00f9-001c-00b2001300bb.png",
        "timestamp": 1574142293414,
        "duration": 6
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29409,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:40:48\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/009a00d7-005c-0089-0003-008800cf009e.png",
        "timestamp": 1574142293694,
        "duration": 2
    },
    {
        "description": "should search for the input text|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29409,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:47:35\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/005a0074-00b0-0096-0096-00970094008a.png",
        "timestamp": 1574142293943,
        "duration": 1897
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 29534,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/000f00ed-009c-00b7-009a-00c60015005b.png",
        "timestamp": 1574142491454,
        "duration": 2
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 29534,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00320033-0097-008d-00e2-00d800f00028.png",
        "timestamp": 1574142491508,
        "duration": 1
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29534,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:34:48\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00560085-00a0-008d-001a-009c005900e8.png",
        "timestamp": 1574142491528,
        "duration": 6
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29534,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:40:48\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00090060-008a-00f8-00c0-005c00e000c6.png",
        "timestamp": 1574142491813,
        "duration": 2
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29534,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0068006a-0084-007e-0001-00db005d00e8.png",
        "timestamp": 1574142492059,
        "duration": 1981
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29620,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0031000c-0090-004b-001d-003300ee00fe.png",
        "timestamp": 1574142557554,
        "duration": 14
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29620,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0015008e-00d1-00ea-0033-008200ff005c.png",
        "timestamp": 1574142557895,
        "duration": 41
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29620,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:34:48\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00aa007e-00d7-0050-00fa-009000140078.png",
        "timestamp": 1574142558209,
        "duration": 4
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29620,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:40:48\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00fe0013-00d3-00c6-0012-00bb00d90084.png",
        "timestamp": 1574142558484,
        "duration": 2
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29620,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003200f8-0048-00f2-0041-001c007700fa.png",
        "timestamp": 1574142558743,
        "duration": 2049
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29828,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00f30035-00a1-00e0-00a5-0026008200ed.png",
        "timestamp": 1574142794309,
        "duration": 12
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29828,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0070000c-0000-00d2-00c5-0002000200b7.png",
        "timestamp": 1574142794655,
        "duration": 28
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29828,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00df001e-003d-003d-00ae-000a005c0054.png",
        "timestamp": 1574142794962,
        "duration": 35
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29828,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:40:54\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:37:64)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00b30008-0066-0082-0082-00ab0024008e.png",
        "timestamp": 1574142795281,
        "duration": 5043
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29828,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00de00c9-0090-0065-008c-004100db0044.png",
        "timestamp": 1574142800573,
        "duration": 1924
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29970,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002e0016-007d-00a3-00cd-00b7000b001b.png",
        "timestamp": 1574142953836,
        "duration": 15
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29970,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00400094-00a2-009c-00a8-0095002d00ee.png",
        "timestamp": 1574142954182,
        "duration": 28
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29970,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009100a2-00e7-0078-0064-00fe00190098.png",
        "timestamp": 1574142954451,
        "duration": 31
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29970,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:37:60\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/003f0015-00d9-00fb-006f-000300fb007d.png",
        "timestamp": 1574142954741,
        "duration": 5027
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 29970,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/000f0068-0065-0032-00f2-00d80081004e.png",
        "timestamp": 1574142960023,
        "duration": 2172
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30067,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a6002b-007c-00e5-001e-004900560036.png",
        "timestamp": 1574143044950,
        "duration": 14
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30067,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/008400a3-00b7-0083-00bc-0062004a00af.png",
        "timestamp": 1574143045266,
        "duration": 28
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30067,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00840025-0085-00d4-00d6-00a6001500df.png",
        "timestamp": 1574143045546,
        "duration": 26
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30067,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00330002-0096-00da-00e8-00cd00ef0023.png",
        "timestamp": 1574143045814,
        "duration": 25
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30067,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009f004f-0089-00a9-0060-004900af00b8.png",
        "timestamp": 1574143046096,
        "duration": 2066
    },
    {
        "description": "should open the google search engine|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30177,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007a0015-0052-00b1-008d-009500270070.png",
        "timestamp": 1574143152739,
        "duration": 14
    },
    {
        "description": "should load the google logo image|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30177,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00590070-00cd-00be-00b8-002600230034.png",
        "timestamp": 1574143153055,
        "duration": 28
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30177,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003f00c0-0091-006f-00c5-0070008a00ff.png",
        "timestamp": 1574143153399,
        "duration": 63
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30177,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00010035-002c-0040-0006-007700be00ba.png",
        "timestamp": 1574143153723,
        "duration": 24
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30177,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0073002e-0062-001f-0073-009300ff006e.png",
        "timestamp": 1574143154007,
        "duration": 2250
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30810,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected 'padding-top: 109px;' to equal 'padding-top:109px'."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:19:54\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/0007009b-0070-00eb-007d-002c00f90034.png",
        "timestamp": 1574144222374,
        "duration": 72
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30810,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009000f1-0009-0017-0036-002800a300eb.png",
        "timestamp": 1574144223029,
        "duration": 31
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30810,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0043000e-001a-0065-00a0-00910017000e.png",
        "timestamp": 1574144223612,
        "duration": 25
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30810,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ae0014-009b-0091-007f-001e00ed0076.png",
        "timestamp": 1574144223898,
        "duration": 2127
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 30810,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00e5000b-0064-0054-00dc-005700c700d3.png",
        "timestamp": 1574144226295,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 30810,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00c2003d-003f-007e-0046-00d200a3007e.png",
        "timestamp": 1574144226314,
        "duration": 1
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30936,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected 'padding-top: 109px;' to equal 'padding-top:109px;'."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:19:54\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/001400f9-009f-0031-007b-00fb00000070.png",
        "timestamp": 1574144351001,
        "duration": 71
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30936,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009600e2-0070-00ae-009c-00ba006b0002.png",
        "timestamp": 1574144351385,
        "duration": 27
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30936,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a10071-00c2-0051-002a-00ca00b400e8.png",
        "timestamp": 1574144351671,
        "duration": 25
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 30936,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/000800f1-005a-003c-005e-0083005200c2.png",
        "timestamp": 1574144351955,
        "duration": 2550
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 30936,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00d50027-00e7-00be-00d5-004600e20058.png",
        "timestamp": 1574144354783,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 30936,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/005100ea-009c-0000-00f5-00ae000400c4.png",
        "timestamp": 1574144354810,
        "duration": 0
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31286,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00bc00a7-0025-0037-004b-0058004b0036.png",
        "timestamp": 1574144474152,
        "duration": 57
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31286,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00bd0019-00ef-00cb-00b0-00e300620003.png",
        "timestamp": 1574144474491,
        "duration": 26
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31286,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d5009c-0037-00bd-00fc-006a00200069.png",
        "timestamp": 1574144474758,
        "duration": 25
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31286,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00510005-00fe-00e8-00f5-00a800c400be.png",
        "timestamp": 1574144475027,
        "duration": 1923
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 31286,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/009b001f-00fb-008c-000c-00f20005006b.png",
        "timestamp": 1574144477212,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 31286,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00d600a6-000c-0017-008e-002b005b0062.png",
        "timestamp": 1574144477230,
        "duration": 0
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31569,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0075001e-0084-00bc-0012-002a00a3004d.png",
        "timestamp": 1574145038554,
        "duration": 103
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31569,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003d00f1-00c1-00d5-00ae-0005006d0091.png",
        "timestamp": 1574145039507,
        "duration": 33
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31569,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/001f0058-006d-00dd-00ca-001a001d0046.png",
        "timestamp": 1574145039813,
        "duration": 25
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31569,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00bb0010-0053-0029-0047-00f200b300b7.png",
        "timestamp": 1574145040090,
        "duration": 4042
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 31569,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/0032002d-005d-0047-00bb-0019006b0023.png",
        "timestamp": 1574145044397,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 31569,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00f00098-00e5-00a7-00c3-005900a900dd.png",
        "timestamp": 1574145044416,
        "duration": 0
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31888,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a5009d-0029-00f1-002d-00ca0041009b.png",
        "timestamp": 1574145437968,
        "duration": 61
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31888,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d900ed-00d7-0022-0054-00d100e800ed.png",
        "timestamp": 1574145438331,
        "duration": 25
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31888,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00460025-0028-00db-00a4-00fd00150080.png",
        "timestamp": 1574145438614,
        "duration": 27
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31888,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c10084-005e-0041-003e-005d00c100e5.png",
        "timestamp": 1574145438894,
        "duration": 2062
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 31888,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00bd00d3-006e-0033-0002-00db00990087.png",
        "timestamp": 1574145441224,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 31888,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00a000db-00d8-00c4-00ec-00d2008f0010.png",
        "timestamp": 1574145441245,
        "duration": 0
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00030064-0061-00c6-0053-00c4009c00d6.png",
        "timestamp": 1574145490475,
        "duration": 73
    },
    {
        "description": "should contain the \"Feeling lucky button\"|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a40045-00b2-000f-0086-00ed003f0074.png",
        "timestamp": 1574145490882,
        "duration": 40
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0014009f-00ca-00cc-00b4-00ca000800f7.png",
        "timestamp": 1574145491181,
        "duration": 30
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 31982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00fb0041-00d4-0015-0017-00ed007f0003.png",
        "timestamp": 1574145491470,
        "duration": 2367
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 31982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00f0004e-0073-006a-00d6-0037000b005e.png",
        "timestamp": 1574145494103,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 31982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00ca00de-00ba-00bd-0064-00f3002a007c.png",
        "timestamp": 1574145494121,
        "duration": 0
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
