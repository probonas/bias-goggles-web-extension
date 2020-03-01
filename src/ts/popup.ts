import { utils } from "./utils";
import {
    OffOptions, ContextBtnMsg, EXTENSION_DISABLED, UNCRAWLED_URL, INVALID_URL, Score,
} from "./types";
import { userSettings } from "./usersettings";
import { extension } from "./storage";
import { templates } from "./templates";

import {
    ScoreCard, UncrawledDomainCard, ExtensionDisabledCard,
    NotAWebpageCard, SpinnerCard, CompareCard, GoggleCard, cards
} from "./infoCard";

import "bootstrap"; //@types/bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import "@fortawesome/fontawesome-free/js/all.min.js";

import { uncrawled } from "./uncrawled";
import { chart } from "./drawchart";

import * as $ from "jquery";

const navId = 'nav-bar';
const onBtnId = 'bg-onbtn';
const offBtnId = 'bg-offbtn';
const oneHourID = 'bg-onehour';
const twoHoursID = 'bg-twohours';
const sessionOnlyID = 'bg-session-only';
const permaID = 'bg-perma';
const onID = 'bg-on';

const compareModal = 'compareModal';
const compareDataBtn = 'compare-data-btn';

let thisWindowID: number = null;

let tabLabels = new Array();
let tabIDs = new Array();

let tempCards = new Array();

//enable tooltips on dynamically created elements
$('body').tooltip({
    selector: '[data-toggle="tooltip"]'
});

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


export function updateContent(url: string, cleanTab: boolean, temp?: boolean) {

    if (cleanTab)
        cards.clearAllCards();

    tabIDs.forEach(goggles => {

        let spinner = new SpinnerCard(goggles);

        spinner.render();

        utils.getBiasDataForGoggles(url, goggles, (scoreData, scoreIndex) => {

            spinner.remove();

            let card;

            switch (scoreIndex) {
                case INVALID_URL:
                    card = new NotAWebpageCard(goggles);
                    break;
                case EXTENSION_DISABLED:
                    card = new ExtensionDisabledCard(goggles);
                    break;
                case UNCRAWLED_URL:
                    card = new UncrawledDomainCard(goggles, url);
                    break;
                default:
                    card = new ScoreCard(goggles, false, url);
                    break;
            }

            card.render();

            if (temp)
                tempCards.push(card);

        });

    });
}

userSettings.load();

createToggleBtn();

/* new tab is activated */
chrome.tabs.onActivated.addListener((activeTabInfo) => {
    if (activeTabInfo.windowId === thisWindowID)
        chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
            updateContent(utils.getDomainFromURL(tabs[0].url), true);
        });
});

/* new page is loaded in the tab */
chrome.tabs.onUpdated.addListener((tabID, chageInfo, tab) => {
    if (tab.windowId === thisWindowID) {
        if (chageInfo.status === 'loading') {
            chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
                updateContent(utils.getDomainFromURL(tabs[0].url), true);
            });
        }
    }
});

chrome.windows.getCurrent((windowInfo) => {
    thisWindowID = windowInfo.id;
    chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
        updateContent(utils.getDomainFromURL(tabs[0].url), true);
    });
});

chrome.runtime.onMessage.addListener((msg: ContextBtnMsg, sender: chrome.runtime.MessageSender) => {
    if (msg.senderWindowID === thisWindowID || (sender.tab && sender.tab.windowId === thisWindowID)) {
        if (msg.url !== undefined) {
            console.log(msg.url);
            updateContent(utils.getDomainFromURL(msg.url), false, true);
        } else if (msg.closeLast !== undefined) {

            tempCards.forEach(card => {
                card.remove();
            });

            tempCards = new Array();
        }
    } else if (msg.updateWindowID !== undefined) {
        thisWindowID = msg.updateWindowID;
    }
});

