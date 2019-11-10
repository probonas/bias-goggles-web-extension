const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');

const sourceRoot = path.resolve(__dirname, './src/ts');

const sourceRootHTML = path.resolve( __dirname, './src');
const sourceRootJS = path.resolve(__dirname, './src/js');
const sourceRootIcons = path.resolve(__dirname, './src/img');

const destinationRoot = path.resolve(__dirname, './dist');
const platformSpecificsRoots = path.resolve(__dirname, './platform');

module.exports = {
  mode: 'development',
  entry: {
    background: sourceRoot + "/background.ts",
    getbias: sourceRoot + "/getbias.ts"
  },
  devtool: "inline-source-map",
  module: {
    rules: [
        {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        },
    ],
  },
  resolve: {
    extensions: ['.tsx','.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: sourceRootJS,
  },
  plugins: [
    new CleanWebpackPlugin(
      {
        verbose: true
      }
    ),
    new FileManagerPlugin(
      {
        onEnd:{
            delete:[
              destinationRoot + '/*'
            ],
            copy: [
              { source: sourceRootHTML + '/*.html', destination: destinationRoot + '/chromium/' },
              { source: sourceRootHTML + '/*.html', destination: destinationRoot + '/firefox/' },
              { source: sourceRootHTML + '/*.html', destination: destinationRoot + '/opera/' },
              { source: sourceRootHTML + '/*.html', destination: destinationRoot + '/safari/' }, 
                
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