import { userSettings } from "./usersettings";
import { utils } from "./utils";
import "./contextMenu";

chrome.runtime.onInstalled.addListener(() => {
    userSettings.initialize(() => {
        utils.showCorrectBadge();
        console.log('initialized user profile!');
    });
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

