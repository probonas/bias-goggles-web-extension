import { BiasScoresMethods, ExtRequest, RequestMessage, ExtResponse } from "./types";
import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";

(function checkDefault() {
    //TODO
    //check default user option in list
})();

document.getElementById('save-button').addEventListener('click', () => {
    let checked: HTMLInputElement;
    let as_default: boolean = false;

    for (let item in BiasScoresMethods) {

        if ((<HTMLInputElement>document.getElementById(item)).checked) {
            checked = <HTMLInputElement>document.getElementById(item);
            console.log(checked.value + ' checked');
        }

    }

    if ((<HTMLInputElement>document.getElementById('set-as-default')).checked) {
        console.log('set as default on');
        as_default = true;
    }

    if (as_default) {
        chrome.runtime.sendMessage(
            new ExtRequest([RequestMessage.GET_STATS, RequestMessage.SET_AS_DEFAULT], checked.value), handleResponse);
    } else {
        chrome.runtime.sendMessage(
            new ExtRequest([RequestMessage.GET_STATS], checked.value), handleResponse);
    }

});

function handleResponse(response: ExtResponse) {
    console.log('received response');

    if (response.data === null) {
        uncrawled.show404Error(response.extra, ['main', 'fat']);
    } else {

        if (uncrawled.errorMessageExists())
            uncrawled.removeCrawlErrorMessage();

        let method = response.extra;
        //@ts-ignore
        let vector = response.data.appdata[method].vector
        chart.draw(vector, 220, 300);
    }
}