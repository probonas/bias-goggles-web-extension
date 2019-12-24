const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const webpack = require('webpack');

const sourceRoot = path.resolve(__dirname, './src/ts');

const sourceRootHTML = path.resolve(__dirname, './src');
const sourceRootJS = path.resolve(__dirname, './src/js');
const sourceRootIcons = path.resolve(__dirname, './src/img');

const destinationRoot = path.resolve(__dirname, './dist');
const platformSpecificsRoots = path.resolve(__dirname, './platform');

module.exports = {
  mode: 'development',
  entry: {
    background: sourceRoot + "/background.ts",
    popup: sourceRoot + "/popup.ts",
    popover: sourceRoot + '/popover.ts'
  },
  devtool: "inline-source-map",
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
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: sourceRootJS,
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new CleanWebpackPlugin(
      {
        verbose: true
      }
    ),
    new FileManagerPlugin(
      {
        onEnd: {
          delete: [
            destinationRoot + '/*'
          ],
          copy: [
            { source: sourceRootHTML + '/*.{html,css,js}', destination: destinationRoot + '/chromium/' },
            { source: sourceRootHTML + '/*.{html,css,js}', destination: destinationRoot + '/firefox/' },
            { source: sourceRootHTML + '/*.{html,css,js}', destination: destinationRoot + '/opera/' },
            { source: sourceRootHTML + '/*.{html,css,js}', destination: destinationRoot + '/safari/' },

            { source: sourceRootJS + '/*', destination: destinationRoot + '/chromium/' },
            { source: sourceRootJS + '/*', destination: destinationRoot + '/firefox/' },
            { source: sourceRootJS + '/*', destination: destinationRoot + '/opera/' },
            { source: sourceRootJS + '/*', destination: destinationRoot + '/safari/' },

            { source: sourceRootIcons + '/*', destination: destinationRoot + '/chromium/icons/' },
            { source: sourceRootIcons + '/*', destination: destinationRoot + '/firefox/icons/' },
            { source: sourceRootIcons + '/*', destination: destinationRoot + '/opera/icons/' },
            { source: sourceRootIcons + '/*', destination: destinationRoot + '/safari/icons' },

            { source: platformSpecificsRoots + '/*/*', destination: destinationRoot }
          ]
        }
      })
  ]
};
