class Options {
    static sanitize(input, output) {
        input = input || {};

        output.useDotNotation = input.useDotNotation === undefined ? true : input.useDotNotation;

        output.consolidate = input.consolidate === undefined ? true : input.consolidate;
        output.consolidateAll = output.consolidate !== false && (input.consolidateAll === undefined ? true : input.consolidateAll);

        output.fileNameSeparator = input.fileNameSeparator === undefined ? '-' : input.fileNameSeparator;
        output.fileNamePrefix = input.fileNamePrefix === undefined ? '' : input.fileNamePrefix;
        output.fileNameSuffix = input.fileNameSuffix === undefined ? '' : input.fileNameSuffix;
        output.fileNameDateSuffix = input.fileNameDateSuffix === undefined ? false : input.fileNameDateSuffix;
        output.fileName = input.fileName === undefined ? 'htmlReport' : input.fileName;
        output.savePath = input.savePath || '';
        output.cleanDestination = input.cleanDestination === undefined ? true : input.cleanDestination;

        output.fixedScreenshotName = input.fixedScreenshotName === undefined ? false : input.fixedScreenshotName;
        output.screenshotsFolder = input.inlineImages ? '' : (input.screenshotsFolder || 'screenshots').replace(/^\//, '') + '/';
        output.screenshotsUrl = input.inlineImages ? '' : output.screenshotsFolder;

        output.inlineImages = input.inlineImages || '';
        output.optimizeImages = input.optimizeImages || { lossy: true, level: 1 };
        output.takeScreenshots = input.takeScreenshots === undefined ? true : input.takeScreenshots;
        output.takeScreenshotsOnlyOnFailures = input.takeScreenshotsOnlyOnFailures === undefined ? false : input.takeScreenshotsOnlyOnFailures;

        output.showPassed = input.showPassed === undefined ? true : input.showPassed;
    }
}

module.exports = Options;