import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";
import { utils } from "./utils";
import { DomainData } from "./types";
import { userSettings } from "./usersettings";

function toggle(btn: HTMLButtonElement) {
    userSettings.get((settings) => {
        if (settings.enabled) {
            btn.innerText = 'Disable Extension';
        } else {
            btn.innerText = 'Enable Extension';
        }
        utils.toggle();
    });
}


let toggleBtn = document.createElement('button');
document.getElementById('on-off').appendChild(toggleBtn);

toggleBtn.addEventListener('click', () => {
    toggle(toggleBtn);
});

toggle(toggleBtn);

userSettings.get((settings) => {
    utils.getDataForActiveTab((domain: string, data: DomainData) => {

        if (data === null) {
            let err = uncrawled.create404Msg(domain, ['error']);
            document.getElementById('chartbox').appendChild(err);
        } else {
            let vector = data[settings.method].vector;
            chart.draw(vector, 220, 300, document.getElementById('chartbox'), true);
        }
        
    });
});
