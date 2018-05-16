var fs = require("fs");
var path = require("path");

class Utils {
    static isSpecFailed(spec) {
        return spec.status === "failed";
    }

    static isSpecSkipped(spec) {
        return spec.status === "pending";
    }

    static isSpecDisabled(spec) {
        return spec.status === "disabled";
    }

    // performs a shallow copy of all props of `obj` onto `duplicate`
    static extend(duplicate, obj) {
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                duplicate[prop] = obj[prop];
            }
        }
        return duplicate;
    }

    static log(str) {
        const output = global.console || console;
        if (output && output.log) {
            output.log(str);
        }
    }

    static rmdir(dir) {
        try {
            if (fs.existsSync(dir)) {
                const list = fs.readdirSync(dir);
                for (let i = 0; i < list.length; i++) {
                    const filename = path.join(dir, list[i]);
                    const stat = fs.statSync(filename);
                    if (stat.isDirectory()) {
                        rmdir(filename);
                    } else {
                        fs.unlinkSync(filename);
                    }
                }
                fs.rmdirSync(dir);
            }
        } catch (e) {
            this.log("Problem trying to remove a folder: " + dir);
        }
    }
}

module.exports = Utils;