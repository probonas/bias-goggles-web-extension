import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";
import { utils } from "./utils";
import { OffOptions, Score, ContextBtnMsg } from "./types";
import { userSettings } from "./usersettings";

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

function detailsCard(domain: string, data: Score, cardID: string, chartID: string, top: boolean) {
    let liveInfoTab: HTMLElement = document.getElementById('live-info');
    let firstChild: HTMLElement = liveInfoTab.firstElementChild as HTMLElement;

    if (data === null) {
        let card = cardInnerHtml('Too bad... :(', uncrawled.create404Msg(domain, ['text-info']).innerHTML, cardID, null);
        if (top && firstChild) {
            liveInfoTab.firstChild.insertBefore(card, liveInfoTab);
        } else {
            liveInfoTab.appendChild(card);
        }
    } else {
        let vector = data.scores['pr'].vector;
        let card = cardInnerHtml('Data for: ' + truncateHTTPSWWW(domain), '', cardID, truncateHTTPSWWW(domain));

        if (top && firstChild) {
            liveInfoTab.firstChild.insertBefore(card, liveInfoTab);
        } else {
            liveInfoTab.appendChild(card);
        }
        chart.draw(vector, 220, 300, card.lastElementChild as HTMLElement, chartID, true);
    }
}

function showBtn(on: boolean) {
//
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

        let btn = createHTMLElement(onBtnHTML)
        document.getElementById(navId).appendChild(btn);

    }

    function addOffBtn() {
        if (document.getElementById(offBtnId))
            return;

        let btn = createHTMLElement(offButtonHTML)
        document.getElementById(navId).appendChild(btn);
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
    const successAlert = createHTMLElement(
        `<div class="alert alert-success alert-dismissible fade show" role="alert">
            <strong>${msg}</strong>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>`);

    document.getElementById('container').appendChild(successAlert);

    setTimeout(() => {
        (<HTMLButtonElement>successAlert.children[1]).click()
    }, 2000);
}

function createHTMLElement(html: string): HTMLElement {
    let ret = document.createElement('div');
    ret.innerHTML = html;

    return ret.firstChild as HTMLElement;
}
function cardInnerHtml(title: string, body: string, id: string, tooltipText: string): HTMLElement {

    if (tooltipText) {

        if (title.length > 32) {
            title = title.substr(0, 32) + '...';
        }

        return createHTMLElement(
            `<div id=${id}>
                <span data-toggle="tooltip" title="${tooltipText}">
                    <h3 class="card-title">${title}</h3>
                </span>
                <h5><p class="card-text">${body}</p></h5>
            </div>`);

    } else {
        return createHTMLElement(
            `<div id=${id}>
                <h3 class="card-title">${title}</h3>
                <h5><p class="card-text">${body}</p></h5>
            </div>`
        );
    }
}

function showSpinner(): void {

    const spinnerSign =
        `<div class="d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>`;

    let spinner = cardInnerHtml('Requesting data from service...', spinnerSign, activeTabCardID, null);

    spinner.id = spinnerID;
    document.getElementById('live-info').appendChild(spinner);
}

function removeSpinner() {
    if (document.getElementById(spinnerID))
        document.getElementById(spinnerID).remove();
}

export function updateContent(url: string, cleanTab: boolean, top: boolean) {


    if (cleanTab)
        clearInfoTab();

    let card: HTMLElement;

    showSpinner();

    utils.getBiasData(url, (scoreData, scoreIndex) => {

        removeSpinner();

        if (scoreIndex === -1) {
            card = cardInnerHtml('Extension is disabled!', 'Enable it, and try again', activeTabCardID, null);
            document.getElementById('live-info').appendChild(card);
        } else {
            detailsCard(url, scoreData, activeTabCardID, 'chart' + ((top) ? 0 : 1), top);
        }
    });

}

createToggleBtn();

/* new tab is activated */
chrome.tabs.onActivated.addListener((activeTabInfo) => {
    if (activeTabInfo.windowId === thisWindowID)
        chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
            updateContent(tabs[0].url, true, true);
        });
});

/* new page is loaded in the tab */
chrome.tabs.onUpdated.addListener((tabID, chageInfo, tab) => {
    if (tab.windowId === thisWindowID)
        chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
            updateContent(tabs[0].url, true, true);
        });
});

chrome.windows.getCurrent((windowInfo) => {
    thisWindowID = windowInfo.id;
    chrome.tabs.query({ windowId: thisWindowID, active: true }, (tabs) => {
        updateContent(tabs[0].url, true, true);
    });
});

chrome.runtime.onMessage.addListener((msg: ContextBtnMsg) => {
    if (msg.windowID === thisWindowID)
        updateContent(msg.url, false, false);
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