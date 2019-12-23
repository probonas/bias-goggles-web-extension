import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";
import { utils } from "./utils";
import { DomainData, OffOptions, Message } from "./types";
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

function clearInfoTab() {
    while(document.getElementById('live-info').hasChildNodes())
        document.getElementById('live-info').firstChild.remove();
}

function detailsCard() {
    utils.getDataForActiveTab((domain: string, data: DomainData) => {
        if (data === null) {
            let card = cardInnerHtml('Too bad... :(', uncrawled.create404Msg(domain,['text-info']));
            
            document.getElementById('live-info').appendChild(card[0]);
            document.getElementById('live-info').appendChild(card[1]);
        } else {
            extension.storage.getScoresForDomain(domain, (data) => {
                let vector = data.scores['pr'].vector;
                let card = cardInnerHtml('Data for ' + domain, '');
                document.getElementById('live-info').appendChild(card[0]);
                document.getElementById('live-info').appendChild(card[1]);
                chart.draw(vector, 220, 300, card[1], true);
            });
        }

    });
};

function showBtn(on: boolean) {

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

        let btn = document.createElement('div');
        btn.id = onBtnId;
        btn.innerHTML = onBtnInnerHtml;
        document.getElementById(navId).appendChild(btn);

    }

    function addOffBtn() {
        if (document.getElementById(offBtnId))
            return;

        let btn = document.createElement('div');
        btn.id = offBtnId;
        btn.innerHTML = offButtonInnerHtml;
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
    const successAlertInnerHTMl =
        `<div class="alert alert-success alert-dismissible fade show" role="alert">
            <strong>${msg}</strong>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>`;

    let alert = document.createElement('div');
    alert.innerHTML = successAlertInnerHTMl;
    document.getElementById('container').appendChild(alert);
    console.log(alert.children[0]);
    console.log(alert.children[0].children[1]);

    setTimeout(() => {
        (<HTMLButtonElement>alert.children[0].children[1]).click()
    }, 2000);
}

const offButtonInnerHtml =
    `<li class="nav-item dropdown">
        <button data-boundary="viewport" type="button" class="btn btn-outline-danger dropdown-toggle" data-toggle="dropdown"
            aria-haspopup="true" aria-expanded="false">Disable</button>
        <div class="dropdown-menu">
            <btn class="dropdown-item" id="${oneHourID}">for 1 hour</btn>
            <btn class="dropdown-item" id="${twoHoursID}">for 2 hours</btn>
            <btn class="dropdown-item" id="${sessionOnlyID}")">for this session only</btn>
            <div class="dropdown-divider"></div>
            <btn class="dropdown-item" id="${permaID}">until I re-enable it</btn>
        </div>
    </li>`;

const onBtnInnerHtml =
    `<li class="nav-item">
        <button class="nav-link btn btn-outline-success text-success" id="${onID}" role="button">Enable</button>
    </li>`;


function cardInnerHtml(title: string, body: HTMLElement | string): HTMLElement[] {
    /*
            `<h3 class="card-title">${title}</h3>
            <h5><p class="card-text">${body}</p></h5>`;
    */

    let ti = document.createElement('h3');
    ti.classList.add('card-title');
    ti.innerHTML = title;

    let text = document.createElement('h5');
    let p = document.createElement('p');
    p.classList.add('card-text');

    if (typeof body === 'string')
        p.innerHTML = body;
    else
        p.appendChild(body);

    text.appendChild(p);

    return [ti, text];
}

function showSpinner(): HTMLElement {
    /*
    `<div class="d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>`;
    */

    let ret = document.createElement('div');
    ret.classList.add('d-flex', 'justify-content-center');

    let ch = document.createElement('div');
    ch.classList.add('spinner-border');
    ch.setAttribute("role", "status");

    ret.appendChild(ch);

    let sp = document.createElement('span');
    sp.classList.add('sr-only');
    sp.innerHTML = 'Loading...';

    ch.appendChild(sp);

    return ret;
}

createToggleBtn();

document.getElementById('live-info-tab').addEventListener('click', detailsCard);

chrome.runtime.onMessage.addListener((message: Message) => {
    clearInfoTab();
    if (message == Message.EXT_DISABLED) {
        let card = cardInnerHtml('Extension is disabled!', 'Enable it, and try again');
        document.getElementById('live-info').appendChild(card[0]);
        document.getElementById('live-info').appendChild(card[1]);
    }
    else if (message === Message.WAITING_SERVICE) {
        let card = cardInnerHtml('Requesting data from service...', showSpinner());
        document.getElementById('live-info').appendChild(card[0]);
        document.getElementById('live-info').appendChild(card[1]);
    } else if (message === Message.SHOW_DATA) {
        detailsCard();
    }
});