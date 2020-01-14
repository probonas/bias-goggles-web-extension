import { PoliticalParties, SportsTeams } from "./types"
import { userSettings } from "./usersettings";
import { utils } from "./utils";
import { popoverAnalytics } from "./analytics"
import "./contextMenu";
import { settings } from "cluster";

chrome.runtime.onInstalled.addListener((details) => {
    userSettings.save('pr', PoliticalParties.id, 100, false, true, false, -1,
        [PoliticalParties, SportsTeams]);
    console.log('initialized default user profile!');
    utils.showCorrectBadge();
    popoverAnalytics.initialize();
});

chrome.runtime.onStartup.addListener(() => {
    utils.showCorrectBadge();
});

chrome.webRequest.onCompleted.addListener((details) => {
    userSettings.get((settings) => {
        for (let i = 0; i < settings.gogglesList.length; i++) {
            utils.getBiasDataForGoggles(details.url, settings.gogglesList[i].id);
        }
    })
},
    { urls: ["<all_urls>"], types: ["main_frame"] }
);