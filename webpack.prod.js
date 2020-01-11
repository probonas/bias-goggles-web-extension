const merge = require('webpack-merge');
const common = require('./webpack.common');

var prodExports = new Array();

for (var i = 0; i < common.length; i++) {
    prodExports[i] = merge(common[i], {
        mode: "production",
    });
}

console.log('====================');
console.log('Building: Production');
console.log('====================\n');

module.exports = prodExports;

