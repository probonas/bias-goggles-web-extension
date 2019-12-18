import { BiasGogglesAvailable } from "./types"
import { userSettings } from "./usersettings";
import { utils } from "./utils";

chrome.runtime.onInstalled.addListener((details) => {
    userSettings.save('pr', BiasGogglesAvailable.politicalParties, 100, false, true, -1);
    console.log('initialized default user profile!');
    utils.updateBadge();
});

chrome.runtime.onStartup.addListener(()=>{
    utils.updateBadge();
});
chrome.webRequest.onCompleted.addListener((details) => {
    utils.getBiasData(details.url);
},
    { urls: ["<all_urls>"], types: ["main_frame"] }
);
