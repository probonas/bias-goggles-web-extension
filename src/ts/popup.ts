import { utils } from "./utils";
import {
    OffOptions, ContextBtnMsg, EXTENSION_DISABLED, UNCRAWLED_URL, INVALID_URL, Score, Goggle,
} from "./types";
import { userSettings } from "./usersettings";
import { extension } from "./storage";
import { templates } from "./templates";

import {
    ScoreCard, UncrawledDomainCard, ExtensionDisabledCard,
    NotAWebpageCard, CompareCard, cards, SpinnerCard
} from "./infoCard";

import "bootstrap"; //all bootstrap functions along their requirements
import 'bootstrap/dist/css/bootstrap.min.css'; //boostrap's css *only*
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
const liveInfoGoggles = "live-info-goggleslist";
const tablist = 'tablist';
const tabContent = 'tabcontent';

let thisWindowID: number = null;

let tempCards = new Array();
let forceDraw = true;

//enable tooltips on dynamically created elements
$('body').tooltip({
    trigger: 'hover',
    selector: '[data-toggle="tooltip"]'
});

userSettings.load();

function showBtn(on: boolean) {

    const offButtonHTML = templates.OffButton(offBtnId, oneHourID, twoHoursID, sessionOnlyID, permaID);

    const onBtnHTML = templates.OnButton(onBtnId, onID);

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
    const successAlert = templates.SuccessAlert(msg);

    document.getElementById('main-card').insertAdjacentHTML('afterbegin', successAlert);

    setTimeout(() => {
        (<HTMLButtonElement>(document.getElementById('main-card').firstElementChild.lastElementChild)).click();
    }, 2000);
}

/**
 * Restores the tabs by programmatically clicking on goggle buttons and then draws contents.
 */
function restoreTabs() {
    userSettings.get((settings) => {

        for (let i = 0; i < settings.googlesUsing.length; i++) {
            forceDraw = (i === settings.googlesUsing.length - 1);
            (<HTMLButtonElement>document.getElementById(settings.googlesUsing[i].id + '-create-tab-btn')).click();
        }

    });
}

export function updateContent(url: string, cleanTab: boolean, temp?: boolean) {

    if (cleanTab)
        cards.clearAllCards();

    userSettings.get((settings) => {
        settings.googlesUsing?.forEach(goggles => {
            utils.getBiasDataForGoggles(url, goggles.id, (scoreData, scoreIndex) => {

                let card;

                switch (scoreIndex) {
                    case INVALID_URL:
                        card = new NotAWebpageCard(goggles.id);
                        break;
                    case EXTENSION_DISABLED:
                        card = new ExtensionDisabledCard(goggles.id);
                        break;
                    case UNCRAWLED_URL:
                        card = new UncrawledDomainCard(goggles.id, url);
                        break;
                    default:
                        card = new ScoreCard(goggles.id, false, url);
                        break;
                }

                card.render();

                if (temp)
                    tempCards.push(card);

            });
        });
    });
}

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
    //If it's a popup, windowID will be set via a message from the parent window.
    //Because popup is window itself, it has a different windowID from its parent,
    //(i.e. the window that opened it and to which the popup belongs) and so 
    //getCurrent() will lead to the popup being disconnected from its parent.
    if (windowInfo.type !== 'popup') {
        thisWindowID = windowInfo.id;
        createGoggleSelectionButtons();
        restoreTabs();
    }
});

chrome.runtime.onMessage.addListener((msg: ContextBtnMsg, sender: chrome.runtime.MessageSender) => {
    if ((msg.senderWindowID && msg.senderWindowID === thisWindowID) || (sender.tab && sender.tab.windowId === thisWindowID)) {
        console.log('here');

        if (msg.url !== undefined) {
            console.log(msg.url);
            updateContent(utils.getDomainFromURL(msg.url), false, true);
        } else if (msg.closeLast !== undefined) {

            tempCards.forEach(card => {
                card.remove();
            });

            tempCards = new Array();
        }
    } else if (msg.updateWindowID) {
        thisWindowID = msg.updateWindowID;
        createGoggleSelectionButtons();
        restoreTabs();
    }
});