let sync = <HTMLSelectElement>document.getElementById('syncSelect');
let syncModal = <HTMLButtonElement>document.getElementById('syncModalBtn');
const settingsTab = "gogglesList";

sync.addEventListener('change', () => {

    if (sync.value === 'Yes') {
        syncModal.click();
    }

});

setTimeout(() => {
    userSettings.get((settings) => {

        for (let i = 0; i < settings.gogglesList.length; i++) {
            new GoggleCard(settingsTab, settings.gogglesList[i].id, settings.gogglesList[i].name, settings.gogglesList[i].description).render();
        }

    });
}, 1000);


let saveSettingsBtn = <HTMLButtonElement>document.getElementById('saveSettingsBtn');

saveSettingsBtn.addEventListener('click', () => {

    userSettings.get((settings) => {

        if (sync.value !== 'Choose...' && sync.value === 'Yes') {
            settings.syncEnabled = true;
        } else if (sync.value !== 'Choose...' && sync.value === 'No') {
            settings.syncEnabled = false;
        }

        console.log(settings);

        userSettings.update(settings, () => {
            showSuccessAlert('Settings Saved!');
        })

    });

});

function showDomainDataUnderSettings() {
    extension.storage.getAllDomainData((domainData) => {
        extension.storage.getAllScoreData(scores => {
            let domainCards: string = '';

            let domainDataOverviewDiv = document.getElementById('domainDataOverview');

            let formatted = new Map<string, Score[]>();

            if (domainData)

                domainData.forEach((value, key) => {

                    if (!formatted.has(utils.getDomainFromKey(key))) {
                        let scoresArr = new Array<Score>();
                        scoresArr.push(scores.get(value.scoreIndex));
                        formatted.set(utils.getDomainFromKey(key), scoresArr);
                    } else {
                        formatted.get(utils.getDomainFromKey(key)).push(scores.get(value.scoreIndex));
                    }

                    //console.log(value, key, utils.getDomainFromKey(key), utils.getGoggleIDFromKey(key));
                });

            //console.log(formatted);

            formatted.forEach((value, key) => {
                let innerTables = '';

                value.forEach((scoreValue) => {

                    //@ts-ignore
                    let pr = scoreValue.scores['pr'];
                    //@ts-ignore
                    let lt = scoreValue.scores['lt'];
                    //@ts-ignore
                    let ic = scoreValue.scores['ic'];

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
                    innerTables += templates.get.Table('Goggles:', scoreValue.goggle, rows) + '<br>';
                });
                domainCards += templates.get.AccordionCard(key, innerTables, cards.getUniqueID(), 'domainDataOverview');
            });

            domainDataOverviewDiv.insertAdjacentHTML('afterbegin', domainCards);
        });
    });
}

document.getElementById('delete-data-btn').addEventListener('click', () => {
    console.log('clear');
    extension.storage.clear();
});

userSettings.get((settings) => {

    settings.gogglesList.forEach(value => {
        tabLabels.push(value.name);
        tabIDs.push(value.id);
    });

    let tabs = templates.get.CreateTabs(tabLabels, tabIDs);

    document.getElementById('live-info').insertAdjacentHTML('beforeend', tabs);
});

//showDomainDataUnderSettings();
//showAnalyticsDataUnderSettings();

//update data under settings without the need to reload popup/sidebar
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (changes.oldValue !== undefined || changes.oldValue !== null) {

        while (document.getElementById('domainDataOverview').hasChildNodes())
            document.getElementById('domainDataOverview').firstChild.remove();

        while (document.getElementById('analyticsDataOverview').hasChildNodes())
            document.getElementById('analyticsDataOverview').firstChild.remove();

        showDomainDataUnderSettings();
    }
});

let uncrawledMsgInModal = false;
let modalBody = document.getElementById(compareModal).getElementsByClassName('modal-body')[0];
let modalTitle = document.getElementById(compareModal).getElementsByClassName('modal-title')[0];
let compare = document.getElementById(compareDataBtn);

