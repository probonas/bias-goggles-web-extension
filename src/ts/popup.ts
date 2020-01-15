import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";
import { utils } from "./utils";
import { OffOptions, Score, ContextBtnMsg, DomainData } from "./types";
import { userSettings } from "./usersettings";
import { extension } from "./storage";
import { templates } from "./templates";

import { GenericCard, ScoreCard } from "./infoCard";

import "bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

const navId = 'nav-bar';
const onBtnId = 'bg-onbtn';
const offBtnId = 'bg-offbtn';
const oneHourID = 'bg-onehour';
const twoHoursID = 'bg-twohours';
const sessionOnlyID = 'bg-session-only';
const permaID = 'bg-perma';
const onID = 'bg-on';

let idCounter = 0;
let thisWindowID: number;

let tabLabels = new Array();
let tabIDs = new Array();

function clearInfoTab() {
    for (let i = 0; i < tabIDs.length; i++) {
        while (document.getElementById(tabIDs[i]).hasChildNodes()) {
            document.getElementById(tabIDs[i]).firstChild.remove();
        }
    }
}

function showBtn(on: boolean) {

    const offButtonHTML = templates.get.OffButton(offBtnId, oneHourID, twoHoursID, sessionOnlyID, permaID);

    const onBtnHTML = templates.get.OnButton(onBtnId, onID);

    function removeOffBtn() {
        if (document.getElementById(offBtnId))
            document.getElementById(offBtnId).remove()
    };

    function removeOnBtn() {
        if (document.getElementById(onBtnId))
            document.getElementById(onBtnId).remove()
    }

    function addOnBtn() {
        if (document.getElementById(onBtnId))
            return;

        document.getElementById(navId).insertAdjacentHTML('beforeend', onBtnHTML);
    }

    function addOffBtn() {
        if (document.getElementById(offBtnId))
            return;

        document.getElementById(navId).insertAdjacentHTML('beforeend', offButtonHTML);
    }

    if (on) {
        removeOffBtn();
        addOnBtn();
    } else {
        removeOnBtn();
        addOffBtn();
    }
}

function reEnableCallback() {
    utils.enableExtension(() => {
        createToggleBtn();
        showSuccessAlert('Re-enabled!');
    });
}

function updateAndShowSuccessCallback() {
    createToggleBtn();
    showSuccessAlert('Success!');
}

function createToggleBtn() {
    let on = true;
    let off = false;

    userSettings.get((settings) => {

        if (settings.enabled) {
            showBtn(off);

            document.getElementById(oneHourID).addEventListener('click', () => {
                utils.disableExtension(OffOptions.ONE_HOUR, updateAndShowSuccessCallback, reEnableCallback);
            });

            document.getElementById(twoHoursID).addEventListener('click', () => {
                utils.disableExtension(OffOptions.TWO_HOURS, updateAndShowSuccessCallback, reEnableCallback);
            });

            document.getElementById(sessionOnlyID).addEventListener('click', () => {
                utils.disableExtension(OffOptions.SESSION_ONLY, updateAndShowSuccessCallback);
            });

            document.getElementById(permaID).addEventListener('click', () => {
                utils.disableExtension(OffOptions.PERMA, updateAndShowSuccessCallback);
            });
        } else {
            showBtn(on);

            document.getElementById(onID).addEventListener('click', () => {
                utils.enableExtension(updateAndShowSuccessCallback);
            });
        }

    });

}

function showSuccessAlert(msg: string) {
    const successAlert = templates.get.SuccessAlert(msg);

    document.getElementById('main-card').insertAdjacentHTML('afterbegin', successAlert);

    setTimeout(() => {
        (<HTMLButtonElement>(document.getElementById('main-card').firstElementChild.lastElementChild)).click();
    }, 2000);
}

