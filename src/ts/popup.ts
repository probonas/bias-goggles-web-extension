import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";
import { utils } from "./utils";
import { Score, DomainData } from "./types";
import { userSettings } from "./usersettings";
import { extension } from "./storage";

import "bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

let toggleBtn = document.createElement('button');

toggleBtn.addEventListener('click', () => {
    userSettings.get((settings) => {
        showBtnMessage(!settings.enabled);
        if (!settings.enabled)
            showDetails();
        else
            removeDetails();

        utils.toggle();
    });
});

function removeDetails() {
    document.getElementById(chart.id).remove();
}

function showDetails() {
    utils.getDataForActiveTab((domain: string, data: DomainData) => {
        if (data === null) {
            let err = uncrawled.create404Msg(domain, ['error']);
            document.getElementById('chartbox').appendChild(err);
        } else {
            extension.storage.getScoresForDomain(domain, (data) => {
                let vector = data.scores['pr'].vector;
                chart.draw(vector, 220, 300, document.getElementById('chartbox'), true);
            });
        }

    });
};

function showBtnMessage(extensionEnabled: boolean) {
    if (extensionEnabled) {
        toggleBtn.innerText = 'Disable Extension';
        if (toggleBtn.classList.contains('on'))
            toggleBtn.classList.remove('on');
        toggleBtn.classList.add('off');
    } else {
        toggleBtn.innerText = 'Enable Extension';
        if (toggleBtn.classList.contains('off'))
            toggleBtn.classList.remove('off');
        toggleBtn.classList.add('on');
    }
}

userSettings.get((settings) => {
    showBtnMessage(settings.enabled);
    if (settings.enabled)
        showDetails();
    document.getElementById('on-off').appendChild(toggleBtn);
});
