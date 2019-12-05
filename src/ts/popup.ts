import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";
import { utils } from "./utils";
import { DomainData, UserData } from "./types";
import { userSettings } from "./usersettings";

function fillPopup(domain: string, data: DomainData, method: string) {
    console.log('received response');

    if (data === null) {
        let err = uncrawled.create404Msg(domain, ['error']);
        document.getElementById('messagebox').appendChild(err);
    } else {
        let figure = document.createElement('figure');
        document.getElementById('figure-container').appendChild(figure);

        let messagebox = document.createElement('div');
        messagebox.id = 'messagebox';
        figure.appendChild(messagebox);

        let infospan = document.createElement('span');
        let info = document.createElement('button');
        infospan.appendChild(info);
        infospan.id = 'infospan';

        let btn = document.createElement('button');
        let btnspan = document.createElement('span');
        btnspan.appendChild(btn);

        btn.id = 'set-as-default';
        btn.innerText = 'Set as default';
        btn.classList.add('slidein');

        messagebox.appendChild(btnspan);
        messagebox.appendChild(infospan);

        btn.addEventListener('click', () => {

            userSettings.get((data) => {
                let settings: UserData = data[userSettings.settingsKey];

                info.innerText = 'Failed!';
                info.classList.add('error');

                userSettings.save(method, settings.goggles, settings.forceRefreshLimit,
                    settings.badgeColor, settings.syncEnabled, () => {
                        info.innerText = 'Success!';
                        info.classList.remove('error');
                    });
            });

            figure.classList.add('rotate');
        });

        let vector = data[method].vector;
        chart.draw(vector, 220, 300, document.getElementById('chartbox'), true);
    }
}

const methods = ['ic', 'lt', 'pr'];

methods.forEach(method => {

    function closure() {
        let m = method;

        function getData() {

            utils.getDataForActiveTab((domain: string, data: DomainData) => {

                if (document.getElementById('figure-container').hasChildNodes()) {
                    document.getElementById('figure-container').firstChild.remove();
                }

                if (uncrawled.errorMessageExists())
                    uncrawled.removeCrawlErrorMessage();

                fillPopup(domain, data, m);
            });
        };

        return getData;
    };

    document.getElementById(method).addEventListener('click', closure());
});
