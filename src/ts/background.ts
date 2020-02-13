import { userSettings } from "./usersettings";
import { utils } from "./utils";
import "./contextMenu";

chrome.runtime.onInstalled.addListener((details) => {
    console.log('initialized default user profile!');
    userSettings.initialize(utils.showCorrectBadge);
});

chrome.runtime.onStartup.addListener(() => {
    utils.showCorrectBadge();

    userSettings.load(() => {

        chrome.webRequest.onResponseStarted.addListener((details) => {
            userSettings.get((settings) => {
                settings.gogglesList.forEach(goggle => {
                    utils.getBiasDataForGoggles(utils.getDomainFromURL(details.url), goggle.id, () => { });
                });
            })
        },
            { urls: ["<all_urls>"], types: ["main_frame"] }
        );

    });

});