compare.addEventListener('click', () => {
    let dismissID = 'dismissCompareModal';

    let checkInputs = modalBody.getElementsByClassName('form-check-input');
    let dismiss = <HTMLButtonElement>document.getElementById(dismissID);

    let checked = new Array();

    for (let i = 0; i < checkInputs.length; i++) {
        if ((<HTMLInputElement>checkInputs[i]).checked)
            checked.push((<HTMLInputElement>checkInputs[i]).value);
    };

    userSettings.get((settings) => {

        for (let i = 0; i < settings.gogglesList.length; i++) {
            let goggles = settings.gogglesList[i].id;

            let compareCard = new CompareCard(goggles, checked);
            compareCard.render();
        }

        //hide modal
        dismiss.click();
    });
});


document.body.addEventListener('compareCard', (e) => {
    //@ts-ignore
    let sourceCardDomain = e.detail;

    let inputID = 'searchsite';
    let searchID = 'searchsitebtn';
    let msgBoxID = 'userInputContentBox';

    while (modalTitle.hasChildNodes())
        modalTitle.firstChild.remove();

    while (modalBody.hasChildNodes())
        modalBody.firstChild.remove();

    let recent = utils.getRecentDomains().filter(value => value !== sourceCardDomain);

    modalTitle.insertAdjacentHTML('beforeend',
        'Compare <b><i>' + sourceCardDomain + '</b></i> with...');

    modalBody.insertAdjacentHTML('beforeend',
        templates.get.checkWithLabel(sourceCardDomain, sourceCardDomain, true, true));

    if (recent.length !== 0)
        modalBody.insertAdjacentHTML('beforeend',
            templates.get.CheckList('<b><i>sites you visited recently:</i></b>', recent));

    modalBody.insertAdjacentHTML('beforeend',
        templates.get.InputWithButon(inputID, searchID,
            'e.g. kathimerini.gr', 'Search', '<b><i>enter site:</i></b>',
            msgBoxID));

    let search = <HTMLButtonElement>document.getElementById(searchID);
    let userInput = <HTMLInputElement>document.getElementById(inputID);
    let msgBox = document.getElementById(msgBoxID);

    search.addEventListener('click', () => {
        let domain = utils.getDomainFromURL(userInput.value.trim());

        //to support inputs like facebook.com
        if (!domain)
            domain = utils.getDomainFromURL('www.' + userInput.value.trim());

        //if true user provided url is invalid
        if (!domain)
            return;

        userSettings.get((settings) => {
            for (let i = 0; i < settings.gogglesList.length; i++) {
                let goggles = settings.gogglesList[i].id;

                utils.getBiasDataForGoggles(domain, goggles, (scoreData, scoreIndex) => {
                    //show only one error msg
                    if (i === 0) {

                        if (uncrawledMsgInModal) {
                            msgBox.lastChild.remove();
                            uncrawledMsgInModal = false;
                        }

                        if (scoreIndex === UNCRAWLED_URL) {
                            if (!uncrawledMsgInModal) {
                                msgBox.appendChild(uncrawled.create404Msg(domain, ['text-info']));
                                uncrawledMsgInModal = true;
                            }
                        } else {
                            let newEntry = templates.get.checkWithLabel(domain, domain + goggles, true);
                            msgBox.insertAdjacentHTML('beforeend', newEntry);
                        }

                    }

                    /* show card
                    if (scoreData !== null) {
                        let card = new ScoreCard(goggles, false, domain);
                        card.render();
                        //hide card
                        card.remove();
                    }
                    */
                });
            }
        });
    });

});

const analyticsTabID = 'analytics';

let analyticsTab = document.getElementById(analyticsTabID);

let analyticsCharts = Array<Chart>();

