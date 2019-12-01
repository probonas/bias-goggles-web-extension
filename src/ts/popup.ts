import { ExtRequest, RequestMessage, ExtResponse, MethodsAndNames } from "./types";
import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";

let methodSelected: string = null;

function handleResponse(response: ExtResponse) {
    console.log('received response');

    if (response.data.appdata === null) {
        uncrawled.show404Error(response.data.domain, ['error']);
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
            chrome.runtime.sendMessage(new ExtRequest([RequestMessage.SET_AS_DEFAULT], methodSelected), (response: ExtResponse) => {
                if (response.extra) {
                    info.innerText = 'Success!';
                }
                else {
                    info.innerText = 'Failed!';
                    info.classList.add('error');
                }

                figure.classList.add('rotate');
            });
        });


        //@ts-ignore
        let vector = response.data.appdata[methodSelected].vector;
        chart.draw(vector, 220, 300, document.getElementById('chartbox'), true);
    }
}

const methods = ['ic', 'lt', 'pr'];

methods.forEach(method => {

    function closure() {
        let m = method;

        function getData() {

            methodSelected = m;
            chrome.runtime.sendMessage(
                new ExtRequest([RequestMessage.GET_STATS], m), (response) => {

                    if (document.getElementById('figure-container').hasChildNodes()) {
                        document.getElementById('figure-container').firstChild.remove();
                    }

                    if (uncrawled.errorMessageExists())
                        uncrawled.removeCrawlErrorMessage();

                    handleResponse(response);
                });
        };

        return getData;
    };

    document.getElementById(method).addEventListener('click', closure());
});
