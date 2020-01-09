const path = require('path');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const webpack = require('webpack');

const sourceRoot = path.resolve(__dirname, './src/ts');

const sourceRootHTML = path.resolve(__dirname, './src');
const sourceRootIcons = path.resolve(__dirname, './src/icons');

const destinationRoot = path.resolve(__dirname, './dist');
const platformSpecificsRoots = path.resolve(__dirname, './platform');

var config = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(css)$/,
        use: ['style-loader', 'css-loader']
      }
    ],
  },
  mode: 'development',
  devtool: "inline-source-map",
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new FileManagerPlugin(
      {
        onStart: {
          delete: [
            destinationRoot
          ],
          mkdir: [
            destinationRoot,
            destinationRoot + '/chromium',
            destinationRoot + '/firefox'
          ]
        },
        onEnd: {
          copy: [
            { source: sourceRootHTML + '/*.{html,css}', destination: destinationRoot + '/chromium/' },
            { source: sourceRootHTML + '/*.{html,css}', destination: destinationRoot + '/firefox/' },

            { source: sourceRootIcons + '/*', destination: destinationRoot + '/chromium/icons/' },
            { source: sourceRootIcons + '/*', destination: destinationRoot + '/firefox/icons/' },

            { source: platformSpecificsRoots + '/chromium/manifest.json', destination: destinationRoot + '/chromium/' },
            { source: platformSpecificsRoots + '/firefox/manifest.json', destination: destinationRoot + '/firefox/' },
          ]
        }
      })
  ]
};

var firefoxConfig = Object.assign({}, config, {
  name: 'firefox',
  entry: {
    app: platformSpecificsRoots + "/firefox/index.ts",
    popup: sourceRoot + "/popup.ts",
    popover: sourceRoot + "/popover.ts"
  },
  output: {
    path: destinationRoot + "/firefox",
    filename: '[name].js'
  }
});

var chromiumConfig = Object.assign({}, config, {
  name: 'chromium',
  entry: {
    app: platformSpecificsRoots + "/chromium/index.ts",
    popup: sourceRoot + "/popup.ts",
    popover: sourceRoot + "/popover.ts"
  },
  output: {
    path: destinationRoot + "/chromium",
    filename: '[name].js'
  }
});

module.exports = [
  firefoxConfig, chromiumConfig
];
