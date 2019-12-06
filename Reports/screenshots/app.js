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
        "description": "should open the google maps home page|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 53924,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002b0063-000a-0012-0096-00be00a00006.png",
        "timestamp": 1575113900197,
        "duration": 10896
    },
    {
        "description": "should search for the given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 53924,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00e500be-00c7-00bf-009c-00fc0084004e.png",
        "timestamp": 1575113914890,
        "duration": 5278
    },
    {
        "description": "should calculate the distance betweeen the current location and given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 53924,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/000d007c-0037-00aa-00d7-000b002c003b.png",
        "timestamp": 1575113920959,
        "duration": 682
    },
    {
        "description": "should open the google maps home page|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 16401,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/006c008c-00d9-007e-0041-00760098001a.png",
        "timestamp": 1575568210408,
        "duration": 2758
    },
    {
        "description": "should search for the given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 16401,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/00cf0014-007b-00a6-00fd-009b00ed0026.png",
        "timestamp": 1575568216711,
        "duration": 2448
    },
    {
        "description": "should calculate the distance betweeen the current location and given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 16401,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/0037005b-0087-0033-0032-000500d30003.png",
        "timestamp": 1575568220131,
        "duration": 553
    },
    {
        "description": "should open the google maps home page|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18130,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009f009f-002c-000b-00a9-00b800f100b3.png",
        "timestamp": 1575569620255,
        "duration": 1337
    },
    {
        "description": "should search for the given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18130,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00fc0025-0056-00d0-00fe-0071006f00f1.png",
        "timestamp": 1575569623428,
        "duration": 1518
    },
    {
        "description": "should calculate the distance betweeen the current location and given location|GooglemapsHomePage testing",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18130,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, button.blue-link.section-directions-action-button)"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, button.blue-link.section-directions-action-button)\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:814:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as click] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.ts:34:57\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should calculate the distance betweeen the current location and given location\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.ts:26:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00400001-0020-006a-008b-00a200840097.png",
        "timestamp": 1575569625424,
        "duration": 11371
    },
    {
        "description": "should open the google maps home page|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18235,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00d10079-008d-003b-00a0-00cb007400cd.png",
        "timestamp": 1575569720793,
        "duration": 5290
    },
    {
        "description": "should search for the given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18235,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00dd003b-0063-009d-0001-00b300c90035.png",
        "timestamp": 1575569728357,
        "duration": 2109
    },
    {
        "description": "should calculate the distance betweeen the current location and given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 18235,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00290088-007c-0046-00a0-0082008000ba.png",
        "timestamp": 1575569731090,
        "duration": 5660
    },
    {
        "description": "should open the google maps home page|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22000,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ce0063-0008-00a8-00e5-002a001300d2.png",
        "timestamp": 1575609935608,
        "duration": 7785
    },
    {
        "description": "should search for the given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22000,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00500088-00fd-005d-00af-00a400310087.png",
        "timestamp": 1575609946463,
        "duration": 3051
    },
    {
        "description": "should calculate the distance betweeen the current location and given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22000,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003600cc-00db-00da-0033-004b00fc0009.png",
        "timestamp": 1575609950370,
        "duration": 7082
    },
    {
        "description": "should implement dragging the pointer to a different location on the maps|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 22000,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images/0031000b-00da-0040-00fa-001800f90079.png",
        "timestamp": 1575609958059,
        "duration": 543
    },
    {
        "description": "should open the google maps home page|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23070,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00a40032-0021-00d8-0016-0007007500d6.png",
        "timestamp": 1575614018008,
        "duration": 1616
    },
    {
        "description": "should search for the given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23070,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/005600c4-00ef-00ee-0097-00df00940023.png",
        "timestamp": 1575614021191,
        "duration": 1600
    },
    {
        "description": "should calculate the distance betweeen the current location and given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23070,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00200052-00fd-00e9-00b6-009e00d90053.png",
        "timestamp": 1575614023424,
        "duration": 5738
    },
    {
        "description": "should implement dragging the pointer to a different location on the maps|GooglemapsHomePage testing",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23070,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": [
            "Failed: Index out of bound. Trying to access element at index: 2, but there are only 0 elements that match locator By(css selector, div.widget-directions-icon)"
        ],
        "trace": [
            "NoSuchElementError: Index out of bound. Trying to access element at index: 2, but there are only 0 elements that match locator By(css selector, div.widget-directions-icon)\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:274:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getId] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getId] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at ActionSequence.mouseMove (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/actions.js:151:44)\n    at ActionSequence.scheduleMouseAction_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/actions.js:189:14)\n    at ActionSequence.mouseDown (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/actions.js:225:17)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.ts:42:33\n    at Generator.next (<anonymous>)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.js:8:71\n    at new Promise (<anonymous>)\nFrom: Task: Run it(\"should implement dragging the pointer to a different location on the maps\") in control flow\n    at UserContext.<anonymous> (/Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /Users/animesh/play/skeletal/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.ts:38:5)\n    at addSpecsToSuite (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/Users/animesh/play/skeletal/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1103:10)\n    at Module.load (internal/modules/cjs/loader.js:914:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:822:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/00d0006c-00e1-00b4-0034-007100070057.png",
        "timestamp": 1575614029646,
        "duration": 5764
    },
    {
        "description": "should open the google maps home page|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23236,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00e900be-0002-0025-0075-0032004a00a1.png",
        "timestamp": 1575614343979,
        "duration": 3317
    },
    {
        "description": "should search for the given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23236,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/008d006d-0016-0097-009b-009700490020.png",
        "timestamp": 1575614348013,
        "duration": 1473
    },
    {
        "description": "should calculate the distance betweeen the current location and given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23236,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00f90064-0041-00b5-009c-00d600ae00f3.png",
        "timestamp": 1575614350142,
        "duration": 5641
    },
    {
        "description": "should implement dragging the pointer to a different location on the maps|GooglemapsHomePage testing",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23236,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": [
            "NoSuchElementError: Index out of bound. Trying to access element at index: 2, but there are only 0 elements that match locator By(css selector, div.widget-directions-icon)"
        ],
        "trace": [
            "NoSuchElementError: Index out of bound. Trying to access element at index: 2, but there are only 0 elements that match locator By(css selector, div.widget-directions-icon)\n    at /Users/animesh/play/skeletal/node_modules/protractor/built/element.js:274:27\n    at ManagedPromise.invokeCallback_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error\n    at ElementArrayFinder.applyAction_ (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as getId] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as getId] (/Users/animesh/play/skeletal/node_modules/protractor/built/element.js:831:22)\n    at ActionSequence.mouseMove (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/actions.js:151:44)\n    at ActionSequence.scheduleMouseAction_ (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/actions.js:189:14)\n    at ActionSequence.mouseDown (/Users/animesh/play/skeletal/node_modules/selenium-webdriver/lib/actions.js:225:17)\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.ts:45:33\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "images/000c005d-0005-004b-00f4-0077004f00aa.png",
        "timestamp": 1575614356278,
        "duration": 6460
    },
    {
        "description": "should open the google maps home page|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23446,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002b00a5-00e2-00a1-00dd-0046000300fe.png",
        "timestamp": 1575614915867,
        "duration": 1768
    },
    {
        "description": "should search for the given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23446,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614918316,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614918321,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614918321,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614918322,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614919769,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614919770,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614919771,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614919771,
                "type": ""
            }
        ],
        "screenShotFile": "images/003d006f-0002-00be-0085-00fd00c90024.png",
        "timestamp": 1575614918958,
        "duration": 1520
    },
    {
        "description": "should calculate the distance betweeen the current location and given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23446,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614922458,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614922459,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614922459,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 523 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614922460,
                "type": ""
            }
        ],
        "screenShotFile": "images/000a0090-0060-00ef-0059-00f3001c009a.png",
        "timestamp": 1575614921153,
        "duration": 5850
    },
    {
        "description": "should implement dragging the pointer to a different location on the maps|GooglemapsHomePage testing",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23446,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": [
            "Expected 'Your location' to equal 'Sakra World Hospital, SY NO 52/2 & 52/3, Devarabeesanahalli, Varthur Hobli Opp Intel, Outer Ring Rd, Marathahalli, Bengaluru, Karnataka 560103'."
        ],
        "trace": [
            "Error: Failed expectation\n    at /Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.ts:47:49\n    at Generator.next (<anonymous>)\n    at fulfilled (/Users/animesh/play/skeletal/e2e_test_suite/spec/maps.spec.js:5:58)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 525 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614928341,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 525 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614928342,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.google.com/maps/ 525 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1575614928343,
                "type": ""
            }
        ],
        "screenShotFile": "images/00a20024-003d-0058-00d2-00c100020090.png",
        "timestamp": 1575614927491,
        "duration": 4821
    },
    {
        "description": "should open the google maps home page|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23543,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/003a00cb-00fd-00b5-0068-00480071008e.png",
        "timestamp": 1575614971537,
        "duration": 1675
    },
    {
        "description": "should search for the given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23543,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00ac000f-004f-0057-00a7-0063004d0094.png",
        "timestamp": 1575614974510,
        "duration": 1473
    },
    {
        "description": "should calculate the distance betweeen the current location and given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23543,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007c00bc-009f-00df-0069-00db00c800c8.png",
        "timestamp": 1575614976692,
        "duration": 5949
    },
    {
        "description": "should implement dragging the pointer to a different location on the maps|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23543,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/000000e7-00d3-00ea-0080-00ee00f6009d.png",
        "timestamp": 1575614983079,
        "duration": 5114
    },
    {
        "description": "should open the google maps home page|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23633,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002200bb-009b-0010-0030-00d20087007d.png",
        "timestamp": 1575615031715,
        "duration": 2397
    },
    {
        "description": "should search for the given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23633,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00250030-002d-0071-0062-001900fa009e.png",
        "timestamp": 1575615035589,
        "duration": 1718
    },
    {
        "description": "should calculate the distance betweeen the current location and given location|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23633,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/008c0097-003c-0039-0081-006a0064005e.png",
        "timestamp": 1575615038013,
        "duration": 5972
    },
    {
        "description": "should implement dragging the pointer to a different location on the maps|GooglemapsHomePage testing",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 23633,
        "browser": {
            "name": "chrome",
            "version": "78.0.3904.108"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00fd004f-00c7-00c0-0046-0098003700c4.png",
        "timestamp": 1575615044448,
        "duration": 5172
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
