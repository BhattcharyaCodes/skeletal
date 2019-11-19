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
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32361,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00b10055-004c-00ff-006e-005600550075.png",
        "timestamp": 1574146043104,
        "duration": 105
    },
    {
        "description": "should contain the \"Feeling lucky button\" and clicking it takes you to doodle url|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32361,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: headless chrome=78.0.3904.97)\n  (Driver info: chromedriver=78.0.3904.70 (edb9c9f3de0247fd912a77b7f6cae7447f6d3ad5-refs/branch-heads/3904@{#800}),platform=Mac OS X 10.14.6 x86_64)"
        ],
        "trace": [
            "ElementNotVisibleError: element not interactable\n  (Session info: headless chrome=78.0.3904.97)\n  (Driver info: chromedriver=78.0.3904.70 (edb9c9f3de0247fd912a77b7f6cae7447f6d3ad5-refs/branch-heads/3904@{#800}),platform=Mac OS X 10.14.6 x86_64)\n    at Object.checkLegacyResponse (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: WebElement.click()\n    at Driver.schedule (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at WebElement.schedule_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:2010:25)\n    at WebElement.click (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:2092:17)\n    at actionFn (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:89:44)\n    at Array.map (<anonymous>)\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:461:65\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as click] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:23:47\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:21:103)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"should contain the \"Feeling lucky button\" and clicking it takes you to doodle url\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:21:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00ca0094-00fd-0001-0069-00ab0063002b.png",
        "timestamp": 1574146044122,
        "duration": 5219
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32361,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00f60022-009c-002c-0083-006f002400af.png",
        "timestamp": 1574146049612,
        "duration": 31
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32361,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/000e00e8-00fe-00df-009c-00a300720010.png",
        "timestamp": 1574146049907,
        "duration": 3489
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 32361,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/007700e2-0092-00e1-000d-0024003b00b2.png",
        "timestamp": 1574146054199,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 32361,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/002e005b-0008-00ef-0043-000500a90074.png",
        "timestamp": 1574146054257,
        "duration": 0
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32466,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003700a8-00c8-0064-0033-007500380021.png",
        "timestamp": 1574146218005,
        "duration": 96
    },
    {
        "description": "should contain the \"Feeling lucky button\" and clicking it takes you to doodle url|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32466,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "TypeError: Cannot read property 'click' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'click' of undefined\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:23:50\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:21:103)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:95:18)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00c9007b-0088-0089-00e3-009000980043.png",
        "timestamp": 1574146218691,
        "duration": 112
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32466,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0009007d-003b-0043-0097-001b0079003c.png",
        "timestamp": 1574146219074,
        "duration": 39
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32466,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00e6008a-00eb-00a1-0068-007200a80046.png",
        "timestamp": 1574146219369,
        "duration": 2711
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 32466,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00cf00b5-00a9-00af-0035-0050009a0057.png",
        "timestamp": 1574146222432,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 32466,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00b4008e-00d9-0041-0023-004c005000a3.png",
        "timestamp": 1574146222460,
        "duration": 0
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32549,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d00047-009e-0075-0025-000d008f0076.png",
        "timestamp": 1574146298374,
        "duration": 56
    },
    {
        "description": "should contain the \"Feeling lucky button\" and clicking it takes you to doodle url|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32549,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected 'https://www.google.com/' to equal 'https://www.google.com/doodles/'."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:24:47\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/004300df-00d1-006c-00bf-0081009e002d.png",
        "timestamp": 1574146298724,
        "duration": 130
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32549,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c6001c-00aa-0012-00dc-0023006000e3.png",
        "timestamp": 1574146299113,
        "duration": 32
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32549,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d50045-00ae-006c-0089-0000000c00eb.png",
        "timestamp": 1574146299408,
        "duration": 2136
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 32549,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/0050005f-00f2-0027-0067-0044002000b0.png",
        "timestamp": 1574146301814,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 32549,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/006a008d-0051-0062-00b6-0039001000ee.png",
        "timestamp": 1574146301832,
        "duration": 0
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32639,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009100a5-00e7-0034-00ba-006700130070.png",
        "timestamp": 1574146398178,
        "duration": 66
    },
    {
        "description": "should contain the \"Feeling lucky button\" and clicking it takes you to doodle url|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32639,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "TypeError: Cannot read property 'submit' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'submit' of undefined\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:23:50\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:21:103)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:95:18)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00f200ec-0067-0071-00e0-00a50095008f.png",
        "timestamp": 1574146398657,
        "duration": 12
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32639,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00fe004e-003f-0083-0031-00b300fb00e9.png",
        "timestamp": 1574146398952,
        "duration": 29
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32639,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00b1001f-00a0-00b7-00c2-00b30065004e.png",
        "timestamp": 1574146399261,
        "duration": 2469
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 32639,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00500098-00f4-008d-005e-009b00330078.png",
        "timestamp": 1574146402005,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 32639,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00e30058-0012-0049-007d-0027005800e7.png",
        "timestamp": 1574146402025,
        "duration": 0
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32729,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0049004f-002c-0089-0008-007300eb00ec.png",
        "timestamp": 1574146479733,
        "duration": 56
    },
    {
        "description": "should contain the \"Feeling lucky button\" and clicking it takes you to doodle url|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32729,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "TypeError: Cannot read property 'click' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'click' of undefined\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:23:50\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:21:103)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:95:18)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00be0031-0036-0063-00de-0061005700d4.png",
        "timestamp": 1574146480200,
        "duration": 12
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32729,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/004f00d7-00f7-0076-0040-0066007e0021.png",
        "timestamp": 1574146480459,
        "duration": 27
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 32729,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/005800ff-0077-0094-0095-00d600d7007a.png",
        "timestamp": 1574146480745,
        "duration": 1824
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 32729,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00820035-0004-0028-00e6-000f00df008a.png",
        "timestamp": 1574146482859,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 32729,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/0011007a-00b1-0039-0030-00c900ea0095.png",
        "timestamp": 1574146482876,
        "duration": 1
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33322,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00de0085-0012-002c-003f-006c00fa0078.png",
        "timestamp": 1574148692622,
        "duration": 75
    },
    {
        "description": "should contain the \"Feeling lucky button\" and clicking it takes you to doodle url|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33322,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Failed: Cannot read property 'isPresent' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'isPresent' of undefined\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:22:45\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:21:103)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:95:18)\nFrom: Task: Run it(\"should contain the \"Feeling lucky button\" and clicking it takes you to doodle url\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:21:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00f00057-008f-00b6-0050-00bb000900db.png",
        "timestamp": 1574148694576,
        "duration": 185
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33322,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0089001f-00b7-00b3-004d-008b00250086.png",
        "timestamp": 1574148695018,
        "duration": 32
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33322,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ef000f-00e9-0072-005a-009b00270008.png",
        "timestamp": 1574148695365,
        "duration": 5987
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 33322,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/003b0018-00f1-0088-00b1-000d00ce007e.png",
        "timestamp": 1574148701642,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 33322,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/003e0073-0053-002e-00bc-00e1002900b4.png",
        "timestamp": 1574148701666,
        "duration": 0
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33719,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0036009e-008c-00de-0061-000b0035006e.png",
        "timestamp": 1574149896722,
        "duration": 62
    },
    {
        "description": "should contain the \"Feeling lucky button\" and clicking it takes you to doodle url|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33719,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Failed: hmp.feeling_lucky_button.toBeTruthy is not a function"
        ],
        "trace": [
            "TypeError: hmp.feeling_lucky_button.toBeTruthy is not a function\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:22:48\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:4:12)\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:21:103)\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:95:18)\nFrom: Task: Run it(\"should contain the \"Feeling lucky button\" and clicking it takes you to doodle url\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:21:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00570058-00f4-0034-0071-005100e40077.png",
        "timestamp": 1574149897576,
        "duration": 6
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33719,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00370056-0088-00ae-0039-007d009c00c2.png",
        "timestamp": 1574149897853,
        "duration": 24
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33719,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00de003f-00de-0094-007d-003100240023.png",
        "timestamp": 1574149898136,
        "duration": 2038
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 33719,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/002100e6-008e-0006-00d3-00da00db00b1.png",
        "timestamp": 1574149900447,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 33719,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00eb00c5-00a5-00f3-00a6-0063007900ae.png",
        "timestamp": 1574149900466,
        "duration": 0
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33958,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00e40071-00dd-0055-001e-00f500610058.png",
        "timestamp": 1574150527501,
        "duration": 69
    },
    {
        "description": "should contain the \"Feeling lucky button\" and clicking it takes you to doodle url|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33958,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: headless chrome=78.0.3904.97)\n  (Driver info: chromedriver=78.0.3904.70 (edb9c9f3de0247fd912a77b7f6cae7447f6d3ad5-refs/branch-heads/3904@{#800}),platform=Mac OS X 10.14.6 x86_64)"
        ],
        "trace": [
            "ElementNotVisibleError: element not interactable\n  (Session info: headless chrome=78.0.3904.97)\n  (Driver info: chromedriver=78.0.3904.70 (edb9c9f3de0247fd912a77b7f6cae7447f6d3ad5-refs/branch-heads/3904@{#800}),platform=Mac OS X 10.14.6 x86_64)\n    at Object.checkLegacyResponse (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: WebElement.click()\n    at Driver.schedule (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at WebElement.schedule_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:2010:25)\n    at WebElement.click (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:2092:17)\n    at actionFn (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:89:44)\n    at Array.map (<anonymous>)\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:461:65\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as click] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:23:47\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should contain the \"Feeling lucky button\" and clicking it takes you to doodle url\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:21:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00120054-0060-002c-00c5-0075009c0058.png",
        "timestamp": 1574150528461,
        "duration": 5184
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33958,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/001c0056-00c9-005a-00f1-009f00640082.png",
        "timestamp": 1574150533915,
        "duration": 25
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 33958,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/000100c4-0025-009f-007a-001600c300f9.png",
        "timestamp": 1574150534191,
        "duration": 2909
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 33958,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/001b0024-00e0-00d2-00c9-00db00ec00c4.png",
        "timestamp": 1574150537390,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 33958,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/007800f7-0062-0012-003c-006600a300d9.png",
        "timestamp": 1574150537412,
        "duration": 0
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 34051,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009f007d-0053-0062-0086-00bb00320057.png",
        "timestamp": 1574150627546,
        "duration": 57
    },
    {
        "description": "should contain the \"Feeling lucky button\" and clicking it takes you to doodle url|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 34051,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: headless chrome=78.0.3904.97)\n  (Driver info: chromedriver=78.0.3904.70 (edb9c9f3de0247fd912a77b7f6cae7447f6d3ad5-refs/branch-heads/3904@{#800}),platform=Mac OS X 10.14.6 x86_64)"
        ],
        "trace": [
            "ElementNotVisibleError: element not interactable\n  (Session info: headless chrome=78.0.3904.97)\n  (Driver info: chromedriver=78.0.3904.70 (edb9c9f3de0247fd912a77b7f6cae7447f6d3ad5-refs/branch-heads/3904@{#800}),platform=Mac OS X 10.14.6 x86_64)\n    at Object.checkLegacyResponse (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: WebElement.click()\n    at Driver.schedule (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at WebElement.schedule_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:2010:25)\n    at WebElement.click (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/webdriver.js:2092:17)\n    at actionFn (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:89:44)\n    at Array.map (<anonymous>)\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:461:65\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as click] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:23:40\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should contain the \"Feeling lucky button\" and clicking it takes you to doodle url\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:21:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00cf0060-00ab-009e-0033-00bd00fb007f.png",
        "timestamp": 1574150628102,
        "duration": 5095
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 34051,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002500b2-0069-00a4-0008-00c9008c000b.png",
        "timestamp": 1574150633450,
        "duration": 25
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 34051,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007a0033-000f-00bf-005d-004e00be00dd.png",
        "timestamp": 1574150633742,
        "duration": 1890
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 34051,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00c400b2-0045-00fd-00e4-0045004d00e0.png",
        "timestamp": 1574150635906,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 34051,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/0028009f-00b6-00b5-00e3-00b500600010.png",
        "timestamp": 1574150635925,
        "duration": 1
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 36579,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0052005b-005c-003b-00ab-0083007f00cc.png",
        "timestamp": 1574169764635,
        "duration": 131
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 36579,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00450057-0061-0099-0083-004f005c00bb.png",
        "timestamp": 1574169765898,
        "duration": 26
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 36579,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ba00e0-003d-0016-000c-008c004100a8.png",
        "timestamp": 1574169766181,
        "duration": 1959
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 36579,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected ElementFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::893\n| TaskQueue::767\n| | (blocked) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::769<then>\n| TaskQueue::838, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), then: null, parentElementArrayFinder: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::893\n| TaskQueue::767\n| | (blocked) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::769<then>\n| TaskQueue::838, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), elementArrayFinder_: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::893\n| TaskQueue::767\n| | (blocked) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::769<then>\n| TaskQueue::838, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }) to contain 'Your search - '."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:43:48\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00d200df-001a-007d-00e8-00c100ac00cd.png",
        "timestamp": 1574169768415,
        "duration": 129
    },
    {
        "description": "should have Minimum lengths be set to 1 for the input boxes|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 36579,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/003100e5-0012-008b-0087-00e900940058.png",
        "timestamp": 1574169768833,
        "duration": 0
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 36579,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00b7005f-0042-0006-0034-00c500090062.png",
        "timestamp": 1574169768856,
        "duration": 20
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 36780,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00f3004a-009c-00cc-00eb-00ed00d4003a.png",
        "timestamp": 1574169890537,
        "duration": 58
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 36780,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00dd0093-008d-00ee-0045-005900730011.png",
        "timestamp": 1574169890891,
        "duration": 31
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 36780,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00e70076-0066-001d-0062-00ec002a0094.png",
        "timestamp": 1574169891174,
        "duration": 4586
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 36780,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected ElementFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::893\n| TaskQueue::767\n| | (blocked) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::769<then>\n| TaskQueue::838\n| | (pending) Task::845<then>\n| | | TaskQueue::892\n| TaskQueue::890, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), then: null, parentElementArrayFinder: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::893\n| TaskQueue::767\n| | (blocked) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::769<then>\n| TaskQueue::838\n| | (pending) Task::845<then>\n| | | TaskQueue::892\n| TaskQueue::890, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), elementArrayFinder_: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::893\n| TaskQueue::767\n| | (blocked) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::769<then>\n| TaskQueue::838\n| | (pending) Task::845<then>\n| | | TaskQueue::892\n| TaskQueue::890, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }) to contain 'Your search - '."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:43:42\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/008500c8-0070-007b-00ed-004700ca0030.png",
        "timestamp": 1574169896049,
        "duration": 117
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 36780,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00050024-00a6-007e-0069-000d00f10076.png",
        "timestamp": 1574169896523,
        "duration": 19
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 36780,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/001c000d-0022-00f9-0094-0023003d003a.png",
        "timestamp": 1574169896817,
        "duration": 2
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37764,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a9007f-0024-001f-00e5-00c100930048.png",
        "timestamp": 1574173813555,
        "duration": 87
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37764,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c7004c-006f-004a-009b-001a001800ff.png",
        "timestamp": 1574173815589,
        "duration": 25
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37764,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00b500fb-0013-00ad-002b-006a003500ec.png",
        "timestamp": 1574173815887,
        "duration": 3281
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37764,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected ElementFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::893\n| TaskQueue::767\n| | (blocked) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::769<then>\n| TaskQueue::838\n| | (pending) Task::845<then>\n| | | TaskQueue::892\n| TaskQueue::890, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), then: null, parentElementArrayFinder: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::893\n| TaskQueue::767\n| | (blocked) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::769<then>\n| TaskQueue::838\n| | (pending) Task::845<then>\n| | | TaskQueue::892\n| TaskQueue::890, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), elementArrayFinder_: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::893\n| TaskQueue::767\n| | (blocked) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::769<then>\n| TaskQueue::838\n| | (pending) Task::845<then>\n| | | TaskQueue::892\n| TaskQueue::890, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }) to contain 'Your search - '."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:43:42\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/009a0063-00ae-00ba-00dc-001e00e200e3.png",
        "timestamp": 1574173819439,
        "duration": 275
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37764,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00570097-00c1-009d-0018-00fa00440024.png",
        "timestamp": 1574173820008,
        "duration": 18
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37764,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/007e00ce-0095-009e-0004-00e500b800a4.png",
        "timestamp": 1574173820302,
        "duration": 1
    },
    {
        "description": "should contain the horizotnal navigation bar to group the search results|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37764,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/000900e1-00ed-00c5-009e-00b8002f005d.png",
        "timestamp": 1574173820577,
        "duration": 1
    },
    {
        "description": "should open the google search engine & load the google  image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37942,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/004000a0-00c9-00b8-0084-004000310019.png",
        "timestamp": 1574174115298,
        "duration": 56
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37942,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/004d0062-003c-0011-00fc-001d00b000be.png",
        "timestamp": 1574174115886,
        "duration": 28
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37942,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002200e2-00d0-00c7-0074-000e00fe005a.png",
        "timestamp": 1574174116194,
        "duration": 2106
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37942,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected ElementFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::845\n| TaskQueue::767\n| | (pending) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | | TaskQueue::770\n| | | | (pending) Task::785<then>\n| | | | | TaskQueue::835\n| | Task::769<then>\n| (active) TaskQueue::838\n| | Task::837<Ignore Synchronization Protractor.waitForAngular()>\n| | Task::840<then>\n| | Task::842<then>\n| | Task::844<then>, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), then: null, parentElementArrayFinder: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::845\n| TaskQueue::767\n| | (pending) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | | TaskQueue::770\n| | | | (pending) Task::785<then>\n| | | | | TaskQueue::835\n| | Task::769<then>\n| (active) TaskQueue::838\n| | Task::837<Ignore Synchronization Protractor.waitForAngular()>\n| | Task::840<then>\n| | Task::842<then>\n| | Task::844<then>, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), elementArrayFinder_: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::845\n| TaskQueue::767\n| | (pending) Task::766<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | | TaskQueue::770\n| | | | (pending) Task::785<then>\n| | | | | TaskQueue::835\n| | Task::769<then>\n| (active) TaskQueue::838\n| | Task::837<Ignore Synchronization Protractor.waitForAngular()>\n| | Task::840<then>\n| | Task::842<then>\n| | Task::844<then>, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }) to contain 'Your search - '."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:44:42\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00de002b-0099-00a3-008e-00a300b100a7.png",
        "timestamp": 1574174118577,
        "duration": 111
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37942,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/005e0030-0094-005d-00e0-00af00440077.png",
        "timestamp": 1574174118978,
        "duration": 17
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37942,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/004f00de-0012-00e9-0021-002a00750073.png",
        "timestamp": 1574174119259,
        "duration": 2
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 37942,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/006c002f-0051-00b6-0011-000000160016.png",
        "timestamp": 1574174119526,
        "duration": 22
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38368,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00150098-008c-00b9-00a3-00b1006b0049.png",
        "timestamp": 1574175799083,
        "duration": 101
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38368,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ce00ab-00dc-00c2-00ba-00ae0052006a.png",
        "timestamp": 1574175800219,
        "duration": 27
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38368,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00e900c8-00b3-00ad-00e8-00dd00ee002b.png",
        "timestamp": 1574175800528,
        "duration": 2092
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38368,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected ElementFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::947\n| TaskQueue::821\n| | (blocked) Task::820<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::823<then>\n| TaskQueue::892\n| | (pending) Task::899<then>\n| | | TaskQueue::946\n| TaskQueue::944, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), then: null, parentElementArrayFinder: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::947\n| TaskQueue::821\n| | (blocked) Task::820<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::823<then>\n| TaskQueue::892\n| | (pending) Task::899<then>\n| | | TaskQueue::946\n| TaskQueue::944, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), elementArrayFinder_: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::947\n| TaskQueue::821\n| | (blocked) Task::820<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::823<then>\n| TaskQueue::892\n| | (pending) Task::899<then>\n| | | TaskQueue::946\n| TaskQueue::944, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }) to contain 'Your search - '."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:45:42\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/003b0042-00ec-0066-008d-00ee008e00c3.png",
        "timestamp": 1574175802890,
        "duration": 117
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38368,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00f30077-0087-0005-00c5-00bd00710064.png",
        "timestamp": 1574175803275,
        "duration": 17
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38368,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/000a00c1-0084-00d6-0086-0040009000ce.png",
        "timestamp": 1574175803562,
        "duration": 1
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38368,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00530076-00b3-0072-008d-00e9006800c3.png",
        "timestamp": 1574175803827,
        "duration": 1637
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38516,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c80048-00b6-0008-00fd-00f300ff007b.png",
        "timestamp": 1574176082447,
        "duration": 54
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38516,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007000df-00ca-0090-00fa-004a0087001c.png",
        "timestamp": 1574176082821,
        "duration": 28
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38516,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d200ef-0087-0010-0004-002100ec006b.png",
        "timestamp": 1574176083111,
        "duration": 2377
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38516,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected ElementFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::947\n| TaskQueue::821\n| | (blocked) Task::820<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::823<then>\n| TaskQueue::892\n| | (pending) Task::899<then>\n| | | TaskQueue::946\n| TaskQueue::944, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), then: null, parentElementArrayFinder: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::947\n| TaskQueue::821\n| | (blocked) Task::820<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::823<then>\n| TaskQueue::892\n| | (pending) Task::899<then>\n| | | TaskQueue::946\n| TaskQueue::944, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), elementArrayFinder_: ElementArrayFinder({ browser_: ProtractorBrowser({ controlFlow: Function, schedule: Function, setFileDetector: Function, getExecutor: Function, getSession: Function, getCapabilities: Function, quit: Function, actions: Function, touchActions: Function, executeScript: Function, executeAsyncScript: Function, call: Function, wait: Function, sleep: Function, getWindowHandle: Function, getAllWindowHandles: Function, getPageSource: Function, close: Function, getCurrentUrl: Function, getTitle: Function, findElementInternal_: Function, findElementsInternal_: Function, takeScreenshot: Function, manage: Function, switchTo: Function, driver: Driver({ flow_: ControlFlow::947\n| TaskQueue::821\n| | (blocked) Task::820<Run it(\"should should not search anything if input belongs to '',!, @, $,# or is blank\") in control flow>\n| | Task::823<then>\n| TaskQueue::892\n| | (pending) Task::899<then>\n| | | TaskQueue::946\n| TaskQueue::944, session_: ManagedPromise::4 {[[PromiseStatus]]: \"fulfilled\"}, executor_: Executor({ w3c: false, customCommands_: Map( [ 'launchApp', Object({ method: 'POST', path: '/session/:sessionId/chromium/launch_app' }) ], [ 'getNetworkConditions', Object({ method: 'GET', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'setNetworkConditions', Object({ method: 'POST', path: '/session/:sessionId/chromium/network_conditions' }) ], [ 'getNetworkConnection', Object({ method: 'GET', path: '/session/:sessionId/network_connection' }) ], [ 'setNetworkConnection', Object({ method: 'POST', path: '/session/:sessionId/network_connection' }) ], [ 'toggleAirplaneMode', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_airplane_mode' }) ], [ 'toggleWiFi', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_wifi' }) ], [ 'toggleData', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_data' }) ], [ 'toggleLocationServices', Object({ method: 'POST', path: '/session/:sessionId/appium/device/toggle_location_services' }) ], [ 'getGeolocation', Object({ method: 'GET', path: '/session/:sessionId/location' }) ], [ 'setGeolocation', Object({ method: 'POST', path: '/session/:sessionId/location' }) ], [ 'getCurrentDeviceActivity', Object({ method: 'GET', path: '/session/:sessionId/appium/device/current_activity' }) ], [ 'startDeviceActivity', Object({ method: 'POST', path: '/session/:sessionId/appium/device/start_activity' }) ], [ 'getAppiumSettings', Object({ method: 'GET', path: '/session/:sessionId/appium/settings' }) ], [ 'setAppiumSettings', Object({ method: 'POST', path: '/session/:sessionId/appium/settings' }) ], [ 'getCurrentContext', Object({ method: 'GET', path: '/session/:sessionId/context' }) ], [ 'selectContext', Object({ method: 'POST', path: '/session/:sessionId/context' }) ], [ 'getScreenOrientation', Object({ method: 'GET', path: '/session/:sessionId/orientation' }) ], [ 'setScreenOrientation', Object({ method: 'POST', path: '/session/:sessionId/orientation' }) ], [ 'isDeviceLocked', Object({ method: 'POST', path: '/session/:sessionId/appium/device/is_locked' }) ], [ 'lockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/lock' }) ], [ 'unlockDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/unlock' }) ], [ 'installApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/install_app' }) ], [ 'isAppInstalled', Object({ method: 'POST', path: '/session/:sessionId/appium/device/app_installed' }) ], [ 'removeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/device/remove_app' }) ], [ 'pullFileFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_file' }) ], [ 'pullFolderFromDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/pull_folder' }) ], [ 'pushFileToDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/push_file' }) ], [ 'listContexts', Object({ method: 'GET', path: '/session/:sessionId/contexts' }) ], [ 'uploadFile', Object({ method: 'POST', path: '/session/:sessionId/file' }) ], [ 'switchToParentFrame', Object({ method: 'POST', path: '/session/:sessionId/frame/parent' }) ], [ 'fullscreen', Object({ method: 'POST', path: '/session/:sessionId/window/fullscreen' }) ], [ 'sendAppToBackground', Object({ method: 'POST', path: '/session/:sessionId/appium/app/background' }) ], [ 'closeApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/close' }) ], [ 'getAppStrings', Object({ method: 'POST', path: '/session/:sessionId/appium/app/strings' }) ], [ 'launchSession', Object({ method: 'POST', path: '/session/:sessionId/appium/app/launch' }) ], [ 'resetApp', Object({ method: 'POST', path: '/session/:sessionId/appium/app/reset' }) ], [ 'hideSoftKeyboard', Object({ method: 'POST', path: '/session/:sessionId/appium/device/hide_keyboard' }) ], [ 'getDeviceTime', Object({ method: 'GET', path: '/session/:sessionId/appium/device/system_time' }) ], [ 'openDeviceNotifications', Object({ method: 'POST', path: '/session/:sessionId/appium/device/open_notifications' }) ], [ 'rotationGesture', Object({ method: 'POST', path: '/session/:sessionId/appium/device/rotate' }) ], [ 'shakeDevice', Object({ method: 'POST', path: '/session/:sessionId/appium/device/shake' }) ], [ 'sendChromiumCommand', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command' }) ], [ 'sendChromiumCommandAndGetResult', Object({ method: 'POST', path: '/session/:sessionId/chromium/send_command_and_get_result' }) ] ), log_: Logger({ name_: 'webdriver.http.Executor', level_: null, parent_: Logger({ name_: 'webdriver.http', level_: null, parent_: Logger({ name_: 'webdriver', level_: null, parent_: Logger({ name_: '', level_: OFF, parent_: null, handlers_: null }), handlers_: null }), handlers_: null }), handlers_: null }) }), fileDetector_: null, onQuit_: undefined, getNetworkConnection: Function, setNetworkConnection: Function, toggleAirplaneMode: Function, toggleWiFi: Function, toggleData: Function, toggleLocationServices: Function, getGeolocation: Function, setGeolocation: Function, getCurrentDeviceActivity: Function, startDeviceActivity: Function, getAppiumSettings: Function, setAppiumSettings: Function, getCurrentContext: Function, selectContext: Function, getScreenOrientation: Function, setScreenOrientation: Function, isDeviceLocked: Function, lockDevice: Function, unlockDevice: Function, installApp: Function, isAppInstalled: Function, removeApp: Function, pullFileFromDevice: Function, pullFolderFromDevice: Function, pushFileToDevice: Function, listContexts: Function, uploadFile: Function, switchToParentFrame: Function, fullscreen: Function, sendAppToBackground: Function, closeApp: Function, getAppStrings: Function, launchSession: Function, resetApp: Function, hideSoftKeyboard: Function, getDeviceTime: Function, openDeviceNotifications: Function, rotationGesture: Function, shakeDevice: Function, sendChromiumCommand: Function, sendChromiumCommandAndGetResult: Function }), element: Function, $: Function, $: Function, baseUrl: '', getPageTimeout: 10000, params: Object({  }), resetUrl: 'data:text/html,<html></html>', debugHelper: DebugHelper({ browserUnderDebug_: <circular reference: Object> }), ready: ManagedPromise::17 {[[PromiseStatus]]: \"fulfilled\"}, trackOutstandingTimeouts_: true, mockModules_: [ Object({ name: 'protractorBaseModule_', script: Function, args: [ true ] }) ], ExpectedConditions: ProtractorExpectedConditions({ browser: <circular reference: Object> }), plugins_: Plugins({ setup: Function, onPrepare: Function, teardown: Function, postResults: Function, postTest: Function, onPageLoad: Function, onPageStable: Function, waitForPromise: Function, waitForCondition: Function, pluginObjs: [  ], assertions: Object({  }), resultsReported: false }), allScriptsTimeout: 11000, getProcessedConfig: Function, forkNewDriverInstance: Function, restart: Function, restartSync: Function, internalRootEl: '', internalIgnoreSynchronization: true }), getWebElements: Function, locator_: By(css selector, p[role=heading]), actionResults_: null, click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }), click: Function, sendKeys: Function, getTagName: Function, getCssValue: Function, getAttribute: Function, getText: Function, getSize: Function, getLocation: Function, isEnabled: Function, isSelected: Function, submit: Function, clear: Function, isDisplayed: Function, getId: Function, takeScreenshot: Function }) to contain 'Your search - '."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:45:42\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00f2003f-001e-0089-0057-008300ff0057.png",
        "timestamp": 1574176085756,
        "duration": 116
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38516,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003300f4-00f8-008d-0030-00ed0010007d.png",
        "timestamp": 1574176086165,
        "duration": 17
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38516,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00a0008f-0056-0097-0024-005800370012.png",
        "timestamp": 1574176086435,
        "duration": 3
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38516,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00560044-00f5-0077-00ae-00c500b60094.png",
        "timestamp": 1574176086704,
        "duration": 1512
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38618,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009c00da-00b7-0078-0028-00f7000800ff.png",
        "timestamp": 1574176156589,
        "duration": 56
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38618,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002e0086-00ac-0027-00a9-009100f100ba.png",
        "timestamp": 1574176156952,
        "duration": 28
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38618,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002c00e7-001c-00cb-004c-00e6008d0042.png",
        "timestamp": 1574176157258,
        "duration": 1986
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38618,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/000800c2-00ad-0051-0062-00f200e800ec.png",
        "timestamp": 1574176159507,
        "duration": 113
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38618,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/000700bc-00fb-00f7-00b0-004e005f001f.png",
        "timestamp": 1574176159900,
        "duration": 17
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 38618,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/001d009d-00ec-0053-0047-00c40008006b.png",
        "timestamp": 1574176160189,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38618,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00260017-0099-00bf-005e-00e600c6003b.png",
        "timestamp": 1574176160215,
        "duration": 1071
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38756,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0079007d-0048-00fe-0064-00d1009e0054.png",
        "timestamp": 1574176407642,
        "duration": 56
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38756,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/008f0099-00d5-003d-0052-0017005b00ab.png",
        "timestamp": 1574176408007,
        "duration": 28
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38756,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ec00e4-00a7-0063-0076-00af0026007c.png",
        "timestamp": 1574176408299,
        "duration": 2386
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38756,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=heading])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=heading])\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getAttribute] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getAttribute] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:45:41\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/0016007e-000d-00e3-0018-004700540039.png",
        "timestamp": 1574176410942,
        "duration": 5185
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38756,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ec00a3-009c-005a-0034-00d0002e00b4.png",
        "timestamp": 1574176416397,
        "duration": 19
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 38756,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00520004-0021-0065-00ac-0077002400a9.png",
        "timestamp": 1574176416670,
        "duration": 1
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38756,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00660055-001e-00e6-0002-00d4000c0020.png",
        "timestamp": 1574176416697,
        "duration": 1520
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0067002d-001f-0053-009a-00c300d500ad.png",
        "timestamp": 1574177075842,
        "duration": 73
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003a0024-0076-0025-00a7-00ca005d0062.png",
        "timestamp": 1574177076419,
        "duration": 26
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ba0032-00c3-0071-00dc-007c003a00b2.png",
        "timestamp": 1574177076721,
        "duration": 2185
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=heading])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=heading])\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getAttribute] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getAttribute] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:45:41\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00cf0020-00eb-0006-0044-0016006f00ea.png",
        "timestamp": 1574177079173,
        "duration": 5118
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/000200a2-003f-00f0-0094-002b0036000b.png",
        "timestamp": 1574177084625,
        "duration": 82
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 38982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00f90023-0066-000f-0074-008c007400ec.png",
        "timestamp": 1574177084975,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 38982,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00b500db-00a6-008d-0087-000000710070.png",
        "timestamp": 1574177085000,
        "duration": 1435
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39062,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00150030-00b8-004e-00ec-00e700ce00fb.png",
        "timestamp": 1574177124938,
        "duration": 60
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39062,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/000000e5-00cd-006d-00ea-0078000f001c.png",
        "timestamp": 1574177125343,
        "duration": 26
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39062,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002b0057-007f-00f8-0054-00c700df00dc.png",
        "timestamp": 1574177125636,
        "duration": 2487
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39062,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=heading])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=heading])\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getAttribute] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getAttribute] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:45:41\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/000d00ea-00d1-0043-00f1-004400e90004.png",
        "timestamp": 1574177128403,
        "duration": 5159
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39062,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/001d0001-00a2-00d6-002a-002a00ac00f4.png",
        "timestamp": 1574177133842,
        "duration": 17
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 39062,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/009a00ee-001a-004c-00a5-007e0006009d.png",
        "timestamp": 1574177134124,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39062,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ba00d8-00b3-004f-0008-00790081005d.png",
        "timestamp": 1574177134150,
        "duration": 1700
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39139,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d800b6-003a-0071-00c6-00ba0042002e.png",
        "timestamp": 1574177182785,
        "duration": 57
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39139,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00f500ba-0080-009d-0017-00f700aa00b1.png",
        "timestamp": 1574177183163,
        "duration": 26
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39139,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/001e00b3-00bc-0083-008f-004700420019.png",
        "timestamp": 1574177183467,
        "duration": 2235
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39139,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=heading])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=heading])\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getAttribute] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getAttribute] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:45:41\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00bc0066-008c-000f-0067-00ae001c0057.png",
        "timestamp": 1574177185981,
        "duration": 5129
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39139,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ee00b4-002b-00be-00a9-009800e9003f.png",
        "timestamp": 1574177191394,
        "duration": 17
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 39139,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/004900d1-005a-0069-00c1-0047009c00d9.png",
        "timestamp": 1574177191698,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39139,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003a00e7-00c9-00d2-00a1-00ce008800e7.png",
        "timestamp": 1574177191726,
        "duration": 1466
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39428,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ff002b-00b5-008d-004f-000400bf00f3.png",
        "timestamp": 1574177728924,
        "duration": 71
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39428,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00bc0011-00b9-00aa-0062-009c002f00e5.png",
        "timestamp": 1574177730055,
        "duration": 26
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39428,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00780017-0080-00c6-00a3-001c004e007c.png",
        "timestamp": 1574177730352,
        "duration": 2961
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39428,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=heading])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=heading])\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:47:41\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/003f0042-00ad-004d-0010-0090008000a1.png",
        "timestamp": 1574177733612,
        "duration": 5321
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39428,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00260049-00a4-0011-0011-003e0074009c.png",
        "timestamp": 1574177739279,
        "duration": 27
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 39428,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/008e00a8-0076-0044-0031-008100ba0013.png",
        "timestamp": 1574177739581,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39428,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00000031-0030-004a-00c8-0079001f007f.png",
        "timestamp": 1574177739611,
        "duration": 1461
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39575,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00220032-008a-006d-009a-008000fc008e.png",
        "timestamp": 1574178030247,
        "duration": 54
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39575,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/006a00e6-0032-00b9-0062-009300590083.png",
        "timestamp": 1574178030810,
        "duration": 26
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39575,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/005800d7-00e5-003b-0014-00cf001f00c0.png",
        "timestamp": 1574178031122,
        "duration": 2841
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39575,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=\"heading\"])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=\"heading\"])\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:47:41\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00a100c5-0050-00a8-0067-007900e40078.png",
        "timestamp": 1574178034263,
        "duration": 5264
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39575,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00980030-005e-0043-004f-004c00aa0001.png",
        "timestamp": 1574178039809,
        "duration": 48
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 39575,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00d6002a-007f-0085-0020-0003008100a8.png",
        "timestamp": 1574178040134,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39575,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007a0013-00ed-00d4-0076-00c300ba0094.png",
        "timestamp": 1574178040165,
        "duration": 1298
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39840,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0027000b-0061-000c-006a-0037007d009f.png",
        "timestamp": 1574178672762,
        "duration": 67
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39840,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0097003d-00ac-0022-0046-008800dc004b.png",
        "timestamp": 1574178673815,
        "duration": 27
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39840,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002700fc-001a-00c2-003e-0045005600c9.png",
        "timestamp": 1574178674126,
        "duration": 2496
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39840,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy.",
            "NoSuchElementError: No element found using locator: By(css selector, p[role=\"heading\"])"
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:44:60\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "NoSuchElementError: No element found using locator: By(css selector, p[role=\"heading\"])\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:47:41\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00eb0044-00d8-0084-0049-00ae009300c0.png",
        "timestamp": 1574178676900,
        "duration": 10365
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39840,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/001f0074-00a1-0007-0098-00df00ad0017.png",
        "timestamp": 1574178687597,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39840,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009e0038-0077-00f1-0067-00bf008c0037.png",
        "timestamp": 1574178687858,
        "duration": 114
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 39840,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00310007-007e-000f-0046-00e000d8000f.png",
        "timestamp": 1574178688279,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39840,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c900b6-00e8-00c6-0004-00b500e600f0.png",
        "timestamp": 1574178688343,
        "duration": 1168
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39915,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/004a007d-00bf-00cb-00ef-00de00a40027.png",
        "timestamp": 1574178742796,
        "duration": 55
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39915,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007c00a4-0073-0086-0056-00cc00250036.png",
        "timestamp": 1574178743341,
        "duration": 25
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39915,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0050005b-0035-0096-0088-009400040017.png",
        "timestamp": 1574178743655,
        "duration": 1848
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39915,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy.",
            "NoSuchElementError: No element found using locator: By(css selector, p[role=\"heading\"])"
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:44:60\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "NoSuchElementError: No element found using locator: By(css selector, p[role=\"heading\"])\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:47:41\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/0078009a-0015-0007-00b0-004a000d0075.png",
        "timestamp": 1574178745770,
        "duration": 10129
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39915,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00320007-0058-0067-0026-00af008e0022.png",
        "timestamp": 1574178756177,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39915,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/008300ab-00b6-00d2-0042-007f001d008f.png",
        "timestamp": 1574178756447,
        "duration": 22
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 39915,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00c700c7-0006-004d-00ca-007700350000.png",
        "timestamp": 1574178756741,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39915,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a00035-0099-0025-00d9-001000c50080.png",
        "timestamp": 1574178756776,
        "duration": 1089
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39990,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/005800d1-0039-003a-00b9-001100a900aa.png",
        "timestamp": 1574178822400,
        "duration": 93
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39990,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/004200cb-001e-008e-007d-002600f3008c.png",
        "timestamp": 1574178823066,
        "duration": 24
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39990,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ad009d-0070-00ec-003f-00f0002e00e5.png",
        "timestamp": 1574178823362,
        "duration": 2610
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39990,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy.",
            "NoSuchElementError: No element found using locator: By(css selector, p[role=\"heading\"])"
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:44:60\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
            "NoSuchElementError: No element found using locator: By(css selector, p[role=\"heading\"])\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:46:46\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00790029-0034-0041-00fd-008f004e00e2.png",
        "timestamp": 1574178826287,
        "duration": 10407
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39990,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00b0001d-003b-0012-0017-008e003500bd.png",
        "timestamp": 1574178837049,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39990,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00b90084-0091-0030-00af-0069005d007d.png",
        "timestamp": 1574178837314,
        "duration": 16
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 39990,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00f70024-00aa-0074-00cd-0075003b00cb.png",
        "timestamp": 1574178837595,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 39990,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002000d4-00d9-00e6-0079-0002000a007c.png",
        "timestamp": 1574178837628,
        "duration": 1213
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40098,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0008001a-0052-00ac-00c3-00c300e00099.png",
        "timestamp": 1574179015132,
        "duration": 53
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40098,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00950077-0058-0073-0080-004600f600ef.png",
        "timestamp": 1574179015924,
        "duration": 26
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40098,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00310044-004b-0050-00d5-00940008002b.png",
        "timestamp": 1574179016216,
        "duration": 2020
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40098,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=\"heading\"])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, p[role=\"heading\"])\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getText] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:46:46\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00e7005b-006d-0001-0021-00b800550082.png",
        "timestamp": 1574179018515,
        "duration": 5214
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40098,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/004200a4-00c5-001f-009f-001c00bc006f.png",
        "timestamp": 1574179024038,
        "duration": 2
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40098,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00030037-00d6-0071-005e-003d009a00b0.png",
        "timestamp": 1574179024347,
        "duration": 26
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 40098,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/000800d8-0063-003a-0009-000b00cf00c4.png",
        "timestamp": 1574179024656,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40098,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002f0026-004d-007d-001e-001f00f400d6.png",
        "timestamp": 1574179024704,
        "duration": 1363
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40187,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00bc0088-00ad-009e-00db-008f0027009a.png",
        "timestamp": 1574179110588,
        "duration": 53
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40187,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ef00d3-0083-0097-00c1-0027005f007c.png",
        "timestamp": 1574179111208,
        "duration": 25
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40187,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003700b8-000b-000b-00dd-002700ca0074.png",
        "timestamp": 1574179111498,
        "duration": 1853
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40187,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:44:55\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00cb00b4-004d-0034-0059-00fd0099001f.png",
        "timestamp": 1574179113629,
        "duration": 5138
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40187,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00690022-0006-008d-006b-0066005400dd.png",
        "timestamp": 1574179119054,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40187,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00900047-00d5-00af-00c4-008900f60037.png",
        "timestamp": 1574179119330,
        "duration": 25
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40187,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002800b9-0049-00ea-00d5-008e006d0080.png",
        "timestamp": 1574179119630,
        "duration": 1151
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40264,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/008300f9-000c-00cd-00ee-0067002c003b.png",
        "timestamp": 1574179205173,
        "duration": 54
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40264,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0046000d-0016-00d9-0049-00c9002700dd.png",
        "timestamp": 1574179205542,
        "duration": 26
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40264,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009b008a-0074-0090-009f-0002000300f3.png",
        "timestamp": 1574179205840,
        "duration": 1774
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40264,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:44:55\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/001f00d0-00cf-0007-0011-0094007100dd.png",
        "timestamp": 1574179207909,
        "duration": 5152
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40264,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00a20086-008b-0052-0024-001f001d000c.png",
        "timestamp": 1574179213342,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40264,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/001900a6-000e-00ad-0093-000100a90066.png",
        "timestamp": 1574179213609,
        "duration": 17
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40264,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0058008d-00d6-0004-00ea-001a00170079.png",
        "timestamp": 1574179213888,
        "duration": 1118
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40497,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/006000f5-004d-0009-00b2-006d008b0016.png",
        "timestamp": 1574179895531,
        "duration": 64
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40497,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00f10033-00b7-0094-00eb-001100d700de.png",
        "timestamp": 1574179896776,
        "duration": 43
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40497,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ae001b-00d4-0070-0044-008900e20069.png",
        "timestamp": 1574179897090,
        "duration": 2212
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40497,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:44:55\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00fc009a-003d-00cf-0076-00ca00e700bc.png",
        "timestamp": 1574179899579,
        "duration": 18240
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40497,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00f10078-00cf-0025-00b3-0048006000a2.png",
        "timestamp": 1574179918099,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40497,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/004800b7-0019-0033-007a-00b4000e0067.png",
        "timestamp": 1574179918392,
        "duration": 28
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40497,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002e0015-0025-001c-00e8-005000d30051.png",
        "timestamp": 1574179918694,
        "duration": 1215
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40584,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ca00a6-007a-006e-00c6-00fa00760083.png",
        "timestamp": 1574180029991,
        "duration": 69
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40584,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c5004e-0023-009b-0052-005800040068.png",
        "timestamp": 1574180030535,
        "duration": 37
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40584,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c100de-0070-0035-0006-00d300540030.png",
        "timestamp": 1574180030863,
        "duration": 2125
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40584,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4281:23)\n    at listOnTimeout (internal/timers.js:531:17)\n    at processTimers (internal/timers.js:475:7)",
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:44:55\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/009d00d9-00a9-00fd-00d4-003000db0071.png",
        "timestamp": 1574180033283,
        "duration": 138599
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40584,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/005f0057-000c-0037-0011-0052004300bc.png",
        "timestamp": 1574180172357,
        "duration": 3
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40584,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00eb00c4-008f-0049-004d-00b2005a002d.png",
        "timestamp": 1574180172647,
        "duration": 36
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40584,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002d0092-0092-00e8-00f7-003100e7004f.png",
        "timestamp": 1574180173010,
        "duration": 1444
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00650090-00fb-0052-0026-00f6009e0008.png",
        "timestamp": 1574180393596,
        "duration": 55
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009c00aa-0063-00ce-00c2-00d200510075.png",
        "timestamp": 1574180394416,
        "duration": 25
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ec0011-0047-00b4-008e-001700790013.png",
        "timestamp": 1574180394725,
        "duration": 2740
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:44:54\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00a9004b-008f-008f-00b3-007800e500ca.png",
        "timestamp": 1574180397738,
        "duration": 6661
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00b700e3-002e-00f7-0095-00de00560079.png",
        "timestamp": 1574180404682,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00910096-0085-0057-00c1-008d00ac007a.png",
        "timestamp": 1574180404956,
        "duration": 36
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/000c00b7-0038-0039-00ba-00eb0034007a.png",
        "timestamp": 1574180405254,
        "duration": 1154
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40823,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00de00c7-003a-0016-0041-00db00b700ac.png",
        "timestamp": 1574180538690,
        "duration": 53
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40823,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c60064-00bd-0032-0025-00f900d10009.png",
        "timestamp": 1574180539070,
        "duration": 27
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40823,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d800f8-00e7-00c5-0057-00b000890028.png",
        "timestamp": 1574180539363,
        "duration": 2207
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40823,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:44:54\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/0084009c-00b4-00ab-00d3-005200380031.png",
        "timestamp": 1574180541848,
        "duration": 7083
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40823,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/009c005f-00b3-0089-00ec-00d100f500b1.png",
        "timestamp": 1574180549251,
        "duration": 2
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40823,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/008a0005-0025-002a-00ad-00ae00b100a7.png",
        "timestamp": 1574180549522,
        "duration": 22
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40823,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00840058-0000-0052-00b7-00cf007800c2.png",
        "timestamp": 1574180549809,
        "duration": 1795
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40908,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/005c0071-00f9-003b-000d-002c00310001.png",
        "timestamp": 1574180608762,
        "duration": 66
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40908,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00470088-00d6-0069-0077-00990093006e.png",
        "timestamp": 1574180609176,
        "duration": 27
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40908,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007800f1-0075-003c-000f-00f700fa0059.png",
        "timestamp": 1574180609482,
        "duration": 2448
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40908,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected false to be truthy."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:44:54\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00870068-0054-00f3-005c-00a7008c0069.png",
        "timestamp": 1574180612503,
        "duration": 6533
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40908,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/005200d2-0026-00b0-00ea-003700b6001d.png",
        "timestamp": 1574180619582,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40908,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c500f6-00ca-00db-003b-00c000f900b8.png",
        "timestamp": 1574180619927,
        "duration": 22
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 40908,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/004b00f7-0041-0099-000d-00de004e0072.png",
        "timestamp": 1574180620265,
        "duration": 1066
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41012,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ce0065-00c2-00db-008c-00fb00c30019.png",
        "timestamp": 1574180700094,
        "duration": 59
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41012,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00330080-007b-009b-006e-0081008600e1.png",
        "timestamp": 1574180700498,
        "duration": 27
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41012,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009300a5-00e0-00f2-0091-003c00670068.png",
        "timestamp": 1574180700834,
        "duration": 1972
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41012,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/005a0051-0062-0014-0070-004800f400d6.png",
        "timestamp": 1574180703137,
        "duration": 1049
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41012,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/008e00c2-002b-00db-0090-0071002d00e2.png",
        "timestamp": 1574180704505,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41012,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00560091-00dd-00dd-0090-00e100e8002c.png",
        "timestamp": 1574180704817,
        "duration": 23
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41012,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00df0067-00e1-0013-0041-002d007a007b.png",
        "timestamp": 1574180705155,
        "duration": 1520
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002c0068-00d1-0089-000f-005900970051.png",
        "timestamp": 1574188317081,
        "duration": 199
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00df00d8-0032-00d1-009f-0037002a007e.png",
        "timestamp": 1574188321403,
        "duration": 31
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00da0041-004d-002c-00e6-001b0090004b.png",
        "timestamp": 1574188321737,
        "duration": 3933
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected 'Your search - * - did not match any documents.' to equal 'Your search - '."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:48:52\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/004f004e-004b-00bd-00d2-0090002300db.png",
        "timestamp": 1574188326015,
        "duration": 1197
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/003c0095-00d7-00f3-0089-00f800210059.png",
        "timestamp": 1574188327524,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/005d00c5-00e2-00e5-0075-00030076001d.png",
        "timestamp": 1574188327813,
        "duration": 49
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 41733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/001f0096-00f4-0005-00e4-00cf00f700e2.png",
        "timestamp": 1574188328164,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41733,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00580000-00e8-00c0-00bc-006e00240017.png",
        "timestamp": 1574188328196,
        "duration": 1454
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41843,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00cb0046-00ff-00c3-00e3-00d4007400f6.png",
        "timestamp": 1574188388388,
        "duration": 78
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41843,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00e80067-00c7-0047-00f7-002d00b00037.png",
        "timestamp": 1574188389236,
        "duration": 28
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41843,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0036007a-0026-00aa-0088-003300e6001f.png",
        "timestamp": 1574188389573,
        "duration": 2835
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41843,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": [
            "Expected 'Your search - * - did not match any documents.' to equal 'Your search - * -'."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.ts:48:52\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/google.search.homepage.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/005100f3-002a-0092-0076-001c002a00ed.png",
        "timestamp": 1574188393177,
        "duration": 1223
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41843,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00b30041-00c2-00ec-00a7-0090007b00f6.png",
        "timestamp": 1574188394732,
        "duration": 2
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41843,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a90093-006b-005f-0069-00b000ee0015.png",
        "timestamp": 1574188395041,
        "duration": 24
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 41843,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00530067-00ce-0092-00e7-000100c200e8.png",
        "timestamp": 1574188395381,
        "duration": 0
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41843,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00b300a1-0088-00d3-007d-0004004b00fd.png",
        "timestamp": 1574188395413,
        "duration": 1755
    },
    {
        "description": "should open the google search engine & load the google logo image in ther center of the page|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41964,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00e300b4-0005-0098-00fb-00d900e4003a.png",
        "timestamp": 1574188607714,
        "duration": 116
    },
    {
        "description": "should contain the  \"Google Search\" button|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41964,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003a00ec-0059-00eb-001a-00d40032004c.png",
        "timestamp": 1574188612036,
        "duration": 31
    },
    {
        "description": "should search for the input text|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41964,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009200e7-0081-006c-000f-0043003e0093.png",
        "timestamp": 1574188612380,
        "duration": 3636
    },
    {
        "description": "should should not search anything if input belongs to '',!, @, $,# or is blank|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41964,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.MEVzAPCznC8.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo_iL6i3Fuh5d3bLKRBazYvzpKjkxg/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1574188617322,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.MEVzAPCznC8.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo_iL6i3Fuh5d3bLKRBazYvzpKjkxg/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1574188617322,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.MEVzAPCznC8.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo_iL6i3Fuh5d3bLKRBazYvzpKjkxg/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1574188617323,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.MEVzAPCznC8.O/m=gapi_iframes,googleapis_client,plusone/rt=j/sv=1/d=1/ed=1/rs=AHpOoo_iL6i3Fuh5d3bLKRBazYvzpKjkxg/cb=gapi.loaded_0 431 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1574188617323,
                "type": ""
            }
        ],
        "screenShotFile": "images/00d800c6-009b-0011-00e0-00d0006a004b.png",
        "timestamp": 1574188616446,
        "duration": 1955
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41964,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00070093-00b6-0018-0076-001500da002c.png",
        "timestamp": 1574188618740,
        "duration": 1
    },
    {
        "description": "should have a Maximum lengths of word char for the input boxes|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41964,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00350050-003b-0025-001b-00ee00c8006c.png",
        "timestamp": 1574188619058,
        "duration": 30
    },
    {
        "description": "should be able to navigate to the first search result|homepage",
        "passed": false,
        "pending": true,
        "os": "Mac OS X",
        "instanceId": 41964,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Temporarily disabled with xit",
        "browserLogs": [],
        "screenShotFile": "images/00da0093-00ea-0020-0073-009a00030026.png",
        "timestamp": 1574188619423,
        "duration": 1
    },
    {
        "description": "should not crash the Application, if user inserted % in search field|homepage",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 41964,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.97"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/005e000c-0066-0044-0038-0066009100e4.png",
        "timestamp": 1574188619489,
        "duration": 1388
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
