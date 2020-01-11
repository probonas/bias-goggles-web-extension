const merge = require('webpack-merge');
const FileManagerPlugin = require('filemanager-webpack-plugin');

const common = require('./webpack.common');
const config = require('./webpack.config');

var devExports = new Array();

var unitTests = Object.assign({}, config.configcaffold, {
    name: 'unit-tests',
    entry: config.testsRoot + '/index.ts',
    output: {
        path: config.destinationRoot + "/firefox/tests",
        filename: '[name].js'
    },
    plugins: [
        new FileManagerPlugin(
            {
                onEnd: {
                    copy: [
                        { source: config.testsJasmineRoot + '/*', destination: config.destinationRoot + '/chromium/tests' },
                        { source: config.testsJasmineRoot + '/*', destination: config.destinationRoot + '/firefox/tests' }
                    ]
                }
            })
    ]
});

common.push(unitTests);

for (var i = 0; i < common.length; i++) {
    devExports[i] = merge(common[i], {
        mode: "development",
        devtool: "inline-source-map"
    });
}

console.log('=====================');
console.log('Building: Development');
console.log('=====================\n');

module.exports = devExports;
