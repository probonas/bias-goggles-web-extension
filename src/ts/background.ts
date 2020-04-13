import { userSettings } from "./usersettings";
import { utils } from "./utils";
import "./contextMenu";

/**
 * When the extension starts, we have to show the correct badge,
 * and setup the webRequest listeners.
 */
function initializeExtension () {
    utils.showCorrectBadge();
    userSettings.load(() => {
        // add webRequest listener
        chrome.webRequest.onResponseStarted.addListener((details) => {
            userSettings.get((settings) => {
                //retrieve data for all goggles user has installed, regarless
                //of whether they are selected(i.e. opened in a tab) or not
                settings.gogglesList.forEach(goggle => {
                    utils.getBiasDataForGoggles(utils.getDomainFromURL(details.url), goggle.id, () => { });
                });
            })
        },
            { urls: ["<all_urls>"], types: ["main_frame"] }
        );
    });
}

/**
 * Fires when extension is installed.
 */
chrome.runtime.onInstalled.addListener(() => {
    userSettings.initialize(() => {
        console.log('initialized user profile!');
        initializeExtension();
    });
});

/**
 * Fires when browser opens.
 * Doesn't fire upon installation!
 */
chrome.runtime.onStartup.addListener(() => {
    console.log('started extension');
    initializeExtension();
});

