import { utils } from "./utils";
import {
    OffOptions, Score, ContextBtnMsg,
} from "./types";
import { userSettings } from "./usersettings";
import { extension } from "./storage";
import { templates } from "./templates";

import {
    ScoreCard, UncrawledDomainCard, ExtensionDisabledCard,
    NotAWebpageCard, SpinnerCard, CompareCard, cards, GenericCard
} from "./infoCard";

import "bootstrap"; //@types/bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';

import { uncrawled } from "./uncrawled";
import { chart } from "./drawchart";

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

let thisWindowID: number;

let tabLabels = new Array();
let tabIDs = new Array();

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


export function updateContent(url: string, cleanTab: boolean) {

    if (cleanTab)
        cards.clearAllCards();

    tabIDs.forEach(goggles => {

        let spinner = new SpinnerCard(goggles);

        spinner.render();

        if (url === null) {
            spinner.remove();

            new NotAWebpageCard(goggles).render();

        } else if (cards.exists(url, goggles)) {
            spinner.remove();

            //remove so as to redraw
            cards.getScoreCard(url, goggles).remove();

            //domain's card already in memomy
            cards.getScoreCard(url, goggles).render();
        } else if (cards.existsInCache(url, goggles)) {
            spinner.remove();

            cards.getScoreCard(url, goggles).render();
        } else {

            utils.getBiasDataForGoggles(url, goggles, (scoreData, scoreIndex) => {

                console.log(url, goggles, scoreIndex);

                spinner.remove();

                if (scoreIndex === -1) {
                    new ExtensionDisabledCard(goggles).render();
                } else if (scoreIndex === -2) {
                    new UncrawledDomainCard(goggles, url).render();
                } else {
                    let card = new ScoreCard(goggles, false, scoreData, url);
                    card.setTitle(url);
                    card.render();
                }
            });
        }
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

chrome.runtime.onMessage.addListener((msg: ContextBtnMsg) => {
    if (msg.windowID === thisWindowID)
        updateContent(utils.getDomainFromURL(msg.url), false);
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
    /*
     extension.storage.getAllDomainData((data) => {
        let domainDataOverviewDiv = document.getElementById('domainDataOverview');
         let domainCards: string = '';
 
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
             domainCards += templates.get.AccordionCard(domain, innerTables, cards.getUniqueID(), 'domainDataOverview');
         }
 
         domainDataOverviewDiv.insertAdjacentHTML('afterbegin', domainCards);
     });
     */
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
    let dismissID = 'dismissCompareModel';

    let checkInputs = modalBody.getElementsByClassName('form-check-input');
    let dismiss = <HTMLButtonElement>document.getElementById(dismissID);

    let checked = new Array();

    for (let i = 0; i < checkInputs.length; i++) {
        //@ts-ignore
        if (<HTMLInputElement>checkInputs[i].checked)
            checked.push((<HTMLInputElement>checkInputs[i]).value);
    };


    //console.log(checked);
    //console.log(urlsToScoreCard);

    userSettings.get((settings) => {

        for (let i = 0; i < settings.gogglesList.length; i++) {
            let goggles = settings.gogglesList[i].id;
            let scoreData: Array<Score> = new Array();

            checked.forEach((checkedDomain) => {
                let data = cards.getScoreCard(checkedDomain, goggles);

                if (data)
                    scoreData.push(data.getScore());

            });

            //console.log(scoreData);
            let compareCard = new CompareCard(goggles, scoreData, checked);

            compareCard.setTitle('Overview');
            compareCard.render();
        }

        //hide modal
        dismiss.click();
    });
});


document.body.addEventListener('compareCard', (e) => {
    //@ts-ignore
    let sourceCardID = e.detail;

    let sourceCard = cards.getCardWithID(sourceCardID) as ScoreCard;
    let thisTabID = sourceCard.getTabID();

    let inputID = 'searchsite';
    let searchID = 'searchsitebtn';
    let msgBoxID = 'userInputContentBox';

    let labelsAndIDs: Array<[string, string]> = new Array();

    while (modalTitle.hasChildNodes()) {
        modalTitle.firstChild.remove();
    }

    while (modalBody.hasChildNodes()) {
        modalBody.firstChild.remove();
    }

    cards.getAllScoreCards().forEach((value, key) => {
        if (value.getTabID() === thisTabID && value.getCardID() !== sourceCardID)
            labelsAndIDs.push([value.getDomain(), key]);

        //console.log(key, value.getDomain());
    });

    labelsAndIDs.sort((val1, val2) => {
        if (val1[0] > val2[0])
            return 1;
        else
            return -1;
    });

    let sortedmap = new Map();

    labelsAndIDs.forEach((value) => {
        sortedmap.set(value[0], value[1]);
    });

    modalTitle.insertAdjacentHTML('beforeend',
        'Compare <b><i>' + sourceCard.getDomain() + '</b></i> with...');

    modalBody.insertAdjacentHTML('beforeend',
        templates.get.checkWithLabel(sourceCard.getDomain(),
            sourceCard.getDomain() + sourceCard.getTabID(),
            true, true));

    modalBody.insertAdjacentHTML('beforeend',
        templates.get.CheckList('<b><i>sites you visited recently:</i></b>', sortedmap));

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
                    //show only once
                    if (i === 0) {

                        if (uncrawledMsgInModal) {
                            msgBox.lastChild.remove();
                            uncrawledMsgInModal = false;
                        }

                        if (scoreIndex === -2) {
                            if (!uncrawledMsgInModal) {
                                msgBox.appendChild(uncrawled.create404Msg(domain, ['text-info']));
                                uncrawledMsgInModal = true;
                            }
                        } else {
                            let newEntry = templates.get.checkWithLabel(domain, domain + goggles, true);
                            msgBox.insertAdjacentHTML('beforeend', newEntry);
                        }

                    }

                    if (scoreData !== null) {
                        let card = new ScoreCard(goggles, false, scoreData, domain);
                        card.setTitle(domain);
                        card.render();
                        //hide card
                        card.remove();
                    }

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

    if (x.length >= 7) {

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
                        text: 'top 3 biased domains for ' + settings.gogglesList[i].name,
                        position: 'bottom'
                    }, 400, 200, analyticsTab,
                        settings.gogglesList[i].id, settings.method)
                );

                analyticsTab.insertAdjacentHTML('beforeend', '<br>');
            }

        });
    } else {
        let noDataAvailableCard = new GenericCard(analyticsTabID, false);
        noDataAvailableCard.setTitle('No data available yet ...');
        noDataAvailableCard.setStringContent('One must use the extension for more than a week before any analytics data is available.')
        noDataAvailableCard.render();
    }

}, true);




