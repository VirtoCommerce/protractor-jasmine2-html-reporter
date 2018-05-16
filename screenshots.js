var hat = require('hat');
var mkdirp = require('mkdirp');
var path = require('path');

var imagemin = require('imagemin');
var pngout = require('imagemin-pngout');
var pngquant = require('imagemin-pngquant');

var cache = require("./cache");
var Utils = require('./utils');

// TODO: Replace with utils / methods from index.js
function sanitizeFilename(name) {
    name = name.replace(/\s+/gi, '-'); // Replace white space with dash
    return name.replace(/[^a-zA-Z0-9\-]/gi, ''); // Strip any special charactere
}

function writeScreenshot(data, filename) {
    var stream = fs.createWriteStream(filename);
    stream.write(new Buffer(data, 'base64'));
    stream.end();
};

class Screenshots {
    static async take(spec, options) {
        spec = cache.getSpec(spec);

        //Take screenshots taking care of the configuration
        if (options.takeScreenshots && (!options.takeScreenshotsOnlyOnFailures || options.takeScreenshotsOnlyOnFailures && Utils.isSpecFailed(spec))) {
            if (!options.fixedScreenshotName)
                spec.screenshot = hat() + '.png';
            else
                spec.screenshot = sanitizeFilename(spec.description) + '.png';

            var png = await browser.takeScreenshot();
            if (options.optimizeImages) {
                var algorithm;
                const minLevel = 0;
                const maxLevel = options.optimizeImages.lossy ? 5 : 2;
                var level = Math.max(Math.min(options.optimizeImages.level, maxLevel), minLevel);
                if (options.optimizeImages.lossy) {
                    // 5: 100%, 4: 90%, 3: 80%, 2: 70%, 1: 60%, 0: 50%
                    var quality = 100 - 10 * (maxLevel - level);
                    var speed = level * 2;
                    algorithm = pngquant({ quality: quality, speed: speed });
                } else {
                    // strategy support 0..4, but 0..1 is not usable because of timeouts, so use only 2..4
                    var strategy = level + 2;
                    algorithm = pngout({ strategy: strategy });
                }
                var buffer = await imagemin.buffer(new Buffer(png, 'base64'), { plugins: algorithm });
                png = buffer.toString('base64');
            }
            if (options.inlineImages) {
                spec.screenshot = 'data:image/png;base64,' + png;
            } else {
                //Folder structure and filename
                var screenshotPath = path.join(options.savePath, options.screenshotsFolder, spec.screenshot);

                mkdirp(path.dirname(screenshotPath), function (err) {
                    if (err) {
                        throw new Error('Could not create directory for ' + screenshotPath);
                    }
                    writeScreenshot(png, screenshotPath);
                });
            }
        }
    }
}

module.exports = Screenshots;