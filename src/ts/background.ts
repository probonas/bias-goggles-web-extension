import { PoliticalParties, SportsTeams } from "./types"
import { userSettings } from "./usersettings";
import { utils } from "./utils";
import { popoverAnalytics } from "./analytics"
import "./contextMenu";

chrome.runtime.onInstalled.addListener((details) => {
    userSettings.save('pr', PoliticalParties.id, 100, false, true, false, -1,
        [PoliticalParties, SportsTeams]);
    console.log('initialized default user profile!');
    utils.showCorrectBadge();
    popoverAnalytics.initialize();
});

chrome.runtime.onStartup.addListener(() => {
    utils.showCorrectBadge();

    userSettings.initScoreIndex(() => {

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

