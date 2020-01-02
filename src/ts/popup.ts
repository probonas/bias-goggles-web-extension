import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";
import { utils } from "./utils";
import { OffOptions, Score, ContextBtnMsg, DomainData } from "./types";
import { userSettings } from "./usersettings";
import { extension } from "./storage";

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
const activeTabCardID = 'bg-active-tab-card';
const selectedLinkCardID = 'bg-selected-link-card-id';
const spinnerID = 'bg-spinner-id';

let idCounter = 0;
let thisWindowID: number;

function clearInfoTab() {
    while (document.getElementById('live-info').hasChildNodes())
        document.getElementById('live-info').firstChild.remove();
}

function truncateHTTPSWWW(domain: string): string {

    let prefixes = ['http://www.', 'https://www.', 'http://', 'https://', 'www.'];

    for (let i = 0; i < prefixes.length; i++) {
        if (domain.startsWith(prefixes[i]))
            return domain.substring(prefixes[i].length);
    }

    return domain;
}

function detailsCard(domain: string, data: Score, cardID: string, chartID: string, dismissable: boolean) {
    let liveInfoTab: HTMLElement = document.getElementById('live-info');

    if (data === null) {
        let card = cardInnerHtml('Too bad... :( ', '', cardID, null, dismissable);

        liveInfoTab.insertAdjacentHTML('beforeend', card);
        document.getElementById(cardID).lastElementChild.firstElementChild.appendChild(uncrawled.create404Msg(domain, ['text-info']));
    } else {
        let vector = data.scores['pr'].vector;
        let card = cardInnerHtml('Data for: ' + truncateHTTPSWWW(domain), '', cardID, truncateHTTPSWWW(domain), dismissable);
        liveInfoTab.insertAdjacentHTML('beforeend', card);
        chart.draw(vector, 220, 300, document.getElementById(cardID).lastElementChild.firstElementChild as HTMLElement, chartID, true);
    }

    if (dismissable) {
        (<HTMLButtonElement>document.getElementById(cardID).firstElementChild.firstElementChild).addEventListener('click', () => {
            document.getElementById(cardID).parentElement.parentElement.remove();
        });
    }
}

function showBtn(on: boolean) {

    const offButtonHTML =
        `<li class="nav-item dropdown" id="${offBtnId}">
                <button id="on-off-dropdown" class="btn btn-outline-danger dropdown-toggle" data-toggle="dropdown" 
                    data-boundary="window" type="button" aria-haspopup="true" aria-expanded="false">
                    Disable
                </button>
                <div class="dropdown-menu" aria-labelledby="on-off-dropdown">
                    <button class="dropdown-item" id="${oneHourID}">for 1 hour</button>
                    <button class="dropdown-item" id="${twoHoursID}">for 2 hours</button>
                    <button class="dropdown-item" id="${sessionOnlyID}")">for this session only</button>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item" id="${permaID}">until I re-enable it</button>
                </div>
        </li>`;

    const onBtnHTML =
        `<li class="nav-item" id="${onBtnId}">
            <button class="btn btn-outline-success" id="${onID}">Enable</button>
        </li>`;

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
    const successAlert =
        `<div class="alert alert-success alert-dismissible fade show" role="alert">
            <strong>${msg}</strong>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>`;

    document.getElementById('container').insertAdjacentHTML('beforeend', successAlert);

    setTimeout(() => {
        (<HTMLButtonElement>(document.getElementById('container').lastElementChild.lastElementChild)).click();
    }, 2000);
}

function cardInnerHtml(title: string, body: string, id: string, tooltipText: string, dismissable: boolean): string {
    let style = '';

    if (!dismissable) {
        style = "display: none;";
    };

    if (tooltipText) {

        if (title.length > 28) {
            title = title.substr(0, 28) + '...';
        }

        return `
        <div>
            <div class="card">
                <div class="card-body" id=${id}>
                    <span data-toggle="tooltip" title="${tooltipText}">
                        <button type="button" style="${style}" class="close" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button> 
                        <h3 class="card-title">${title}</h3>
                    </span>
                    <h5>
                        <p class="card-text">${body}</p>
                    </h5>
                </div>
            </div>
            <div class="pt-2"></div>
        </div>`;

    } else {
        return `
        <div>
            <div class="card">
                <div class="card-body" id=${id}>
                    <button type="button" style="${style}" class="close" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <h3 class="card-title">${title}</h3>
                    <h5>
                        <p class="card-text">${body}</p>
                    </h5>
                </div>
            </div>
            <div class="pt-2"></div>
        </div>`;
    }
}

function showSpinner(): void {

    const spinnerSign =
        `<div class="d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>`;

    let spinner = cardInnerHtml('Requesting data from service...', spinnerSign, spinnerID, null, false);
    document.getElementById('live-info').insertAdjacentHTML('beforeend', spinner);
}

