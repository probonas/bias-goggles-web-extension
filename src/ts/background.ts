import { BiasGogglesAvailable } from "./types"
import { userSettings } from "./usersettings";
import { utils } from "./utils";

chrome.runtime.onInstalled.addListener((details) => {
    userSettings.save('pr', BiasGogglesAvailable.politicalParties, 100, '#0000FF', false, true);
    console.log('initialized default user profile!');
});

chrome.runtime.onStartup.addListener(() => {
    utils.removeExpiredDomains([userSettings.settingsKey]);
    console.log('restored user settings!');
});

chrome.webRequest.onCompleted.addListener((details) => {
    utils.getBiasData(details.url, undefined);
},
    { urls: ["<all_urls>"], types: ["main_frame"] }
);
