const merge = require('webpack-merge');
const FileManagerPlugin = require('filemanager-webpack-plugin');

const common = require('./webpack.common');
const config = require('./webpack.config');

var devExports = new Array();

var firefoxUnitTests = Object.assign({}, {
    name: 'firefox-unit-tests',
    entry: {
        "storage.test": config.testsRoot + '/storage.test.ts'
    },
    output: {
        path: config.destinationRoot + "/firefox/tests",
    },
    plugins: [
        new FileManagerPlugin(
            {
                onEnd: {
                    copy: [
                        { source: config.testsJasmineRoot + '/*', destination: config.destinationRoot + '/firefox/tests' },
                    ]
                }
            })
    ]
});


var chromiumUnitTests = Object.assign({}, {
    name: 'chromium-unit-tests',
    entry: {
        "storage.test": config.testsRoot + '/storage.test.ts'
    },
    output: {
        path: config.destinationRoot + "/chromium/tests",
    },
    plugins: [
        new FileManagerPlugin(
            {
                onEnd: {
                    copy: [
                        { source: config.testsJasmineRoot + '/*', destination: config.destinationRoot + '/chromium/tests' },
                    ]
                }
            })
    ]
});

devExports.push(common.firefox);
devExports.push(common.chromium);

devExports.push(merge(common.firefox, firefoxUnitTests));
devExports.push(chromiumUnitTests = merge(common.chromium, chromiumUnitTests));

for (var i = 0; i < devExports.length; i++) {
    devExports[i] = merge(devExports[i], {
        mode: "development",
        devtool: "inline-source-map"
    });
}

console.log('=====================');
console.log('Building: Development');
console.log('=====================\n');

module.exports = devExports;
