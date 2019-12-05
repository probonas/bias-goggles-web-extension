import { BiasGogglesAvailable } from "./types"
import { userSettings } from "./usersettings";
import { utils } from "./utils";

chrome.runtime.onInstalled.addListener((details) => {
    userSettings.save('pr', BiasGogglesAvailable.politicalParties, 100, '#0000FF', false);
    console.log('initialized default user profile!');
});

chrome.runtime.onStartup.addListener(() => {
    //TODO
    //remove old ones!
    console.log('restored user settings!');
});

chrome.webRequest.onCompleted.addListener((details) => {
    utils.getBiasData(details.url);

},
    { urls: ["<all_urls>"], types: ["main_frame"] }
);
