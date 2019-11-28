import Popper from "popper.js";
import { chart } from "./drawchart";
import { ExtRequest, ExtResponse, RequestMessage, DomainData, ScoreData, AppData, MethodsAndNames } from "./types";

const id = 'bias-popover';

function createPopover(data: DomainData, method: string, refElem: HTMLElement) {
    let canvasWrapper = document.createElement('div');
    canvasWrapper.id = id;

    addScoreInfo(data, method, canvasWrapper);

    refElem.appendChild(canvasWrapper);
    
    //@ts-ignore
    chart.draw(data[method].vector, 150, 200, canvasWrapper);

    new Popper(refElem, canvasWrapper, {
        placement: "right",
        onCreate: (data) => {
            console.log(data);
        }
    });
}

function addScoreInfo(data: DomainData, method: string, elem: HTMLElement) {

    let scoreWrapper = document.createElement('div');
    let scoreText = document.createElement('p');

    //@ts-ignore
    let score: string = data[method].bias_score;
    score = Math.fround(parseFloat(score) * 100).toFixed(2);

    scoreText.innerText = 'Bias Score : ' + score;

    let methodInfo = document.createElement('p');
    methodInfo.classList.add("popover_method_info");
    methodInfo.innerText = 'using ' + MethodsAndNames[method];

    scoreWrapper.appendChild(scoreText);
    scoreWrapper.appendChild(methodInfo);
    elem.appendChild(scoreWrapper);
}

function handleResponse(response: ExtResponse, target: any) {
    let m = <string>response.extra;
    //@ts-check
    createPopover(response.data.appdata, m, target);
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