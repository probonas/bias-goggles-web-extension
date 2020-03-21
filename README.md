# Bias Goggles - Browser Extension [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC) ![version: 0.9.0](https://img.shields.io/badge/version-0.9.0-success) ![platforms: firefox|chromium](https://img.shields.io/badge/platform-firefox%20%7C%20chromium-lightgrey) 

from the [bias goggle homepage](http://pangaia.ics.forth.gr/bias-goggles/about.html)

> _Bias Goggles is a rapidly evolving prototype system that enables users to explore the bias characteristics of web domains for a specific user-defined concept._

This project implements a browser plugin for firefox and chromium which enables users to interact with the Bias Goggles system.
## Quick Install Extension ⚡
------

* [Firefox-Addon](https://jped3q.am.files.1drv.com/y4mtk65XtbE0efPuJ9lGnHXk74L0d1UyxAt6WgY9dynUkCNoNV8CDSQnUjCa0YEbD36KykEx6ffGSGS2S_4ZpWXcUiEnVr1VURcgIorBDiApbmdNkiLnuvN_QypQxickdvThXTCJS_Rx0gh7aGRqP-qGJBCKVZv-1K8PPXkx3xecVlZ_2uTyiPGI0qPdUu0DSKJSay4nkXBC-7jalrYBoWyOA)
* Chrome/Chromium Addon: download this [zip](https://1drv.ms/u/s!AoICqO06GNF0gswuYjHkOLMKJWGMuA?e=YAln1A) ,unzip it and follow [these](http://www.adambarth.com/experimental/crx/docs/packaging.html) instructions. 

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

## Development  ![size: ~9.5MB](https://img.shields.io/badge/size-~%209.5%20MB-informational)
------

Run:

``` bash
npm run dev
```

A newly created folder named `dist` should be present under project's root. The `dist` folder contains two subfolders named chromium and firefox where the created extensions are stored respectively. Use the files under these folders to load the extension in your browser during development. Unit tests are also bundled with this version and are located under `dist/firefox/tests` and `dist/chromium/tests` .

### Load the extension on Firefox ![firefox-logo](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_24x24.png)

Navigate to `about:debugging` . Then click `This firefox` , then `Load temporary plugin` and load the contents of the `dist/firefox` folder. Keep in mind that you have to repeat this process everytime you reopen the browser.

![load-to-firefox-step-by-step-gif](https://kzef3q.am.files.1drv.com/y4mIP0RZYgEnvWT7bNwgWRYgHfb3H1Kpi-1nOBswrQ4TBFjiE7KvFEPB5bcju786Sm4B0jY6YANUYz2LpUOZ69MTMNOJVcaE7_lcXDEBVF5ZQGSiNfLNTXUdKB0KIA5bM3vkJOE-uyZ1CvEYPMqonEzh-CEkyYVda12t15nJhEOdb69_qMpcEwSAmn_vChfSnMxHUYLelLVjLpftb_NuGj9Lg/firefox-load.gif?psid=1)

### Load the extension on Chromium/Chrome ![chromium-logo](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chromium/chromium_24x24.png)

Navigate to `chrome://extensions` . Then click `Developer Mode` , then `Load upacked` and load the contents of the `dist/chromium` folder.

![load-to-chrome-step-by-step-gif](https://kzev3q.am.files.1drv.com/y4msNelP_M1hBuk3PoI3ILBiRsXX0FmiXiP501s0n2WuCulM2qDZK8HfVzbUND1O3sK48LkkQi6tor5E-pvFsDoeagK4HMMgtIoDO6MQaisH5pmTeJQMbf5gQMJIyTfJq7ct1DXWsqY1l6a2jufNeMTwdddesrKG9h2unADn56IB_Vb0OpScCONlc_nBlfewct4GM7aiAlO9jGDnEoV6AB0Sg/chrome-load.gif?psid=1)

## Production ![size: ~1.9 MB](https://img.shields.io/badge/size-~%201.9%20MB-informational)
------

Run:
``` bash
npm run build
```

to build the minified production ready version of the extension. This version doesn't contain any unit tests and is found under `dist` , just like the development one.

### Create .xpi for Firefox ![firefox-logo](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_24x24.png)

Follow these [instructions](https://extensionworkshop.com/documentation/develop/web-ext-command-reference#web-ext-sign) in order to obtain API access credentials. 

Then run the following replacing `your-key` and `your-secret` with the ones you have obtained: 
``` bash
WEB_EXT_API_KEY="your-key"
WEB_EXT_API_SECRET="your-secret"
cd dist/firefox
npx web-ext sign --api-key=$WEB_EXT_API_KEY --api-secret=$WEB_EXT_API_SECRET
```

The .xpi file should now be located under the newly created folder `web-ext-artifacts` in the current working directory and is also uploaded to your personal Firefox Developer Account, where you can proceed with publishing it.
This file can be installed manually just like any other extension not in the Firefox Addons store.

### Create .crx for chromium ![chromium-logo](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chromium/chromium_24x24.png)

To create .crx file follow [these instructions](http://www.adambarth.com/experimental/crx/docs/packaging.html).
The files needed are located under `dist/chromium`.
To publish the extension to Chrome Web Store follow [these](https://developer.chrome.com/webstore/get_started_simple#step5).

