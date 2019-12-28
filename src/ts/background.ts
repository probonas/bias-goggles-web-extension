import { BiasGogglesAvailable } from "./types"
import { userSettings } from "./usersettings";
import { utils } from "./utils";
import { popoverAnalytics } from "./analytics"
import "./contextMenu";

chrome.runtime.onInstalled.addListener((details) => {
    userSettings.save('pr', BiasGogglesAvailable.politicalParties, 100, false, true, true, -1);
    console.log('initialized default user profile!');
    utils.showCorrectBadge();
    popoverAnalytics.initialize();
});

chrome.runtime.onStartup.addListener(() => {
    utils.showCorrectBadge();
});

chrome.webRequest.onCompleted.addListener((details) => {
    utils.getBiasData(details.url);
},
    { urls: ["<all_urls>"], types: ["main_frame"] }
);