function removeSpinner() {
    if (document.getElementById(spinnerID))
        document.getElementById(spinnerID).parentElement.parentElement.remove();
}

export function updateContent(url: string, cleanTab: boolean, dismissable: boolean) {

    if (cleanTab) {
        clearInfoTab();
    } else {
        idCounter++;
    }

    let card: string;

    showSpinner();

    utils.getBiasData(url, (scoreData, scoreIndex) => {

        removeSpinner();

        if (scoreIndex === -1) {
            card = cardInnerHtml('Extension is disabled!', 'Enable it, and try again', activeTabCardID + idCounter, null, false);
            document.getElementById('live-info').insertAdjacentHTML('beforeend', card);
        } else {
            detailsCard(url, scoreData, activeTabCardID + idCounter, 'chart' + idCounter, dismissable);
        }
    });

}

createToggleBtn();

/* new tab is activated */
chrome.tabs.onActivated.addListener((activeTabInfo) => {
    if (activeTabInfo.windowId === thisWindowID)
        chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
            updateContent(tabs[0].url, true, false);
        });
});

/* new page is loaded in the tab */
chrome.tabs.onUpdated.addListener((tabID, chageInfo, tab) => {
    if (tab.windowId === thisWindowID) {
        if (chageInfo.status !== 'loading')
            return;
        chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
            updateContent(tabs[0].url, true, false);
        });
    }
});

chrome.windows.getCurrent((windowInfo) => {
    thisWindowID = windowInfo.id;
    chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
        updateContent(tabs[0].url, true, false);
    });
});

chrome.runtime.onMessage.addListener((msg: ContextBtnMsg) => {
    if (msg.windowID === thisWindowID)
        updateContent(msg.url, false, true);
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

function createRowForTable(firstColValue: string, secondColValue: string, strong: boolean): string {
    const body_strong = `
        <tr>
            <th scope="row">${firstColValue}</th>
            <td>${secondColValue}</td>
        </tr>`;

    const body = `
        <tr>
            <td>${firstColValue}</td>
            <td>${secondColValue}</td>
        </tr>`;

    if (strong)
        return body_strong;
    else
        return body;
}

function createTable(firstColLabel: string, secondColLabel: string, rowsData: string): string {
    const table = `
        <table class="table table-hover">
            <thead>
                <tr>
                <th scope="col">${firstColLabel}</th>
                <th scope="col">${secondColLabel}</th>
                </tr>
            </thead>
            <tbody>
                ${rowsData}
            </tbody>
        </table>`;

    return table;
}

function createAccordionCard(title: string, body: string, ascendingCardNum: number): string {

    const card = `
        <div class="card">
            <div class="card-header" id="header${ascendingCardNum}">
            <h2 class="mb-0">
                <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse${ascendingCardNum}" aria-expanded="true" aria-controls="collapse${ascendingCardNum}">
                ${title}
                </button>
            </h2>
            </div>

            <div id="collapse${ascendingCardNum}" class="collapse" aria-labelledby="header${ascendingCardNum}" data-parent="#domainDataOverview">
            <div class="card-body">
                ${body}
            </div>
            </div>
        </div>`;

    return card;
}

extension.storage.getAllDomainData((data) => {
    let domainDataOverviewDiv = document.getElementById('domainDataOverview');
    let cards: string = '';
    let i = 0;

    let innertTables = '';

    console.log(data);

    let formattedData: { [key: string]: { [key: string]: any } } = {};

    for (let key in data) {

        if (!isNaN(parseInt(key)))
            continue;

        let goggle = key.split(' ')[0];
        let domain = key.split(' ')[1];

        let domainData = <DomainData>data[key];

        console.log(domainData.scoreIndex);

        let scores = (<Score>data[domainData.scoreIndex]).scores;

        if (typeof formattedData[domain] === 'undefined')
            formattedData[domain] = {};

        formattedData[domain][goggle] = {
            scores
        };
    }

    for (let key in Object.keys(formattedData)) {
        let domain = Object.keys(formattedData)[key];

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
                        ret += createRowForTable('Vectors', 'Support', true);

                        for (let vectorKey in Object.keys(scoreValue[propertyName])) {
                            let vectorName = Object.keys(scoreValue[propertyName])[vectorKey];

                            ret += createRowForTable(vectorName, scoreValue[propertyName][vectorName], false);
                        }

                    } else {
                        ret += createRowForTable(propertyName, scoreValue[propertyName], false);
                    }
                }

                return ret;
            }

            let rows = unrollscore(pr);
            //rows += unrollscore(lt);
            //rows += unrollscore(ic);

            innertTables += createTable('Goggles:', goggleName, rows) + '<br>';
        }
        cards += createAccordionCard(domain, innertTables, i++);
    }

    domainDataOverviewDiv.insertAdjacentHTML('afterbegin', cards);
});