extension.storage.getAllScoreData((scores) => {

    let x = new Array<Date>();
    let y = new Array<number>();
    let total: number = 0;
    let prevValue: number = null;

    scores.forEach((currValue, key) => {

        if (prevValue && prevValue !== currValue.date) {
            x.push(new Date(prevValue));
            y.push(total);
            total = 0;
        }

        prevValue = currValue.date;
        total += currValue.hits;

    });

    chart.drawTimeline(
        {
            //@ts-ignore
            labels: x,
            datasets: [
                {
                    data: y,
                    borderWidth: 1,
                    backgroundColor: 'lightgrey'
                }
            ]
        },
        {
            display: true,
            text: 'Extension Usage',
            position: 'top'
        },
        300, 100, analyticsTab, analyticsCharts);

    userSettings.get((settings) => {

        for (let i = 0; i < settings.gogglesList.length; i++) {

            analyticsCharts.push(
                chart.drawLineChartForTimeline({
                    display: true,
                    text: 'bias for ' + settings.gogglesList[i].name,
                    position: 'bottom'
                }, 400, 200, analyticsTab,
                    'bias', settings.gogglesList[i].id, settings.method)
            );

            analyticsTab.insertAdjacentHTML('beforeend', '<br>');

            analyticsCharts.push(
                chart.drawLineChartForTimeline({
                    display: true,
                    text: 'support for ' + settings.gogglesList[i].name,
                    position: 'bottom'
                }, 400, 200, analyticsTab,
                    'support', settings.gogglesList[i].id, settings.method)
            );

            analyticsTab.insertAdjacentHTML('beforeend', '<br>');

            analyticsCharts.push(
                chart.drawStackedBar({
                    display: true,
                    text: 'top biased domains for ' + settings.gogglesList[i].name,
                    position: 'bottom'
                }, 400, 200, analyticsTab,
                    settings.gogglesList[i].id, settings.method)
            );

            analyticsTab.insertAdjacentHTML('beforeend', '<br>');
        }

    });

}, true);

//document.body.insertAdjacentHTML('beforeend',templates.get.GoggleCard('Testing card','Hmmmm ok','polikalo'));

function aspectSupportingSitesAddListener(elem: Element) {
    if (elem) {

        (<HTMLButtonElement>(elem.getElementsByClassName('add-site')[0])).addEventListener('click', () => {
            (elem.getElementsByClassName('seedlist_')[0]).insertAdjacentHTML('beforeend', templates.get.AspectSeed());
        });

        (<HTMLButtonElement>(elem.getElementsByClassName('remove-site')[0])).addEventListener('click', () => {
            let seeds = (elem.getElementsByClassName('seedlist_')[0]).getElementsByClassName('seed_');

            if (seeds.length > 1) {
                (<HTMLInputElement>seeds[seeds.length - 1]).remove();
            }
        });
    }
}

document.getElementById('goggle-creator').insertAdjacentHTML('afterbegin', templates.get.GoggleCreator());

document.getElementById('add-aspect').addEventListener('click', () => {
    let aspects = document.getElementsByClassName('aspect_');
    let emptyFound = false;
    let emptyIndex = -1;

    for (let i = 0; i < aspects.length; i++) {
        if (!(<HTMLInputElement>(aspects[i].getElementsByClassName('aspect_name')[0])).value) {
            emptyFound = true;
            emptyIndex = i;
            break;
        }
    }

    if (emptyFound) {
        (<HTMLInputElement>(aspects[emptyIndex].getElementsByClassName('aspect_name')[0])).focus();
    } else {
        document.getElementById('aspectslist').insertAdjacentHTML('beforeend', templates.get.GoggleAspect());
        let aspects = document.getElementById('aspectslist').getElementsByClassName('aspect_');
        aspectSupportingSitesAddListener(aspects[aspects.length - 1]);
    }
});

document.getElementById('remove-aspect').addEventListener('click', () => {
    let aspects = document.getElementsByClassName('aspect_');

    for (let i = aspects.length - 1; i > 0; i--) {
        aspects[i].remove();
    }

});

aspectSupportingSitesAddListener(document.body);