function createGoggleSelectionButton(goggle: Goggle) {
    let btnID = goggle.id + '-create-tab-btn';
    document.getElementById(liveInfoGoggles).insertAdjacentHTML('beforeend', templates.MutedButton(goggle.id + '-create-tab-btn', goggle.name));

    document.getElementById(btnID).addEventListener('click', (elem) => {
        let btn = <HTMLButtonElement>elem.target;

        if (btn.classList.contains('disabled')) {
            btn.classList.remove('disabled');
            newTab(goggle, forceDraw);
        }
        else {
            btn.classList.add('disabled');
            removeTab(goggle);
        }

    });
}

function createGoggleSelectionButtons() {

    userSettings.get((settings) => {
        settings.gogglesList.forEach(value => {
            createGoggleSelectionButton(value);

            //disable for now
            //goggles can be uninstalled under the search tab
            //new GoggleCard(settingsTab, value.id, value.name, value.description).render();
        });

    });

}

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
                    let pr = scoreValue.scores[userSettings.DEFAULT_ALG];
                    //@ts-ignore
                    //TODO: fix the following
                    //let lt = scoreValue.scores['lt'];
                    //@ts-ignore
                    //let ic = scoreValue.scores['ic'];

                    let unrollscore = (scoreValue: any) => {
                        let ret = '';

                        for (let property in Object.keys(scoreValue)) {
                            let propertyName = Object.keys(scoreValue)[property];

                            if (propertyName === 'vector') {
                                ret += templates.TableRow('Vectors', 'Support', true);

                                for (let vectorKey in Object.keys(scoreValue[propertyName])) {
                                    let vectorName = Object.keys(scoreValue[propertyName])[vectorKey];

                                    ret += templates.TableRow(vectorName, scoreValue[propertyName][vectorName], false);
                                }

                            } else {
                                ret += templates.TableRow(propertyName, scoreValue[propertyName], false);
                            }
                        }

                        return ret;
                    }

                    let rows = unrollscore(pr);
                    innerTables += templates.Table('Goggles:', scoreValue.goggle, rows) + '<br>';
                });
                domainCards += templates.AccordionCard(key, innerTables, cards.getUniqueID(), 'domainDataOverview');
            });

            domainDataOverviewDiv.insertAdjacentHTML('afterbegin', domainCards);
        });
    });
}

document.getElementById('delete-data-btn').addEventListener('click', () => {
    console.log('clear');
    extension.storage.clear();
});

function newTab(goggle: Goggle, forceDraw: boolean) {
    userSettings.addToSelectedGoggles(goggle, () => {

        let tabs = document.getElementById(tablist);
        let content = document.getElementById(tabContent);

        tabs.insertAdjacentHTML('beforeend', templates.Tab(goggle.name, goggle.id, false));
        content.insertAdjacentHTML('beforeend', templates.TabPane(goggle.id, goggle.name, false));

        (<HTMLElement>document.getElementById(goggle.name).lastElementChild).click();

        userSettings.get((settings) => {
            console.log('===== opened: TABS ====');
            console.log(settings.googlesUsing);
        });

        //when a new tab is created, relevant data is shown
        if (forceDraw)
            chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
                updateContent(utils.getDomainFromURL(tabs[0].url), true);
            });
    });
}

function removeTab(goggle: Goggle) {
    userSettings.removeFromSelectedGoggles(goggle, () => {
        let thisTab = document.getElementById(goggle.name);
        let contentTab = document.getElementById('content' + goggle.id);

        userSettings.get(settings => {
            console.log('===== closed : TABS ====');
            console.log(settings.googlesUsing);
        });


        console.log('===== THIS =====');
        console.log(thisTab);
        console.log(contentTab);

        let sibling = thisTab.nextElementSibling || thisTab.previousElementSibling;

        thisTab.remove();
        contentTab.remove();

        if (sibling)
            (<HTMLElement>document.getElementById(sibling.id).lastElementChild).click();
    });
}

