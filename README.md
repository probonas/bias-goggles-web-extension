# Bias Goggles - Browser Extension [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC) ![version: 0.9.0](https://img.shields.io/badge/version-0.9.0-success) ![platforms: firefox|chromium](https://img.shields.io/badge/platform-firefox%20%7C%20chromium-lightgrey) 

> <i><b>Bias Goggles</b> is a rapidly evolving prototype system that enables users to explore the bias characteristics of web domains for a specific user-defined concept.</i> 

from <a href="http://pangaia.ics.forth.gr/bias-goggles/about.html"> bias goggle homepage</a>

This project implements a browser plugin for firefox and chromium which enables users to interact with the Bias Goggles engine.

## Getting Started

------

### Prerequisites

* A Unix-like operating system. On Windows WSL is preferred, but nodejs under powershell/cygwin should work too.
* [Node.js](https://nodejs.org/en/download/) with npm to manage the dependencies
* Any IDE that supports typescript.[VS Code](https://code.visualstudio.com/) is highly recommended.

### Install dependencies

Run: 

``` bash
npm install
```

in order to download all dependecies needed to develop and build the extension.

### Build development version ![size: ~9.5MB](https://img.shields.io/badge/size-~%209.5%20MB-informational)

Run:

``` bash
npm run dev
```

A newly created folder named `dist` should be present under project's root. The `dist` folder contains two subfolders named chromium and firefox where the created extensions are stored respectively. Use the files under these folders to load the extension in your browser during development. Unit tests are also bundled with this version and are located under `dist/firefox/tests` and `dist/chromium/tests` .

### Production ![size: ~1.9 MB](https://img.shields.io/badge/size-~%201.9%20MB-informational)

Run:

``` bash
npm run build
```

to build the minified production ready version of the extension. This version doesn't contain any unit tests and is found under `dist` , just like the development one.

### Load the extension on Firefox ![firefox-logo](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_24x24.png)

Navigate to `about:debugging` . Then click `This firefox` , then `Load temporary plugin` and load the contents of the `dist/firefox` folder. Keep in mind that you have to repeat this process everytime you reopen the browser.

![load-to-firefox-step-by-step-gif](https://kzef3q.am.files.1drv.com/y4mIP0RZYgEnvWT7bNwgWRYgHfb3H1Kpi-1nOBswrQ4TBFjiE7KvFEPB5bcju786Sm4B0jY6YANUYz2LpUOZ69MTMNOJVcaE7_lcXDEBVF5ZQGSiNfLNTXUdKB0KIA5bM3vkJOE-uyZ1CvEYPMqonEzh-CEkyYVda12t15nJhEOdb69_qMpcEwSAmn_vChfSnMxHUYLelLVjLpftb_NuGj9Lg/firefox-load.gif?psid=1)

### Load the extension on Chromium/Chrome ![chromium-logo](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chromium/chromium_24x24.png)

Navigate to `about:debugging` . Then click `This firefox` , then `Load temporary plugin` and load the contents of the `dist/firefox` folder. Keep in mind that you have to repeat this process everytime you reopen the browser.

### How to sign the extension with web-ext (Firefox)

[web-ext documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)

``` bash
npx web-ext sign --api-key=$WEB_EXT_API_KEY --api-secret=$WEB_EXT_API_SECRET
```

