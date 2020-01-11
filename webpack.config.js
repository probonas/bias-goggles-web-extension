const path = require('path');
const webpack = require('webpack');

const FileManagerPlugin = require('filemanager-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const sourceRoot = path.resolve(__dirname, './src/ts');
const sourceRootHTML = path.resolve(__dirname, './src/html');
const sourceRootIcons = path.resolve(__dirname, './src/icons');

const destinationRoot = path.resolve(__dirname, './dist');
const platformSpecificsRoots = path.resolve(__dirname, './platform');

const testsRoot = path.resolve(__dirname, './tests');
const testsJasmineRoot = path.resolve(__dirname, './tests/jasmine');

var configScaffold = {
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(css)$/,
                use: ['style-loader', 'css-loader']
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new CleanWebpackPlugin(),
        new FileManagerPlugin(
            {
                onEnd: {
                    copy: [
                        { source: sourceRootHTML + '/*.{html,css}', destination: destinationRoot + '/chromium' },
                        { source: sourceRootHTML + '/*.{html,css}', destination: destinationRoot + '/firefox' },

                        { source: sourceRootIcons + '/*', destination: destinationRoot + '/chromium/icons' },
                        { source: sourceRootIcons + '/*', destination: destinationRoot + '/firefox/icons' },

                        { source: platformSpecificsRoots + '/chromium/manifest.json', destination: destinationRoot + '/chromium' },
                        { source: platformSpecificsRoots + '/firefox/manifest.json', destination: destinationRoot + '/firefox' },
                    ],
                    delete: [
                        sourceRoot + '/*.{js,map}'
                    ]
                }
            })
    ]
};

module.exports = {
    configScaffold,
    'sourceRoot': sourceRoot,
    'sourceRootHTML': sourceRootHTML,
    'sourceRootIcons': sourceRootIcons,
    'destinationRoot': destinationRoot,
    'platformSpecificsRoots': platformSpecificsRoots,
    'testsRoot': testsRoot,
    'testsJasmineRoot': testsJasmineRoot
};