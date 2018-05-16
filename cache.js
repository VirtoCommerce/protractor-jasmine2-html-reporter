var Utils = require("./utils");

class Cache {
    constructor() {
        this.suites = {};
        this.specs = {};
    }

    getSuite(suite) {
        this.suites[suite.id] = Utils.extend(this.suites[suite.id] || {}, suite);
        return this.suites[suite.id];
    }

    getSpec(spec) {
        this.specs[spec.id] = Utils.extend(this.specs[spec.id] || {}, spec);
        return this.specs[spec.id];
    }
}

// Singletone
module.exports = new Cache();