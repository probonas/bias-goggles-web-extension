const merge = require('webpack-merge');
const common = require('./webpack.common');

var prodExports = new Array();

prodExports.push(merge(common.firefox, {
    mode: "production",
}));

prodExports.push(merge(common.chromium, {
    mode: "production",
}));

console.log('====================');
console.log('Building: Production');
console.log('====================\n');

module.exports = prodExports;