export function updateContent(url: string, cleanTab: boolean, dismissable: boolean, showScores: boolean) {

    if (cleanTab)
        clearInfoTab();


    for (let i = 0; i < tabIDs.length; i++) {
        let tabID = tabIDs[i];

        //show spinner
        let card = new GenericCard((++idCounter).toString(), tabID, true, false);
        card.setTitle('Requesting data from service...');
        card.setStringContent(templates.get.Spinner());
        card.render();

        utils.getBiasDataForGoggles(url, tabID, (scoreData, scoreIndex) => {
            let cardID = (++idCounter).toString();

            card.delete();

            if (scoreIndex === -1) {
                let card = new GenericCard(cardID, tabID, dismissable, false);

                card.setTitle('Extension is disabled!');
                card.setStringContent('Enable it, and try again');
                card.render();
            } else if (scoreIndex === -2) {
                let card = new GenericCard(cardID, tabID, dismissable, false);
                //
                card.setTitle('Too bad... :(');
                card.setHTMLContent(uncrawled.create404Msg(url, ['text-info']));
                card.render();
            } else {
                let vector = scoreData.scores['pr'].vector;

                if (showScores) {
                    let card = new ScoreCard(cardID, tabID, dismissable, false);
                    //
                    card.setTitle(utils.getDomainFromURL(url),
                        Math.fround(scoreData.scores['pr'].bias_score * 100).toFixed(2),
                        Math.fround(scoreData.scores['pr'].bias_score * 100).toFixed(2));
                    card.setStringContent('');
                    card.render(); //canvas can only be rendered if element is already in the dom
                    chart.draw(vector, 220, 300,
                        document.getElementById(cardID).getElementsByClassName('card-text')[0] as HTMLElement,
                        'chart' + cardID, true);
                } else {
                    let card = new ScoreCard(cardID, tabID, dismissable, false);
                    //
                    card.setTitle(utils.getDomainFromURL(url));
                    card.setStringContent('');
                    card.render(); //canvas can only be rendered if element is already in the dom
                    chart.draw(vector, 220, 300,
                        document.getElementById(cardID).getElementsByClassName('card-text')[0] as HTMLElement,
                        'chart' + cardID, true);
                }

            }
        });

    }

}

createToggleBtn();

/* new tab is activated */
chrome.tabs.onActivated.addListener((activeTabInfo) => {
    if (activeTabInfo.windowId === thisWindowID)
        chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
            updateContent(tabs[0].url, true, false, true);
        });
});

/* new page is loaded in the tab */
chrome.tabs.onUpdated.addListener((tabID, chageInfo, tab) => {
    if (tab.windowId === thisWindowID) {
        if (chageInfo.status == 'complete') {
            chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
                updateContent(tabs[0].url, true, false, true);
            });
        }
    }
});

chrome.windows.getCurrent((windowInfo) => {
    thisWindowID = windowInfo.id;
    chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
        updateContent(tabs[0].url, true, false, true);
    });
});

chrome.runtime.onMessage.addListener((msg: ContextBtnMsg) => {
    if (msg.windowID === thisWindowID)
        updateContent(msg.url, false, true, true);
});

let sync = <HTMLSelectElement>document.getElementById('syncSelect');
let goggle = <HTMLSelectElement>document.getElementById('goggleSelect');
let popover = <HTMLSelectElement>document.getElementById('popoverSelect');

let syncModal = <HTMLButtonElement>document.getElementById('syncModalBtn');

sync.addEventListener('change', () => {

    if (sync.value === 'Yes') {
        syncModal.click();
    }

});

let saveSettingsBtn = <HTMLButtonElement>document.getElementById('saveSettingsBtn');

saveSettingsBtn.addEventListener('click', () => {

    userSettings.get((settings) => {

        if (goggle.value !== 'Choose...') {
            settings.goggles = goggle.value;
        }

        if (sync.value !== 'Choose...' && sync.value === 'Yes') {
            settings.syncEnabled = true;
        } else if (sync.value !== 'Choose...' && sync.value === 'No') {
            settings.syncEnabled = false;
        }

        if (popover.value !== 'Choose...' && popover.value === 'Yes') {
            settings.pagePopoverEnabled = true;
        } else if (popover.value !== 'Choose...' && popover.value === 'No') {
            settings.pagePopoverEnabled = false;
        }

        console.log(settings);

        userSettings.update(settings, () => {
            showSuccessAlert('Settings Saved!');
        })

    });

});

