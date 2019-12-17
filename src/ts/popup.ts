import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";
import { utils } from "./utils";
import { DomainData } from "./types";
import { userSettings } from "./usersettings";

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
            let vector = data['pr'].vector;
            chart.draw(vector, 220, 300, document.getElementById('chartbox'), true);
        }

    });
};

function showBtnMessage(extensionEnabled: boolean) {
    if (extensionEnabled) {
        toggleBtn.innerText = 'Disable Extension';
    } else {
        toggleBtn.innerText = 'Enable Extension';
    }
}

userSettings.get((settings) => {
    showBtnMessage(settings.enabled);
    if (settings.enabled)
        showDetails();
    document.getElementById('on-off').appendChild(toggleBtn);
});
