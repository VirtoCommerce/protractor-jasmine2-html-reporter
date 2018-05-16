var cache = require("./cache");
var Utils = require("./utils");

class Process {
    constructor() {
        this.suites = [];
        this.currentSuite = null;
    }

    // when use fit, jasmine never calls suiteStarted / suiteDone, so make a fake one to use
    static get fakeFocusedSuite() {
        return {
            id: 'focused',
            description: 'focused specs',
            fullName: 'focused specs'
        }
    }
    
    initSuite(suite) {
        suite = cache.getSuite(suite);
        suite._startTime = new Date();
        suite._specs = [];
        suite._suites = [];
        suite._failures = 0;
        suite._skipped = 0;
        suite._disabled = 0;
        suite._parent = this.currentSuite;
        if (!this.currentSuite) {
            this.suites.push(suite);
        } else {
            this.currentSuite._suites.push(suite);
        }
        this.currentSuite = suite;
    }

    initSpec(spec, focusedSpecCallback) {
        if (!this.currentSuite) {
            // focused suite (fit) -- suiteStarted was never called
            focusedSpecCallback(fakeFocusedSuite);
        }
        spec = cache.getSpec(spec);
        spec._startTime = new Date();
        spec._suite = this.currentSuite;
        this.currentSuite._specs.push(spec);
    }

    finalizeSpec(spec) {
        spec = cache.getSpec(spec);
        spec._endTime = new Date();
        if (Utils.isSpecSkipped(spec)) { spec._suite._skipped++; }
        if (Utils.isSpecDisabled(spec)) { spec._suite._disabled++; }
        if (Utils.isSpecFailed(spec)) { spec._suite._failures++; }
    }

    finalizeSuite(suite, disabledSuiteCallback) {
        suite = cache.getSuite(suite);
        if (suite._parent === undefined) {
            // disabled suite (xdescribe) -- suiteStarted was never called
            disabledSuiteCallback(suite);
        }
        suite._endTime = new Date();
        this.currentSuite = suite._parent;
    }
}

module.exports = Process;