//update data under settings without the need to reload popup/sidebar
chrome.storage.onChanged.addListener((changes, areaName) => {
    /*
    if (changes.oldValue !== undefined || changes.oldValue !== null) {

        while (document.getElementById('domainDataOverview').hasChildNodes())
            document.getElementById('domainDataOverview').firstChild.remove();

        while (document.getElementById('analyticsDataOverview').hasChildNodes())
            document.getElementById('analyticsDataOverview').firstChild.remove();

        showDomainDataUnderSettings();
    }
    */
});

showDomainDataUnderSettings();

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
        templates.checkWithLabel(sourceCardDomain, sourceCardDomain, true, true));

    if (recent.length !== 0)
        modalBody.insertAdjacentHTML('beforeend',
            templates.CheckList('<b><i>sites you visited recently:</i></b>', recent));

    modalBody.insertAdjacentHTML('beforeend',
        templates.InputWithButon(inputID, searchID,
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
                            let newEntry = templates.checkWithLabel(domain, domain + goggles, true);
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

    // Also add the same behavior to the enter key in the textbox
    userInput.addEventListener("keyup", (event) => {
        //enter key is pressed
        if (event.keyCode === 13)
            search.click();
    });

});

let sync = <HTMLSelectElement>document.getElementById('syncSelect');
let syncModal = <HTMLButtonElement>document.getElementById('syncModalBtn');
const settingsTab = "contentgogglesList";

sync.addEventListener('change', () => {
    if (sync.value === 'Yes') {
        syncModal.click();
    }
});


let timeline = document.getElementById('timelinepos');
let charts = document.getElementById('chartdatapos')
let analyticsCharts = Array<Chart>();

extension.storage.getAllScoreData((scores) => {

    let x = new Array<Date>();
    let y = new Array<number>();
    let total: number = 0;
    let prevValue: number = null;

    scores?.forEach((currValue, key) => {

        if (prevValue && prevValue !== currValue.date) {
            x.push(new Date(prevValue));
            y.push(total);
            total = 0;
        }

        prevValue = currValue.date;
        total += currValue.hits;

    });

    userSettings.get((settings) => {

        for (let i = 0; i < settings.gogglesList.length; i++) {

            /*
                This draws the average score for bias and support in a human readable way.
                Dummy values, since I do not know how to get the average score from the timeline for the bias and the support
            */
            let info = document.createElement('div');
            info.insertAdjacentHTML('beforeend', templates.AnalyticsScores(0.0, 0.0));
            charts.appendChild(info);

            analyticsCharts.push(
                chart.drawLineChartForTimeline({
                    display: true,
                    text: 'bias for ' + settings.gogglesList[i].name,
                    position: 'bottom'
                }, 400, 200, charts, info,
                    'bias', settings.gogglesList[i].id, settings.method)
            );

            charts.insertAdjacentHTML('beforeend', '<br>');

            analyticsCharts.push(
                chart.drawLineChartForTimeline({
                    display: true,
                    text: 'support for ' + settings.gogglesList[i].name,
                    position: 'bottom'
                }, 400, 200, charts, null,
                    'support', settings.gogglesList[i].id, settings.method)
            );

            charts.insertAdjacentHTML('beforeend', '<br>');

            analyticsCharts.push(
                chart.drawStackedBar({
                    display: true,
                    text: 'top biased domains for ' + settings.gogglesList[i].name,
                    position: 'bottom'
                }, 400, 200, charts,
                    settings.gogglesList[i].id, settings.method)
            );

            charts.insertAdjacentHTML('beforeend', '<br>');
        }

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
        300, 100, timeline, analyticsCharts);

}, true);

document.getElementById("search").insertAdjacentElement("afterbegin", templates.GoggleSearch());
document.getElementById('goggle-creator').insertAdjacentElement('afterbegin', templates.GoggleCreator());

userSettings.get(settings => {
    let algsNames = new Array<string>();
    algsNames.push('Choose an algorithm...');
    
    settings.algs.forEach(alg => {
        algsNames.push(alg.name);
    });

    let selectionList = document.createElement('select');
    selectionList.classList.add('custom-select');

    selectionList.insertAdjacentHTML('afterbegin',templates.selections(algsNames));
    
    document.getElementById('settings').insertAdjacentElement('afterbegin',selectionList);
});