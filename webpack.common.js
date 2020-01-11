const merge = require('webpack-merge');
const config = require('./webpack.config');

var distScaffold = merge(config.configScaffold, {
    entry: {
        popup: config.sourceRoot + "/popup.ts",
        popover: config.sourceRoot + "/popover.ts"
    },
    output: {
        filename: '[name].js'
    }
});

var firefox = merge(distScaffold, {
    name: 'firefox',
    entry: {
        main: config.platformSpecificsRoots + "/firefox/index.ts",
    },
    output: {
        path: config.destinationRoot + "/firefox",
    }
});

var chromium = merge(distScaffold, {
    name: 'chromium',
    entry: {
        main: config.platformSpecificsRoots + "/chromium/index.ts",
    },
    output: {
        path: config.destinationRoot + "/chromium",
    }
});

module.exports = [
    firefox, chromium
];