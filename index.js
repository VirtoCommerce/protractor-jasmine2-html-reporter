var fs           = require('fs'),
    _            = require('lodash'),
    path         = require('path'),
    Options      = require('./options'),
    cache        = require('./cache'),
    Process      = require('./process'),
    Screenshots  = require('./screenshots'),
    Utils        = require('./utils');

require('string.prototype.startswith');

var UNDEFINED, reportDate;

function elapsed(start, end) { return (end - start)/1000; }
function parseDecimalRoundAndFixed(num,dec){
    var d =  Math.pow(10,dec);
    return isNaN((Math.round(num * d) / d).toFixed(dec)) === true ? 0 : (Math.round(num * d) / d).toFixed(dec);
}
function escapeInvalidHtmlChars(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getReportDate(){
    if (reportDate === undefined)
        reportDate = new Date();
    return reportDate.getFullYear() + '' +
            (reportDate.getMonth() + 1) +
            reportDate.getDate() + ' ' +
            reportDate.getHours() + '' +
            reportDate.getMinutes() + '' +
            reportDate.getSeconds() + ',' +
            reportDate.getMilliseconds();
}


function Jasmine2HTMLReporter(options) {

    var self = this;

    Options.sanitize(options, self);

    function getReportFilename(specName){
        var name = '';
        console.log(self.fileNamePrefix);
        if (self.fileNamePrefix)
            name += self.fileNamePrefix + self.fileNameSeparator;

        name += self.fileName;

        if (specName !== undefined)
            name += self.fileNameSeparator + specName;

        if (self.fileNameSuffix)
            name += self.fileNameSeparator + self.fileNameSuffix;

        if (self.fileNameDateSuffix)
            name += self.fileNameSeparator + getReportDate();

        return name;
    }

    self.getScreenshotPrefix = function() {
        return self.screenshotsUrl ? self.screenshotsUrl : self.screenshotsFolder;
    };

    // ========================================================================== //

    var process = new Process();

    self._asyncFlow = null;

    self._addTaskToFlow = function(callback) {
        /* Create. */
        if (this._asyncFlow == null) {
            this._asyncFlow = callback();
        }
        /* Chain. */
        else {
            this._asyncFlow = this._asyncFlow.then(callback);
        }

    }

    self._awaitAsyncFlow = async function() {
        await this._asyncFlow;
        this._asyncFlow = null;
    }

    // Entry point
    self.jasmineStarted = function (suiteInfo) {
        debugger;
        //Delete previous reports unless cleanDirectory is false
        if (self.cleanDestination)
            Utils.rmdir(self.savePath);

        beforeEach(() => self._awaitAsyncFlow());
        afterAll(() => self._awaitAsyncFlow());
    };

    self.suiteStarted = function(suite) {
        this._addTaskToFlow(async () => process.initSuite(suite));
    };
    self.specStarted = function (spec) {
        this._addTaskToFlow(async () => process.initSpec(spec, self.suiteStarted));
    };

    self.specDone = function (spec) {
        this._addTaskToFlow(async function() {
            process.finalizeSpec(spec);
            await Screenshots.take(spec, self);
        });
    };

    self.suiteDone = function(suite) {
        this._addTaskToFlow(async () => process.finalizeSuite(suite, self.suiteStarted));
    };

    self.jasmineDone = function() {
        if (process.currentSuite) {
            // focused spec (fit) -- suiteDone was never called
            self.suiteDone(process.fakeFocusedSuite);
        }
        
        var output = '';
        for (var i = 0; i < process.suites.length; i++) {            
            output += self.getOrWriteNestedOutput(process.suites[i]);            
        }
        // if we have anything to write here, write out the consolidated file
        if (output) {
            wrapOutputAndWriteFile(getReportFilename(), output);
        }                
    };

    self.getOrWriteNestedOutput = function(suite) {
        var output = suiteAsHtml(suite);
        for (var i = 0; i < suite._suites.length; i++) {
            output += self.getOrWriteNestedOutput(suite._suites[i]);
        }
        if (self.consolidateAll || self.consolidate && suite._parent) {
            return output;
        } else {
            // if we aren't supposed to consolidate output, just write it now
            wrapOutputAndWriteFile(generateFilename(suite), output);
            return '';
        }
    };

    /******** Helper functions with closure access for simplicity ********/
    function generateFilename(suite) {
        return getReportFilename(getFullyQualifiedSuiteName(suite, true));
    }

    function getFullyQualifiedSuiteName(suite, isFilename) {
        var fullName;
        if (self.useDotNotation || isFilename) {
            fullName = suite.description;
            for (var parent = suite._parent; parent; parent = parent._parent) {
                fullName = parent.description + '.' + fullName;
            }
        } else {
            fullName = suite.fullName;
        }

        // Either remove or escape invalid HTML characters
        if (isFilename) {
            var fileName = "",
                rFileChars = /[\w\.]/,
                chr;
            while (fullName.length) {
                chr = fullName[0];
                fullName = fullName.substr(1);
                if (rFileChars.test(chr)) {
                    fileName += chr;
                }
            }
            return fileName;
        } else {
            return escapeInvalidHtmlChars(fullName);
        }
    }

    function suiteAsHtml(suite) {

        var html = '<article class="suite">';
        html += '<header>';
        html += '<h2>' + getFullyQualifiedSuiteName(suite) + ' - ' + elapsed(suite._startTime, suite._endTime) + 's</h2>';
        html += '<ul class="stats">';
        html += '<li>Tests: <strong>' + suite._specs.length + '</strong></li>';
        html += '<li>Skipped: <strong>' + suite._skipped + '</strong></li>';
        html += '<li>Failures: <strong>' + suite._failures + '</strong></li>';
        html += '</ul> </header>';

        for (var i = 0; i < suite._specs.length; i++) {
            var spec = suite._specs[i];
            html += '<div class="spec">';
            html += specAsHtml(spec);
                html += '<div class="resume">';
                if (spec.screenshot !== UNDEFINED){
                    html += '<a class="screenshot" href="">';
                    html += '<img src="' + self.getScreenshotPrefix() + spec.screenshot + '" width="100" height="100" />';
                    html += '</a>';
                }
                html += '<br />';
                var num_tests= spec.failedExpectations.length + spec.passedExpectations.length;
                var percentage = (spec.passedExpectations.length*100)/num_tests;
                html += '<span>Tests passed: ' + parseDecimalRoundAndFixed(percentage,2) + '%</span><br /><progress max="100" value="' + Math.round(percentage) + '"></progress>';
                html += '</div>';
            html += '</div>';
        }
        html += '\n </article>';
        return html;
    }
    function specAsHtml(spec) {

        var html = '<div class="description">';
        html += '<h3>' + escapeInvalidHtmlChars(spec.description) + ' - ' + elapsed(spec._startTime, spec._endTime) + 's</h3>';

        if (spec.failedExpectations.length > 0 || spec.passedExpectations.length > 0 ){
            html += '<ul>';
            _.each(spec.failedExpectations, function(expectation){
                html += '<li>';
                html += expectation.message + '<span style="padding:0 1em;color:red;">&#10007;</span>';
                html += '</li>';
            });
            if(self.showPassed === true){
                _.each(spec.passedExpectations, function(expectation){
                    html += '<li>';
                    html += expectation.message + '<span style="padding:0 1em;color:green;">&#10003;</span>';
                    html += '</li>';
                });
            }
            html += '</ul></div>';
        }
        else{
            html += '<span style="padding:0 1em;color:orange;">***Skipped***</span>';
            html += '</div>';
        }
        return html;
    }

    self.writeFile = function(filename, text) {
        var errors = [];
        var path = self.savePath;
        
        // Track errors in case no write succeeds
        try {
            var fs = require("fs");
            var nodejs_path = require("path");
            require("mkdirp").sync(path); // make sure the path exists
            var filepath = nodejs_path.join(path, filename);
            var htmlfile = fs.openSync(filepath, "w");
            fs.writeSync(htmlfile, text, 0);
            fs.closeSync(htmlfile);
            return;
        } catch (f) { errors.push('  NodeJS attempt: ' + f.message); }

        // If made it here, no write succeeded.  Let user know.
        Utils.log("Warning: writing html report failed for '" + path + "', '" +
            filename + "'. Reasons:\n" +
            errors.join("\n")
        );
    };

    // To remove complexity and be more DRY about the silly preamble and <testsuites> element
    var prefix = '<!DOCTYPE html><html><head lang=en><meta charset=UTF-8><title>Test Report -  ' + getReportDate() + '</title><style>body{font-family:"open_sans",sans-serif}.suite{width:100%;overflow:auto}.suite .stats{margin:0;width:90%;padding:0}.suite .stats li{display:inline;list-style-type:none;padding-right:20px}.suite h2{margin:0}.suite header{margin:0;padding:5px 0 5px 5px;background:#003d57;color:white}.spec{width:100%;overflow:auto;border-bottom:1px solid #e5e5e5}.spec:hover{background:#e8f3fb}.spec h3{margin:5px 0}.spec .description{margin:1% 2%;width:65%;float:left}.spec .resume{width:29%;margin:1%;float:left;text-align:center}</style></head>';
        prefix += '<body><section>';
    var suffix = '\n</section><script>!function(){var e=document.getElementsByClassName("screenshot");function n(e){var n=new Image;n.src=e.currentTarget.children[0].src,window.open("","_blank").document.write(n.outerHTML)}for(var r=0;r<e.length;r++)e[r].onclick=n}();</script></body></html>';

    function wrapOutputAndWriteFile(filename, text) {
        if (filename.substr(-5) !== '.html') { filename += '.html'; }
        self.writeFile(filename, (prefix + text + suffix));        
    }

    return this;
}

module.exports = Jasmine2HTMLReporter;