function showDomainDataUnderSettings() {
    extension.storage.getAllDomainData((data) => {
        let domainDataOverviewDiv = document.getElementById('domainDataOverview');
        let cards: string = '';

        let innerTables = '';

        //console.log(data);

        let formattedData: { [key: string]: { [key: string]: any } } = {};

        for (let key in data) {

            if (!isNaN(parseInt(key)))
                continue;

            let goggle = key.split(' ')[0];
            let domain = key.split(' ')[1];

            let domainData = <DomainData>data[key];

            //console.log(domainData.scoreIndex);

            let scores = (<Score>data[domainData.scoreIndex]).scores;

            if (typeof formattedData[domain] === 'undefined')
                formattedData[domain] = {};

            formattedData[domain][goggle] = {
                scores
            };
        }

        for (let key in Object.keys(formattedData)) {
            let domain = Object.keys(formattedData)[key];
            innerTables = '';

            for (let goggleKey in Object.keys(formattedData[domain])) {
                let goggleName = Object.keys(formattedData[domain])[goggleKey];

                let biasData = formattedData[domain][goggleName];

                //@ts-ignore
                let pr = biasData.scores['pr'];
                //@ts-ignore
                let lt = biasData.scores['lt'];
                //@ts-ignore
                let ic = biasData.scores['ic'];

                let unrollscore = (scoreValue: any) => {
                    let ret = '';

                    for (let property in Object.keys(scoreValue)) {
                        let propertyName = Object.keys(scoreValue)[property];

                        if (propertyName === 'vector') {
                            ret += templates.get.TableRow('Vectors', 'Support', true);

                            for (let vectorKey in Object.keys(scoreValue[propertyName])) {
                                let vectorName = Object.keys(scoreValue[propertyName])[vectorKey];

                                ret += templates.get.TableRow(vectorName, scoreValue[propertyName][vectorName], false);
                            }

                        } else {
                            ret += templates.get.TableRow(propertyName, scoreValue[propertyName], false);
                        }
                    }

                    return ret;
                }

                let rows = unrollscore(pr);
                //rows += unrollscore(lt);
                //rows += unrollscore(ic);

                innerTables += templates.get.Table('Goggles:', goggleName, rows) + '<br>';
            }
            cards += templates.get.AccordionCard(domain, innerTables, ++idCounter, 'domainDataOverview');
        }

        domainDataOverviewDiv.insertAdjacentHTML('afterbegin', cards);
    });
}

function showAnalyticsDataUnderSettings() {
    extension.storage.getAnalytics((analytics) => {
        if (analytics === null)
            return;

        let analyticsDataOverviewDiv = document.getElementById('analyticsDataOverview');
        let cards = '';

        for (let i = 0; i < analytics.total; i++) {
            let rows = '';
            let table = '';

            for (let analyticsKey in Object.keys(analytics.data[i])) {
                let name = Object.keys(analytics.data[i])[analyticsKey];
                //@ts-ignore
                rows += createRowForTable(name, (analytics.data[i])[name], false);
            }

            table = templates.get.Table('Key', 'Value', rows);
            cards += templates.get.AccordionCard('Analytics Data #' + i, table, ++idCounter, 'analyticsDataOverview');
        }

        analyticsDataOverviewDiv.insertAdjacentHTML('afterbegin', cards);
    });
}

document.getElementById('delete-data-btn').addEventListener('click', () => {
    extension.storage.clear();
});

userSettings.get((settings) => {

    for (let i = 0; i < settings.gogglesList.length; i++) {
        tabLabels.push(settings.gogglesList[i].name);
        tabIDs.push(settings.gogglesList[i].id);
    }

    let tabs = templates.get.CreateTabs(tabLabels, tabIDs);

    document.getElementById('live-info').insertAdjacentHTML('beforeend', tabs);
});

showDomainDataUnderSettings();
showAnalyticsDataUnderSettings();

//update data under settings without the need to reload popup/sidebar
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (changes.oldValue !== undefined || changes.oldValue !== null) {

        while (document.getElementById('domainDataOverview').hasChildNodes())
            document.getElementById('domainDataOverview').firstChild.remove();

        while (document.getElementById('analyticsDataOverview').hasChildNodes())
            document.getElementById('analyticsDataOverview').firstChild.remove();

        showDomainDataUnderSettings();
        showAnalyticsDataUnderSettings();
    }
});