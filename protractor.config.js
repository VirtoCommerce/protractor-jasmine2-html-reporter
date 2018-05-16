// An example configuration file
exports.config = {

    // Capabilities to be passed to the webdriver instance.
    multiCapabilities: [
        { 'browserName': 'chrome' }
      //{ 'browserName': 'firefox' }
    ],
    framework: 'jasmine2',

    specs: ['test/**/*[sS]pec.js'],

    allScriptsTimeout: 50000,
    defaultTimeoutInterval: 500000,
    onPrepare: function () {
        return global.browser.getProcessedConfig().then(function (config) {
            var Jasmine2HtmlReporter = require('./index.js');

            jasmine.getEnv().addReporter(new Jasmine2HtmlReporter({
                inlineImages: true,
                savePath: './reports/'
            }));
        });
        
    }
};