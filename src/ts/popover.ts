import Popper from "popper.js";
import { chart } from "./drawchart";
import { ExtRequest, ExtResponse, RequestMessage, DomainData, ScoreData } from "./types";

const id = 'bias-popover';

function createPopover(data: ScoreData, refElem: HTMLElement) {
    let canvasWrapper = document.createElement('div');
    canvasWrapper.id = id;

    refElem.appendChild(canvasWrapper);
    chart.draw(data.vector, canvasWrapper);

    new Popper(refElem, canvasWrapper, {
        placement: "right",
        onCreate: (data) => {
            console.log(data);
        }
    });
}

function handleResponse(response: ExtResponse, target: any) {
    let m = <string>response.extra;
    //@ts-ignore
    createPopover(response.data.appdata[m], target);
}

function handleFocus(event: FocusEvent): void {

    if (event.target instanceof HTMLAreaElement || event.target instanceof HTMLAnchorElement) {
        if (event.target.href[0] === '#' || event.target.href[0] === '/')
            return;

        console.log('link found!' + event.target.href);

        chrome.runtime.sendMessage(new ExtRequest([RequestMessage.GET_DEFAULT_STATS], event.target.href), (response) => {
            handleResponse(response, event.target);
        });
    }

}

function removeCanvas() {
    if (document.getElementById(id))
        document.getElementById(id).remove();

    console.log('out!');
}
//bubble down event
document.body.addEventListener("mouseover", handleFocus);
//not bubble down event
document.body.addEventListener("mouseout", removeCanvas);